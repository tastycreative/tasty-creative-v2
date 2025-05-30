"use server";

import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { AuthError } from "next-auth";

export async function signInWithGoogle() {
  try {
    await authSignIn("google", {
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "OAuthSignInError":
          throw new Error("OAuth sign in error");
        default:
          throw new Error("Something went wrong");
      }
    }
    throw error;
  }
}

export async function signOut() {
  await authSignOut({ redirectTo: "/sign-in" });
}
