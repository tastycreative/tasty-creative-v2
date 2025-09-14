import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      status: 'healthy',
      userId: session.user.id,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      runtime: process.env.VERCEL_REGION || 'local'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
