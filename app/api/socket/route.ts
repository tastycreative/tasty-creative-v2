import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('📱 Socket.IO endpoint called - App Router doesn\'t support Socket.IO directly');
    
    return NextResponse.json({ 
      status: 'Socket.IO not available in App Router',
      message: 'App Router does not support Socket.IO. Using SSE fallback.',
      usingFallback: 'SSE',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in socket endpoint:', error);
    return NextResponse.json(
      { error: 'Socket endpoint error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
