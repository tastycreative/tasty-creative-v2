"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

interface ProtectedFeatureProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedFeature({
  children,
  requireVerified = true,
  fallback,
}: ProtectedFeatureProps) {
  const { data: session } = useSession();

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google");
    } catch (err) {
      console.error("Error during signIn:", err);
    }
  };

  if (!session) {
    return (
      fallback || (
        <div className="text-center py-4">
          <p className="text-gray-500 mb-2">
            Please sign in to access this feature
          </p>
          <Link
            href="/sign-in"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </div>
      )
    );
  }

  if (session.user.role === "GUEST") {
    return (
      <div>
        <div className="flex-1 items-center justify-center rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Guest Access Restricted
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            This feature is not available for guest users. Wait or contact an Admin/Moderator to elevate your access.
          </p>
           <p className="text-gray-500 dark:text-gray-400 mb-4">
            Relogin after access has been elevated.
          </p>
          <button
            onClick={handleGoogleSignIn}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (requireVerified && !session.user.emailVerified) {
    return (
      <div className="flex-1 items-center justify-center rounded-lg p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Email Verification Required
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Please verify your email address to access this feature.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
