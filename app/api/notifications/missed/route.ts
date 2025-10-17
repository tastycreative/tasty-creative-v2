import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getUnreadNotifications } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = session.user.id;
    
    // Get recent notifications (both read and unread) that the user might have missed
    const recentNotifications = await getUnreadNotifications(userId);

    console.log(`📡 Found ${recentNotifications.length} recent notifications for user ${userId}`);

    return new Response(JSON.stringify({
      success: true,
      missedNotifications: recentNotifications,
      count: recentNotifications.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching missed notifications:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch missed notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
