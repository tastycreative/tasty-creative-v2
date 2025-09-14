"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MessageSquare, X, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ForumNotification {
  id: string;
  type: "new_reply" | "thread_update" | "mention";
  threadId: string;
  threadTitle: string;
  modelId: string;
  message: string;
  author: {
    username: string;
    image?: string;
  };
  createdAt: Date;
  read: boolean;
}

export function ForumNotifications({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<ForumNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // In a real implementation, this would connect to a WebSocket or Server-Sent Events
    // For now, we'll use a polling mechanism
    const checkNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications/forum?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Initial fetch
    checkNotifications();

    // Poll every 30 seconds
    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/forum/${notificationId}/read`, {
        method: "POST",
      });
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: ForumNotification) => {
    markAsRead(notification.id);
    router.push(`/apps/pod-new/my-models/${notification.modelId}/forum/thread/${notification.threadId}`);
    setIsOpen(false);
  };

  const clearAll = async () => {
    try {
      await fetch(`/api/notifications/forum/clear`, {
        method: "POST",
      });
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-96 z-50"
            >
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Forum Notifications
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAll}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Clear all
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No new notifications</p>
                      <p className="text-xs mt-1 opacity-70">
                        Watch threads to get notified of updates
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                            !notification.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                notification.type === "new_reply"
                                  ? "bg-blue-100 dark:bg-blue-900/50"
                                  : notification.type === "mention"
                                  ? "bg-purple-100 dark:bg-purple-900/50"
                                  : "bg-green-100 dark:bg-green-900/50"
                              }`}>
                                {notification.type === "new_reply" ? (
                                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                ) : notification.type === "mention" ? (
                                  <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                ) : (
                                  <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                {notification.threadTitle}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  by {notification.author.username}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Unread indicator */}
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={() => {
                        router.push("/notifications");
                        setIsOpen(false);
                      }}
                    >
                      View all notifications
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}