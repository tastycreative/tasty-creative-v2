'use client';

import React, { useState } from 'react';
import { Bell, X, CheckCircle2, Clock, Users, FileText, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

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
  const { notifications, unreadCount, isConnected, connectionType, markAsRead, markAllAsRead, refetch } = useNotifications();

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
        console.log('✅ Test notification result:', result);
        
        // Show result in an alert for debugging
        alert(`Test notification sent! SSE enabled: ${result.sseEnabled || true}`);
      } else {
        console.error('❌ Test notification failed:', response.status);
        alert('Test notification failed');
      }
    } catch (error) {
      console.error('❌ Test notification error:', error);
      alert('Test notification error');
    }
  };


  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon */}
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
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[11px] font-semibold">
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
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
                  <button
                    onClick={testNotification}
                    className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20"
                    title="Send test notification"
                  >
                    Test
                  </button>
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

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${
                              !notification.isRead ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Additional context */}
                        {notification.task && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Task: {notification.task.title}
                          </div>
                        )}
                        {notification.podTeam && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Team: {notification.podTeam.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/dashboard/notifications';
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}