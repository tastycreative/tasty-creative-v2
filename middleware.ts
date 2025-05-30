// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if user has a session
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  const isAuth = !!sessionToken;

  // Define route types
  const authPages = ["/sign-in", "/sign-up", "/forgot-password"];
  const isAuthPage = authPages.some((page) => path.startsWith(page));
  const isVerifyPage = path.startsWith("/verify-email");
  const isApiAuth = path.startsWith("/api/auth");

  // Allow access to auth pages, verification, and API auth routes
  if (isAuthPage || isVerifyPage || isApiAuth) {
    // Redirect to dashboard if authenticated user tries to access auth pages
    if (isAuth && isAuthPage && !isVerifyPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Redirect authenticated users from `/` to `/dashboard`
  if (isAuth && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to sign in
  if (!isAuth) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("from", path);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
