'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Play, CheckCircle2, XCircle } from 'lucide-react';

// Simple Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}>
    <div
      className="bg-gradient-to-r from-purple-500 to-blue-600 dark:from-purple-400 dark:to-blue-500 h-full rounded-full transition-all duration-300"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    ></div>
  </div>
);

// Status configuration matching the Board component
const statusConfig = {
  'not-started': {
    label: 'Not Started',
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50'
  },
  'in-progress': {
    label: 'In Progress',
    icon: Play,
    color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  'completed': {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  'review': {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20'
  }
};

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
  tasks = []
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
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{completedTasks}</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Completed</p>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">In Progress</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                    {tasks.filter(t => t.status === 'not-started').length}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Not Started</p>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {tasks.filter(t => t.status === 'review').length}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">Cancelled</p>
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
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {tasks.length > 0 ? (
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
                    
                    {/* Task List with Status Badges */}
                    <div className="space-y-2">
                      {memberTasks.map((task) => {
                        const config = statusConfig[task.status];
                        const IconComponent = config.icon;
                        
                        return (
                          <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${config.bgColor} border-gray-200 dark:border-gray-600`}>
                            <div className="flex items-center space-x-3 flex-1">
                              {/* Status Icon */}
                              <div className={`p-1 rounded-full ${config.color}`}>
                                <IconComponent className="h-3 w-3" />
                              </div>
                              
                              {/* Task Title */}
                              <span className={`text-sm font-medium flex-1 ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                {task.title}
                              </span>
                            </div>
                            
                            {/* Status Badge */}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                There are no tasks assigned to this team yet.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Create tasks in the Admin panel to see them here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowDashboard;
