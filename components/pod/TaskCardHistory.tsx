"use client";

import React, { useEffect } from 'react';
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
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
  });
};

export default function TaskCardHistory({ taskId, teamId, isModal = false }: TaskCardHistoryProps) {
  const {
    activities,
    isLoading,
    error,
    columns,
    fetchTaskActivities,
  } = useTaskActivities(taskId);

  useEffect(() => {
    if (taskId && teamId) {
      fetchTaskActivities(taskId, teamId);
    }
  }, [taskId, teamId, fetchTaskActivities]);

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

  const maxActivities = isModal ? 15 : 8;
  const displayActivities = activities.slice(0, maxActivities);

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
          {activities.length > maxActivities && (
            <span className="text-xs text-gray-500">
              +{activities.length - maxActivities} more
            </span>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-4 overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="flex items-center space-x-4 min-w-max pb-2 max-w-none">
          {displayActivities.map((activity, index) => {
            const { icon: IconComponent, color } = getActivityIcon(activity.actionType);
            
            return (
              <div key={activity.id} className="flex items-center space-x-3 group">
                {/* Activity Node */}
                <div className="flex flex-col items-center space-y-2">
                  {/* User Avatar */}
                  <div className="relative">
                    {activity.user.image ? (
                      <Image
                        src={activity.user.image}
                        alt={activity.user.name || activity.user.email}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                        <span className="text-white text-xs font-semibold">
                          {activity.user.name?.charAt(0)?.toUpperCase() || activity.user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
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

                {/* Timeline Connector */}
                {index < displayActivities.length - 1 && (
                  <div className="flex-shrink-0 w-8 h-px bg-gray-300 dark:bg-gray-600 self-start mt-4"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}