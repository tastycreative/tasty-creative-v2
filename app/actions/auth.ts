"use server";

import { signIn, signOut, auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { AuthError } from "next-auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInWithCredentials(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          throw new Error("Invalid email or password");
        default:
          throw new Error("Something went wrong");
      }
    }
    throw error;
  }
}

export async function signUp(email: string, password: string, name?: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (existingUser) {
      // Check if they have a password
      if (existingUser.password) {
        throw new Error(
          "An account with this email already exists. Please sign in."
        );
      }

      // User exists (probably from Google) but no password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name || existingUser.name,
        },
      });

      // If already verified through Google, sign them in
      if (existingUser.emailVerified) {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        await signInWithCredentials(formData);
        return { success: true, needsVerification: false };
      }

      // If not verified, send verification email
      await createAndSendVerificationToken(email);
      return { success: true, needsVerification: true };
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Send verification email
    await createAndSendVerificationToken(email);

    return { success: true, needsVerification: true };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
}

async function createAndSendVerificationToken(email: string) {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  // Send verification email
  await sendVerificationEmail(email, token);
}

export async function resendVerificationEmail() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("No user session found");
  }

  if (session.user.emailVerified) {
    throw new Error("Email already verified");
  }

  await createAndSendVerificationToken(session.user.email);

  return { success: true };
}

export async function verifyEmail(token: string) {
  try {
    // First check if token exists
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    // If no token found, check if user might already be verified
    if (!verificationToken) {
      // Try to find any user with this token pattern (this is a fallback)
      throw new Error("Invalid or expired verification token");
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      throw new Error("Verification token has expired");
    }

    // Check if user is already verified
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (user?.emailVerified) {
      // User is already verified, clean up token and return success
      await prisma.verificationToken.delete({
        where: { token },
      });
      return { success: true, alreadyVerified: true };
    }

    // Update user as verified
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return { success: true, alreadyVerified: false };
  } catch (error) {
    console.error("Email verification error:", error);
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function refreshSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("No session to refresh");
  }

  // Fetch fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Force a new sign-in to refresh the JWT
  // This is a workaround since we can't update JWT directly
  return { needsReauth: true };
}
