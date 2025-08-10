'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simple Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}>
    <div
      className="bg-gradient-to-r from-purple-500 to-blue-600 h-full rounded-full transition-all duration-300"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    ></div>
  </div>
);

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'not-started' | 'in-progress' | 'review' | 'completed';
  progress: number;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

interface WorkflowDashboardProps {
  tasks?: Task[];
}

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({
  tasks = [
    {
      id: '1',
      title: 'Design Homepage Banner',
      assignee: 'Sarah Wilson',
      status: 'completed',
      progress: 100,
      dueDate: '2025-08-10',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Create Video Thumbnail',
      assignee: 'Alex Chen',
      status: 'in-progress',
      progress: 65,
      dueDate: '2025-08-12',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Write Product Description',
      assignee: 'Emma Davis',
      status: 'review',
      progress: 90,
      dueDate: '2025-08-11',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Social Media Graphics',
      assignee: 'Sarah Wilson',
      status: 'not-started',
      progress: 0,
      dueDate: '2025-08-15',
      priority: 'low'
    },
  ]
}) => {
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-2xl">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-4">
              <span className="h-5 w-5 text-white text-lg">📋</span>
            </div>
            POD Workflow Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Progress</h3>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {completedTasks}/{totalTasks} completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {overallProgress.toFixed(0)}% of tasks completed
              </p>
            </div>

            {/* Status Summary */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <p className="text-lg font-bold text-pink-600 dark:text-pink-400">{completedTasks}</p>
                  <p className="text-xs text-pink-700 dark:text-pink-300">Completed</p>
                </div>
                <div className="text-center p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300">In Progress</p>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team Performance</h3>
              <div className="space-y-2">
                {Array.from(new Set(tasks.map(t => t.assignee))).map(assignee => {
                  const memberTasks = tasks.filter(t => t.assignee === assignee);
                  const completedCount = memberTasks.filter(t => t.status === 'completed').length;
                  const memberProgress = memberTasks.length > 0 ? (completedCount / memberTasks.length) * 100 : 0;
                  
                  return (
                    <div key={assignee} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{assignee}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">{memberProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={memberProgress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3">
              <span className="text-white text-sm">👤</span>
            </div>
            Active Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from(new Set(tasks.map(t => t.assignee))).map(assignee => {
              const memberTasks = tasks.filter(t => t.assignee === assignee);
              
              return (
                <div key={assignee} className="p-4 rounded-lg border border-pink-200 dark:border-pink-500/30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  {/* Member Header */}
                  <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-pink-200 dark:border-pink-500/30">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {assignee.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{assignee}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{memberTasks.length} tasks</p>
                    </div>
                  </div>
                  
                  {/* Simple Task List with Checkboxes */}
                  <div className="space-y-2">
                    {memberTasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          readOnly
                          className="h-4 w-4 text-green-600 rounded border-gray-300 dark:border-gray-600 focus:ring-green-500"
                        />
                        
                        {/* Task Title Only */}
                        <span className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowDashboard;
