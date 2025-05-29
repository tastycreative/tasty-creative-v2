// middleware.ts (in your project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for auth token/session
  const isAuthenticated = request.cookies.get("auth-token"); // or your auth method

  // Define auth-related routes (sign-in, sign-up, etc.)
  const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"];
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname);

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !isAuthRoute) {
    const signInUrl = new URL("/sign-in", request.url);
    // Optionally preserve the attempted URL
    signInUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated and trying to access auth routes, redirect to home
  if (isAuthenticated && isAuthRoute) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
