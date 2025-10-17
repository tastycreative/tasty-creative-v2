// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Block phantom API endpoints that are no longer in use
  const phantomEndpoints = [
    "/api/notifications/stream",
    "/api/notifications/health", 
    "/api/health",
    "/api/notifications/efficient-stream",
    "/api/notifications/debug-connections",
    "/api/notifications/push-stream",
    "/api/notifications/store",
    "/api/realtime/stream",
    "/api/sse",
    "/api/stream"
  ];
  
  if (phantomEndpoints.some(endpoint => path === endpoint || path.startsWith(endpoint + "/"))) {
    const clientIP = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referer = request.headers.get("referer") || "direct";
    const method = request.method;
    const timestamp = new Date().toISOString();
    
    // Try to get session info if available
    const sessionToken = request.cookies.get("authjs.session-token")?.value ??
                        request.cookies.get("__Secure-authjs.session-token")?.value;
    
    // Try to extract user info from session token (NextAuth format)
    let userInfo = null;
    if (sessionToken) {
      try {
        // NextAuth often uses encrypted JWE tokens, not plain JWTs
        // Try to decode if it's a JWT first
        const parts = sessionToken.split('.');
        if (parts.length === 3) {
          // Standard JWT format
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          userInfo = {
            type: 'JWT',
            email: payload.email || payload.user?.email || 'unknown',
            name: payload.name || payload.user?.name || 'unknown',
            sub: payload.sub || payload.user?.id || 'unknown',
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'
          };
        } else if (parts.length === 5) {
          // JWE format (encrypted) - we can't decode this in middleware
          userInfo = {
            type: 'JWE (encrypted)',
            note: 'Session is encrypted, cannot decode user info in middleware',
            tokenLength: sessionToken.length,
            tokenStart: sessionToken.substring(0, 20) + '...'
          };
        } else {
          // Some other format
          userInfo = {
            type: 'Unknown format',
            tokenLength: sessionToken.length,
            tokenStart: sessionToken.substring(0, 20) + '...',
            parts: parts.length
          };
        }
      } catch (error) {
        userInfo = { 
          type: 'Decode error',
          error: error instanceof Error ? error.message : 'Unknown error',
          tokenLength: sessionToken.length 
        };
      }
    }
    
    // Get cookie names for debugging (without sensitive values)
    const cookieNames = Array.from(request.cookies.getAll()).map(cookie => cookie.name);

    console.log(`🚫 PHANTOM ENDPOINT BLOCKED:`, {
      path,
      method,
      timestamp,
      clientIP,
      userAgent,
      referer,
      hasSession: !!sessionToken,
      userInfo,
      cookieNames: cookieNames.length > 0 ? cookieNames : 'none',
      possibleSource: clientIP === '::1' || clientIP === '127.0.0.1' ? 'Local development' : 
                     referer === 'direct' ? 'Direct request or cached page' :
                     'External source',
      headers: {
        'x-forwarded-for': request.headers.get("x-forwarded-for"),
        'x-real-ip': request.headers.get("x-real-ip"),
        'origin': request.headers.get("origin"),
        'host': request.headers.get("host"),
        'connection': request.headers.get("connection")
      }
    });

    return new NextResponse(
      null, // Empty body to minimize bandwidth
      { 
        status: 410, // Gone - indicates the resource is no longer available
        headers: { 
          "Content-Length": "0",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours to prevent repeat requests
          "X-Deprecated": "true",
          "X-Blocked-Reason": "phantom-endpoint"
        } 
      }
    );
  }

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
    path.startsWith("/api/notifications") ||
    path.startsWith("/api/users");

  const publicPaths = ["/", "/privacy-policy", "/terms-of-service"];
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
