"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { resendVerificationEmail } from "@/app/actions/auth"
import { commonDomainTypos } from "@/lib/lib"

function detectEmailTypo(email: string): string | null {
  if (!email) return null
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  
  const suggestedDomain = commonDomainTypos[domain]
  return suggestedDomain ? email.replace(domain, suggestedDomain) : null
}

export function EmailVerificationBanner() {
  const { data: session, update } = useSession()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Listen for cross-tab email verification notifications
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'emailVerified') {
        // Update session when email is verified in another tab
        update()
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'EMAIL_VERIFIED') {
        update()
      }
    }

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === 'EMAIL_VERIFIED') {
        update()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('message', handleMessage)
      
      const channel = new BroadcastChannel('auth')
      channel.addEventListener('message', handleBroadcast)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('message', handleMessage)
        channel.removeEventListener('message', handleBroadcast)
        channel.close()
      }
    }
  }, [update])

  // Only show if user is logged in but not verified
  if (!session?.user || session.user.emailVerified) {
    return null
  }

  const suggestedEmail = detectEmailTypo(session.user.email || "")

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
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50 relative z-10 lg:mt-0 mt-16">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap lg:flex-nowrap">
          <div className="w-0 flex-1 flex items-center min-w-0 lg:order-1 order-2">
            <span className="flex p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800/30 flex-shrink-0">
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
            <p className="ml-3 font-medium text-yellow-700 dark:text-yellow-300 truncate">
              <span className="md:hidden">
                Verify your email ({session.user.email}) to access all features.
              </span>
              <span className="hidden md:inline">
                Please verify your email address ({session.user.email}) to access all features.
              </span>
            </p>
          </div>
          <div className="flex-shrink-0 ml-4 lg:order-2 order-1 w-full lg:w-auto mb-2 lg:mb-0">
            {sent ? (
              <span className="text-sm text-green-600 dark:text-green-400 whitespace-nowrap">
                Verification email sent to {session.user.email}! Check your inbox.
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap w-full lg:w-auto"
              >
                {sending ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </div>
        </div>
        {(error || suggestedEmail) && (
          <div className="mt-3 space-y-2">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {suggestedEmail && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Did you mean <strong>{suggestedEmail}</strong>? Your current email might have a typo.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}