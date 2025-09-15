import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { registerConnection, removeConnection } from '@/lib/sse-broadcast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel Pro

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log('❌ SSE: Unauthorized access attempt');
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    console.log(`📡 Setting up SSE stream for user: ${userId} in ${process.env.NODE_ENV} mode`);

    // Create SSE stream with better error handling
    const stream = new ReadableStream({
      start(controller) {
        console.log(`📡 Starting SSE controller for user: ${userId}`);
        
        // Send initial connection message
        const sendMessage = (data: any) => {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
            return true;
          } catch (error) {
            console.error(`❌ Error sending SSE message to user ${userId}:`, error);
            return false;
          }
        };

        // Initial connection confirmation
        if (!sendMessage({
          type: 'connected',
          message: 'Notification stream connected',
          timestamp: new Date().toISOString(),
          userId
        })) {
          console.error(`❌ Failed to send initial message to user ${userId}`);
          removeConnection(userId);
          return;
        }

        // Register connection for broadcasting
        registerConnection(userId, controller);

        // Poll Upstash for pending messages for this user and forward to the SSE controller
        const pollingInterval = process.env.NODE_ENV === 'production' ? 1500 : 3000;
        const poller = setInterval(async () => {
          try {
            // popUserMessage returns the next queued message (or null)
            const { popUserMessage } = await import('@/lib/upstash');
            const message = await popUserMessage(userId);
            if (message) {
              const msg = `data: ${JSON.stringify(message)}\n\n`;
              try {
                controller.enqueue(new TextEncoder().encode(msg));
                console.log(`📡 Forwarded Upstash message to user ${userId}`);
              } catch (err) {
                console.error('❌ Failed to enqueue Upstash message to controller:', err);
              }
            }
          } catch (error) {
            console.error('Upstash poller error:', error);
          }
        }, pollingInterval);

        // Keep connection alive with heartbeat - more aggressive for production
        const heartbeatInterval = process.env.NODE_ENV === 'production' ? 10000 : 15000; // 10s prod, 15s dev
        const heartbeat = setInterval(() => {
          if (!sendMessage({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })) {
            console.error(`❌ Heartbeat failed for user ${userId}, cleaning up`);
            clearInterval(heartbeat);
            removeConnection(userId);
            try {
              if (controller.desiredSize !== null) {
                controller.close();
              }
            } catch (error) {
              console.log('Controller already closed:', error);
            }
          }
        }, heartbeatInterval);

        // Clean up on close
        const cleanup = () => {
          console.log(`📡 Cleaning up SSE connection for user: ${userId}`);
          clearInterval(heartbeat);
          clearInterval(poller);
          removeConnection(userId);
          try {
            if (controller.desiredSize !== null) {
              controller.close();
            }
          } catch (error) {
            console.log('Controller already closed during cleanup:', error);
          }
        };

        // Store cleanup function for external access
        (controller as any).cleanup = cleanup;

        // Handle connection close/abort from client
        if (req.signal) {
          req.signal.addEventListener('abort', () => {
            console.log(`📡 Client aborted SSE connection for user: ${userId}`);
            cleanup();
          });
        }

        // Cleanup on process termination (important for Vercel)
        const processCleanup = () => {
          console.log(`📡 Process cleanup for SSE user: ${userId}`);
          cleanup();
        };
        
        process.on('SIGTERM', processCleanup);
        process.on('SIGINT', processCleanup);
      },
      cancel(reason) {
        console.log(`📡 SSE stream cancelled for user: ${userId}, reason:`, reason);
        removeConnection(userId);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        // Additional headers for better Vercel support
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Error setting up notification stream:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}