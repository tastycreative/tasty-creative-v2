"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Bell, CheckCircle2, Clock, Users, FileText, ChevronLeft, ChevronRight, Filter, Search, MoreHorizontal, ArrowLeft } from 'lucide-react';
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

export default function NotificationsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Get the 'from' parameter to know where to go back
  const fromPath = searchParams.get('from');

  const handleGoBack = () => {
    if (fromPath) {
      const decodedPath = decodeURIComponent(fromPath);
      window.location.href = decodedPath;
    } else {
      // Fallback to previous page or dashboard
      window.history.back();
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_STATUS_CHANGED':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'POD_TEAM_ADDED':
      case 'POD_TEAM_CLIENT_ASSIGNED':
      case 'POD_TEAM_MEMBER_JOINED':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'TASK_DUE_DATE_APPROACHING':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/in-app?all=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
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
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification data
    if (notification.data?.taskUrl) {
      window.location.href = notification.data.taskUrl;
    } else if (notification.task?.id) {
      const teamParam = notification.podTeam?.id || notification.data?.teamId || notification.data?.podTeamId;
      const baseUrl = `/apps/pod/board`;
      if (teamParam) {
        window.location.href = `${baseUrl}?team=${teamParam}&task=${notification.task.id}`;
      } else {
        window.location.href = `${baseUrl}?task=${notification.task.id}`;
      }
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'read' && notification.isRead);
    
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
  
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage));
    setTotalPages(newTotalPages);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredNotifications.length]);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Sign in to view notifications
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to access your notifications.
          </p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/50 dark:from-gray-900 dark:via-gray-800/70 dark:to-gray-900/80">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Notifications
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 border border-pink-200 dark:border-pink-800 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex space-x-2">
            {(['all', 'unread', 'read'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                  filter === filterOption
                    ? 'bg-pink-600 text-white'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-pink-200/50 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                }`}
              >
                {filterOption}
                {filterOption === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 bg-pink-100 text-pink-800 text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-pink-200/50 dark:border-pink-500/30 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-xl border border-pink-200/50 dark:border-pink-500/30">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No matching notifications' : 'No notifications found'}
              </h3>
              <p>
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.'
                  : filter === 'unread' 
                  ? 'All caught up! No unread notifications.'
                  : filter === 'read'
                  ? 'No read notifications yet.'
                  : 'You\'ll see your notifications here when you receive them.'
                }
              </p>
            </div>
          ) : (
            <>
              {paginatedNotifications.map((notification, index) => {
                const triggerUser = notification.type === 'TASK_COMMENT_ADDED' 
                  ? notification.data?.commenterUser || notification.data?.mentionerUser
                  : notification.data?.createdByUser || notification.data?.movedByUser || notification.data?.mentionerUser;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-6 border-b border-pink-100/40 dark:border-pink-500/10 last:border-b-0 cursor-pointer hover:bg-pink-50/40 dark:hover:bg-pink-900/10 transition-colors ${
                      !notification.isRead ? 'bg-pink-50/60 dark:bg-pink-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <UserProfile 
                          user={{
                            id: triggerUser?.id || 'system',
                            name: triggerUser?.name || 'System',
                            email: triggerUser?.email || 'system@app.com',
                            image: triggerUser?.image || null
                          }}
                          size="md"
                          className="ring-2 ring-pink-200/50 dark:ring-pink-500/30"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-base font-medium text-gray-900 dark:text-gray-100 ${
                                !notification.isRead ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                              {(notification.task || notification.podTeam) && (
                                <div className="flex items-center space-x-2">
                                  {notification.task && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {notification.task.title}
                                    </span>
                                  )}
                                  {notification.podTeam && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400">
                                      <Users className="h-3 w-3 mr-1" />
                                      {notification.podTeam.name}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Pagination - Always show */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {filteredNotifications.length > 0 ? (
              <>Showing {startIndex + 1} to {Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length} notifications</>
            ) : (
              <>0 notifications</>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || filteredNotifications.length === 0}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {totalPages > 1 ? (
              [...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-pink-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/20'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  (page === currentPage - 3 && page > 1) ||
                  (page === currentPage + 3 && page < totalPages)
                ) {
                  return (
                    <span key={page} className="px-2 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })
            ) : (
              <span className="px-3 py-2 text-sm font-medium bg-pink-600 text-white rounded-md">
                1
              </span>
            )}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || filteredNotifications.length === 0}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}