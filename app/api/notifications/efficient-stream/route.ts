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

// Check for new messages in Redis stream (minimal polling)
async function checkForNewMessages(userId: string, controller: ReadableStreamDefaultController, lastId = '$') {
  const streamKey = `notifications:${userId}`;
  
  try {
    console.log(`🔍 Checking stream ${streamKey} from position ${lastId}`);
    
    // Use XREAD with minimal count to reduce data transfer
    const result = await executeRedisCommand([
      'XREAD',
      'COUNT', '5', // Reduced from 10 to 5
      'STREAMS',
      streamKey,
      lastId
    ]);
    
    if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
      const streamData = result.data[0];
      if (Array.isArray(streamData) && streamData.length > 1) {
        const messages = streamData[1];
        
        if (Array.isArray(messages) && messages.length > 0) {
          console.log(`📬 ${messages.length} new messages for user ${userId}`);
          
          let latestMessageId = lastId;
          for (const message of messages) {
            if (Array.isArray(message) && message.length === 2) {
              const [messageId, fields] = message;
              latestMessageId = messageId;
              
              // Parse message fields efficiently
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

              // Send notification immediately
              if (messageData.notification) {
                const encoder = new TextEncoder();
                const sseMessage = JSON.stringify({
                  type: 'notification',
                  data: messageData.notification
                });
                
                console.log(`📡 Real-time notification: ${messageData.notification.title}`);
                
                try {
                  controller.enqueue(encoder.encode(`data: ${sseMessage}\n\n`));
                } catch (error) {
                  console.error(`❌ Error sending SSE message:`, error);
                  throw error;
                }
              }
            }
          }
          
          return latestMessageId;
        }
      }
    }
    
    return lastId; // No new messages
    
  } catch (error) {
    console.error(`❌ Error checking stream:`, error);
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
    console.log('🔍 Stream key will be:', `notifications:${userId}`);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        activeConnections.set(connectionId, {
          controller,
          userId,
          lastActivity: new Date(),
          streamPosition: '$' // Start from latest to prevent refresh flooding
        });

        console.log(`🔗 New SSE connection established for user ${userId}, connection ${connectionId}`);
        console.log(`📊 Total active connections: ${activeConnections.size}`);
        console.log(`🎯 This connection will listen for notifications on stream: notifications:${userId}`);

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

        // Optimized stream listening with event-driven approach
        const streamLoop = async () => {
          // Get the latest message ID to start from, preventing old message flooding
          let lastStreamId = '$';
          try {
            const streamKey = `notifications:${userId}`;
            const latestResult = await executeRedisCommand([
              'XREVRANGE', 
              streamKey, 
              '+', 
              '-', 
              'COUNT', '1'
            ]);
            
            if (latestResult.success && latestResult.data && latestResult.data.length > 0) {
              const latestMessage = latestResult.data[0];
              if (Array.isArray(latestMessage) && latestMessage.length >= 1) {
                lastStreamId = latestMessage[0]; // Use the latest message ID as starting point
                console.log(`🎯 Starting from latest message ID: ${lastStreamId}`);
              }
            } else {
              console.log('📭 No existing messages in stream, starting from $');
            }
          } catch (error) {
            console.log('⚠️ Could not get latest message ID, starting from $');
          }
          
          let iterationCount = 0;
          let consecutiveEmptyPolls = 0;
          
          while (activeConnections.has(connectionId)) {
            try {
              const newLastId = await checkForNewMessages(userId, controller, lastStreamId);
              
              if (newLastId && newLastId !== lastStreamId) {
                lastStreamId = newLastId;
                consecutiveEmptyPolls = 0; // Reset counter on activity
                console.log(`✅ User ${userId} processed new messages, position: ${newLastId}`);
              } else {
                consecutiveEmptyPolls++;
                console.log(`📭 No new messages for user ${userId}, empty polls: ${consecutiveEmptyPolls}`);
              }
              
              iterationCount++;
              
              // Adaptive polling - faster for testing, still efficient
              let pollDelay = 5000; // Base 5 seconds for testing
              
              if (consecutiveEmptyPolls > 5) {
                pollDelay = 15000; // 15 seconds after no activity
              }
              if (consecutiveEmptyPolls > 10) {
                pollDelay = 30000; // 30 seconds for extended inactivity
              }
              
              // Minimal keepalive (only every 5 minutes)
              if (iterationCount % 20 === 0) {
                sendMessage({ 
                  type: 'keepalive', 
                  timestamp: Date.now(),
                  connections: activeConnections.size 
                });
              }
              
              await new Promise(resolve => setTimeout(resolve, pollDelay));
              
            } catch (error) {
              console.error(`❌ Stream error:`, error);
              
              if (!activeConnections.has(connectionId)) {
                break;
              }
              
              // Longer delay on errors to prevent spam
              await new Promise(resolve => setTimeout(resolve, 30000));
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
        const handleDisconnect = () => {
          console.log('🔌 Client disconnected:', connectionId, 'for user:', userId);
          console.log(`📊 Remaining connections: ${activeConnections.size - 1}`);
          activeConnections.delete(connectionId);
          try {
            controller.close();
          } catch {}
        };
        
        request.signal?.addEventListener('abort', handleDisconnect);
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
