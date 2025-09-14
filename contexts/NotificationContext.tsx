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
  connectionType: 'sse' | 'polling' | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
  // Task update functions (simplified for SSE)
  subscribeToTaskUpdates: (teamId: string, onTaskUpdate: (update: TaskUpdate) => void) => void;
  unsubscribeFromTaskUpdates: (teamId: string) => void;
  broadcastTaskUpdate: (update: Omit<TaskUpdate, 'teamId'>, teamId: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

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

  const initializeSSE = () => {
    try {
      console.log('📡 Initializing SSE connection...');
      
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('📡 SSE notification stream connected');
        setIsConnected(true);
        setConnectionType('sse');
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 SSE message received:', data.type);
          
          if (data.type === 'NEW_NOTIFICATION') {
            console.log('🎉 NEW NOTIFICATION via SSE:', data.data);
            
            // Add new notification to the list
            setNotifications(prev => {
              console.log('📡 Adding SSE notification, prev count:', prev.length);
              return [data.data, ...prev];
            });
            setUnreadCount(prev => {
              const newCount = prev + 1;
              console.log('📡 Updating SSE unread count from', prev, 'to', newCount);
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
            console.log('📡 SSE connection established');
          } else if (data.type === 'heartbeat') {
            // Keep connection alive
            console.log('💓 SSE heartbeat received');
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting SSE reconnection...');
          initializeSSE();
        }, 5000);
      };

    } catch (error) {
      console.error('Failed to setup SSE:', error);
      setIsConnected(false);
    }
  };

  // Task subscription functions (simplified for SSE)
  const subscribeToTaskUpdates = (teamId: string, onTaskUpdate: (update: TaskUpdate) => void) => {
    console.log('📋 Subscribing to task updates for team:', teamId);
    taskUpdateCallbacks.current.set(teamId, onTaskUpdate);
  };

  const unsubscribeFromTaskUpdates = (teamId: string) => {
    console.log('📋 Unsubscribing from task updates for team:', teamId);
    taskUpdateCallbacks.current.delete(teamId);
  };

  const broadcastTaskUpdate = async (update: Omit<TaskUpdate, 'teamId'>, teamId: string): Promise<boolean> => {
    // For SSE, we use HTTP fallback to broadcast updates
    try {
      const response = await fetch('/api/tasks/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...update, teamId })
      });
      
      if (response.ok) {
        console.log('📡 Task update broadcasted via HTTP');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to broadcast task update:', error);
      return false;
    }
  };

  const cleanup = async () => {
    // Clear all task update callbacks
    taskUpdateCallbacks.current.clear();
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionType(null);
  };

  // Initialize notifications and SSE connection
  useEffect(() => {
    // Initial fetch
    refetch();

    console.log('📡 Starting SSE-only notification system');
    initializeSSE();

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

  // Fallback polling if SSE disconnects
  useEffect(() => {
    if (!isConnected) {
      console.log('📡 Starting fallback polling for notifications');
      const interval = setInterval(refetch, 30000); // Poll every 30 seconds
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
