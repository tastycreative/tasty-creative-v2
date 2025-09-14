import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getConnectionCount, getConnectedUsers } from '@/lib/sse-broadcast';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION || 'local',
      userId: session.user.id,
      connections: {
        total: getConnectionCount(),
        users: getConnectedUsers(),
        isCurrentUserConnected: getConnectedUsers().includes(session.user.id)
      },
      runtime: 'nodejs'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
