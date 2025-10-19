"use client";

import React, { useMemo } from "react";
import { BarChart3, Users, Calendar, CheckSquare, TrendingUp, Clock, Target, Activity } from "lucide-react";

interface Task {
  id: string;
  status: string;
  priority: string;
  assignedBy?: string | null;
  assignedTo?: string | null;
  createdAt: Date;
  dueDate?: Date | null;
  completedAt?: Date | null;
}

interface BoardColumn {
  id: string;
  label: string;
  status: string;
  position: number;
  color?: string;
  isDefault?: boolean;
}

interface SummaryProps {
  teamName: string;
  totalTasks: number;
  filteredTasksCount: number;
  tasks: Task[];
  teamMembers: Array<{id: string, email: string, name?: string}>;
  columns: BoardColumn[];
}

export default function Summary({
  teamName,
  totalTasks,
  filteredTasksCount,
  tasks,
  teamMembers,
  columns,
}: SummaryProps) {
  
  // Calculate analytics data
  const analytics = useMemo(() => {
    // Dynamic status counts based on actual board columns
    const statusCounts = columns.reduce((acc, column) => {
      acc[column.status] = tasks.filter(t => t.status === column.status).length;
      return acc;
    }, {} as Record<string, number>);

    const priorityCounts = {
      HIGH: tasks.filter(t => t.priority === 'HIGH').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      LOW: tasks.filter(t => t.priority === 'LOW').length,
    };

    // Team member performance
    const memberPerformance = teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo === member.id || t.assignedTo === member.email);
      const completedTasks = memberTasks.filter(t => {
        // Check if task is in a completed status based on dynamic columns
        const completedStatuses = columns
          .filter(col => 
            col.status.toLowerCase().includes('completed') || 
            col.status.toLowerCase().includes('done') ||
            col.position === Math.max(...columns.map(c => c.position))
          )
          .map(col => col.status);
        return completedStatuses.includes(t.status);
      });
      return {
        ...member,
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        completionRate: memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0,
      };
    });

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentTasks = tasks.filter(t => new Date(t.createdAt) >= oneWeekAgo);

    // Overdue tasks (exclude completed status)
    const now = new Date();
    const completedStatuses = columns
      .filter(col => 
        col.status.toLowerCase().includes('completed') || 
        col.status.toLowerCase().includes('done') ||
        col.position === Math.max(...columns.map(c => c.position))
      )
      .map(col => col.status);
    
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      !completedStatuses.includes(t.status)
    );

    // Find completed column (usually the last one or one marked as completed)
    const completedColumn = columns.find(col => 
      col.status.toLowerCase().includes('completed') || 
      col.status.toLowerCase().includes('done') ||
      col.position === Math.max(...columns.map(c => c.position))
    );
    const completedCount = completedColumn ? statusCounts[completedColumn.status] || 0 : 0;

    return {
      statusCounts,
      priorityCounts,
      memberPerformance,
      recentTasksCount: recentTasks.length,
      overdueTasksCount: overdueTasks.length,
      completionRate: totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0,
      completedCount,
    };
  }, [tasks, teamMembers, totalTasks, columns]);

  // Simple progress bar component
  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
      />
    </div>
  );

  // Circle chart component
  const CircleChart = ({ data, size = 120 }: { data: Array<{label: string, value: number, color: string}>, size?: number }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">No data</div>
          </div>
        </div>
      );
    }

    let cumulativePercentage = 0;
    const radius = (size - 20) / 2;
    const center = size / 2;
    const strokeWidth = 20;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgb(229, 231, 235)"
            strokeWidth={strokeWidth}
            className="dark:stroke-gray-700"
          />
          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * circumference / 100;
            
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{total}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>
    );
  };

  // Status chart with circle visualization based on dynamic columns
  const StatusChart = () => {
    // Static pastel colors for task status columns
    const staticPastelColors = [
      'rgb(165, 180, 252)', // Light Indigo
      'rgb(147, 197, 253)', // Light Blue  
      'rgb(134, 239, 172)', // Light Green
      'rgb(252, 211, 77)',  // Light Yellow
      'rgb(253, 186, 116)', // Light Orange
      'rgb(252, 165, 165)', // Light Red
      'rgb(244, 114, 182)', // Light Pink
      'rgb(196, 181, 253)', // Light Purple
      'rgb(153, 246, 228)', // Light Teal
      'rgb(196, 224, 217)', // Light Emerald
      'rgb(254, 202, 202)', // Light Rose
      'rgb(156, 163, 175)', // Light Gray
      'rgb(190, 227, 248)', // Light Sky
      'rgb(187, 247, 208)', // Light Mint
      'rgb(254, 215, 170)', // Light Peach
      'rgb(249, 168, 212)', // Light Fuchsia
      'rgb(221, 214, 254)', // Light Violet
      'rgb(165, 243, 252)', // Light Cyan
      'rgb(209, 250, 229)', // Light Seafoam
      'rgb(254, 240, 138)', // Light Lime
    ];

    const getColumnColor = (index: number) => {
      return staticPastelColors[index % staticPastelColors.length];
    };

    const statusData = columns
      .sort((a, b) => a.position - b.position)
      .map((column, index) => ({
        label: column.label,
        value: analytics.statusCounts[column.status] || 0,
        color: column.color || getColumnColor(index),
      }));

    return (
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div className="flex-shrink-0">
          <CircleChart data={statusData} size={160} />
        </div>
        <div className="flex-1 w-full">
          {statusData.length <= 6 ? (
            // Standard layout for 6 or fewer columns
            <div className="space-y-3">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium ml-2">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            // Grid layout for many columns
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium ml-2">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Priority chart with circle visualization
  const PriorityChart = () => {
    const priorityData = [
      { label: 'High', value: analytics.priorityCounts.HIGH, color: 'rgb(252, 165, 165)' }, // Light Red
      { label: 'Medium', value: analytics.priorityCounts.MEDIUM, color: 'rgb(252, 211, 77)' }, // Light Yellow
      { label: 'Low', value: analytics.priorityCounts.LOW, color: 'rgb(134, 239, 172)' }, // Light Green
    ];

    return (
      <div className="flex items-center gap-6">
        <CircleChart data={priorityData} size={160} />
        <div className="space-y-3 flex-1">
          {priorityData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label} Priority</span>
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Tasks */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-lg">
                <CheckSquare className="w-3 h-3 text-pink-600 dark:text-pink-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Tasks</h4>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{totalTasks}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {analytics.completionRate.toFixed(1)}% completed
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-indigo-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/20 rounded-lg">
                <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Team Members</h4>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{teamMembers.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Active contributors
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-emerald-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/20 dark:to-emerald-400/20 rounded-lg">
                <Activity className="w-3 h-3 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Recent Activity</h4>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{analytics.recentTasksCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Tasks created this week
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-red-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-400/20 dark:to-red-400/20 rounded-lg">
                <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Overdue Tasks</h4>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{analytics.overdueTasksCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Need attention
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Status Distribution</h3>
            </div>
            <StatusChart />
          </div>
        </div>

        {/* Team Performance */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-indigo-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Performance</h3>
            </div>
            <div className="space-y-4">
              {analytics.memberPerformance.slice(0, 5).map((member, index) => (
                <div key={member.id || index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.name || member.email.split('@')[0]}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {member.completedTasks}/{member.totalTasks}
                    </span>
                  </div>
                  <ProgressBar 
                    value={member.completedTasks} 
                    max={member.totalTasks} 
                    color="bg-blue-500" 
                  />
                </div>
              ))}
              {analytics.memberPerformance.length === 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  No team member data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-emerald-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/20 dark:to-emerald-400/20 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Priority Distribution</h3>
          </div>
          <PriorityChart />
        </div>
      </div>
    </div>
  );
}