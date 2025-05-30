// auth.ts
import "server-only"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client/edge"


export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allows linking Google to existing email account
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        // REMOVED: Email verification check - we'll handle this in the app instead
        // Return user even if not verified
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified, // ADD: Include emailVerified
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = user.role || "USER"
        token.emailVerified = user.emailVerified // ADD: Store emailVerified in token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.emailVerified = token.emailVerified as Date | null // ADD: Include in session
      }
      return session
    },
    async signIn({ user, account }) {
      // ADD: Allow OAuth sign-ins without email verification
      if (account?.provider !== "credentials") {
        return true
      }
      
      // For credentials, always allow sign in - we'll handle verification in the app
      return true
    }
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
    verifyRequest: "/verify-email",
  },
  events: {
    async linkAccount({ user, account }) {
      // When a Google account is linked, mark email as verified
      if (
        account.provider === "google" &&
        !(user as { emailVerified?: Date | null }).emailVerified
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })
      }
    }
  }
})