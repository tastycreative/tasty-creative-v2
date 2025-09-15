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
  lastUpdated: number; // Add timestamp to force re-renders
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
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const processedNotifications = useRef(new Set<string>());
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  const sseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      console.log(`📡 Initializing SSE connection... (Production: ${isProduction})`);
      
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Clear any existing timeout
      if (sseTimeoutRef.current) {
        clearTimeout(sseTimeoutRef.current);
        sseTimeoutRef.current = null;
      }

      const eventSource = new EventSource('/api/notifications/stream', {
        withCredentials: true
      });
      eventSourceRef.current = eventSource;

      // Add error state tracking
      let hasErrored = false;
      let connectionStartTime = Date.now();

      eventSource.onopen = () => {
        console.log(`📡 SSE notification stream connected (${isProduction ? 'production' : 'development'})`);
        setIsConnected(true);
        setConnectionType('sse');
        setReconnectAttempts(0); // Reset reconnection attempts on successful connection
        connectionStartTime = Date.now();
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Check for missed notifications when reconnecting
        checkForMissedNotifications();

        // In production, proactively reconnect before Vercel timeout
        if (isProduction) {
          sseTimeoutRef.current = setTimeout(() => {
            console.log('📡 Proactive SSE reconnection for Vercel timeout prevention');
            initializeSSE();
          }, 240000); // 4 minutes (before 5min Vercel limit)
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 SSE message received:', data.type);
          
          if (data.type === 'NEW_NOTIFICATION') {
            console.log('🎉 NEW NOTIFICATION via SSE:', data.data);
            
            // Prevent duplicate processing
            if (processedNotifications.current.has(data.data.id)) {
              console.log('📡 Skipping duplicate notification:', data.data.id);
              return;
            }
            processedNotifications.current.add(data.data.id);
            
            // Clean up old processed notifications to prevent memory leaks
            if (processedNotifications.current.size > 100) {
              const notificationIds = Array.from(processedNotifications.current);
              const toKeep = notificationIds.slice(-50);
              processedNotifications.current = new Set(toKeep);
            }
            
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
            
            // Force re-render by updating timestamp
            setLastUpdated(Date.now());
            console.log('📡 Forced re-render with new timestamp');
            
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
            // Keep connection alive - respond to heartbeat
            console.log('💓 SSE heartbeat received');
            // Reset reconnection attempts on successful heartbeat
            if (reconnectAttempts > 0) {
              setReconnectAttempts(0);
              console.log('🔄 Reset reconnection attempts due to heartbeat');
            }
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error);
        const connectionDuration = Date.now() - connectionStartTime;
        console.log(`📡 Connection lasted: ${Math.round(connectionDuration / 1000)}s`);
        
        hasErrored = true;
        setIsConnected(false);
        
        // Clear proactive timeout since connection failed
        if (sseTimeoutRef.current) {
          clearTimeout(sseTimeoutRef.current);
          sseTimeoutRef.current = null;
        }
        
        // Close the current connection
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
        
        // In production, if connection lasted less than 30 seconds, probably serverless timeout
        const isLikelyServerlessTimeout = isProduction && connectionDuration < 30000;
        
        if (isLikelyServerlessTimeout) {
          console.log('⚠️ Detected likely Vercel serverless timeout, switching to polling mode');
          setConnectionType('polling');
          startFallbackPolling();
          return;
        }
        
        // Check if this is an authentication error by testing a simple endpoint
        const checkAuth = async () => {
          try {
            const authResponse = await fetch('/api/notifications/health');
            if (authResponse.status === 401) {
              console.log('❌ Authentication error detected, switching to polling');
              setConnectionType('polling');
              startFallbackPolling();
              return;
            }
          } catch (authError) {
            console.log('❌ Auth check failed:', authError);
          }
          
          // Proceed with reconnection if not auth error
          if (reconnectAttempts < maxReconnectAttempts) {
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
            console.log(`🔄 Attempting SSE reconnection in ${backoffDelay}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              initializeSSE();
            }, backoffDelay);
          } else {
            console.log('❌ Max SSE reconnection attempts reached, falling back to polling');
            setConnectionType('polling');
            startFallbackPolling();
          }
        };
        
        checkAuth();
      };

    } catch (error) {
      console.error('Failed to setup SSE:', error);
      setIsConnected(false);
      setConnectionType('polling');
      startFallbackPolling();
    }
  };

  // Fallback polling when SSE fails
  const startFallbackPolling = () => {
    console.log(`📡 Starting fallback polling for notifications (Production: ${isProduction})`);
    setConnectionType('polling');
    setIsConnected(true); // Consider polling as "connected"
    
    // More frequent polling in production due to SSE reliability issues
    const pollInterval = isProduction ? 10000 : 30000; // 10s in prod, 30s in dev
    console.log(`📡 Polling every ${pollInterval / 1000}s`);
    
    // Immediate fetch
    refetch().catch(error => console.error('Initial polling fetch failed:', error));
    
    // Set up polling interval
    const interval = setInterval(async () => {
      try {
        await refetch();
        setIsConnected(true);
        console.log('📡 Polling successful');
      } catch (error) {
        console.error('📡 Polling failed:', error);
        setIsConnected(false);
      }
    }, pollInterval);

    // Clean up polling on unmount or when SSE reconnects
    return () => clearInterval(interval);
  };

  // Check for missed notifications when reconnecting
  const checkForMissedNotifications = async () => {
    try {
      console.log('📡 Checking for missed notifications...');
      const response = await fetch('/api/notifications/missed');
      
      if (response.ok) {
        const { missedNotifications } = await response.json();
        
        if (missedNotifications && missedNotifications.length > 0) {
          console.log(`📡 Found ${missedNotifications.length} missed notifications`);
          
          // Add missed notifications to the list
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifications = missedNotifications.filter((n: any) => !existingIds.has(n.id));
            
            if (newNotifications.length > 0) {
              console.log(`📡 Adding ${newNotifications.length} new missed notifications`);
              return [...newNotifications, ...prev];
            }
            
            return prev;
          });
          
          // Update unread count
          const unreadMissed = missedNotifications.filter((n: any) => !n.isRead).length;
          if (unreadMissed > 0) {
            setUnreadCount(prev => {
              const newCount = prev + unreadMissed;
              console.log(`📡 Added ${unreadMissed} missed unread notifications, total: ${newCount}`);
              return newCount;
            });
          }
          
          // Force re-render
          setLastUpdated(Date.now());
        } else {
          console.log('📡 No missed notifications found');
        }
      }
    } catch (error) {
      console.error('Failed to check for missed notifications:', error);
    }
  };

  // Debug function for production troubleshooting
  const debugSSEStatus = async () => {
    try {
      const [healthResponse, debugResponse] = await Promise.all([
        fetch('/api/notifications/health'),
        fetch('/api/notifications/debug')
      ]);

      const health = await healthResponse.json();
      const debug = await debugResponse.json();

      console.log('🔍 SSE Debug Status:', {
        health,
        debug,
        clientState: {
          isConnected,
          connectionType,
          reconnectAttempts,
          lastUpdated: new Date(lastUpdated).toLocaleString(),
          notificationCount: notifications.length,
          unreadCount
        },
        eventSource: {
          readyState: eventSourceRef.current?.readyState,
          url: eventSourceRef.current?.url,
          readyStates: {
            0: 'CONNECTING',
            1: 'OPEN', 
            2: 'CLOSED'
          }
        }
      });

      return { health, debug };
    } catch (error) {
      console.error('Debug status check failed:', error);
      return null;
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

    // Clear SSE proactive timeout
    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
      sseTimeoutRef.current = null;
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

    // Make debug function available globally
    (window as any).debugSSE = debugSSEStatus;
    return () => {
      delete (window as any).debugSSE;
    };
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
      lastUpdated,
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
