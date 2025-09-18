import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserNotifications } from '@/lib/upstash';

// More efficient notification system for Vercel
// Uses webhooks + manual refresh instead of polling

// Store active connections per user (minimal memory usage)
const activeConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string;
  lastActivity: Date;
}>();

// Cleanup every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const CONNECTION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = new Date();
  for (const [id, conn] of activeConnections.entries()) {
    if (now.getTime() - conn.lastActivity.getTime() > CONNECTION_TIMEOUT) {
      try {
        conn.controller.close();
      } catch {}
      activeConnections.delete(id);
      console.log('🧹 Cleaned up stale connection:', id);
    }
  }
}, CLEANUP_INTERVAL);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const connectionId = crypto.randomUUID();

    console.log('🔗 Setting up efficient notification stream for user:', userId);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        activeConnections.set(connectionId, {
          controller,
          userId,
          lastActivity: new Date()
        });

        console.log(`🔗 New SSE connection established for user ${userId}, connection ${connectionId}`);
        console.log(`📊 Total active connections: ${activeConnections.size}`);

        const sendMessage = (data: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            const conn = activeConnections.get(connectionId);
            if (conn) {
              conn.lastActivity = new Date();
            }
          } catch (error) {
            activeConnections.delete(connectionId);
          }
        };

        // Send initial connection confirmation
        sendMessage({ 
          type: 'connected', 
          message: 'Efficient notification stream ready',
          connectionId 
        });

        // Check for any existing queued notifications (one-time check)
        try {
          const result = await getUserNotifications(userId);
          if (result.success && result.notifications) {
            const recentNotifications = result.notifications
              .filter(n => Date.now() - n.timestamp < 60000) // Last minute only
              .slice(0, 5); // Max 5 recent notifications
            
            if (recentNotifications.length > 0) {
              console.log('📋 Sending recent notifications:', recentNotifications.length);
              sendMessage({
                type: 'initial_notifications',
                data: recentNotifications
              });
            }
          }
        } catch (error) {
          console.error('❌ Error fetching initial notifications:', error);
        }

        // Send keepalive every 2 minutes
        const keepAliveInterval = setInterval(() => {
          if (activeConnections.has(connectionId)) {
            sendMessage({ 
              type: 'keepalive', 
              timestamp: Date.now(),
              connections: activeConnections.size 
            });
          } else {
            clearInterval(keepAliveInterval);
          }
        }, 120000); // 2 minutes

        // Handle client disconnect
        request.signal?.addEventListener('abort', () => {
          console.log('🔌 Client disconnected:', connectionId, 'for user:', userId);
          console.log(`📊 Remaining connections: ${activeConnections.size - 1}`);
          clearInterval(keepAliveInterval);
          activeConnections.delete(connectionId);
          try {
            controller.close();
          } catch {}
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ Error setting up notification stream:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Webhook endpoint to push notifications to active connections
export async function POST(request: NextRequest) {
  try {
    // Skip auth for webhook calls (internal server-to-server)
    const { userId, notification } = await request.json();
    
    if (!userId || !notification) {
      return NextResponse.json({ error: 'Missing userId or notification' }, { status: 400 });
    }

    console.log('🔔 Webhook: Pushing notification to user:', userId);

    // Find active connections for this user
    let sentCount = 0;
    for (const [id, conn] of activeConnections.entries()) {
      if (conn.userId === userId) {
        try {
          const encoder = new TextEncoder();
          conn.controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'notification',
              data: notification
            })}\n\n`)
          );
          conn.lastActivity = new Date();
          sentCount++;
          console.log('📡 Sent notification to connection:', id);
        } catch (error) {
          console.error('❌ Error sending to connection:', id, error);
          activeConnections.delete(id);
        }
      }
    }

    console.log(`📡 Sent notification to ${sentCount} active connections`);

    return NextResponse.json({
      success: true,
      sentToConnections: sentCount,
      totalConnections: activeConnections.size
    });

  } catch (error) {
    console.error('❌ Error in webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Stats endpoint
export async function PATCH(request: NextRequest) {
  const connections = Array.from(activeConnections.entries()).map(([id, conn]) => ({
    id,
    userId: conn.userId,
    lastActivity: conn.lastActivity,
  }));

  return NextResponse.json({
    totalConnections: activeConnections.size,
    connections
  });
}
