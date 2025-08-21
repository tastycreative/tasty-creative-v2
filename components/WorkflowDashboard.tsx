'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Play, CheckCircle2, XCircle, Sparkles, ExternalLink } from 'lucide-react';

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

interface Creator {
  id: string;
  name: string;
  specialty: string;
  rowNumber?: number;
}

interface PricingItem {
  name: string;
  price: string;
  creator: string;
  totalCombinations?: number;
}

interface WorkflowDashboardProps {
  tasks?: Task[];
  creators?: Creator[];
  onPricingGuideClick?: () => void;
  pricingPreview?: PricingItem[];
}

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({
  tasks = [],
  creators = [],
  onPricingGuideClick,
  pricingPreview = []
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

      {/* Recent Tasks and Pricing Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="space-y-4">
              {Array.from(new Set(tasks.map(t => t.assignee))).slice(0, 3).map(assignee => {
                const memberTasks = tasks.filter(t => t.assignee === assignee).slice(0, 3); // Limit to 3 tasks per member
                
                return (
                  <div key={assignee} className="p-4 rounded-lg border border-pink-200 dark:border-pink-500/30 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/20 dark:to-rose-900/20">
                    {/* Member Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {assignee.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{assignee}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{tasks.filter(t => t.assignee === assignee).length} tasks</p>
                      </div>
                    </div>
                    
                    {/* Task List with Status Badges */}
                    <div className="space-y-2">
                      {memberTasks.map((task) => {
                        const config = statusConfig[task.status];
                        const IconComponent = config.icon;
                        
                        return (
                          <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2 flex-1">
                              {/* Status Icon */}
                              <div className={`p-1 rounded-full ${config.color}`}>
                                <IconComponent className="h-3 w-3" />
                              </div>
                              
                              {/* Task Title */}
                              <span className={`text-xs font-medium flex-1 ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
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
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No tasks assigned to this team yet.
              </p>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Pricing Guide Shortcut */}
        <Card className="border border-purple-200 dark:border-purple-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/30 dark:to-indigo-900/30 border-b border-purple-200 dark:border-purple-500/30">
            <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center justify-between text-lg">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                Pricing Guide
              </div>
              {onPricingGuideClick && (
                <button 
                  onClick={onPricingGuideClick}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pricingPreview.length > 0 ? (
              <div className="space-y-4">
                {/* Pricing Items Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview Contents</h4>
                  {pricingPreview.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-500/30">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.creator}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400 ml-2">
                        {item.price}
                      </span>
                    </div>
                  ))}
                  
                  {pricingPreview.length > 0 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {pricingPreview[0]?.totalCombinations ? 
                          `+${pricingPreview[0].totalCombinations - Math.min(pricingPreview.length, 4)} more pricing combinations` :
                          `+${Math.max(pricingPreview.length - 4, 0)} more pricing combinations`
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* View All Button */}
                {onPricingGuideClick && (
                  <button
                    onClick={onPricingGuideClick}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <span>View Full Pricing Guide</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">No creators assigned</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Assign creators to see pricing information.
                </p>
                {onPricingGuideClick && (
                  <button
                    onClick={onPricingGuideClick}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-medium transition-colors"
                  >
                    Browse Pricing Guide →
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
