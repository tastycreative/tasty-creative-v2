import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Store for Socket.IO server instance
let io: ServerIO | null = null;

export function getSocketIOServer() {
  return io;
}

export function setSocketIOServer(serverInstance: ServerIO) {
  io = serverInstance;
  console.log('📱 Socket.IO server instance set globally');
}

// Helper function to broadcast notification to specific user
export async function broadcastNotification(notification: any) {
  try {
    console.log('📱 broadcastNotification called with:', {
      userId: notification?.userId,
      title: notification?.title,
      hasGlobalIo: !!io
    });

    // Ensure Socket.IO is initialized
    if (!io) {
      console.log('📱 Socket.IO not initialized, attempting to initialize...');
      try {
        // Try to trigger Socket.IO initialization via Pages API
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/socket`);
        console.log('📱 Pages API Socket.IO initialization response:', response.status);
        
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('📱 After Pages API initialization wait, hasGlobalIo:', !!io);

        // If still no Socket.IO, try App Router endpoint
        if (!io) {
          console.log('📱 Trying App Router /api/socket endpoint...');
          const appResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/socket`);
          console.log('📱 App Router Socket.IO initialization response:', appResponse.status);
          await new Promise(resolve => setTimeout(resolve, 200));
          console.log('📱 After App Router initialization wait, hasGlobalIo:', !!io);
        }
      } catch (fetchError) {
        console.log('📱 Socket.IO initialization via API failed:', fetchError);
      }
    }

    if (io && notification.userId) {
      console.log('📱 Broadcasting notification via Socket.IO to user:', notification.userId, notification.title);
      console.log('📱 Socket.IO instance exists:', !!io);
      console.log('📱 Socket.IO connected clients:', io.sockets.sockets.size);
      
      const room = `user-${notification.userId}`;
      console.log('📱 Broadcasting to room:', room);
      
      // Broadcast to the specific user room
      io.to(room).emit('new-notification', notification);
      
      // Check how many clients are in the room
      const roomClients = io.sockets.adapter.rooms.get(room);
      const clientCount = roomClients ? roomClients.size : 0;
      console.log('📱 Clients in room:', clientCount);
      
      // Also log all active rooms for debugging
      const allRooms = Array.from(io.sockets.adapter.rooms.keys());
      console.log('📱 All active rooms:', allRooms.filter(room => room.startsWith('user-')));
      
      return true;
    } else {
      console.log('❌ Cannot broadcast notification - falling back to polling:', {
        hasIo: !!io,
        hasUserId: !!notification?.userId,
        notification: notification?.title || 'undefined',
        reason: !io ? 'Socket.IO not available' : 'No userId',
        connectedClients: io ? io.sockets.sockets.size : 0
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error in broadcastNotification:', error);
    return false;
  }
}

export function initializeSocketIO(server: NetServer) {
  if (!io) {
    console.log('Initializing Socket.IO server...');
    
    const serverInstance = new ServerIO(server, {
      path: '/api/socket.io/',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Set the global instance
    io = serverInstance;

    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);
      console.log('🔌 Current global io instance:', !!io);
      console.log('🔌 Socket server instance:', !!(socket as any).server);
      
      // Simple ping test handler
      socket.on('ping', (data) => {
        console.log('🏓 Ping received from client:', socket.id, data);
        socket.emit('pong', `pong-${data}`);
        console.log('🏓 Pong sent back to client:', socket.id);
      });
      
      // Handle joining team rooms
      socket.on('join-team', (teamId: string) => {
        console.log(`Client ${socket.id} joining team: ${teamId}`);
        socket.join(`team-${teamId}`);
        socket.emit('joined-team', teamId);
      });
      
      // Handle leaving team rooms
      socket.on('leave-team', (teamId: string) => {
        console.log(`Client ${socket.id} leaving team: ${teamId}`);
        socket.leave(`team-${teamId}`);
      });
      
      // Handle task updates
      socket.on('task-update', (data) => {
        console.log('Broadcasting task update to team:', data.teamId, data);
        
        // Broadcast to all clients in the team room
        socket.to(`team-${data.teamId}`).emit('task-updated', data);
      });

      // Handle user-specific notification rooms
      socket.on('join-notifications', (userId) => {
        console.log('🔔 join-notifications event received:', {
          socketId: socket.id,
          userId: userId,
          hasUserId: !!userId
        });
        
        if (userId) {
          console.log(`📱 Client ${socket.id} joining notifications for user: ${userId}`);
          socket.join(`user-${userId}`);
          console.log(`📱 Emitting joined-notifications confirmation to ${socket.id}`);
          socket.emit('joined-notifications', userId);
          console.log(`📱 joined-notifications emitted successfully`);
        } else {
          console.log('❌ No userId provided for join-notifications');
        }
      });

      // Handle leaving notification rooms
      socket.on('leave-notifications', (userId) => {
        if (userId) {
          console.log(`Client ${socket.id} leaving notifications for user: ${userId}`);
          socket.leave(`user-${userId}`);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    console.log('Socket.IO server initialized');
  }
  
  return io;
}
