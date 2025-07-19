import { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import SignInWithGoogle from "@/components/SignInWithGoogle";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUp() {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold text-foreground">
        Create your account
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Or{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary hover:text-primary/90 transition-colors"
        >
          sign in to an existing account
        </Link>
      </p>

      <SignUpForm />

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
