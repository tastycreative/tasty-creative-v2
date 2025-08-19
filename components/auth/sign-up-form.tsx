"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/app/actions/auth"
import { commonDomainTypos } from "@/lib/lib"

function detectEmailTypo(email: string): string | null {
  if (!email) return null
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  
  const suggestedDomain = commonDomainTypos[domain]
  return suggestedDomain ? email.replace(domain, suggestedDomain) : null
}

export function SignUpForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    try {
      const result = await signUp(email, password, name)
      
      if (result.needsVerification) {
        router.push("/verify-email?email=" + encodeURIComponent(email))
      } else {
        // Already verified (linked Google account)
        router.push("/dashboard")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="mt-1 block w-full rounded-lg border border-input px-3 py-2 bg-background text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="John Doe"
          />
        </div>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-input px-3 py-2 bg-background text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="you@example.com"
          />
          {email && detectEmailTypo(email) && (
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              ⚠️ Did you mean <strong>{detectEmailTypo(email)}</strong>?
            </p>
          )}
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
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1 block w-full rounded-lg border border-input px-3 py-2 bg-background text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>
    </form>
  )
}