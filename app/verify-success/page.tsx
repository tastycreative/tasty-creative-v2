"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function VerifySuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [sessionUpdated, setSessionUpdated] = useState(false)
  const { update, data: session } = useSession()

  useEffect(() => {
    // Immediately update session and notify other tabs
    const updateSessionAndNotify = async () => {
      try {
        console.log("Updating session after email verification...")
        
        // Multiple attempts to ensure session is updated
        await update()
        
        // Wait a bit and try again
        setTimeout(async () => {
          await update()
          setSessionUpdated(true)
        }, 500)
        
        // Also call our refresh endpoint
        await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        // Notify all other tabs about email verification
        if (typeof window !== 'undefined') {
          localStorage.setItem('emailVerified', Date.now().toString())
          localStorage.setItem('emailVerifiedAt', Date.now().toString())
          window.postMessage({ type: 'EMAIL_VERIFIED' }, window.location.origin)
          
          // Broadcast to all tabs
          const channel = new BroadcastChannel('auth')
          channel.postMessage({ type: 'EMAIL_VERIFIED' })
          channel.close()
        }
      } catch (error) {
        console.error("Failed to update session:", error)
        setSessionUpdated(true) // Continue anyway
      }
    }

    updateSessionAndNotify()

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Add verification timestamp to URL for banner to check
          router.push("/dashboard?emailVerified=" + Date.now())
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, update])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Email Verified Successfully!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your email has been verified successfully! You now have access to all features.
        </p>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800 dark:text-green-300">
            You will be automatically redirected to the dashboard in{" "}
            <span className="font-bold">{countdown}</span> seconds.
          </p>
        </div>
        
        <button
          onClick={() => {
            update().then(() => {
              router.push("/dashboard")
            }).catch(() => {
              router.push("/dashboard")
            })
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  )
}