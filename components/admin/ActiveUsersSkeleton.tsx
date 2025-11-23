"use client";

import { Users } from "lucide-react";

export function ActiveUsersSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 p-6 shadow-lg">
      {/* Radial pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header Skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 opacity-50" />
          </div>
          <div>
            <div className="h-5 w-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse" />
          </div>
        </div>

        {/* Users List Skeleton */}
        <div className="space-y-1.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 animate-pulse"
            >
              {/* Avatar Skeleton */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex-shrink-0" />

              {/* User Info Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
              </div>

              {/* Time Skeleton */}
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
