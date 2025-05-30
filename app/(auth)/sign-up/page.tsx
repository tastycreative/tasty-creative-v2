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
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Create your account
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Or{" "}
        <Link
          href="/sign-in"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          sign in to an existing account
        </Link>
      </p>

      <SignUpForm />

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
            Or continue with
          </span>
        </div>
      </div>

      <SignInWithGoogle />
    </div>
  );
}
