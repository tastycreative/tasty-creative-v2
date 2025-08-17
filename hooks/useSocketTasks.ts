import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface TaskUpdate {
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED';
  taskId: string;
  teamId: string;
  data?: any;
}

interface UseSocketTasksProps {
  teamId: string;
  onTaskUpdate: (update: TaskUpdate) => void;
}

export function useSocketTasks({ teamId, onTaskUpdate }: UseSocketTasksProps) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = async () => {
      try {
        // First, ensure Socket.IO server is initialized
        await fetch('/api/socket');
        
        // Create socket connection
        const socket = io({
          path: '/api/socket.io/',
          addTrailingSlash: false,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Socket.IO connected:', socket.id);
          setIsConnected(true);
          
          // Join the team room
          if (teamId) {
            socket.emit('join-team', teamId);
          }
        });

        socket.on('joined-team', (joinedTeamId: string) => {
          console.log('Joined team room:', joinedTeamId);
        });

        socket.on('task-updated', (update: TaskUpdate) => {
          console.log('Received task update via Socket.IO:', update);
          
          // Only process updates for the current team
          if (update.teamId === teamId) {
            onTaskUpdate(update);
          }
        });

        socket.on('disconnect', () => {
          console.log('Socket.IO disconnected');
          setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          setIsConnected(false);
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    if (teamId) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        if (teamId) {
          socketRef.current.emit('leave-team', teamId);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [teamId]);

  // Function to broadcast task updates
  const broadcastTaskUpdate = (update: Omit<TaskUpdate, 'teamId'>) => {
    if (socketRef.current && isConnected) {
      const payload = {
        ...update,
        teamId: teamId
      };
      
      console.log('Broadcasting task update via Socket.IO:', payload);
      socketRef.current.emit('task-update', payload);
      
      return true;
    } else {
      console.warn('Socket not connected, cannot broadcast update');
      return false;
    }
  };

  return {
    isConnected,
    broadcastTaskUpdate
  };
}
