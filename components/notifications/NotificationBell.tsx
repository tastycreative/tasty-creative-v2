"use client";

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, Clock, Users, FileText, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import UserProfile from '@/components/ui/UserProfile';

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

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const { notifications, unreadCount, isConnected, connectionType, lastUpdated, markAsRead, markAllAsRead, refetch } = useNotifications();

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      case 'all':
      default:
        return true;
    }
  });

  // Force re-render when lastUpdated changes
  useEffect(() => {
  // Re-render on updates; keep quiet in production
  }, [lastUpdated, unreadCount]);

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_STATUS_CHANGED':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'POD_TEAM_ADDED':
      case 'POD_TEAM_CLIENT_ASSIGNED':
      case 'POD_TEAM_MEMBER_JOINED':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'TASK_DUE_DATE_APPROACHING':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handle notification click (navigate to related item)
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification data
    if (notification.data?.taskUrl) {
      window.location.href = notification.data.taskUrl;
    } else if (notification.task?.id) {
      // Try to get team from podTeam relationship or data
      const teamParam = notification.podTeam?.id || notification.data?.teamId || notification.data?.podTeamId;
      const baseUrl = `/apps/pod/board`;
      if (teamParam) {
        window.location.href = `${baseUrl}?team=${teamParam}&task=${notification.task.id}`;
      } else {
        window.location.href = `${baseUrl}?task=${notification.task.id}`;
      }
    }
  };

  // Test notification function for debugging
  const testNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
            // Show result in an alert for quick confirmation
            alert(`Test notification sent!`);
      } else {
            alert('Test notification failed');
      }
    } catch (error) {
          alert('Test notification error');
    }
  };



  return (
    <div className={`relative ${className}`} key={`bell-${lastUpdated}`}>
      {/* Bell Icon or Commenter Profile */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) refetch();
        }}
        className="relative p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
        title={`${unreadCount} unread notifications${isConnected ? ` (${connectionType})` : ' (offline)'}`}
      >
        <div className="relative">
          <Bell className="h-5 w-5" />
          {/* Connection status indicator */}
          {isConnected ? (
            <Wifi className="h-2 w-2 text-green-500 absolute -bottom-0.5 -right-0.5" />
          ) : (
            <WifiOff className="h-2 w-2 text-red-500 absolute -bottom-0.5 -right-0.5" />
          )}
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[11px] font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-pink-200/50 dark:border-pink-500/30 z-50 max-h-[500px] flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-pink-100/60 dark:border-pink-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Notifications
                </h3>
                {isConnected ? (
                  <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>{connectionType === 'sse' ? 'Live' : connectionType === 'polling' ? 'Polling' : 'Connected'}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Offline</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <button
                      onClick={testNotification}
                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20"
                      title="Send test notification"
                    >
                      Test
                    </button>
                  </>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-pink-100/60 dark:border-pink-500/20">
              {(['all', 'unread', 'read'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-center capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400 bg-pink-50/60 dark:bg-pink-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400'
                  }`}
                >
                  {tab}
                  {tab === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 bg-pink-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {activeTab === 'unread' && notifications.length > 0 
                      ? 'No unread notifications'
                      : activeTab === 'read' && notifications.length > 0
                      ? 'No read notifications'
                      : 'No notifications yet'
                    }
                  </p>
                </div>
              ) : (
                filteredNotifications.slice(0, 5).map((notification) => {
                  // Extract user info from notification data - prioritize commenter for comment notifications
                  const triggerUser = notification.type === 'TASK_COMMENT_ADDED' 
                    ? notification.data?.commenterUser || notification.data?.mentionerUser
                    : notification.data?.createdByUser || notification.data?.movedByUser || notification.data?.mentionerUser;
                  
                  // Debug log for comment notifications
                  if (notification.type === 'TASK_COMMENT_ADDED') {
                    console.log('Comment notification debug:', {
                      notificationId: notification.id,
                      data: notification.data,
                      commenterUser: notification.data?.commenterUser,
                      triggerUser
                    });
                  }
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-pink-100/40 dark:border-pink-500/10 last:border-b-0 cursor-pointer hover:bg-pink-50/40 dark:hover:bg-pink-900/10 transition-colors ${
                        !notification.isRead ? 'bg-pink-50/60 dark:bg-pink-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <UserProfile 
                            user={{
                              id: triggerUser?.id || 'system',
                              name: triggerUser?.name || 'System',
                              email: triggerUser?.email || 'system@app.com',
                              image: triggerUser?.image || null
                            }}
                            size="sm"
                            className="ring-2 ring-pink-200/50 dark:ring-pink-500/30"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm text-gray-900 dark:text-gray-100 ${
                              !notification.isRead ? 'font-medium' : ''
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-pink-500 rounded-full ml-2"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-3 border-t border-pink-100/60 dark:border-pink-500/20">
              <button
                onClick={() => {
                  setIsOpen(false);
                  const currentPath = window.location.pathname + window.location.search;
                  const encodedPath = encodeURIComponent(currentPath);
                  window.location.href = `/notifications?from=${encodedPath}`;
                }}
                className="w-full flex items-center justify-center space-x-2 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 py-2 px-4 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
              >
                <span>View all notifications</span>
                <ExternalLink className="h-3 w-3" />
              </button>
              {filteredNotifications.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Showing 5 of {filteredNotifications.length} notifications
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}