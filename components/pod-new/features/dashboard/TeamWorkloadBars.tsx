"use client";

import React from "react";

interface TeamWorkload {
  teamId: string;
  teamName: string;
  taskCount: number;
  memberCount: number;
  tasksPerMember: number;
}

interface TeamWorkloadBarsProps {
  data: TeamWorkload[];
}

export default function TeamWorkloadBars({ data }: TeamWorkloadBarsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No team data available
        </div>
      </div>
    );
  }

  const maxTasks = Math.max(...data.map(t => t.taskCount));
  const maxTasksPerMember = Math.max(...data.map(t => t.tasksPerMember));

  // Sort by tasks per member (most loaded teams first)
  const sortedData = [...data].sort((a, b) => b.tasksPerMember - a.tasksPerMember);

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Team Workload
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active tasks per team</p>
        </div>

        {/* Team Bars */}
        <div className="space-y-5">
          {sortedData.map((team, index) => {
            const taskBarWidth = maxTasks > 0 ? (team.taskCount / maxTasks) * 100 : 0;
            const isOverloaded = team.tasksPerMember > 10; // Alert if >10 tasks per member

            return (
              <div key={team.teamId} className="group">
                {/* Team Name and Stats */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isOverloaded ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-bold text-gray-900">
                      {team.teamName}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({team.memberCount} {team.memberCount === 1 ? 'member' : 'members'})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Tasks/Member</div>
                      <div className={`text-sm font-bold ${
                        isOverloaded ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {team.tasksPerMember.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="text-sm font-bold text-gray-900">
                        {team.taskCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Count Bar */}
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden mb-1">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out ${
                      isOverloaded
                        ? 'bg-gradient-to-r from-red-500 to-orange-500'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    } group-hover:opacity-90`}
                    style={{ width: `${taskBarWidth}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                  </div>

                  {/* Count inside bar */}
                  {taskBarWidth > 20 && (
                    <div className="absolute inset-y-0 left-0 flex items-center px-3">
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {team.taskCount} tasks
                      </span>
                    </div>
                  )}
                </div>

                {/* Tasks Per Member Bar (lighter, smaller) */}
                <div className="relative h-2 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                      isOverloaded ? 'bg-red-400' : 'bg-purple-400'
                    }`}
                    style={{
                      width: `${maxTasksPerMember > 0 ? (team.tasksPerMember / maxTasksPerMember) * 100 : 0}%`
                    }}
                  />
                </div>

                {/* Overload Warning */}
                {isOverloaded && (
                  <div className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    High workload - consider redistributing tasks
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Normal load</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Overloaded (&gt;10 tasks/member)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
