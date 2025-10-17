import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the last timestamp from query params
    const searchParams = req.nextUrl.searchParams;
    const since = searchParams.get('since');
    const sinceDate = since ? new Date(parseInt(since)) : new Date(Date.now() - 60000); // Last minute by default

    // Fetch notifications since the given timestamp
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gt: sinceDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        podTeam: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 50 // Limit to prevent large payloads
    });

    const totalUnread = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    return new Response(JSON.stringify({
      success: true,
      notifications,
      unreadCount: totalUnread,
      timestamp: Date.now(),
      polledSince: sinceDate.toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in notifications poll:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
