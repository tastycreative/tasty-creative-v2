import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { executeRedisCommand } from '@/lib/upstash';

// Store active connections per user (per serverless instance)
const userConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  lastActivity: Date;
  userId: string;
}>();

// Cleanup stale connections every minute
setInterval(() => {
  const now = new Date();
  userConnections.forEach((connection, id) => {
    if (now.getTime() - connection.lastActivity.getTime() > 300000) { // 5 minutes
      try {
        connection.controller.close();
      } catch (error) {
        console.log('🧹 Cleaned up stale notification connection:', id);
      }
      userConnections.delete(id);
    }
  });
}, 60000);

// Redis subscription-based real-time notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const connectionId = crypto.randomUUID();

    console.log('🔗 Setting up notification stream for user:', userId);

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Store connection
        userConnections.set(connectionId, {
          controller,
          lastActivity: new Date(),
          userId
        });

        // Send initial connection message
        const sendMessage = (data: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            userConnections.get(connectionId)!.lastActivity = new Date();
          } catch (error) {
            console.error('❌ Error sending message:', error);
            userConnections.delete(connectionId);
          }
        };

        sendMessage({ type: 'connected', message: 'Notification stream connected' });

        // Start Redis subscription polling using LPOP (non-blocking)
        const subscribeToRedis = async () => {
          const channel = `notifications:${userId}`;
          let isSubscribed = true;

          while (isSubscribed && userConnections.has(connectionId)) {
            try {
              // Use LPOP to get messages from the queue (non-blocking)
              const listKey = `notifications_queue:${userId}`;
              
              const result = await executeRedisCommand(['LPOP', listKey]);
              
              if (result.success && result.data) {
                try {
                  const notification = JSON.parse(result.data);
                  console.log('📬 Received notification from Redis:', notification.id);
                  sendMessage({
                    type: 'notification',
                    data: notification
                  });
                } catch (parseError) {
                  console.error('❌ Error parsing notification:', parseError);
                }
              }

              // Check if connection still exists
              if (!userConnections.has(connectionId)) {
                isSubscribed = false;
                break;
              }

              // Poll every 2 seconds to reduce load
              await new Promise(resolve => setTimeout(resolve, 2000));
              
            } catch (error) {
              console.error('❌ Redis subscription error:', error);
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer on error
            }
          }
        };

        // Start subscription in background
        subscribeToRedis().catch(console.error);

        // Send periodic keepalive
        const keepAliveInterval = setInterval(() => {
          if (userConnections.has(connectionId)) {
            sendMessage({ type: 'keepalive', timestamp: Date.now() });
          } else {
            clearInterval(keepAliveInterval);
          }
        }, 30000); // Every 30 seconds

        // Handle cleanup
        request.signal?.addEventListener('abort', () => {
          console.log('🔌 Client disconnected, cleaning up:', connectionId);
          clearInterval(keepAliveInterval);
          userConnections.delete(connectionId);
          try {
            controller.close();
          } catch (error) {
            // Connection already closed
          }
        });
      },

      cancel() {
        console.log('🔌 Stream cancelled for connection:', connectionId);
        userConnections.delete(connectionId);
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

// Get connection stats (for debugging)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = {
      activeConnections: userConnections.size,
      connections: Array.from(userConnections.entries()).map(([id, conn]) => ({
        id,
        userId: conn.userId,
        lastActivity: conn.lastActivity,
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Error getting connection stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
