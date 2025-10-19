"use client";

import React from "react";

// Skeleton loading component - Memoized to prevent unnecessary re-renders
export const TaskSkeleton = React.memo(() => (
  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>

      {/* Description skeleton */}
      <div className="space-y-1 mb-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
      </div>

      {/* Meta skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-16"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
      </div>

      {/* Assignment skeleton */}
      <div className="space-y-1">
        <div className="flex items-center">
          <div className="h-3 w-3 bg-gray-200 dark:bg-gray-600 rounded mr-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 bg-gray-200 dark:bg-gray-600 rounded mr-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
));

export const ColumnHeaderSkeleton = () => (
  <div className="p-4 bg-gray-50 dark:bg-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded mr-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        <div className="ml-2 h-5 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
      </div>
      <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);

interface BoardSkeletonProps {
  teamName: string;
  getColumnConfig: () => Array<[string, any]>;
  getGridClasses: () => string;
  getGridStyles: () => { gridTemplateColumns: string };
}

export default function BoardSkeleton({
  teamName,
  getColumnConfig,
  getGridClasses,
  getGridStyles,
}: BoardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Board Header with Team Selection - Mobile Responsive Loading */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg backdrop-blur-sm">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30 animate-pulse">
                  <div className="w-6 h-6 bg-pink-300 dark:bg-pink-600 rounded"></div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Task Board
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span className="font-medium">{teamName}</span>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                      <span className="text-xs">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Search and Filter Controls - Simplified during loading */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-sm font-medium">Loading board data...</span>
          </div>
        </div>
      </div>

      {/* Board with Skeleton Content - Only task content is skeleton */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {/* Horizontal scroll container */}
        <div className="overflow-x-auto">
          {/* Column Headers - Always visible with real data */}
          <div
            className={`grid ${getGridClasses()} border-b-2 border-gray-200 dark:border-gray-600`}
            style={getGridStyles()}
          >
            {getColumnConfig().map(([status, config], index) => {
              const IconComponent = config.icon;
              return (
                <div
                  key={status}
                  className={`p-4 ${config.headerColor} dark:bg-gray-700 ${
                    index < 3
                      ? "border-r-2 border-gray-200 dark:border-gray-600"
                      : ""
                  }`}
                >
                  <ColumnHeaderSkeleton />
                </div>
              );
            })}
          </div>

          {/* Column Content - Only this part shows skeleton loading */}
          <div
            className={`grid ${getGridClasses()} min-h-[600px]`}
            style={getGridStyles()}
          >
            {getColumnConfig().map(([status, config], index) => (
              <div
                key={status}
                className={`p-4 ${
                  index < (getColumnConfig().length || 4) - 1
                    ? "border-r-2 border-gray-200 dark:border-gray-600"
                    : ""
                }`}
              >
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TaskSkeleton key={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
