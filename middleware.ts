// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Note: We can't use the auth() wrapper in Edge Runtime with Prisma
// Instead, we'll check for the session token cookie

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Check if user has a session
  const sessionToken = request.cookies.get("authjs.session-token") ?? 
                      request.cookies.get("__Secure-authjs.session-token")
  
  const isAuth = !!sessionToken
  const isAuthPage = path.startsWith("/sign-in") || 
                     path.startsWith("/sign-up") ||
                     path.startsWith("/forgot-password")
  
  // Redirect logic
  if (!isAuth && !isAuthPage && !path.startsWith("/api/auth")) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("from", path)
    return NextResponse.redirect(signInUrl)
  }
  
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}