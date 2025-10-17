import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createInAppNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a test notification
    const testNotification = await createInAppNotification({
      userId: session.user.id,
      type: 'SYSTEM_NOTIFICATION',
      title: 'Test Notification',
      message: 'This is a test notification to verify real-time functionality',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

            return NextResponse.json({
              success: true,
              message: 'Test notification created',
              notification: testNotification,
              timestamp: new Date().toISOString()
            });

  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
