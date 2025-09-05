"use client";

import React from "react";
import { Session } from "next-auth";

interface TeamOption {
  row: number;
  name: string;
  label: string;
}

interface BoardHeaderProps {
  teamName: string;
  availableTeams: TeamOption[];
  selectedRow: number;
  onTeamChange: (teamRow: number) => void;
  totalTasks: number;
  filteredTasksCount: number;
  isLoading: boolean;
}

export default function BoardHeader({
  teamName,
  availableTeams,
  selectedRow,
  onTeamChange,
  totalTasks,
  filteredTasksCount,
  isLoading,
}: BoardHeaderProps) {
  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/30 dark:border-gray-700/30 rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Task Board
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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

          {/* Team Selector - Mobile Responsive */}
          <div className="relative w-full sm:w-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 sm:px-4 py-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Team
                </span>
              </div>
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
  );
}
