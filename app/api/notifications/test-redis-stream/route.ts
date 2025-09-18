import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { executeRedisCommand } from '@/lib/upstash';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Testing Redis stream for user:', session.user.id);

    const userId = session.user.id;
    const streamKey = `notifications:${userId}`;

    // Test 1: Add a test message to the stream
    const testMessage = {
      id: `test-${Date.now()}`,
      type: 'TASK_COMMENT_ADDED',
      title: 'Test Redis Stream Notification',
      message: 'This is a test notification for Redis streams',
      userId: userId,
      timestamp: Date.now(),
      data: {
        taskId: 'test-task',
        taskTitle: 'Test Task'
      }
    };

    console.log('🔧 Adding test message to Redis stream:', streamKey);
    const addResult = await executeRedisCommand([
      'XADD',
      streamKey,
      '*', // Auto-generate ID
      'notification', JSON.stringify(testMessage),
      'timestamp', testMessage.timestamp.toString(),
      'type', testMessage.type
    ]);

    if (!addResult.success) {
      console.error('❌ Failed to add to Redis stream:', addResult.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to add to Redis stream',
        details: addResult.error
      }, { status: 500 });
    }

    console.log('✅ Added to Redis stream successfully:', addResult.data);

    // Test 2: Try to read from the stream
    console.log('🔍 Reading from Redis stream:', streamKey);
    const readResult = await executeRedisCommand([
      'XREAD',
      'COUNT', '10',
      'STREAMS',
      streamKey,
      '0' // Read from beginning
    ]);

    if (!readResult.success) {
      console.error('❌ Failed to read from Redis stream:', readResult.error);
    } else {
      console.log('📖 Read from Redis stream successfully:', JSON.stringify(readResult.data, null, 2));
    }

    // Test 3: Check stream info
    const infoResult = await executeRedisCommand([
      'XINFO',
      'STREAM',
      streamKey
    ]);

    return NextResponse.json({
      success: true,
      streamKey,
      addResult: addResult.data,
      readResult: readResult.data,
      infoResult: infoResult.data,
      message: 'Redis stream test completed - check server console for detailed logs'
    });

  } catch (error) {
    console.error('❌ Test Redis stream error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    );
  }
}
