"use client";

import { ActiveUser } from "@/hooks/useAdminUsers";
import { Users, Clock } from "lucide-react";
import { formatForDisplay } from "@/lib/dateUtils";
import Image from "next/image";

interface ActiveUsersTodayProps {
  users: ActiveUser[];
}

// Helper function to format relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days}d ago`;
}

// Get user's timezone abbreviation
function getTimezoneAbbr(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    const abbr = new Date().toLocaleTimeString('en-US', {
      timeZoneName: 'short'
    }).split(' ').pop();
    return abbr || timezone;
  } catch {
    return timezone;
  }
}

export function ActiveUsersToday({ users }: ActiveUsersTodayProps) {
  const timezoneAbbr = getTimezoneAbbr();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 p-6 shadow-lg h-full flex flex-col">
      {/* Radial pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold bg-gradient-to-r from-gray-900 via-emerald-600 to-green-600 dark:from-white dark:via-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
              Active Today
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {users.length} {users.length === 1 ? 'user' : 'users'} • Your time: {timezoneAbbr}
            </p>
          </div>
        </div>

        {/* Users List */}
        {users.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No users accessed today</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent min-h-0">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {/* Avatar */}
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || user.email || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Users className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0" title={`${user.name || 'No name'}\n${user.email || ''}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name || user.email?.split('@')[0] || "User"}
                  </p>
                </div>

                {/* Last Accessed */}
                <div
                  className="flex flex-col items-end gap-0.5 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
                  title={`Last active: ${new Date(user.lastAccessed).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                  })}`}
                >
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="whitespace-nowrap font-medium text-emerald-600 dark:text-emerald-400">
                      {formatRelativeTime(user.lastAccessed)}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(user.lastAccessed).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
