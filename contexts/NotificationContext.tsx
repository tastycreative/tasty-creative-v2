"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

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

  const refetch = async () => {
    try {
      const res = await fetch('/api/notifications/in-app', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.count || 0);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      console.error('Notification shim: failed to fetch in-app notifications', err);
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
    console.warn('subscribeToTaskUpdates: realtime removed — subscription is a no-op');
  }

  function unsubscribeFromTaskUpdates(_teamId: string) {
    // no-op
  }

  async function broadcastTaskUpdate(_update: any, _teamId: string): Promise<boolean> {
    // no-op broadcast
    return false;
  }

  useEffect(() => {
    refetch();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected: false,
        connectionType: null,
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
