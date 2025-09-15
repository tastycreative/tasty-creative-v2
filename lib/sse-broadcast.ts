import { createInAppNotification } from '@/lib/notifications';
import { pushUserMessage } from '@/lib/upstash';

// Use globalThis to persist connections across Next.js hot reloads in development
const globalForConnections = globalThis as unknown as {
  sseConnections: Map<string, ReadableStreamDefaultController> | undefined
};

// Store active connections - persisted across hot reloads
const connections = globalForConnections.sseConnections ?? new Map<string, ReadableStreamDefaultController>();

if (!globalForConnections.sseConnections) {
  globalForConnections.sseConnections = connections;
  console.log('📡 Initialized SSE connections store');
} else {
  console.log(`📡 Reusing existing SSE connections store with ${connections.size} connections`);
  console.log(`📡 Existing connected users: [${Array.from(connections.keys()).join(', ')}]`);
}

// Register a new connection
export function registerConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
  console.log(`📡 SSE connection registered for user: ${userId}`);
  console.log(`📡 Total active connections: ${connections.size}`);
  console.log(`📡 All connected users: [${Array.from(connections.keys()).join(', ')}]`);
}

// Remove a connection
export function removeConnection(userId: string) {
  const existed = connections.has(userId);
  connections.delete(userId);
  console.log(`📡 SSE connection removed for user: ${userId} (existed: ${existed})`);
  console.log(`📡 Remaining connections: ${connections.size}, users: [${Array.from(connections.keys()).join(', ')}]`);
  
  // Log stack trace to see what's calling removeConnection
  console.trace('📡 removeConnection called from:');
}

// Get connection count for debugging
export function getConnectionCount(): number {
  return connections.size;
}

// Get connected user IDs for debugging
export function getConnectedUsers(): string[] {
  return Array.from(connections.keys());
}

// Broadcast to specific user
export async function broadcastToUser(userId: string, type: string, data: any): Promise<boolean> {
  console.log(`📡 === BROADCAST ATTEMPT ===`);
  console.log(`📡 Target user: ${userId}, type: ${type}`);
  console.log(`📡 Current connections: ${connections.size}, connected users: [${Array.from(connections.keys()).join(', ')}]`);
  console.log(`📡 Looking for connection for user: ${userId}`);
  
  const controller = connections.get(userId);
  
  // Always store the notification in database for persistence
  try {
    await storeNotificationForUser(userId, type, data);
    console.log(`📡 Notification stored in database for user: ${userId}`);
    // Publish to Upstash list so other server instances can deliver to connected clients
    try {
      await pushUserMessage(userId, {
        type,
        data,
        timestamp: new Date().toISOString(),
      });
      console.log(`📡 Published notification to Upstash for user: ${userId}`);
    } catch (upError) {
      console.error('❌ Failed to publish notification to Upstash:', upError);
    }
  } catch (error) {
    console.error(`❌ Failed to store notification in database for user ${userId}:`, error);
  }
  
  // Try to send via SSE if user is connected
  if (!controller) {
    console.log(`❌ No SSE connection found for user: ${userId}`);
    console.log(`📡 Available connections for users: [${Array.from(connections.keys()).join(', ')}]`);
    console.log(`📡 Notification stored for delivery when user reconnects`);
    return false; // Not delivered via SSE, but stored for later
  }

  console.log(`✅ Found controller for user: ${userId}, attempting to send message...`);

  try {
    const message = `data: ${JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    })}\n\n`;
    
    controller.enqueue(new TextEncoder().encode(message));
    console.log(`📡 SSE broadcasted successfully to user ${userId}, type: ${type}, title: ${data?.title}`);
    return true;
  } catch (error) {
    console.error(`❌ Error broadcasting via SSE to user ${userId}:`, error);
    console.log(`📡 Removing connection for user ${userId} due to error`);
    connections.delete(userId);
    return false;
  }
}

// Store notification in database for persistent delivery
async function storeNotificationForUser(userId: string, type: string, data: any) {
  // Use the existing notification creation function directly
  try {
    const notification = await createInAppNotification({
      userId,
      type: type as any, // Cast to the expected notification type
      title: data.title || 'New Notification',
      message: data.message || '',
      data,
      taskId: data.taskId,
      podTeamId: data.podTeamId,
      contentSubmissionId: data.contentSubmissionId,
      clientModelId: data.clientModelId
    });
    
    console.log(`📡 Notification stored directly via createInAppNotification: ${notification.id}`);
    return notification;
  } catch (error) {
    console.error('Failed to store notification directly:', error);
    throw error;
  }
}

// Broadcast to all connected users
export async function broadcastToAll(type: string, data: any): Promise<number> {
  let successCount = 0;
  
  for (const [userId, controller] of connections.entries()) {
    try {
      const message = `data: ${JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(message));
      successCount++;
    } catch (error) {
      console.error(`Error broadcasting to user ${userId}:`, error);
      connections.delete(userId);
    }
  }
  
  console.log(`📡 SSE broadcasted to ${successCount} users, type: ${type}`);
  return successCount;
}

// Send heartbeat to all connections
export function sendHeartbeat() {
  const heartbeatData = {
    type: 'heartbeat',
    timestamp: new Date().toISOString()
  };

  for (const [userId, controller] of connections.entries()) {
    try {
      const message = `data: ${JSON.stringify(heartbeatData)}\n\n`;
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error(`Error sending heartbeat to user ${userId}:`, error);
      connections.delete(userId);
    }
  }
}
