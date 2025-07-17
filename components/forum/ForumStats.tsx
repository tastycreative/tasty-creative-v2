"use client";

import { Users, MessageSquare, TrendingUp } from "lucide-react";
import { ForumStats as ForumStatsType } from "../../lib/forum-api";

interface ForumStatsProps {
  stats: ForumStatsType | null;
  loading: boolean;
}

export function ForumStats({ stats, loading }: ForumStatsProps) {
  if (loading) {
    return (
      <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Community Stats
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              Active Users
            </span>
          </div>
          <span className="text-gray-800 dark:text-white font-bold">
            {stats?.activeUsers || 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              Total Posts
            </span>
          </div>
          <span className="text-gray-800 dark:text-white font-bold">
            {stats?.totalPosts || 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              Today
            </span>
          </div>
          <span className="text-gray-800 dark:text-white font-bold">
            {stats?.todayPosts || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
