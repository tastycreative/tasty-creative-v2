"use client";

import React, { useState } from "react";
import { KanbanSquare, BarChart3, Settings, List } from "lucide-react";
import { useSession } from "next-auth/react";

interface BoardHeaderProps {
  teamName: string;
  totalTasks: number;
  filteredTasksCount: number;
  isLoading: boolean;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export type TabType = 'board' | 'list' | 'summary' | 'settings';

export default function BoardHeader({
  teamName,
  totalTasks,
  filteredTasksCount,
  isLoading,
  activeTab = 'board',
  onTabChange,
}: BoardHeaderProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  const handleTabChange = (tab: TabType) => {
    // Prevent settings access for non-admin/moderator users
    if (tab === 'settings' && !isAdmin) {
      return;
    }
    
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const tabs = [
    {
      id: 'summary' as TabType,
      label: 'Summary',
      icon: BarChart3,
    },
    {
      id: 'board' as TabType,
      label: 'Board',
      icon: KanbanSquare,
    },
    {
      id: 'list' as TabType,
      label: 'List',
      icon: List,
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      icon: Settings,
    },
  ];

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
                  {teamName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
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

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isSettingsTab = tab.id === 'settings';
              const isDisabled = isSettingsTab && !isAdmin;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isDisabled
                      ? 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                      : isActive
                      ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  title={isDisabled ? 'Settings access requires Admin or Moderator role' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
