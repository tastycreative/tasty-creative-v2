"use client";

import React from "react";

// Skeleton loading component for individual tasks
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

TaskSkeleton.displayName = "TaskSkeleton";

// Main board skeleton component
export default function BoardSkeleton() {
  const columns = [
    { status: "NOT_STARTED", label: "Not Started" },
    { status: "IN_PROGRESS", label: "In Progress" },
    { status: "COMPLETED", label: "Completed" },
    { status: "CANCELLED", label: "Cancelled" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 h-full">
      {columns.map((column) => (
        <div
          key={column.status}
          className="border-r-2 border-gray-200 dark:border-gray-600 last:border-r-0"
        >
          {/* Column Header Skeleton */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                <div className="h-5 w-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </div>
              <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Column Body with Task Skeletons */}
          <div className="p-4 space-y-3">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}