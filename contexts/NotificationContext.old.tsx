'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
  task?: {
    id: string;
    title: string;
    status: string;
  };
  podTeam?: {
    id: string;
    name: string;
  };
}

interface TaskUpdate {
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED';
  taskId: string;
  teamId: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  connectionType: 'socketio' | 'sse' | 'polling' | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
  // Task update functions
  subscribeToTaskUpdates: (teamId: string, onTaskUpdate: (update: TaskUpdate) => void) => void;
  unsubscribeFromTaskUpdates: (teamId: string) => void;
  broadcastTaskUpdate: (update: Omit<TaskUpdate, 'teamId'>, teamId: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Detect if we're in production or development
// Note: App Router doesn't support Socket.IO properly, so we'll use SSE in both environments
const isProduction = true; // Force SSE for both development and production

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'sse' | 'polling' | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const taskUpdateCallbacks = useRef<Map<string, (update: TaskUpdate) => void>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications from API
  const refetch = async () => {
    try {
      const response = await fetch('/api/notifications/in-app');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const initializeSocketIO = async () => {
    try {
      console.log('📱 Initializing Socket.IO client...');
      
      // Check if we already have a connection
      if (socketRef.current?.connected) {
        console.log('📱 Socket.IO already connected');
        setIsConnected(true);
        setConnectionType('socketio');
        return;
      }

      // Clean up any existing socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // First, ensure Socket.IO server is initialized
      console.log('📱 Fetching /api/socket to initialize server...');
      try {
        const initResponse = await fetch('/api/socket');
        const initData = await initResponse.json();
        console.log('📱 Socket.IO server init response:', initResponse.status, initData);
      } catch (fetchError) {
        console.warn('📱 Could not initialize Socket.IO server via /api/socket:', fetchError);
        // Continue anyway, maybe the Pages API route will work
      }
      
      // Small delay to ensure server is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create socket connection with better error handling
      console.log('📱 Creating Socket.IO client connection...');
      const socket = io({
        path: '/api/socket.io/',
        addTrailingSlash: false,
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'] // Allow fallback to polling
      });

      socketRef.current = socket;

      socket.on('connect', async () => {
        console.log('🎉 Socket.IO CLIENT CONNECTED!', {
          id: socket.id,
          transport: socket.io.engine.transport.name
        });
        setIsConnected(true);
        setConnectionType('socketio');
        console.log('📱 Socket.IO connected for notifications');
        
        // Get current user ID and join notification room
        try {
          const response = await fetch('/api/auth/session');
          if (response.ok) {
            const session = await response.json();
            if (session?.user?.id) {
              console.log('📱 Joining notification room for user:', session.user.id);
              socket.emit('join-notifications', session.user.id);
            } else {
              console.log('📱 No user ID found in session');
            }
          } else {
            console.log('📱 Session fetch failed:', response.status);
          }
        } catch (error) {
          console.error('❌ Failed to get user session for notifications:', error);
        }

        // Join any pending team rooms for task updates
        for (const teamId of taskUpdateCallbacks.current.keys()) {
          console.log('📋 Re-joining team room on reconnect:', teamId);
          socket.emit('join-team', teamId);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        console.error('❌ Socket.IO error details:', {
          message: error.message,
          description: (error as any).description,
          context: (error as any).context,
          type: (error as any).type,
          transport: socket.io.engine?.transport?.name
        });
        setIsConnected(false);
        setConnectionType(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('📱 Socket.IO disconnected:', reason);
        setIsConnected(false);
        setConnectionType(null);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        setConnectionType('socketio');
      });

      socket.on('joined-notifications', (userId) => {
        console.log('📱 Successfully joined notifications room for user:', userId);
      });

      socket.on('joined-team', (teamId) => {
        console.log('📋 Successfully joined team room for tasks:', teamId);
      });

      socket.on('task-updated', (update: TaskUpdate) => {
        console.log('🔄 Received task update:', update);
        
        // Call the callback for this team if it exists
        const callback = taskUpdateCallbacks.current.get(update.teamId);
        if (callback) {
          callback(update);
        }
      });

      socket.on('new-notification', (notification: Notification) => {
        console.log('🎉 CLIENT: Received new notification via Socket.IO:', notification);
        console.log('🎉 CLIENT: Current notification count before:', notifications.length);
        console.log('🎉 CLIENT: Current unread count before:', unreadCount);
        
        // Add new notification to the list
        setNotifications(prev => {
          console.log('🎉 CLIENT: Adding notification, prev count:', prev.length);
          return [notification, ...prev];
        });
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('🎉 CLIENT: Updating unread count from', prev, 'to', newCount);
          return newCount;
        });
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
          });
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO for notifications:', error);
      setIsConnected(false);
      setConnectionType(null);
    }
  };

  const initializeSSE = () => {
    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('📡 Notification SSE connected');
        setIsConnected(true);
        setConnectionType('sse');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'NEW_NOTIFICATION') {
            console.log('🎉 CLIENT: Received new notification via SSE:', data.data);
            console.log('🎉 CLIENT: Current notification count before:', notifications.length);
            console.log('🎉 CLIENT: Current unread count before:', unreadCount);
            
            // Add new notification to the list
            setNotifications(prev => {
              console.log('🎉 CLIENT: Adding SSE notification, prev count:', prev.length);
              return [data.data, ...prev];
            });
            setUnreadCount(prev => {
              const newCount = prev + 1;
              console.log('🎉 CLIENT: Updating SSE unread count from', prev, 'to', newCount);
              return newCount;
            });
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.data.title, {
                body: data.data.message,
                icon: '/favicon.ico',
                tag: data.data.id,
              });
            }
          } else if (data.type === 'connected') {
            console.log('📡 Notification stream established');
          } else if (data.type === 'heartbeat') {
            // Keep connection alive
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Notification stream error:', error);
        setIsConnected(false);
        eventSource.close();
        
        // Retry connection after 5 seconds
        setTimeout(initializeSSE, 5000);
      };

      (eventSource as any).onclose = () => {
        console.log('📡 Notification stream closed');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to setup SSE:', error);
      setIsConnected(false);
    }
  };

  // Task subscription functions
  const subscribeToTaskUpdates = (teamId: string, onTaskUpdate: (update: TaskUpdate) => void) => {
    console.log('📋 Subscribing to task updates for team:', teamId);
    
    // Store the callback
    taskUpdateCallbacks.current.set(teamId, onTaskUpdate);
    
    // Join the team room if connected
    if (socketRef.current && isConnected) {
      console.log('📋 Emitting join-team for:', teamId);
      socketRef.current.emit('join-team', teamId);
    }
  };

  const unsubscribeFromTaskUpdates = (teamId: string) => {
    console.log('📋 Unsubscribing from task updates for team:', teamId);
    
    // Remove the callback
    taskUpdateCallbacks.current.delete(teamId);
    
    // Leave the team room if connected
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-team', teamId);
    }
  };

  const broadcastTaskUpdate = async (update: Omit<TaskUpdate, 'teamId'>, teamId: string): Promise<boolean> => {
    const payload = { ...update, teamId };
    
    if (isProduction) {
      // Production: Use HTTP fallback (since SSE is one-way)
      try {
        const response = await fetch('/api/tasks/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return response.ok;
      } catch (error) {
        console.error('Failed to broadcast task update:', error);
        return false;
      }
    } else {
      // Development: Use Socket.IO
      if (socketRef.current && isConnected) {
        socketRef.current.emit('task-update', payload);
        return true;
      }
      return false;
    }
  };

  const cleanup = async () => {
    // Leave all team rooms
    for (const teamId of taskUpdateCallbacks.current.keys()) {
      if (socketRef.current) {
        socketRef.current.emit('leave-team', teamId);
      }
    }
    taskUpdateCallbacks.current.clear();

    if (socketRef.current) {
      // Get user ID for cleanup
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session?.user?.id) {
            socketRef.current.emit('leave-notifications', session.user.id);
          }
        }
      } catch (error) {
        // Silent fail for cleanup
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionType(null);
  };

  // Initialize notifications and persistent connection
  useEffect(() => {
    // Initial fetch
    refetch();

    // Debug environment detection
    if (typeof window !== 'undefined') {
      console.log('📱 Notification Environment:', {
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
        NODE_ENV: process.env.NODE_ENV,
        isProduction,
        willUse: isProduction ? 'SSE (Production)' : 'Socket.IO (Development)'
      });
    }

    if (isProduction) {
      // Production: Use SSE
      initializeSSE();
    } else {
      // Development: Use Socket.IO
      initializeSocketIO();
    }

    return () => {
      cleanup();
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Fallback polling if not connected
  useEffect(() => {
    if (!isConnected) {
      console.log('📱 Starting fallback polling for notifications');
      const interval = setInterval(refetch, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      connectionType,
      markAsRead,
      markAllAsRead,
      refetch,
      subscribeToTaskUpdates,
      unsubscribeFromTaskUpdates,
      broadcastTaskUpdate,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}