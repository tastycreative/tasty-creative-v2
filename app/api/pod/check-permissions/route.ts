import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if there's a token error (which could mean refresh failed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session as any).error) {
      return NextResponse.json(
        { 
          error: "GooglePermissionDenied", 
          message: "Token refresh failed. Please re-authenticate with Google to restore permissions." 
        },
        { status: 403 }
      );
    }

    // Check if user has access token
    if (!session.accessToken) {
      return NextResponse.json(
        { 
          error: "GooglePermissionDenied", 
          message: "No access token available. Please sign in with Google." 
        },
        { status: 403 }
      );
    }

    // Check if user has refresh token (this is what was causing the original error)
    if (!session.refreshToken) {
      return NextResponse.json(
        { 
          error: "GooglePermissionDenied", 
          message: "Missing refresh token. Please re-authenticate with Google to grant proper permissions." 
        },
        { status: 403 }
      );
    }

    // Check if token is expired (this should be handled by auto-refresh, but as a fallback)
    if (session.expiresAt && Date.now() > (session.expiresAt * 1000)) {
      return NextResponse.json(
        { 
          error: "GooglePermissionDenied", 
          message: "Access token has expired. Please re-authenticate with Google." 
        },
        { status: 403 }
      );
    }

    // Test the token by making a simple API call to ensure it works
    try {
      const testResponse = await fetch(
        'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + session.accessToken
      );
      
      if (!testResponse.ok) {
        return NextResponse.json(
          { 
            error: "GooglePermissionDenied", 
            message: "Access token is invalid. Please re-authenticate with Google." 
          },
          { status: 403 }
        );
      }
    } catch (tokenTestError) {
      console.error('Token validation failed:', tokenTestError);
      return NextResponse.json(
        { 
          error: "GooglePermissionDenied", 
          message: "Unable to validate Google access token. Please re-authenticate." 
        },
        { status: 403 }
      );
    }

    // All checks passed - user has proper Google permissions
    return NextResponse.json({ 
      success: true, 
      message: "Google permissions verified successfully",
      tokenExpiresAt: session.expiresAt,
      hasRefreshToken: !!session.refreshToken
    });

  } catch (error) {
    console.error('Error checking Google permissions:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}