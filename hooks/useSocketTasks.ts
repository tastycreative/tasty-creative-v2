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

// Detect if we're in production (Vercel) or development
// Check for localhost/development vs production
const isProduction = typeof window !== 'undefined' && !(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.includes('.local') ||
  window.location.port === '3000' ||
  window.location.port === '3001'
) && process.env.NODE_ENV === 'production';

export function useSocketTasks({ teamId, onTaskUpdate }: UseSocketTasksProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'socketio' | 'websocket' | 'sse' | 'polling' | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Debug environment detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🌍 Environment Debug:', {
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        isProduction: isProduction,
        willUse: isProduction ? 'WebSocket/SSE (Production)' : 'Socket.IO (Development)'
      });
    }
  }, []);

  useEffect(() => {
    if (!teamId) return;

    if (isProduction) {
      // Production: Use WebSocket Edge Function or SSE
      initializeProductionConnection();
    } else {
      // Development: Use Socket.IO
      initializeSocketIO();
    }

    return () => {
      cleanup();
    };
  }, [teamId]);

  const initializeSocketIO = async () => {
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
        setIsConnected(true);
        setConnectionType('socketio');
        
        // Join the team room
        if (teamId) {
          socket.emit('join-team', teamId);
        }
      });

      socket.on('joined-team', (joinedTeamId: string) => {
        // Silent join confirmation
      });

      socket.on('task-updated', (update: TaskUpdate) => {        
        // Only process updates for the current team
        if (update.teamId === teamId) {
          onTaskUpdate(update);
        }
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setIsConnected(false);
      });

    } catch (error) {
      console.error('Failed to initialize Socket.IO:', error);
    }
  };

  const initializeProductionConnection = () => {
    try {
      // Try WebSocket first, fallback to SSE
      if (typeof WebSocket !== 'undefined') {
        initializeWebSocket();
      } else {
        initializeSSE();
      }
    } catch (error) {
      console.error('Failed to initialize production connection:', error);
      // Fallback to polling
      initializePolling();
    }
  };

  const initializeWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/websocket`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set a timeout to quickly fail and fallback to SSE
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          initializeSSE();
        }
      }, 3000); // 3 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setConnectionType('websocket');
        
        // Subscribe to team updates
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE',
          teamId: teamId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          
          if (update.type === 'SUBSCRIBED') {
            return;
          }

          if (update.teamId === teamId) {
            onTaskUpdate(update);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        // Don't try to reconnect WebSocket, go straight to SSE
        initializeSSE();
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        // Fallback to SSE immediately
        initializeSSE();
      };

    } catch (error) {
      initializeSSE();
    }
  };

  const initializeSSE = () => {
    try {
      const eventSource = new EventSource(`/api/realtime?teamId=${teamId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionType('sse');
      };

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          
          if (update.type === 'CONNECTED') {
            return;
          }
          
          if (update.type === 'HEARTBEAT') {
            // Silent heartbeat - just to keep connection alive
            return;
          }

          if (update.teamId === teamId) {
            onTaskUpdate(update);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        
        // Close the current connection
        eventSource.close();
        
        // Retry after a delay
        setTimeout(() => {
          if (teamId && !eventSourceRef.current) {
            initializeSSE();
          }
        }, 5000);
      };

    } catch (error) {
      console.error('Failed to initialize SSE:', error);
      // Last resort: polling
      initializePolling();
    }
  };

  const initializePolling = () => {
    setConnectionType('polling');
    
    // Simple polling mechanism as last resort
    const pollInterval = setInterval(async () => {
      try {
        // This would poll for updates from your API
        // For now, just set connected status
        setIsConnected(true);
      } catch (error) {
        console.error('Polling error:', error);
        setIsConnected(false);
      }
    }, 5000);

    // Store interval for cleanup
    (window as any).__taskPollingInterval = pollInterval;
  };

  const cleanup = () => {
    if (socketRef.current) {
      if (teamId) {
        socketRef.current.emit('leave-team', teamId);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if ((window as any).__taskPollingInterval) {
      clearInterval((window as any).__taskPollingInterval);
      delete (window as any).__taskPollingInterval;
    }
    
    setIsConnected(false);
    setConnectionType(null);
  };

  // Function to broadcast task updates
  const broadcastTaskUpdate = async (update: Omit<TaskUpdate, 'teamId'>) => {
    const payload = {
      ...update,
      teamId: teamId
    };

    if (isProduction) {
      // Production: Use HTTP API for broadcasting
      try {
        const response = await fetch('/api/realtime', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Failed to broadcast update');
        }

        return true;
      } catch (error) {
        return false;
      }
    } else {
      // Development: Use Socket.IO
      if (socketRef.current && isConnected) {
        socketRef.current.emit('task-update', payload);
        return true;
      } else {
        return false;
      }
    }
  };

  return {
    isConnected,
    connectionType,
    broadcastTaskUpdate
  };
}
