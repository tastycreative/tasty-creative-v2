'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationDebugger() {
  const { notifications, unreadCount, isConnected, connectionType } = useNotifications();

  const triggerTestNotification = async () => {
    try {
      console.log('🧪 Triggering test notification...');
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const result = await response.json();
      console.log('🧪 Test notification result:', result);
      
      if (response.ok) {
        alert(`Test notification created! SSE enabled: ${result.sseEnabled}`);
      } else {
        alert(`Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('🧪 Test notification error:', error);
      alert(`Test error: ${error}`);
    }
  };

  const simulateNewNotification = () => {
    console.log('🧪 Simulating notification locally...');
    
    // Create a test notification object
    const testNotification = {
      id: 'test-' + Date.now(),
      type: 'SYSTEM_NOTIFICATION',
      title: 'Local Test Notification',
      message: 'This is a locally simulated notification',
      isRead: false,
      createdAt: new Date().toISOString(),
      data: { test: true, local: true }
    };

    // Manually dispatch a notification event to test the UI
    window.dispatchEvent(new CustomEvent('test-notification', { detail: testNotification }));
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Notification Debugger
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Connection:</span>
          <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? `Connected (${connectionType})` : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Unread count:</span>
          <span className="font-medium">{unreadCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total notifications:</span>
          <span className="font-medium">{notifications.length}</span>
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        <button
          onClick={triggerTestNotification}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Test Server Notification
        </button>
        
        <button
          onClick={simulateNewNotification}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
        >
          Simulate Local Event
        </button>
      </div>
      
      {notifications.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Last notification: {notifications[0]?.title}
          </div>
        </div>
      )}
    </div>
  );
}
