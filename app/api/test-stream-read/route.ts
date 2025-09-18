import { NextRequest, NextResponse } from 'next/server';
import { executeRedisCommand } from '@/lib/upstash';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'test-user-id';
    const streamKey = `notifications:${userId}`;
    
    console.log('🔍 Reading from Redis stream:', streamKey);
    
    // Try to read the latest messages from the stream
    const result = await executeRedisCommand([
      'XREAD',
      'COUNT', '10', // Read last 10 messages
      'STREAMS',
      streamKey,
      '0' // Start from beginning
    ]);
    
    console.log('📖 Stream read result:', result);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        streamKey,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        streamKey,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Stream read error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    });
  }
}
