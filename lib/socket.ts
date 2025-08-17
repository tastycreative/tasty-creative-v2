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

export function initializeSocketIO(server: NetServer) {
  if (!io) {
    console.log('Initializing Socket.IO server...');
    
    io = new ServerIO(server, {
      path: '/api/socket.io/',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

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
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    console.log('Socket.IO server initialized');
  }
  
  return io;
}
