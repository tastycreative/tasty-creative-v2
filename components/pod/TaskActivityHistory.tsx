"use client";

import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Edit3, 
  ArrowRight, 
  User, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

interface TaskActivity {
  id: string;
  actionType: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
}

interface TaskActivityHistoryProps {
  taskId: string;
  teamId: string;
  className?: string;
}

const getActivityIcon = (actionType: string, fieldName?: string) => {
  switch (actionType) {
    case 'CREATED':
      return { icon: Plus, color: 'text-green-600', bg: 'bg-green-100' };
    case 'STATUS_CHANGED':
      return { icon: ArrowRight, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'PRIORITY_CHANGED':
      return { icon: Tag, color: 'text-orange-600', bg: 'bg-orange-100' };
    case 'ASSIGNED':
    case 'UNASSIGNED':
      return { icon: User, color: 'text-purple-600', bg: 'bg-purple-100' };
    case 'DUE_DATE_CHANGED':
      return { icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' };
    case 'UPDATED':
      if (fieldName === 'title' || fieldName === 'description') {
        return { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-100' };
      }
      return { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-100' };
    case 'ATTACHMENT_ADDED':
    case 'ATTACHMENT_REMOVED':
      return { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-100' };
    case 'COMMENT_ADDED':
      return { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-100' };
    case 'DELETED':
      return { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' };
    default:
      return { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
};

// Component to display activity value changes with proper label resolution
const ActivityValueChange = ({ activity, statusLabels }: { 
  activity: TaskActivity; 
  statusLabels: Map<string, string>; 
}) => {
  const getDisplayValue = (value: string, isStatus: boolean): string => {
    if (isStatus && statusLabels.has(value)) {
      return statusLabels.get(value)!;
    }
    return value.length > 20 ? `${value.substring(0, 20)}...` : value;
  };

  const isStatusField = activity.fieldName === 'status' || activity.actionType === 'STATUS_CHANGED';
  const oldDisplayValue = getDisplayValue(activity.oldValue!, isStatusField);
  const newDisplayValue = getDisplayValue(activity.newValue!, isStatusField);

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
      <div className="flex items-center space-x-1">
        <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
          {oldDisplayValue}
        </span>
        <ArrowRight className="h-3 w-3" />
        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
          {newDisplayValue}
        </span>
      </div>
    </div>
  );
};

export default function TaskActivityHistory({ taskId, teamId, className = '' }: TaskActivityHistoryProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLabels, setStatusLabels] = useState<Map<string, string>>(new Map());

  // Function to resolve status to column label
  const resolveStatusLabel = async (status: string): Promise<string> => {
    if (statusLabels.has(status)) {
      return statusLabels.get(status)!;
    }

    try {
      const response = await fetch(`/api/board-columns?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        const columns = data.columns || [];
        const newLabels = new Map();
        
        // Build a map of status -> label for all columns
        columns.forEach((column: any) => {
          newLabels.set(column.status, column.label);
        });
        
        setStatusLabels(newLabels);
        return newLabels.get(status) || status;
      }
    } catch (error) {
      console.error('Error fetching column labels:', error);
    }
    
    return status;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch both activities and column labels in parallel
        const [activitiesResponse, columnsResponse] = await Promise.all([
          fetch(`/api/tasks/${taskId}/activity`),
          fetch(`/api/board-columns?teamId=${teamId}`)
        ]);
        
        if (!activitiesResponse.ok) {
          throw new Error('Failed to fetch activity history');
        }
        
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.activities || []);
        
        // Load column labels if available
        if (columnsResponse.ok) {
          const columnsData = await columnsResponse.json();
          const columns = columnsData.columns || [];
          const newLabels = new Map();
          
          columns.forEach((column: any) => {
            newLabels.set(column.status, column.label);
          });
          
          setStatusLabels(newLabels);
        }
      } catch (error) {
        console.error('Error fetching task activities:', error);
        setError(error instanceof Error ? error.message : 'Failed to load activity history');
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId && teamId) {
      fetchData();
    }
  }, [taskId, teamId]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Activity
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Activity
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm py-4">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Activity
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({activities.length})
        </span>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No activity yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const isFirst = index === 0;
            const isLast = index === activities.length - 1;
            const { icon: IconComponent, color, bg } = getActivityIcon(activity.actionType, activity.fieldName);

            return (
              <div key={activity.id} className="relative group">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-600 -z-10" />
                )}

                {/* Activity item */}
                <div className="flex items-start space-x-3">
                  {/* Activity icon */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${bg} dark:${bg.replace('bg-', 'bg-').replace('-100', '-900/20')} border-2 border-white dark:border-gray-800 shadow-sm`}>
                    <IconComponent className={`h-3.5 w-3.5 ${color} dark:${color.replace('text-', 'text-').replace('-600', '-400')}`} />
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* User info */}
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-medium">
                              {activity.user.name?.charAt(0) || activity.user.email.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {activity.user.name || activity.user.email.split('@')[0]}
                          </span>
                        </div>

                        {/* Activity description */}
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {activity.description}
                        </div>

                        {/* Value changes (for field updates) */}
                        {activity.oldValue && activity.newValue && activity.actionType !== 'CREATED' && (
                          <ActivityValueChange 
                            activity={activity}
                            statusLabels={statusLabels}
                          />
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex-shrink-0 ml-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}