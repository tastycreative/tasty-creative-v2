import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { publishNotification } from '@/lib/ably';

// Test endpoint to trigger an Ably notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message = 'Test notification from Ably system! 🚀' } = body;

    const userId = session.user.id;
    const notificationId = crypto.randomUUID();

    const notification = {
      id: notificationId,
      type: 'TEST_ABLY',
      title: 'Test Ably Notification',
      message: message,
      userId: userId,
      timestamp: Date.now(),
      data: {
        test: true,
        system: 'ably',
        triggeredBy: session.user.name || session.user.email,
        timestamp: new Date().toISOString()
      }
    };

    console.log('🧪 Publishing test Ably notification:', notification);

    const result = await publishNotification(notification);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test Ably notification sent successfully',
        notification: notification,
        system: 'ably'
      });
    } else {
      console.error('❌ Failed to publish test notification:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        notification: notification
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Error in test Ably endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message || String(error)
    }, { status: 500 });
  }
}
