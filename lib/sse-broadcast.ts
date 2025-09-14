// SSE broadcast utility for sending real-time notifications
// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

// Register a new connection
export function registerConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
  console.log(`📡 SSE connection registered for user: ${userId}`);
}

// Remove a connection
export function removeConnection(userId: string) {
  connections.delete(userId);
  console.log(`📡 SSE connection removed for user: ${userId}`);
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
  const controller = connections.get(userId);
  
  if (!controller) {
    console.log(`📡 No SSE connection found for user: ${userId}`);
    return false;
  }

  try {
    const message = `data: ${JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    })}\n\n`;
    
    controller.enqueue(new TextEncoder().encode(message));
    console.log(`📡 SSE broadcasted to user ${userId}, type: ${type}, title: ${data?.title}`);
    return true;
  } catch (error) {
    console.error('Error broadcasting via SSE:', error);
    connections.delete(userId);
    return false;
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
