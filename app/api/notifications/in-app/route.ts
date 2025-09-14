import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUnreadNotifications, getNotificationCount } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'count') {
      const count = await getNotificationCount(session.user.id);
      return NextResponse.json({ count });
    }

    // Default: return unread notifications
    const notifications = await getUnreadNotifications(session.user.id);
    
    return NextResponse.json({ 
      notifications,
      count: notifications.length 
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}