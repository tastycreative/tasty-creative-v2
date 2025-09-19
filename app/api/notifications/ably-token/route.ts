import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Ably from 'ably';

const ABLY_API_KEY = process.env.ABLY_API_KEY;

// Create Ably token for authenticated client connections
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ABLY_API_KEY) {
      return NextResponse.json({ error: 'Ably not configured' }, { status: 500 });
    }

    const userId = session.user.id;
    
    // Create Ably REST client for token generation
    const ably = new Ably.Rest(ABLY_API_KEY);

    // Generate token with specific capability for user's notification channel
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: userId,
      capability: {
        [`user:${userId}:notifications`]: ['subscribe'],
        [`team:*:notifications`]: ['subscribe'] // Allow subscription to any team the user is part of
      },
      ttl: 3600000, // 1 hour
    });

    console.log(`🔐 Generated Ably token for user: ${userId}`);

    return NextResponse.json(tokenRequest);

  } catch (error: any) {
    console.error('❌ Error generating Ably token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error.message },
      { status: 500 }
    );
  }
}
