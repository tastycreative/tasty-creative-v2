"use client";

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  lastFetchTime: number;
  isConnected: boolean;
  connectionType: 'polling' | 'ably' | null;
  currentUserId: string | null; // Track which user the cached data belongs to
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  setConnectionStatus: (isConnected: boolean, type: 'polling' | 'ably' | null) => void;
  updateLastFetchTime: () => void;
  setCurrentUser: (userId: string | null) => void; // New method to handle user changes
  clearUserData: () => void; // New method to clear user-specific data
  
  // Cache helpers
  shouldRefetch: (userId?: string) => boolean; // Updated to check user
  isNotificationCached: (notificationId: string) => boolean;
  getRecentNotifications: (maxAge?: number) => Notification[];
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
const MAX_NOTIFICATIONS = 100; // Keep only latest 100 notifications

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        notifications: [],
        unreadCount: 0,
        lastFetchTime: 0,
        isConnected: false,
        connectionType: null,
        currentUserId: null,

        setNotifications: (notifications) => {
          set((state) => {
            // Merge with existing notifications, removing duplicates
            const existingIds = new Set(state.notifications.map(n => n.id));
            const newNotifications = notifications.filter(n => !existingIds.has(n.id));
            
            const allNotifications = [...newNotifications, ...state.notifications]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, MAX_NOTIFICATIONS); // Keep only latest 100
            
            return {
              notifications: allNotifications,
              lastFetchTime: Date.now()
            };
          });
        },

        addNotification: (notification) => {
          set((state) => {
            // Check if notification already exists
            if (state.notifications.some(n => n.id === notification.id)) {
              return state; // No change if duplicate
            }
            
            const newNotifications = [notification, ...state.notifications]
              .slice(0, MAX_NOTIFICATIONS);
            
            return {
              notifications: newNotifications,
              unreadCount: state.unreadCount + (notification.isRead ? 0 : 1)
            };
          });
        },

        markAsRead: (notificationId) => {
          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }));
        },

        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, isRead: true })),
            unreadCount: 0
          }));
        },

        setUnreadCount: (count) => {
          set({ unreadCount: count });
        },

        setConnectionStatus: (isConnected, type) => {
          set({ isConnected, connectionType: type });
        },

        updateLastFetchTime: () => {
          set({ lastFetchTime: Date.now() });
        },

        setCurrentUser: (userId) => {
          set((state) => {
            // If user changed, clear all cached data
            if (state.currentUserId !== userId) {
              console.log('🔄 User changed from', state.currentUserId, 'to', userId, '- clearing notification cache');
              return {
                currentUserId: userId,
                notifications: [],
                unreadCount: 0,
                lastFetchTime: 0,
                isConnected: state.isConnected,
                connectionType: state.connectionType
              };
            }
            return { currentUserId: userId };
          });
        },

        clearUserData: () => {
          set((state) => ({
            notifications: [],
            unreadCount: 0,
            lastFetchTime: 0,
            currentUserId: null,
            isConnected: state.isConnected,
            connectionType: state.connectionType
          }));
        },

        // Cache helpers
        shouldRefetch: (userId) => {
          const { lastFetchTime, currentUserId } = get();
          
          // Always refetch if user changed
          if (userId && currentUserId !== userId) {
            console.log('🔄 User mismatch detected, forcing refetch');
            return true;
          }
          
          // Normal cache timeout check
          return Date.now() - lastFetchTime > CACHE_DURATION;
        },

        isNotificationCached: (notificationId) => {
          const { notifications } = get();
          return notifications.some(n => n.id === notificationId);
        },

        getRecentNotifications: (maxAge = 24 * 60 * 60 * 1000) => { // Default 24 hours
          const { notifications } = get();
          const cutoff = Date.now() - maxAge;
          return notifications.filter(n => n.timestamp > cutoff);
        }
      }),
      {
        name: 'notification-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
          lastFetchTime: state.lastFetchTime,
          currentUserId: state.currentUserId
        }),
        // Don't persist connection status as it's session-specific
      }
    ),
    {
      name: 'notification-store'
    }
  )
);