"use client";

import { Users } from "lucide-react";

export function UserActivityChartSkeleton() {
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
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 opacity-50" />
          </div>
          <div>
            <div className="h-6 w-36 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Chart Skeleton - Area Chart Style */}
        <div className="flex-1 -mx-2 min-h-0 relative">
          {/* Animated gradient area to simulate loading chart */}
          <div className="absolute inset-0 flex items-end justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Animated area fill */}
              <defs>
                <linearGradient id="skeletonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity="0.3"/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path
                d="M 0,60 L 10,55 L 20,65 L 30,50 L 40,60 L 50,45 L 60,55 L 70,40 L 80,50 L 90,45 L 100,55 L 100,100 L 0,100 Z"
                fill="url(#skeletonGradient)"
                className="animate-pulse"
              />
              <path
                d="M 0,60 L 10,55 L 20,65 L 30,50 L 40,60 L 50,45 L 60,55 L 70,40 L 80,50 L 90,45 L 100,55"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 opacity-20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-px bg-gray-300 dark:bg-gray-600" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
