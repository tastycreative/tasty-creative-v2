import { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface TaskUpdate {
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED';
  taskId: string;
  teamId: string;
  data?: any;
}

interface UseTaskUpdatesProps {
  teamId: string;
  onTaskUpdate: (update: TaskUpdate) => void;
}

export function useTaskUpdates({ teamId, onTaskUpdate }: UseTaskUpdatesProps) {
  const { 
    isConnected, 
    connectionType, 
    subscribeToTaskUpdates, 
    unsubscribeFromTaskUpdates, 
    broadcastTaskUpdate 
  } = useNotifications();

  useEffect(() => {
    if (!teamId) return;

    // Subscribe to task updates for this team
    subscribeToTaskUpdates(teamId, onTaskUpdate);

    return () => {
      // Unsubscribe when component unmounts or teamId changes
      unsubscribeFromTaskUpdates(teamId);
    };
  }, [teamId, onTaskUpdate, subscribeToTaskUpdates, unsubscribeFromTaskUpdates]);

  return {
    isConnected,
    connectionType,
    broadcastTaskUpdate: (update: Omit<TaskUpdate, 'teamId'>) => broadcastTaskUpdate(update, teamId)
  };
}