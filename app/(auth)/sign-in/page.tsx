// import { SignInForm } from "@/components/auth/sign-in-form";
import SignInWithGoogle from "@/components/SignInWithGoogle";
import { Metadata } from "next";
// import Link from "next/link";
// import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignIn() {
  return (
    <Card className="shadow-lg border">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <Image
            src="/tasty-new.png"
            alt="Tasty Creative Logo"
            width={64}
            height={75}
            priority
            quality={85}
            sizes="64px"
            className="h-auto w-auto"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          Sign in to Tasty Creative
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Welcome back! Please sign in to continue
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {/* Commented out form inputs - only Google sign-in needed */}
        {/* <h2 className="text-2xl font-semibold text-foreground">
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
        </div> */}

        <SignInWithGoogle />

        <div className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a
              href="/terms-of-service"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy-policy"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
