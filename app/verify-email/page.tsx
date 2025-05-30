// app/verify-email/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default function VerifyEmail({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Check your email
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          We&apos;ve sent a verification link to{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {searchParams?.email || "your email address"}
          </span>
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
          Please check your inbox and click the verification link to complete your registration.
        </p>
      </div>
    </div>
  );
}
