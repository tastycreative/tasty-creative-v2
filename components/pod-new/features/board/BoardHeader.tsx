"use client";

import React from "react";
import { KanbanSquare } from "lucide-react";

interface BoardHeaderProps {
  teamName: string;
  totalTasks: number;
  filteredTasksCount: number;
  isLoading: boolean;
}

export default function BoardHeader({
  teamName,
  totalTasks,
  filteredTasksCount,
  isLoading,
}: BoardHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg backdrop-blur-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                <KanbanSquare className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Task Board
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span className="font-medium">{teamName}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    {filteredTasksCount} of {totalTasks} tasks
                  </span>
                  {isLoading && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                        <span className="text-xs">Updating...</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
