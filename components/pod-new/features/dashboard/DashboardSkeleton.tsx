"use client";

import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm p-8 animate-pulse">
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white dark:bg-gray-800 rounded-full opacity-50 blur-3xl"></div>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Quick Stats Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              {/* Top Accent Bar */}
              <div className="h-1 bg-gray-300 dark:bg-gray-600" />

              <div className="p-6 space-y-3">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Top Contributors Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          <div className="mb-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>

          {/* Chart */}
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Task Pipeline */}
          <div className="space-y-6">
            {/* Task Pipeline Chart Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="mb-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              {/* Chart Area */}
              <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />

              {/* Total */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>

            {/* Priority Chart Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="mb-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              {/* Donut Chart */}
              <div className="h-[280px] bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Content Production */}
          <div className="space-y-6">
            {/* Content Type Chart Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="mb-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              {/* Chart */}
              <div className="h-[250px] bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="space-y-1">
                      <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>

            {/* Content Style Pills Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="mb-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              {/* Chart */}
              <div className="h-[200px] bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />

              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>

            {/* Recent Submissions Timeline Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="mb-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
