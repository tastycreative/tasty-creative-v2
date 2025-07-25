import { SignInForm } from "@/components/auth/sign-in-form";
import SignInWithGoogle from "@/components/SignInWithGoogle";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignIn() {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold text-foreground">
        Sign in to your account
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Or{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary hover:text-primary/90 transition-colors"
        >
          create a new account
        </Link>
      </p>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        }
      >
        <SignInForm />
      </Suspense>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <SignInWithGoogle />
    </div>
  );
}
