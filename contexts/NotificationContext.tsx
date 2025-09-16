"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import UserProfile from '@/components/ui/UserProfile';

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
  connectionType: 'sse' | 'polling' | null;
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
  const [connectionType, setConnectionType] = useState<'sse' | 'polling' | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const previousNotificationIds = useRef<Set<string>>(new Set());

  const showNotificationToast = (notification: Notification) => {
    const data = notification.data || {};
    
    console.log('🔔 showNotificationToast called with:', notification);
    
    // Extract user info from notification data - try the new user profile structure first
    const triggerUserProfile = data.movedByUser || data.mentionerUser || data.createdByUser || null;
    const triggerUserName = triggerUserProfile?.name || data.movedBy || data.mentionerName || data.userWhoLinked || data.createdBy || 'Someone';
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
      case 'TASK_COMMENT_ADDED':
        action = `mentioned you in "${taskTitle}"`;
        summary = 'You were mentioned in a comment';
        break;
      case 'TASK_ASSIGNED':
        action = `created a new ${data.submissionType || 'content'} task${data.modelName ? ` for ${data.modelName}` : ''}`;
        summary = `New ${data.submissionType || 'content'} task created`;
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
    try {
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
          
          console.log('🔔 New notifications detected:', newOnes.length);
          
          newOnes.forEach((notif: Notification) => {
            console.log('🔔 Showing toast for:', notif.title);
            showNotificationToast(notif);
          });
        } else {
          console.log('🔔 First load, not showing toasts for', newNotifications.length, 'notifications');
        }
        
        // Update the set of seen notification IDs
        previousNotificationIds.current = new Set(newNotifications.map((n: Notification) => n.id));
        
        setNotifications(newNotifications);
        setUnreadCount(data.count || 0);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      // swallow network errors silently to avoid noisy logs
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

  // Establish SSE connection to our stream endpoint
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
  // Use polling-only to avoid flaky SSE streaming on serverless platforms.
  startPolling();
  return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    refetch();
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
