"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export function SignInForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Check for verification success message
  const verified = searchParams?.get("verified") === "true";
  const verificationError = searchParams?.get("error");
  const errorParam = searchParams?.get("error");
  const message = searchParams?.get("message");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      

      if (result?.error) {
        switch (result.error) {
          case "CredentialsSignin":
            setError("Invalid email or password");
            break;
          default:
            setError(result.error);
        }
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {verified && (
        <div className="mb-4 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm border border-green-200 dark:border-green-800">
          <div className="font-semibold">Email verified successfully!</div>
          <div>Please sign in to access your account with full privileges.</div>
        </div>
      )}

      {message === "already-verified" && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
          Your email is already verified. Please sign in to continue.
        </div>
      )}

      {errorParam && (
        <div className="mb-4 bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">
          {errorParam === "invalid-token"
            ? "The verification link is invalid or has already been used."
            : errorParam}
        </div>
      )}

      {verificationError === "invalid-token" && (
        <div className="mb-4 bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">
          Invalid or expired verification link.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-lg border border-input px-3 py-2 bg-background text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-lg border border-input px-3 py-2 bg-background text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-2 bg-background"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-muted-foreground"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a
              href="/forgot-password"
              className="font-medium text-primary hover:text-primary/90 transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </>
  );
}
