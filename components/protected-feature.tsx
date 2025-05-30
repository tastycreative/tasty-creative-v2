"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

interface ProtectedFeatureProps {
  children: React.ReactNode
  requireVerified?: boolean
  fallback?: React.ReactNode
}

export function ProtectedFeature({ 
  children, 
  requireVerified = true,
  fallback 
}: ProtectedFeatureProps) {
  const { data: session } = useSession()

  if (!session) {
    return fallback || (
      <div className="text-center py-4">
        <p className="text-gray-500 mb-2">Please sign in to access this feature</p>
        <Link href="/sign-in" className="text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </div>
    )
  }

  if (requireVerified && !session.user.emailVerified) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
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
    )
  }

  return <>{children}</>
}