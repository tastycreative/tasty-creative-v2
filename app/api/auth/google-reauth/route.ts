import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl') || '/apps/gallery';
  
  // Build Google OAuth URL with forced consent and offline access
  const params = new URLSearchParams({
    client_id: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    response_type: 'code',
    scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
    access_type: 'offline',
    prompt: 'consent', // Force consent screen to get refresh token
    state: Buffer.from(JSON.stringify({ callbackUrl })).toString('base64')
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return NextResponse.redirect(googleAuthUrl);
}