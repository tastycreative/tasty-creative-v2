import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      const result = await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({ 
        success: true, 
        message: 'All notifications marked as read',
        count: result.count 
      });
    } else if (notificationId) {
      // Mark specific notification as read
      await markNotificationAsRead(notificationId, session.user.id);
      return NextResponse.json({ 
        success: true, 
        message: 'Notification marked as read' 
      });
    } else {
      return NextResponse.json({ 
        error: 'Either notificationId or markAll must be provided' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}