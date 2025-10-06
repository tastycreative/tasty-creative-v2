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
  availableTeams: Array<{ row: number; name: string; label: string }>;
  selectedRow: number;
  onTeamChange: (teamRow: number) => void;
  getColumnConfig: () => Array<[string, any]>;
  getGridClasses: () => string;
  getGridStyles: () => { gridTemplateColumns: string };
}

export default function BoardSkeleton({
  teamName,
  availableTeams,
  selectedRow,
  onTeamChange,
  getColumnConfig,
  getGridClasses,
  getGridStyles,
}: BoardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Board Header with Team Selection - Mobile Responsive Loading */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/30 dark:border-gray-700/30 rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Task Board
                </h2>
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full"></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{teamName}</span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center space-x-1"></div>
              </div>
            </div>

            {/* Team Selector - Mobile Responsive */}
            <div className="relative w-full sm:w-auto">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 sm:px-4 py-2 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-2"></div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <select
                  value={selectedRow}
                  onChange={(e) => onTeamChange(Number(e.target.value))}
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors appearance-none pr-6 min-w-0 flex-1"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1rem 1rem",
                  }}
                >
                  {availableTeams.map((team) => (
                    <option key={team.row} value={team.row}>
                      {team.name}
                    </option>
                  ))}
                </select>
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
