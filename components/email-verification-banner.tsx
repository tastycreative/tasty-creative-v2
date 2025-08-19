"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { resendVerificationEmail } from "@/app/actions/auth"

export function EmailVerificationBanner() {
  const { data: session } = useSession()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  // Only show if user is logged in but not verified
  if (!session?.user || session.user.emailVerified) {
    return null
  }

  const handleResend = async () => {
    setSending(true)
    setError("")
    try {
      await resendVerificationEmail()
      setSent(true)
      setTimeout(() => setSent(false), 5000) // Reset after 5 seconds
    } catch {
      setError("Failed to send verification email. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50 relative z-10">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800/30">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
            <p className="ml-3 font-medium text-yellow-700 dark:text-yellow-300">
              <span className="md:hidden">
                Verify your email ({session.user.email}) to access all features.
              </span>
              <span className="hidden md:inline">
                Please verify your email address ({session.user.email}) to access all features.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            {sent ? (
              <span className="text-sm text-green-600 dark:text-green-400">
                Verification email sent to {session.user.email}! Check your inbox.
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}