import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// TODO: Define a more specific type for the token object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("Error refreshing access token:", refreshedTokens);
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      // Keep the existing refresh token if a new one isn't provided
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent", // Forces Google to always ask for consent and return refresh token
          scope:
            "openid profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
        },
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
        console.log("JWT Callback - Google account data:");
        console.log("- Has access_token:", !!account.access_token);
        console.log("- Has refresh_token:", !!account.refresh_token);
        console.log("- expires_at:", account.expires_at);
        
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        
        if (!account.refresh_token) {
          console.warn("WARNING: Google did not return a refresh token! This will cause permission issues.");
        }
      }

      // If the access token has expired, try to refresh it
      // This now works for any request, not just when account is present
      if (token.refreshToken && token.expiresAt) {
        // Check if token is expired or about to expire (e.g., within the next 5 minutes)
        const buffer = 5 * 60 * 1000; // 5 minutes buffer
        const now = Date.now();
        const expiryTime = Number(token.expiresAt) * 1000;
        
        if (now > expiryTime - buffer) {
          console.log("Access token expired or expiring soon, attempting refresh...");
          const refreshedToken = await refreshAccessToken(token);

          if (refreshedToken.error) {
            console.error("Failed to refresh access token:", refreshedToken.error);
            // Don't clear the token immediately - let the user know they need to re-auth
            token.error = refreshedToken.error;
            return token; // Return token with error so UI can handle re-authentication
          }
          console.log("Access token refreshed successfully.");
          return refreshedToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.emailVerified = token.emailVerified as Date | null;
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
          updates.emailVerified = new Date();
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
