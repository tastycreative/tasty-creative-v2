"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import UserProfile from '@/components/ui/UserProfile';
import { useSession } from 'next-auth/react';

// Minimal notification context shim — removes all SSE/EventSource logic but
// preserves the public API so the app can be rebuilt and iterated on.

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  connectionType: 'redis' | 'polling' | null;
  lastUpdated: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
  subscribeToTaskUpdates: (teamId: string, onTaskUpdate: (payload: any) => void) => void;
  unsubscribeFromTaskUpdates: (teamId: string) => void;
  broadcastTaskUpdate: (update: any, teamId: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'redis' | 'polling' | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const previousNotificationIds = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const lastHeartbeatRef = useRef<number>(Date.now());
  const isTabVisibleRef = useRef<boolean>(true);
  const isConnectingRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Get session for authentication
  const { data: session, status } = useSession();

  // Declare connectToRedisStream function
  const connectToRedisStream = useRef<() => void>();

  // Page Visibility API and Focus/Blur events - Track if tab is active
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isTabVisibleRef.current = isVisible;
      console.log(`👁️ Tab visibility changed: ${isVisible ? 'visible' : 'hidden'}`);
      
      if (isVisible) {
        // Clear any existing timeout
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        
        // Add a small delay to avoid rapid successive calls
        visibilityTimeout = setTimeout(() => {
          console.log('🔍 Checking connection health after visibility change...');
          checkConnectionHealth();
        }, 1000); // 1 second delay
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused - ensuring connection is healthy');
      isTabVisibleRef.current = true;
      
      // Clear any existing timeout
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      
      // Add a small delay to avoid rapid successive calls
      visibilityTimeout = setTimeout(() => {
        checkConnectionHealth();
      }, 500); // 0.5 second delay for focus
    };

    const handleBlur = () => {
      console.log('😴 Window blurred - connection will continue in background');
      isTabVisibleRef.current = false;
      
      // Clear any pending health checks
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
    };

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Connection health check - only reconnect if actually disconnected
  const checkConnectionHealth = () => {
    // Only reconnect if connection is actually lost
    if (!esRef.current || esRef.current.readyState === EventSource.CLOSED || esRef.current.readyState === EventSource.CONNECTING) {
      console.log('🏥 Connection unhealthy (state:', esRef.current?.readyState, '), attempting to reconnect...');
      connectToRedisStream.current?.();
    } else if (esRef.current.readyState === EventSource.OPEN) {
      console.log('💚 Connection healthy and open - no action needed');
      // Connection is healthy, no need to do anything
      // Real-time notifications will come through the SSE stream
    } else {
      console.log('🔍 Connection in unknown state:', esRef.current?.readyState);
    }
  };

  // Emergency heartbeat - only used when connection is unstable
  const sendEmergencyHeartbeat = async () => {
    try {
      console.log('🆘 Sending emergency heartbeat to stabilize connection...');
      await fetch('/api/notifications/ping', { 
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp: Date.now(),
          tabVisible: isTabVisibleRef.current,
          emergency: true
        })
      });
      console.log('💓 Emergency heartbeat sent successfully');
    } catch (error) {
      console.error('❌ Emergency heartbeat failed:', error);
    }
  };

  // Connection health monitor - checks periodically but only acts on issues
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      lastHeartbeatRef.current = Date.now();
      
      // Only act if connection is having issues
      if (!esRef.current) {
        console.log('🔍 No EventSource found, attempting reconnect...');
        connectToRedisStream.current?.();
      } else if (esRef.current.readyState === EventSource.CLOSED) {
        console.log('� Connection closed, attempting reconnect...');
        connectToRedisStream.current?.();
      } else if (esRef.current.readyState === EventSource.CONNECTING) {
        console.log('🔄 Connection still connecting, sending emergency heartbeat...');
        sendEmergencyHeartbeat();
      } else if (esRef.current.readyState === EventSource.OPEN) {
        // Connection is healthy - just log silently
        console.log('� Connection healthy, no action needed');
      }
    }, 30000); // Every 30 seconds - just monitoring, not constantly pinging
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  };

  const showNotificationToast = (notification: Notification) => {
    const data = notification.data || {};
    
    console.log('🔔 showNotificationToast called with:', notification);
    
    // Extract user info from notification data - try different user profile fields
    const triggerUserProfile = data.movedByUser || data.mentionerUser || data.commenterUser || data.createdByUser || null;
    const triggerUserName = triggerUserProfile?.name || data.movedBy || data.mentionerName || data.commenterName || data.userWhoLinked || data.createdBy || 'Someone';
    const taskTitle = data.taskTitle || data.taskUrl?.split('task=')[1] || '';
    const taskUrl = data.taskUrl;
    
    console.log('🔔 Toast data:', { triggerUserProfile, triggerUserName, taskTitle, taskUrl, type: notification.type });
    
    // Create summary based on notification type
    let summary = '';
    let action = '';
    
    switch (notification.type) {
      case 'TASK_STATUS_CHANGED':
        action = `moved "${taskTitle}" to ${data.newColumn || 'a new column'}`;
        summary = `Task moved to ${data.newColumn || 'new status'}`;
        break;
      case 'TASK_MENTION':
        action = `mentioned you in "${taskTitle}"`;
        summary = 'You were mentioned in a comment';
        break;
      case 'TASK_COMMENT_ADDED':
        action = `commented on "${taskTitle}"`;
        summary = 'New comment on task';
        break;
      case 'TASK_ASSIGNED':
        action = `assigned "${taskTitle}" to you`;
        summary = 'Task assigned to you';
        break;
      case 'POD_TEAM_ADDED':
      case 'POD_TEAM_CLIENT_ASSIGNED':
      case 'POD_TEAM_MEMBER_JOINED':
        action = 'added you to a team';
        summary = notification.message;
        break;
      default:
        action = notification.message;
        summary = notification.title;
    }

    console.log('🔔 Final toast content:', { action, summary });

    // Show toast with click handler
    toast(
      <div className="flex items-start space-x-3 cursor-pointer max-w-sm" onClick={() => handleToastClick(taskUrl, notification)}>
        {triggerUserProfile ? (
          <UserProfile 
            user={{
              id: triggerUserProfile.id,
              name: triggerUserProfile.name,
              email: triggerUserProfile.email,
              image: triggerUserProfile.image
            }}
            size="sm"
            className="flex-shrink-0"
          />
        ) : (
          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {triggerUserName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {triggerUserName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 break-words leading-tight">
            {action}
          </p>
        </div>
      </div>,
      {
        duration: 6000,
        position: 'bottom-right',
        style: {
          maxWidth: '400px',
          width: 'auto',
        },
      }
    );
    
    console.log('🔔 Toast called successfully');
  };

  const handleToastClick = (taskUrl?: string, notification?: Notification) => {
    if (taskUrl) {
      window.location.href = taskUrl;
    } else if (notification?.data?.taskId) {
      // Fallback: construct URL from task ID
      const teamParam = notification.data.teamId ? `team=${notification.data.teamId}&` : '';
      window.location.href = `/apps/pod/board?${teamParam}task=${notification.data.taskId}`;
    }
  };

  const refetch = async () => {
    // Prevent duplicate simultaneous fetches
    if (isFetchingRef.current) {
      console.log('🚫 Already fetching notifications, skipping duplicate request');
      return;
    }

    // Rate limiting - don't fetch more than once every 2 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) {
      console.log('🚫 Rate limiting: Last fetch was too recent, skipping');
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;

      console.log('📡 Fetching notifications from API...');
      const res = await fetch('/api/notifications/in-app?all=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const newNotifications = data.notifications || [];
        
        // Check for new notifications and show toast
        // Only show toasts if we have previous notifications to compare against
        const isFirstLoad = previousNotificationIds.current.size === 0;
        
        if (!isFirstLoad) {
          const newOnes = newNotifications.filter((notif: Notification) => 
            !previousNotificationIds.current.has(notif.id)
          );
          
          console.log('🔔 New notifications detected during refetch:', newOnes.length);
          
          newOnes.forEach((notif: Notification) => {
            console.log('🔔 Showing toast for newly fetched:', notif.title);
            showNotificationToast(notif);
          });
        } else {
          console.log('🔔 First load, not showing toasts for', newNotifications.length, 'notifications');
        }
        
        // Update the set of seen notification IDs
        previousNotificationIds.current = new Set(newNotifications.map((n: Notification) => n.id));
        
        // Update state
        setNotifications(newNotifications);
        const newUnreadCount = data.count || 0;
        setUnreadCount(newUnreadCount);
        setLastUpdated(Date.now());
        
        console.log('📊 Notifications updated:', {
          total: newNotifications.length,
          unread: newUnreadCount,
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      // swallow network errors silently to avoid noisy logs
    } finally {
      isFetchingRef.current = false; // Always reset fetching flag
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      });
    } catch (err) {
      // ignore
    }
    await refetch();
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      // ignore
    }
    await refetch();
  };

  // No-op realtime subscription API to keep callers working until a new
  // realtime implementation is added.
  function subscribeToTaskUpdates(_teamId: string, _onTaskUpdate: (p: any) => void) {
  // intentionally left blank — use refetch() for updates
  }

  function unsubscribeFromTaskUpdates(_teamId: string) {
    // no-op
  }

  async function broadcastTaskUpdate(_update: any, _teamId: string): Promise<boolean> {
    // no-op broadcast
    return false;
  }

  // Establish Redis SSE connection
  useEffect(() => {
    console.log('🚀 NotificationContext useEffect triggered');
    console.log('🔐 Auth status:', status, 'Session:', !!session?.user);
    
    // Only run on client
    if (typeof window === 'undefined') {
      console.log('❌ Running on server, skipping SSE connection');
      return;
    }
    
    // Wait for authentication to be resolved
    if (status === 'loading') {
      console.log('⏳ Auth loading, waiting...');
      return;
    }
    
    if (status === 'unauthenticated' || !session?.user) {
      console.log('❌ User not authenticated, skipping SSE connection');
      return;
    }
    
    console.log('✅ User authenticated, proceeding with SSE connection for:', session.user.email);
    
    // Check if we already have a healthy connection
    if (esRef.current && esRef.current.readyState === EventSource.OPEN) {
      console.log('🔗 Connection already exists and is healthy, skipping reconnection');
      setIsConnected(true);
      setConnectionType('redis');
      return;
    }
    
    // Define the connection function
    connectToRedisStream.current = () => {
      // Prevent multiple simultaneous connection attempts
      if (isConnectingRef.current) {
        console.log('🚫 Already connecting, skipping duplicate connection attempt');
        return;
      }
      
      console.log('🔗 Connecting to efficient notification stream...');
      isConnectingRef.current = true;
      
      // Close existing connection
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      try {
        console.log('🚀 Creating EventSource for efficient notification stream...');
        const eventSource = new EventSource('/api/notifications/efficient-stream');
        esRef.current = eventSource;
        console.log('📡 EventSource created, waiting for connection...');

        eventSource.onopen = () => {
          console.log('✅ Efficient notification stream connected');
          setIsConnected(true);
          setConnectionType('redis');
          reconnectAttempts.current = 0;
          isConnectingRef.current = false; // Reset connecting flag
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Start heartbeat to keep connection alive
          startHeartbeat();
          
          // Log connection success for debugging
          console.log('🎯 SSE Connection established - should register with server');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📬 Received notification stream data:', data);
            
            if (data.type === 'notification' && data.data) {
              const notification = data.data;
              
              // Check if this is a new notification
              if (!previousNotificationIds.current.has(notification.id)) {
                console.log('🔔 New notification received:', notification.title);
                showNotificationToast(notification);
                
                // Add to seen notifications
                previousNotificationIds.current.add(notification.id);
                
                // Update notifications state directly instead of refetching
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                setLastUpdated(Date.now());
              }
            } else if (data.type === 'connected') {
              console.log('🎉 Efficient notification stream ready');
              // Initial fetch of notifications
              refetch();
            } else if (data.type === 'initial_notifications') {
              console.log('📋 Received initial notifications:', data.data?.length || 0);
              // Handle initial notifications if needed
            } else if (data.type === 'keepalive') {
              // Just a keepalive, no action needed
              console.log('💓 Keepalive received, connections:', data.connections || 0);
            }
          } catch (error) {
            console.error('❌ Error parsing notification data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('❌ Efficient notification stream error:', error);
          setIsConnected(false);
          setConnectionType(null);
          isConnectingRef.current = false; // Reset connecting flag on error
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connectToRedisStream.current?.();
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached, falling back to polling');
            startPolling();
          }
          
          if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
          }
        };
      } catch (error) {
        console.error('❌ Failed to create efficient EventSource:', error);
        setIsConnected(false);
        setConnectionType(null);
        isConnectingRef.current = false; // Reset connecting flag on error
        
        // Fallback to polling
        console.log('🔄 Falling back to polling due to EventSource error');
        startPolling();
      }
    };

    // Start Redis connection
    connectToRedisStream.current?.();

    // Cleanup function
    return () => {
        console.log('🧹 Cleaning up efficient notification stream...');
      
      // Stop heartbeat
      stopHeartbeat();
      
      // Reset flags
      isConnectingRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      
      setIsConnected(false);
      setConnectionType(null);
    };
  }, [status, session?.user?.id]); // Only depend on auth status and user ID, not entire session object

  // Polling fallback
  let pollTimer: number | undefined;
  function startPolling() {
  setConnectionType('polling');
  setIsConnected(true);
    // fetch immediately
    refetch();
    pollTimer = window.setInterval(() => {
      refetch();
    }, 10000);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  }

  // Initial fetch when component mounts
  useEffect(() => {
    // Initial fetch will happen when Redis stream connects
    // This ensures we don't double-fetch
  }, []);

  return (
    <NotificationContext.Provider
      value={{
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
      }}
    >
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
