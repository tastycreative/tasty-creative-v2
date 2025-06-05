
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
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
            user.password
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role || "GUEST";
        token.emailVerified = user.emailVerified;
      }
      // Add Google OAuth tokens to the JWT
      if (account && account.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
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
