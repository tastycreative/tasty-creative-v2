import { NextRequest, NextResponse } from 'next/server';
import { auth, signOut } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try to revoke the Google token if we have one
    if (session.accessToken) {
      try {
        console.log('Attempting to revoke Google token...');
        const revokeResponse = await fetch(
          `https://oauth2.googleapis.com/revoke?token=${session.accessToken}`,
          { method: 'POST' }
        );
        
        if (revokeResponse.ok) {
          console.log('Google token revoked successfully');
        } else {
          console.log('Google token revoke failed, but continuing...');
        }
      } catch (error) {
        console.log('Error revoking Google token:', error);
        // Continue anyway
      }
    }

    // Sign the user out to clear the session
    await signOut({ redirect: false });

    return NextResponse.json({ 
      success: true, 
      message: "Google access revoked and user signed out. Please sign in again to get fresh tokens." 
    });

  } catch (error) {
    console.error('Error revoking Google access:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}