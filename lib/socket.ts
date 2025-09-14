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
    // Ensure Socket.IO is initialized
    if (!io) {
      console.log('📱 Socket.IO not initialized, attempting to initialize...');
      try {
        // Try to trigger Socket.IO initialization
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/socket`);
        console.log('📱 Socket.IO initialization response:', response.status);
        
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (fetchError) {
        console.log('📱 Socket.IO initialization via /api/socket failed:', fetchError);
      }
    }

    if (io && notification.userId) {
      console.log('📱 Broadcasting notification via Socket.IO to user:', notification.userId, notification.title);
      console.log('📱 Socket.IO instance exists:', !!io);
      
      const room = `user-${notification.userId}`;
      console.log('📱 Broadcasting to room:', room);
      
      io.to(room).emit('new-notification', notification);
      
      // Check how many clients are in the room
      const roomClients = io.sockets.adapter.rooms.get(room);
      console.log('📱 Clients in room:', roomClients ? roomClients.size : 0);
      
      return true;
    } else {
      console.log('❌ Cannot broadcast notification - falling back to polling:', {
        hasIo: !!io,
        hasUserId: !!notification?.userId,
        notification: notification?.title || 'undefined',
        reason: !io ? 'Socket.IO not available' : 'No userId'
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
      console.log('New client connected:', socket.id);
      
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
        if (userId) {
          console.log(`Client ${socket.id} joining notifications for user: ${userId}`);
          socket.join(`user-${userId}`);
          socket.emit('joined-notifications', userId);
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
