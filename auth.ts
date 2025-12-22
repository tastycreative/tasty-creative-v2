import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { utcNow } from "@/lib/dateUtils";
import bcrypt from "bcryptjs";

// Token refresh mutex to prevent concurrent refresh attempts
const refreshPromises = new Map<string, Promise<any>>();

// Cache to throttle last_accessed updates (userId -> timestamp)
const lastAccessUpdateCache = new Map<string, number>();

// Cache for daily stats updates (throttled to once per hour)
let lastDailyStatsUpdate = 0;

// Circuit breaker for database updates - if DB fails, skip updates temporarily
let dbUpdateCircuitOpen = false;
let dbUpdateCircuitOpenUntil = 0;

// TODO: Define a more specific type for the token object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshAccessToken(token: any) {
  try {
    // Get the latest refresh token from the database
    const account = await prisma.account.findFirst({
      where: {
        userId: token.id,
        provider: "google",
      },
    });

    if (!account?.refresh_token) {
      console.error("❌ No refresh token found in database for user:", token.id);
      return {
        ...token,
        error: "NoRefreshToken",
      };
    }

    console.log("🔄 Attempting to refresh access token using database refresh token...");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
        scope: account.scope || "openid profile email",
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("❌ Token refresh failed:", {
        status: response.status,
        statusText: response.statusText,
        error: refreshedTokens.error,
        error_description: refreshedTokens.error_description,
      });

      // Check for specific error types
      if (refreshedTokens.error === "invalid_grant") {
        console.error("🔐 Refresh token is invalid or expired. User needs to re-authenticate.");
        return {
          ...token,
          error: "RefreshTokenExpired",
        };
      }

      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }

    console.log("✅ Access token refreshed successfully");

    // Update the database with the new tokens
    const newRefreshToken = refreshedTokens.refresh_token ?? account.refresh_token;
    const expiresAt = Math.floor(Date.now() / 1000 + refreshedTokens.expires_in);
    const now = new Date();

    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        access_token: refreshedTokens.access_token,
        refresh_token: newRefreshToken,
        expires_at: expiresAt,
        last_refreshed: now,
        last_accessed: now,
        scope: refreshedTokens.scope,
      },
    });

    console.log("💾 Updated tokens in database (refreshed at:", now.toISOString(), ")");

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: expiresAt,
      refreshToken: newRefreshToken,
      error: undefined, // Clear any previous errors
    };
  } catch (error) {
    console.error("❌ Exception during token refresh:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// Diagnostic logging for AWS Amplify debugging (only in production)
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  console.error("❌ CRITICAL: Neither NEXTAUTH_SECRET nor AUTH_SECRET environment variables are set!");
  console.error("Available env vars starting with 'AUTH':", Object.keys(process.env).filter(k => k.startsWith('AUTH')));
  console.error("Available env vars starting with 'NEXT':", Object.keys(process.env).filter(k => k.startsWith('NEXT')));
}

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!authSecret) {
  throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be defined. Set one of these environment variables.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  // Explicitly define secret for AWS Amplify compatibility
  secret: authSecret,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent", // Force consent screen to always get refresh token
          scope:
            "openid profile email ",
        },
      },
      // Add profile callback to ensure we request the refresh token
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date(profile.email_verified) : null,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) {
            return null;
          }

          // For OAuth users who haven't set a password
          if (!user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            username: user.username,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error; // Re-throw to show error message to user
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role || "GUEST";
        token.emailVerified = user.emailVerified;
      }
      
      // Always refresh user data from database when session is updated OR when token is being refreshed
      if ((trigger === "update" || trigger === "signIn") && token.id) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              emailVerified: true,
            },
          });
          
          if (freshUser) {
            // Only update if there are actual changes to prevent unnecessary token updates
            const hasChanges = 
              token.name !== freshUser.name ||
              token.email !== freshUser.email ||
              token.picture !== freshUser.image ||
              token.role !== freshUser.role ||
              token.emailVerified !== freshUser.emailVerified;

            if (hasChanges) {
              console.log(`JWT: Refreshing token for user ${freshUser.id}, role: ${token.role} -> ${freshUser.role}`);
              token.name = freshUser.name;
              token.email = freshUser.email;
              token.picture = freshUser.image;
              token.role = freshUser.role || "GUEST";
              token.emailVerified = freshUser.emailVerified;
            }
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT:", error);
        }
      }
      // Add Google OAuth tokens to the JWT
      if (account && account.provider === "google") {
        console.log("🔑 JWT Callback - Google account data:");
        console.log("- Has access_token:", !!account.access_token);
        console.log("- Has refresh_token:", !!account.refresh_token);
        console.log("- expires_at:", account.expires_at);

        // Critical: Check if refresh token is provided
        if (!account.refresh_token) {
          console.error("⚠️ WARNING: Google did not return a refresh token!");
          console.error("This usually happens when:");
          console.error("1. User has previously authorized this app");
          console.error("2. The authorization params are not forcing consent");
          console.error("Solution: User needs to revoke app access in Google settings and sign in again");
          console.error("Or: Use prompt='consent' to force the consent screen");

          // Set error flag so UI can prompt user to re-authorize
          token.error = "NoRefreshToken";
        } else {
          // Manually save refresh token to database to ensure it's persisted
          console.log("💾 Saving refresh token to database for user:", token.id);
          try {
            await prisma.account.updateMany({
              where: {
                userId: token.id as string,
                provider: "google",
              },
              data: {
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                scope: account.scope,
              },
            });
            console.log("✅ Refresh token and scopes saved to database");
          } catch (error) {
            console.error("❌ Failed to save refresh token to database:", error);
          }
        }

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // If the access token has expired, try to refresh it
      // This now works for any request, not just when account is present
      if (token.refreshToken && token.expiresAt) {
        // Check if token is expired or about to expire (e.g., within the next 5 minutes)
        const buffer = 5 * 60; // 5 minutes buffer in seconds
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const expiryTime = Number(token.expiresAt);

        if (now > expiryTime - buffer) {
          console.log("🕐 Access token expired or expiring soon, attempting refresh...");

          // Use mutex to prevent concurrent refresh attempts
          const userId = token.id as string;
          if (refreshPromises.has(userId)) {
            console.log("⏳ Token refresh already in progress, waiting...");
            try {
              const refreshedToken = await refreshPromises.get(userId);
              console.log("✅ Using refreshed token from concurrent request");
              return refreshedToken;
            } catch (error) {
              console.error("❌ Concurrent refresh failed, attempting new refresh");
              // If concurrent refresh failed, fall through to try again
            }
          }

          // Create new refresh promise and store it
          const refreshPromise = refreshAccessToken(token);
          refreshPromises.set(userId, refreshPromise);

          try {
            const refreshedToken = await refreshPromise;

            if (refreshedToken.error) {
              console.error("❌ Failed to refresh access token:", refreshedToken.error);

              // If refresh token is expired, user needs to re-authenticate
              if (refreshedToken.error === "RefreshTokenExpired" || refreshedToken.error === "NoRefreshToken") {
                console.error("🔐 User needs to sign in again to get new tokens");
                // Clear sensitive data but keep user info
                return {
                  ...token,
                  accessToken: undefined,
                  refreshToken: undefined,
                  expiresAt: undefined,
                  error: refreshedToken.error,
                };
              }

              // For other errors, keep the token with error flag
              token.error = refreshedToken.error;
              return token;
            }
            console.log("✅ Access token refreshed successfully");
            return refreshedToken;
          } finally {
            // Clean up the promise after a short delay to allow concurrent requests to complete
            setTimeout(() => refreshPromises.delete(userId), 1000);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.image = token.picture as string | null;
      }
      // Add custom properties to session from token
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.expiresAt = token.expiresAt as number | undefined;
      // Propagate the error to the session if it exists
      if (token.error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).error = token.error;
      }

      // Update last_accessed timestamp on every session check (throttled to avoid too many DB writes)
      const userId = token.id as string;
      const now = Date.now();

      // Check circuit breaker - skip DB updates if circuit is open
      if (dbUpdateCircuitOpen && now < dbUpdateCircuitOpenUntil) {
        return session; // Skip updates when circuit is open
      }

      // Reset circuit breaker if enough time has passed
      if (dbUpdateCircuitOpen && now >= dbUpdateCircuitOpenUntil) {
        dbUpdateCircuitOpen = false;
        if (process.env.NODE_ENV === "development") {
          console.log("🔄 Database circuit breaker reset");
        }
      }

      const shouldUpdate = !lastAccessUpdateCache.has(userId) ||
        (now - lastAccessUpdateCache.get(userId)!) > 120000; // Update max once per 2 minutes (reduced frequency)

      if (shouldUpdate) {
        lastAccessUpdateCache.set(userId, now);

        // Update last_accessed in background without blocking the response
        prisma.account.updateMany({
          where: {
            userId: userId,
            provider: "google",
          },
          data: {
            last_accessed: new Date(),
          },
        }).catch((error: any) => {
          // Open circuit breaker on failure - skip updates for 5 minutes
          if (!dbUpdateCircuitOpen) {
            dbUpdateCircuitOpen = true;
            dbUpdateCircuitOpenUntil = Date.now() + (5 * 60 * 1000); // 5 minutes
            if (process.env.NODE_ENV === "development") {
              console.error("❌ Database update failed, circuit breaker opened for 5 minutes:", error.code);
            }
          }
        });

        // Update daily activity stats (throttled to once per 2 hours for reduced load)
        const twoHours = 2 * 60 * 60 * 1000;
        if (now - lastDailyStatsUpdate > twoHours) {
          lastDailyStatsUpdate = now;

          // Update today's activity count in background
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          // Count active users today and update stats
          prisma.$queryRaw`
            SELECT COUNT(DISTINCT u.id)::bigint as count
            FROM "User" u
            LEFT JOIN "Account" a ON a."userId" = u.id AND a.provider = 'google'
            WHERE COALESCE(a.last_accessed, u."lastAccessedAt") >= ${today}
              AND COALESCE(a.last_accessed, u."lastAccessedAt") < ${tomorrow}
          `.then(async (result: any) => {
            const activeCount = Number(result[0]?.count || 0);
            await prisma.dailyActivityStat.upsert({
              where: { date: today },
              update: { activeUsers: activeCount },
              create: { date: today, activeUsers: activeCount },
            });
            if (process.env.NODE_ENV === "development") {
              console.log(`✅ Updated daily stats: ${activeCount} active users`);
            }
          }).catch((error: any) => {
            // Silently fail in production, only log in development
            if (process.env.NODE_ENV === "development") {
              console.error("❌ Failed to update daily stats:", error.code);
            }
          });
        }
      }

      return session;
    },
    async signIn({ user, account }) {
      // Allow all OAuth sign-ins
      if (account?.provider !== "credentials") {
        return true;
      }

      if (user?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (
          existingUser &&
          (existingUser.name !== user.name || existingUser.image !== user.image)
        ) {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name,
              image: user.image,
            },
          });
        }
      }

      // For credentials, we've already validated in authorize()
      return true;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in", // Custom error page with error message display
    verifyRequest: "/verify-email",
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider === "google") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Record<string, any> = {};

        if (!(user as { emailVerified?: Date | null }).emailVerified) {
          updates.emailVerified = utcNow();
        }

        if (
          (user.name && user.name !== null) ||
          (user.image && user.image !== null)
        ) {
          updates.name = user.name;
          updates.image = user.image;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: updates,
          });
        }
      }
    },
  },
});
