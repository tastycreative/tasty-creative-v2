import { NextRequest } from 'next/server';
import { auth } from '@/auth';

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

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

        // Store connection for broadcasting
        connections.set(session.user.id, controller);

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatMessage = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`;
            
            controller.enqueue(new TextEncoder().encode(heartbeatMessage));
          } catch (error) {
            clearInterval(heartbeat);
            connections.delete(session.user.id);
          }
        }, 30000); // 30 seconds

        // Clean up on close
        const cleanup = () => {
          clearInterval(heartbeat);
          connections.delete(session.user.id);
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
        connections.delete(session.user.id);
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

// Helper function to broadcast to specific user
export async function broadcastToUser(userId: string, data: any) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const message = `data: ${JSON.stringify({
        type: 'NEW_NOTIFICATION',
        data,
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(message));
      console.log(`📡 Broadcasted to user ${userId}:`, data.title);
    } catch (error) {
      console.error('Error broadcasting to user:', error);
      connections.delete(userId);
    }
  }
}