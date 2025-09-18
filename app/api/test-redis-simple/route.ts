import { NextRequest, NextResponse } from 'next/server';
import { executeRedisCommand } from '@/lib/upstash';

export async function GET() {
  console.log('🔧 Testing simple Redis commands...');

  try {
    // Test 1: Simple PING
    console.log('Test 1: PING');
    const pingResult = await executeRedisCommand(['PING']);
    console.log('PING result:', pingResult);

    // Test 2: Simple SET/GET
    console.log('Test 2: SET/GET');
    const setResult = await executeRedisCommand(['SET', 'test:key', 'hello']);
    console.log('SET result:', setResult);
    
    const getResult = await executeRedisCommand(['GET', 'test:key']);
    console.log('GET result:', getResult);

    // Test 3: Simple HSET
    console.log('Test 3: HSET');
    const hsetResult = await executeRedisCommand(['HSET', 'test:hash', 'field1', 'value1']);
    console.log('HSET result:', hsetResult);

    // Test 4: HSET with JSON (potential issue)
    console.log('Test 4: HSET with JSON');
    const jsonData = JSON.stringify({ test: 'data' });
    console.log('JSON string:', jsonData);
    const hsetJsonResult = await executeRedisCommand(['HSET', 'test:hash', 'jsonfield', jsonData]);
    console.log('HSET JSON result:', hsetJsonResult);

    // Test 5: Simple XADD
    console.log('Test 5: Simple XADD');
    const xaddResult = await executeRedisCommand([
      'XADD',
      'test:stream',
      '*',
      'message', 'hello',
      'timestamp', '123456789'
    ]);
    console.log('XADD result:', xaddResult);

    // Test 6: XADD with JSON (potential issue)
    console.log('Test 6: XADD with JSON');
    const xaddJsonResult = await executeRedisCommand([
      'XADD',
      'test:stream:json',
      '*',
      'data', jsonData,
      'type', 'test'
    ]);
    console.log('XADD JSON result:', xaddJsonResult);

    return NextResponse.json({
      success: true,
      tests: {
        ping: pingResult,
        set: setResult,
        get: getResult,
        hset: hsetResult,
        hsetJson: hsetJsonResult,
        xadd: xaddResult,
        xaddJson: xaddJsonResult
      }
    });

  } catch (error: any) {
    console.error('❌ Redis test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
