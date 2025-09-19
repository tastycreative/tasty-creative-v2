// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuth = !!sessionToken;

  const authPages = ["/sign-in", "/sign-up", "/forgot-password"];
  const isAuthPage = authPages.some((page) => path.startsWith(page));
  const isVerifyPage = path.startsWith("/verify-email");
  const isApiAuth =
    path.startsWith("/api/auth") ||
    path.startsWith("/api/webhook") ||
    path.startsWith("/api/hubstaff") ||
    path.startsWith("/api/media-proxy") ||
    path.startsWith("/api/gallery-db") ||
    path.startsWith("/api/notifications") ||
    path.startsWith("/api/users");

  const publicPaths = ["/"];
  const isPublic = publicPaths.includes(path);

  // ✅ Allow access to public pages
  if (isPublic) {
    return NextResponse.next();
  }

  // ✅ Allow access to auth pages, verification, and API auth routes
  if (isAuthPage || isVerifyPage || isApiAuth) {
    if (isAuth && isAuthPage && !isVerifyPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ✅ Redirect unauthenticated users
  if (!isAuth) {
    const signInUrl = new URL("/", request.url);
    signInUrl.searchParams.set("from", path);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
