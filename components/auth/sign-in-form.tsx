"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithCredentials } from "@/app/actions/auth";

export function SignInForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Check for verification success message
  const verified = searchParams.get("verified") === "true";
  const verificationError = searchParams.get("error");

  const errorParam = searchParams.get("error");
  const message = searchParams.get("message");

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const result = (await signInWithCredentials(
      formData
    )) as unknown as AuthResponse;

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If no error, the user will be redirected
  }

  return (
    <>
      {verified && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">
          <div className="font-semibold">Email verified successfully!</div>
          <div>Please sign in to access your account with full privileges.</div>
        </div>
      )}

      {message === "already-verified" && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-sm">
          Your email is already verified. Please sign in to continue.
        </div>
      )}

      {errorParam && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {errorParam === "invalid-token"
            ? "The verification link is invalid or has already been used."
            : errorParam}
        </div>
      )}

      {verificationError === "invalid-token" && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          Invalid or expired verification link.
        </div>
      )}

      <form action={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a
              href="/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </>
  );
}
