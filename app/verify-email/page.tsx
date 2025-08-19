// app/verify-email/page.tsx
"use client"

import { commonDomainTypos } from "@/lib/lib"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"


function detectEmailTypo(email: string): string | null {
  if (!email) return null
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  
  const suggestedDomain = commonDomainTypos[domain]
  return suggestedDomain ? email.replace(domain, suggestedDomain) : null
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || undefined
  const suggestedEmail = detectEmailTypo(email || "")

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
          <span className="font-medium text-gray-900 dark:text-white break-all">
            {email || "your email address"}
          </span>
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
          Please check your inbox and click the verification link to complete your registration.
        </p>
        {suggestedEmail && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg">
            <p className="text-sm text-orange-600 dark:text-orange-400">
              ⚠️ <strong>Possible typo detected:</strong> Did you mean{" "}
              <span className="font-semibold">{suggestedEmail}</span>?
            </p>
            <p className="text-xs text-orange-500 dark:text-orange-500 mt-1">
              If your email has a typo, you won&apos;t receive the verification email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
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
            Loading...
          </p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}