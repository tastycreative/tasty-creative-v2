import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Ably from 'ably';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const ABLY_API_KEY = process.env.ABLY_API_KEY;

    if (!ABLY_API_KEY) {
      console.error('ABLY_API_KEY not configured');
      return NextResponse.json(
        { error: 'Ably not configured' },
        { status: 500 }
      );
    }

    // Create an Ably REST client
    const ablyRest = new Ably.Rest(ABLY_API_KEY);

    // Generate a token request with the user's ID as the clientId
    const tokenRequest = await ablyRest.auth.createTokenRequest({
      clientId: session.user.id,
      capability: {
        // Allow subscribing to board channels for teams the user is part of
        'board:*': ['subscribe', 'publish'],
        // Allow subscribing to user's own notification channel
        [`user:${session.user.id}:notifications`]: ['subscribe'],
      },
      // Token valid for 1 hour
      ttl: 60 * 60 * 1000,
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Error creating Ably token request:', error);
    return NextResponse.json(
      { error: 'Failed to create token request' },
      { status: 500 }
    );
  }
}
