"use client";

import React, { useEffect, useState, useRef } from 'react';
import {
  Clock,
  Edit3,
  ArrowRight,
  User,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  GitCommit
} from 'lucide-react';
import Image from 'next/image';
import { useTaskActivities } from '@/lib/stores/boardStore';
import type { TaskActivity } from '@/lib/stores/boardStore';
import UserProfile from '@/components/ui/UserProfile';
import { formatForDisplay } from '@/lib/dateUtils';

interface TaskCardHistoryProps {
  taskId: string;
  teamId: string;
  isModal?: boolean;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case 'CREATED':
      return { icon: Plus, color: 'text-emerald-500' };
    case 'STATUS_CHANGED':
      return { icon: GitCommit, color: 'text-blue-500' };
    case 'PRIORITY_CHANGED':
      return { icon: Tag, color: 'text-amber-500' };
    case 'ASSIGNED':
    case 'UNASSIGNED':
      return { icon: User, color: 'text-violet-500' };
    case 'DUE_DATE_CHANGED':
      return { icon: Calendar, color: 'text-indigo-500' };
    case 'UPDATED':
      return { icon: Edit3, color: 'text-slate-500' };
    case 'DELETED':
      return { icon: Trash2, color: 'text-red-500' };
    default:
      return { icon: Edit3, color: 'text-slate-500' };
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatForDisplay(dateString);
};

export default function TaskCardHistory({ taskId, teamId, isModal = false }: TaskCardHistoryProps) {
  const {
    activities,
    isLoading,
    error,
    columns,
    fetchTaskActivities,
  } = useTaskActivities(taskId);
  
  const [visibleCount, setVisibleCount] = useState(4); // Start with 4 activities
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (taskId && teamId) {
      fetchTaskActivities(taskId, teamId);
    }
  }, [taskId, teamId, fetchTaskActivities]);

  const loadMoreActivities = () => {
    setVisibleCount(prev => Math.min(prev + 5, activities.length));
  };

  const resolveStatusLabel = (value: string): string => {
    const column = columns.find(col => col.status === value);
    return column ? column.label : value;
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading activity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="ml-2 text-sm">{error.message || 'Failed to load activity history'}</span>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="w-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="ml-2 text-sm">No activity yet</span>
        </div>
      </div>
    );
  }

  // Get the most recent activities (activities are already oldest first from API)
  // We want to show: [oldest] ... [newer] [newest] (left to right)
  // So we take the LAST visibleCount activities to show recent ones
  const totalActivities = activities.length;
  const startIndex = Math.max(0, totalActivities - visibleCount);
  const displayActivities = activities.slice(startIndex);
  const hasMoreActivities = visibleCount < activities.length;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity</span>
            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
              {activities.length}
            </span>
          </div>
          {hasMoreActivities && (
            <span className="text-xs text-gray-500">
              +{activities.length - visibleCount} more
            </span>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div 
        ref={scrollContainerRef}
        className="p-4 overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative"
      >
        <div className="flex items-center space-x-4 min-w-max pb-2 max-w-none">
          {/* Load More Button - Left Side (for older activities) */}
          {hasMoreActivities && (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={loadMoreActivities}
                className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full flex items-center justify-center border-2 border-blue-300 dark:border-blue-600 transition-colors group"
                title="Load 5 older activities"
              >
                <span className="text-xs text-blue-700 dark:text-blue-300 font-bold group-hover:scale-110 transition-transform">
                  +5
                </span>
              </button>
              <div className="text-center min-w-[140px] max-w-[160px] flex-shrink-0">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Load older
                </div>
              </div>
            </div>
          )}
          {displayActivities.map((activity, index) => {
            const { icon: IconComponent, color } = getActivityIcon(activity.actionType);
            
            return (
              <div key={activity.id} className="flex items-center space-x-3 group">
                {/* Activity Node */}
                <div className="flex flex-col items-center space-y-2">
                  {/* User Avatar */}
                  <div className="relative">
                    <UserProfile user={activity.user} size="md" showTooltip />
                    
                    {/* Activity Icon Badge */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <IconComponent className={`h-2.5 w-2.5 ${color}`} />
                    </div>
                  </div>
                  
                  {/* Activity Details */}
                  <div className="text-center min-w-[140px] max-w-[160px] flex-shrink-0">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                      {activity.user.name || activity.user.email.split('@')[0]}
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {activity.actionType === 'STATUS_CHANGED' ? (
                        <div className="space-y-1">
                          <div>Changed status</div>
                          {activity.oldValue && activity.newValue && (
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-gray-500">From:</span>
                                <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-md text-center max-w-full truncate" 
                                      title={resolveStatusLabel(activity.oldValue)}>
                                  {resolveStatusLabel(activity.oldValue)}
                                </span>
                              </div>
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-gray-500">To:</span>
                                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-center max-w-full truncate" 
                                      title={resolveStatusLabel(activity.newValue)}>
                                  {resolveStatusLabel(activity.newValue)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : activity.actionType === 'CREATED' ? (
                        'Created task'
                      ) : activity.actionType === 'UPDATED' ? (
                        `Updated ${activity.fieldName || 'task'}`
                      ) : activity.actionType === 'ASSIGNED' ? (
                        'Assigned task'
                      ) : activity.actionType === 'UNASSIGNED' ? (
                        'Unassigned task'  
                      ) : (
                        activity.actionType.toLowerCase().replace('_', ' ')
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(activity.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Timeline Connector with Arrow */}
                {index < displayActivities.length - 1 && (
                  <div className="flex-shrink-0 flex items-center justify-center self-start mt-4 w-8 h-4">
                    <svg 
                      width="32" 
                      height="16" 
                      viewBox="0 0 32 16" 
                      className="text-gray-400 dark:text-gray-500"
                    >
                      {/* Line */}
                      <line 
                        x1="0" 
                        y1="8" 
                        x2="24" 
                        y2="8" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                      />
                      {/* Arrow head */}
                      <polygon 
                        points="24,4 32,8 24,12" 
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}