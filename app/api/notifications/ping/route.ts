import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const timestamp = body.timestamp || Date.now();

    // Simple ping response to keep connection alive
    return NextResponse.json({
      success: true,
      timestamp,
      serverTime: Date.now(),
      userId: session.user.id
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Ping failed' },
      { status: 500 }
    );
  }
}
