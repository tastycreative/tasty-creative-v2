import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { registerConnection, removeConnection } from '@/lib/sse-broadcast';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log(`📡 Setting up SSE stream for user: ${session.user.id}`);

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Notification stream connected',
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(new TextEncoder().encode(initialMessage));

        // Register connection for broadcasting
        registerConnection(session.user.id, controller);

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatMessage = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`;
            
            controller.enqueue(new TextEncoder().encode(heartbeatMessage));
          } catch (error) {
            console.error('Heartbeat error:', error);
            clearInterval(heartbeat);
            removeConnection(session.user.id);
          }
        }, 30000); // 30 seconds

        // Clean up on close
        const cleanup = () => {
          console.log(`📡 Cleaning up SSE connection for user: ${session.user.id}`);
          clearInterval(heartbeat);
          removeConnection(session.user.id);
          try {
            controller.close();
          } catch (error) {
            // Connection already closed
          }
        };

        // Store cleanup function
        (controller as any).cleanup = cleanup;
      },
      cancel() {
        console.log(`📡 SSE stream cancelled for user: ${session.user.id}`);
        removeConnection(session.user.id);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('Error setting up notification stream:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}