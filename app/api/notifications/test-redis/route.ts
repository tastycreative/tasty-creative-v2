import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { publishNotification } from '@/lib/upstash';

// Test endpoint to trigger a notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message = 'Test notification from Redis system!' } = body;

    const userId = session.user.id;
    const notificationId = crypto.randomUUID();

    const notification = {
      id: notificationId,
      type: 'TEST',
      title: 'Test Notification',
      message: message,
      userId: userId,
      timestamp: Date.now(),
      data: {
        test: true,
        triggeredBy: session.user.name || session.user.email,
        timestamp: new Date().toISOString()
      }
    };

    console.log('🧪 Publishing test notification:', notification);

    const result = await publishNotification(notification);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully',
        notification: notification
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
