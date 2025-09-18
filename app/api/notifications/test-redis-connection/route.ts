import { NextRequest, NextResponse } from 'next/server';
import { executeRedisCommand } from '@/lib/upstash';

// Test Redis connection
export async function GET(request: NextRequest) {
  try {
    // Test basic Redis connection
    const pingResult = await executeRedisCommand(['PING']);
    
    if (!pingResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Redis PING failed',
        details: pingResult.error
      }, { status: 500 });
    }

    // Test SET and GET
    const testKey = `test:${Date.now()}`;
    const testValue = JSON.stringify({ test: true, timestamp: new Date().toISOString() });
    
    const setResult = await executeRedisCommand(['SET', testKey, testValue]);
    if (!setResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Redis SET failed',
        details: setResult.error
      }, { status: 500 });
    }

    const getResult = await executeRedisCommand(['GET', testKey]);
    if (!getResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Redis GET failed', 
        details: getResult.error
      }, { status: 500 });
    }

    // Clean up test key
    await executeRedisCommand(['DEL', testKey]);

    return NextResponse.json({
      success: true,
      message: 'Redis connection working properly',
      ping: pingResult.data,
      testValue: getResult.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Redis test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Redis test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
