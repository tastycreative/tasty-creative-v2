import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Token refresh requested');
    
    // This endpoint can be called to manually trigger a token refresh
    // The auth() function will automatically handle the refresh if needed
    const session = await auth();

    if (!session || !session.user) {
      console.log('Token refresh failed: No session or user');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if there was an error in the token refresh
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session as any).error) {
      console.log('Token refresh failed: Session has error:', (session as any).error);
      return NextResponse.json(
        { 
          error: "Token refresh failed", 
          message: "Unable to refresh the access token. Please re-authenticate with Google.",
          requiresReauth: true
        },
        { status: 401 }
      );
    }

    console.log('Token refresh check - Has access token:', !!session.accessToken);
    console.log('Token refresh check - Has refresh token:', !!session.refreshToken);
    console.log('Token refresh check - Expires at:', session.expiresAt);
    console.log('Token refresh check - Current time:', Math.floor(Date.now() / 1000));

    // If we get here, either the token was fresh or successfully refreshed
    return NextResponse.json({ 
      success: true, 
      message: "Token is valid or was successfully refreshed",
      tokenExpiresAt: session.expiresAt,
      hasRefreshToken: !!session.refreshToken,
      hasAccessToken: !!session.accessToken
    });

  } catch (error) {
    console.error('Error during token refresh:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: "An error occurred while refreshing the token"
      },
      { status: 500 }
    );
  }
}