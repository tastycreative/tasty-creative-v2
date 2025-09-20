import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { publishNotification } from '@/lib/ably';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Testing webhook notification for user:', session.user.id);

    // Create a test notification
    const testNotification = {
      id: `test-${Date.now()}`,
      type: 'TASK_COMMENT_ADDED' as const,
      title: 'Test Notification',
      message: 'This is a test notification to verify webhooks work',
      userId: session.user.id,
      timestamp: Date.now(),
      data: {
        taskId: 'test-task',
        taskTitle: 'Test Task',
        teamId: 'test-team'
      }
    };

    const result = await publishNotification(testNotification);

    return NextResponse.json({
      success: result.success,
      error: result.error,
      notification: testNotification
    });

  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
}
