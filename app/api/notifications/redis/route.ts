import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserNotifications } from '@/lib/upstash';

// Get user notifications from Redis
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const result = await getUserNotifications(userId);

    if (!result.success) {
      console.error('❌ Failed to get notifications from Redis:', result.error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const notifications = result.notifications || [];
    const unreadCount = notifications.filter(n => !n.data?.isRead).length;

    return NextResponse.json({
      notifications,
      count: unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('❌ Error fetching Redis notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
