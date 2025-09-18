import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserNotifications, executeRedisCommand } from '@/lib/upstash';

// Real-time notification system using Upstash Redis Streams
// Uses XREAD to listen for new notifications

// Store active connections per user
const activeConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string;
  lastActivity: Date;
  streamPosition: string;
}>();

// Cleanup stale connections every 5 minutes
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

// Listen to Redis stream for a specific user
async function listenToUserStream(userId: string, controller: ReadableStreamDefaultController, lastId = '$') {
  const streamKey = `notifications:${userId}`;
  
  try {
    // Use non-blocking XREAD since Upstash REST doesn't support blocking commands
    const result = await executeRedisCommand([
      'XREAD',
      'COUNT', '10', // Read up to 10 messages
      'STREAMS',
      streamKey,
      lastId
    ]);

    console.log(`🔍 XREAD for ${streamKey} from position ${lastId}`);
    
    if (result.success) {
      console.log(`✅ XREAD success:`, result.data ? 'HAS_DATA' : 'NO_DATA');
    } else {
      console.log(`❌ XREAD failed:`, result.error);
    }

    if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
      const streamData = result.data[0]; // First stream
      if (Array.isArray(streamData) && streamData.length > 1) {
        const messages = streamData[1]; // Messages array
        
        if (Array.isArray(messages) && messages.length > 0) {
          console.log(`📬 ${messages.length} new Redis stream messages for user ${userId}`);
          
          let latestMessageId = lastId;
          for (const message of messages) {
            if (Array.isArray(message) && message.length === 2) {
              const [messageId, fields] = message;
              latestMessageId = messageId;
              
              // Parse the message fields (Redis stores as flat array: [key, value, key, value, ...])
              const messageData: any = {};
              if (Array.isArray(fields)) {
                for (let i = 0; i < fields.length; i += 2) {
                  const key = fields[i];
                  const value = fields[i + 1];
                  
                  if (key === 'notification' && typeof value === 'string') {
                    try {
                      messageData.notification = JSON.parse(value);
                    } catch {
                      messageData.notification = value;
                    }
                  } else {
                    messageData[key] = value;
                  }
                }
              }

              // Send to SSE client
              if (messageData.notification) {
                const encoder = new TextEncoder();
                const sseMessage = JSON.stringify({
                  type: 'notification',
                  data: messageData.notification
                });
                
                console.log(`📡 Sending SSE notification to user ${userId}:`, messageData.notification.title);
                
                try {
                  controller.enqueue(encoder.encode(`data: ${sseMessage}\n\n`));
                  
                  // Update connection activity and stream position
                  for (const [connId, conn] of activeConnections.entries()) {
                    if (conn.userId === userId) {
                      conn.lastActivity = new Date();
                      conn.streamPosition = messageId;
                      break;
                    }
                  }
                } catch (error) {
                  console.error(`❌ Error sending SSE message to user ${userId}:`, error);
                  throw error;
                }
              }
            }
          }
          
          return latestMessageId; // Return the latest message ID processed
        }
      }
    }
    
    // Always add delay between polls to prevent tight looping (whether we got messages or not)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between polls
    return lastId; // Return same ID if no new messages
    
  } catch (error) {
    console.error(`❌ Error reading from Redis stream ${streamKey}:`, error);
    // Add delay on error to prevent tight error loops
    await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delay on errors
    throw error;
  }
}

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
          lastActivity: new Date(),
          streamPosition: '0' // Start from beginning to catch existing messages
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

        // Start listening to Redis stream in a loop
        const streamLoop = async () => {
          let lastStreamId = '0'; // Start from beginning to catch existing messages
          let iterationCount = 0;
          
          while (activeConnections.has(connectionId)) {
            try {
              const newLastId = await listenToUserStream(userId, controller, lastStreamId);
              if (newLastId && newLastId !== lastStreamId) {
                lastStreamId = newLastId;
              }
              
              iterationCount++;
              
              // Send keepalive only every 6th iteration (roughly every 30 seconds with 5s XREAD timeout)
              if (iterationCount % 6 === 0) {
                sendMessage({ 
                  type: 'keepalive', 
                  timestamp: Date.now(),
                  connections: activeConnections.size 
                });
              }
              
            } catch (error) {
              console.error(`❌ Stream loop error for user ${userId}:`, error);
              
              // If connection is broken, clean up and exit
              if (!activeConnections.has(connectionId)) {
                break;
              }
              
              // Wait before retrying on error
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
        };

        // Start the stream listening loop
        streamLoop().catch(error => {
          console.error(`❌ Fatal stream error for user ${userId}:`, error);
          activeConnections.delete(connectionId);
          try {
            controller.close();
          } catch {}
        });

        // Handle client disconnect
        request.signal?.addEventListener('abort', () => {
          console.log('🔌 Client disconnected:', connectionId, 'for user:', userId);
          console.log(`📊 Remaining connections: ${activeConnections.size - 1}`);
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

// Stats endpoint for debugging
export async function PATCH(request: NextRequest) {
  const connections = Array.from(activeConnections.entries()).map(([id, conn]) => ({
    id,
    userId: conn.userId,
    lastActivity: conn.lastActivity,
    streamPosition: conn.streamPosition,
  }));

  return NextResponse.json({
    totalConnections: activeConnections.size,
    connections
  });
}
