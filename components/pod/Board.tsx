'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { Session } from 'next-auth';
import { 
  MoreHorizontal, 
  Plus, 
  User, 
  UserPlus,
  Calendar, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Trash2,
  Edit3,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X
} from 'lucide-react';
import { useSocketTasks } from '@/hooks/useSocketTasks';
import UserDropdown from '@/components/UserDropdown';
import FileUpload from '@/components/ui/FileUpload';
import AttachmentViewer from '@/components/ui/AttachmentViewer';
import { useBoardStore, useBoardTasks, useBoardFilters, useBoardTaskActions, type Task } from '@/lib/stores/boardStore';
// import { UserSearchInput } from '@/components/UserSearchInput';

// Task types are now imported from the boardStore

// Utility function to make links clickable
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface TeamOption {
row: number;
name: string;
label: string;
}

interface BoardProps {
teamId: string;
teamName: string;
session: Session | null;
availableTeams: TeamOption[];
onTeamChange: (teamRow: number) => void;
selectedRow: number;
}

const statusConfig = {
  NOT_STARTED: {
    label: 'Not Started',
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    headerColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gray-600 hover:bg-gray-700'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Play,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    headerColor: 'bg-blue-50 border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-700 border-green-200',
    headerColor: 'bg-green-50 border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
    headerColor: 'bg-red-50 border-red-200',
    buttonColor: 'bg-red-600 hover:bg-red-700'
  }
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: 'High', color: 'bg-red-100 text-red-700' },
  URGENT: { label: 'Urgent', color: 'bg-red-500 text-white' }
};

// Skeleton loading component - Memoized to prevent unnecessary re-renders
const TaskSkeleton = React.memo(() => (
  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-1 mb-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
      </div>
      
      {/* Meta skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-16"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
      </div>
      
      {/* Assignment skeleton */}
      <div className="space-y-1">
        <div className="flex items-center">
          <div className="h-3 w-3 bg-gray-200 dark:bg-gray-600 rounded mr-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 bg-gray-200 dark:bg-gray-600 rounded mr-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
));

const ColumnHeaderSkeleton = () => (
  <div className="p-4 bg-gray-50 dark:bg-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded mr-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        <div className="ml-2 h-5 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
      </div>
      <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);

export default function Board({ teamId, teamName, session, availableTeams, onTeamChange, selectedRow }: BoardProps) {
  // Zustand store hooks
  const { tasks, isLoading, error, currentTeamId, fetchTasks, setCurrentTeamId } = useBoardTasks();
  const { 
    searchTerm, priorityFilter, assigneeFilter, dueDateFilter, sortBy, sortOrder, showFilters,
    setSearchTerm, setPriorityFilter, setAssigneeFilter, setDueDateFilter, setSortBy, setSortOrder, setShowFilters
  } = useBoardFilters();
  const { createTask, updateTaskStatus, updateTask, deleteTask } = useBoardTaskActions();
  
  // UI State from store
  const draggedTask = useBoardStore(state => state.draggedTask);
  const showNewTaskForm = useBoardStore(state => state.showNewTaskForm);
  const showNewTaskModal = useBoardStore(state => state.showNewTaskModal);
  const newTaskStatus = useBoardStore(state => state.newTaskStatus);
  const newTaskData = useBoardStore(state => {
    console.log('newTaskData selector called, current value:', state.newTaskData);
    return state.newTaskData;
  });
  const isCreatingTask = useBoardStore(state => state.isCreatingTask);
  const selectedTask = useBoardStore(state => state.selectedTask);
  const isEditingTask = useBoardStore(state => state.isEditingTask);
  const editingTaskData = useBoardStore(state => state.editingTaskData);
  
  // UI State setters from store
  const setDraggedTask = useBoardStore(state => state.setDraggedTask);
  const setShowNewTaskForm = useBoardStore(state => state.setShowNewTaskForm);
  const setShowNewTaskModal = useBoardStore(state => state.setShowNewTaskModal);
  const setNewTaskStatus = useBoardStore(state => state.setNewTaskStatus);
  const setNewTaskData = useBoardStore(state => {
    console.log('setNewTaskData function retrieved from store');
    return state.setNewTaskData;
  });
  const setSelectedTask = useBoardStore(state => state.setSelectedTask);
  const setIsEditingTask = useBoardStore(state => state.setIsEditingTask);
  const setEditingTaskData = useBoardStore(state => state.setEditingTaskData);

  // Local state for minimum skeleton display time
  const [showMinimumSkeleton, setShowMinimumSkeleton] = useState(false);

  // Effect to ensure skeleton shows for minimum time
  useEffect(() => {
    if (isLoading && tasks.length === 0) {
      setShowMinimumSkeleton(true);
      // Ensure skeleton shows for at least 300ms
      const timer = setTimeout(() => {
        if (!isLoading || tasks.length > 0) {
          setShowMinimumSkeleton(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Only hide skeleton if we're not loading anymore
      if (!isLoading) {
        setShowMinimumSkeleton(false);
      }
    }
  }, [isLoading, tasks.length]);

  // Consolidated team initialization and data fetching
  useEffect(() => {
    if (teamId !== currentTeamId) {
      setCurrentTeamId(teamId);
    }
    // Always fetch tasks when teamId changes, but use debouncing to prevent rapid calls
    const timeoutId = setTimeout(() => {
      fetchTasks(teamId);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [teamId, currentTeamId, setCurrentTeamId, fetchTasks]);

  // Real-time task updates with debouncing to prevent rapid updates
  const { broadcastTaskUpdate } = useSocketTasks({
    teamId: currentTeamId,
    onTaskUpdate: useCallback((update) => {
      console.log('Board received task update:', update);
      
      // Debounce the fetch to prevent rapid loading states
      const timeoutId = setTimeout(() => {
        if (update.type === 'TASK_UPDATED' || update.type === 'TASK_CREATED' || update.type === 'TASK_DELETED') {
          console.log('Refreshing tasks due to socket update:', update.type);
          fetchTasks(currentTeamId, true);
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }, [currentTeamId, fetchTasks])
  });

  // fetchTasks is now provided by the useBoardTasks hook

  // Handle team change with immediate UI update
  const handleTeamChange = (newTeamRow: number) => {
    const newTeamId = `team-${newTeamRow}`;
    
    // Update store with new team ID (this will clear tasks and UI state)
    setCurrentTeamId(newTeamId);
    setShowNewTaskForm(null); // Close any open forms
    
    // Update parent component
    onTeamChange(newTeamRow);
    
    // Fetch new data will be handled by the useEffect above
  };

  // updateTaskStatus is now provided by useBoardTaskActions hook and includes socket broadcasting

  // Wrapper function to use store's createTask with socket broadcasting
  const handleCreateTask = async (status: Task['status']) => {
    if (!newTaskData.title.trim()) return;

    try {
      // Use store's createTask function
      await createTask(newTaskData, status);
      
      // Broadcast the new task to other users - the store handles the API call
      // We'll fetch tasks to get the updated list which includes the new task
      await fetchTasks(currentTeamId, true);
      
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Wrapper function to use store's deleteTask with socket broadcasting
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      // Use store's deleteTask function
      await deleteTask(taskId);
      
      // Broadcast the task deletion to other users
      await broadcastTaskUpdate({
        type: 'TASK_DELETED',
        taskId: taskId
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Task detail and editing functions
  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setEditingTaskData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo || '',
      attachments: task.attachments || []
    });
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setIsEditingTask(false);
    setEditingTaskData({});
  };

  const startEditingTask = () => {
    setIsEditingTask(true);
  };

  const cancelEditingTask = () => {
    setIsEditingTask(false);
    if (selectedTask) {
      setEditingTaskData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '',
        assignedTo: selectedTask.assignedTo || '',
        attachments: selectedTask.attachments || []
      });
    }
  };

  // Function to auto-save attachments immediately
  const autoSaveAttachments = async (newAttachments: any[]) => {
    if (!selectedTask) return;

    console.log('Auto-saving attachments:', newAttachments);
    console.log('Selected task ID:', selectedTask.id);

    try {
      await updateTask(selectedTask.id, { attachments: newAttachments });
      
      // Update the selectedTask to reflect the new attachments
      setSelectedTask({
        ...selectedTask,
        attachments: newAttachments
      });
      
      console.log('Successfully auto-saved attachments');
    } catch (error) {
      console.error('Error auto-saving attachments:', error);
    }
  };

  const saveTaskChanges = async () => {
    if (!selectedTask) return;

    try {
      // Prepare update data
      const updates = {
        title: editingTaskData.title,
        description: editingTaskData.description,
        priority: editingTaskData.priority,
        dueDate: editingTaskData.dueDate ? new Date(editingTaskData.dueDate).toISOString() : null,
        assignedTo: editingTaskData.assignedTo || null,
        attachments: editingTaskData.attachments || [],
      };

      // Use store's updateTask function
      await updateTask(selectedTask.id, updates);
      
      // Broadcast the update to other users
      await broadcastTaskUpdate({
        type: 'TASK_UPDATED',
        taskId: selectedTask.id,
        data: { ...selectedTask, ...updates }
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // New task modal functions
  const openNewTaskModal = (status: string) => {
    console.log('Opening new task modal, current state:', { 
      status, 
      newTaskData,
      showNewTaskModal 
    });
    setNewTaskStatus(status as Task['status']);
    // Don't reset newTaskData - preserve any existing input
    setShowNewTaskModal(true);
    console.log('After setting modal state');
  };

  const closeNewTaskModal = () => {
    setShowNewTaskModal(false);
    setNewTaskStatus(null);
    setNewTaskData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignedTo: '',
      dueDate: ''
    });
  };

  const createTaskFromModal = async () => {
    if (!newTaskData.title.trim() || !newTaskStatus) return;

    try {
      // Use store's createTask function
      await createTask(newTaskData, newTaskStatus);
      
      // Broadcast the new task to other users - the store handles the API call
      // We'll fetch tasks to get the updated list which includes the new task
      await fetchTasks(currentTeamId, true);
        
      // Close modal
      closeNewTaskModal();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const canMoveTask = (task: Task) => {
    if (!session?.user) return false;
    
    // Admin can move any task
    if (session.user.role === 'ADMIN') return true;
    
    // Task creator can move their own tasks
    if (task.createdById === session.user.id) return true;
    
    // Assigned user can move their assigned tasks
    // Check both assignedTo (could be email or ID) and assignedUser.id
    if (task.assignedTo === session.user.id || 
        task.assignedTo === session.user.email ||
        task.assignedUser?.id === session.user.id ||
        task.assignedUser?.email === session.user.email) {
      return true;
    }
    
    return false;
  };

  const canEditTask = (task: Task) => {
    if (!session?.user) return false;
    
    // Admin can edit any task
    if (session.user.role === 'ADMIN') return true;
    
    // Assigned user can edit their assigned tasks
    // Check both assignedTo (could be email or ID) and assignedUser.id
    if (task.assignedTo === session.user.id || 
        task.assignedTo === session.user.email ||
        task.assignedUser?.id === session.user.id ||
        task.assignedUser?.email === session.user.email) {
      return true;
    }
    
    return false;
  };

  const updateTaskStatusInModal = async (newStatus: Task['status']) => {
    if (!selectedTask) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedTask.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const result = await response.json();
      
      if (result.success && result.task) {
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id ? result.task : task
          )
        );
        
        // Update selected task
        setSelectedTask(result.task);
        
        // Broadcast the update to other users
        await broadcastTaskUpdate({
          type: 'TASK_UPDATED',
          taskId: selectedTask.id,
          data: result.task
        });
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canMoveTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    // Add visual feedback to the drag element
    e.dataTransfer.effectAllowed = 'move';
    if (e.target instanceof HTMLElement) {
      e.target.style.transform = 'rotate(3deg) scale(1.05)';
      e.target.style.zIndex = '50';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.transform = '';
      e.target.style.zIndex = '';
    }
    // Add small delay before clearing dragged task to prevent flicker
    setTimeout(() => {
      setDraggedTask(null);
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      return;
    }

    // Provide immediate visual feedback before API call
    updateTaskStatus(draggedTask.id, newStatus);
  };

  const getTasksForStatus = (status: Task['status']) => {
    return filteredAndSortedTasks.filter(task => task.status === status);
  };

  // Filter and sort functions
  const filterTasks = (tasksToFilter: Task[]) => {
    return tasksToFilter.filter(task => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.assignedUser?.name?.toLowerCase().includes(searchLower) ||
          task.assignedUser?.email?.toLowerCase().includes(searchLower) ||
          task.createdBy.name?.toLowerCase().includes(searchLower) ||
          task.createdBy.email?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter === 'ASSIGNED' && !task.assignedTo) {
        return false;
      }
      if (assigneeFilter === 'UNASSIGNED' && task.assignedTo) {
        return false;
      }
      if (assigneeFilter === 'MY_TASKS' && task.assignedTo !== session?.user?.email) {
        return false;
      }

      // Due date filter
      if (dueDateFilter !== 'ALL' && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);

        switch (dueDateFilter) {
          case 'OVERDUE':
            if (dueDate >= today) return false;
            break;
          case 'TODAY':
            if (dueDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'WEEK':
            if (dueDate > weekFromNow) return false;
            break;
        }
      } else if (dueDateFilter !== 'ALL' && !task.dueDate) {
        return false;
      }

      return true;
    });
  };

  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  if (showMinimumSkeleton || (isLoading && tasks.length === 0)) {
    return (
      <div className="space-y-6">
        {/* Board Header with Team Selection - Mobile Responsive Loading */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/30 dark:border-gray-700/30 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex flex-col">
                <div className="flex items-center space-x-3 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Task Board
                  </h2>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Loading
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{teamName}</span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                    <span className="text-blue-600 dark:text-blue-400">Loading tasks...</span>
                  </div>
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
                    onChange={(e) => handleTeamChange(Number(e.target.value))}
                    className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors appearance-none pr-6 min-w-0 flex-1"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1rem 1rem'
                    }}
                  >
                    {availableTeams.map((team) => (
                      <option key={team.row} value={team.row} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls - Simplified during loading */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm font-medium">Loading board data...</span>
            </div>
          </div>
        </div>

        {/* Board with Skeleton Content - Only task content is skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Column Headers - Always visible with real data */}
          <div className="grid grid-cols-4 border-b-2 border-gray-200 dark:border-gray-600">
            {Object.entries(statusConfig).map(([status, config], index) => {
              const IconComponent = config.icon;
              return (
                <div
                  key={status}
                  className={`p-4 ${config.headerColor} dark:bg-gray-700 ${
                    index < 3 ? 'border-r-2 border-gray-200 dark:border-gray-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {config.label}
                      </h3>
                      <span className="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-gray-400 rounded animate-pulse"></div>
                      </span>
                    </div>
                    <button
                      disabled
                      className={`${config.buttonColor} text-white p-1 rounded-md opacity-50 cursor-not-allowed`}
                      title="Loading..."
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Column Content - Only this part shows skeleton loading */}
          <div className="grid grid-cols-4 min-h-[600px]">
            {Object.entries(statusConfig).map(([status, config], index) => (
              <div
                key={status}
                className={`p-4 ${
                  index < 3 ? 'border-r-2 border-gray-200 dark:border-gray-600' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Skeleton Tasks - Fixed count for stable loading */}
                  {Array.from({ length: 2 }).map((_, taskIndex) => (
                    <TaskSkeleton key={`${status}-skeleton-${taskIndex}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Header with Team Selection - Mobile Responsive */}
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
                <span>{filteredAndSortedTasks.length} of {tasks.length} tasks</span>
                {isLoading && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center space-x-1">
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                      <span className="text-blue-600 dark:text-blue-400">Syncing</span>
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
                  onChange={(e) => handleTeamChange(Number(e.target.value))}
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors appearance-none pr-6 min-w-0 flex-1"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1rem 1rem'
                  }}
                >
                  {availableTeams.map((team) => (
                    <option key={team.row} value={team.row} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>Drag to reorder</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls - Mobile Responsive */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 space-y-4">
        {/* Search Bar and Filter Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Filter Toggle and Clear */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick My Tasks Filter */}
            <button
              onClick={() => setAssigneeFilter(assigneeFilter === 'MY_TASKS' ? 'ALL' : 'MY_TASKS')}
              className={`flex items-center space-x-1 px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                assigneeFilter === 'MY_TASKS'
                  ? 'border-pink-500 text-pink-700 bg-pink-50 dark:border-pink-400 dark:text-pink-300 dark:bg-pink-900/30'
                  : 'border-gray-200 text-gray-700 bg-white dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">My Tasks</span>
            </button>

            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              {filteredAndSortedTasks.length} of {tasks.length} tasks
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                showFilters || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || dueDateFilter !== 'ALL'
                  ? 'border-pink-500 text-pink-700 bg-pink-50 dark:border-pink-400 dark:text-pink-300 dark:bg-pink-900/30'
                  : 'border-gray-200 text-gray-700 bg-white dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {(priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || dueDateFilter !== 'ALL') && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full">
                  <span className="sm:hidden">!</span>
                  <span className="hidden sm:inline">Active</span>
                </span>
              )}
            </button>
            {(searchTerm || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || dueDateFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPriorityFilter('ALL');
                  setAssigneeFilter('ALL');
                  setDueDateFilter('ALL');
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="sm:hidden">Clear</span>
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assignment
                </label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                >
                  <option value="ALL">All Tasks</option>
                  <option value="MY_TASKS">My Tasks</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNASSIGNED">Unassigned</option>
                </select>
              </div>

              {/* Due Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <select
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                >
                  <option value="ALL">All Dates</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="TODAY">Due Today</option>
                  <option value="WEEK">Due This Week</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Responsive Kanban Board */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {/* Mobile Column Navigation - Only visible on mobile */}
        <div className="md:hidden border-b border-gray-200 dark:border-gray-600">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {Object.entries(statusConfig).map(([status, config]) => {
              const statusTasks = getTasksForStatus(status as Task['status']);
              const IconComponent = config.icon;
              return (
                <button
                  key={status}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    status === 'NOT_STARTED' // Default selected for demo
                      ? `${config.headerColor} border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100`
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{config.label}</span>
                  <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Column Headers - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-4 border-b-2 border-gray-200 dark:border-gray-600">
          {Object.entries(statusConfig).map(([status, config], index) => {
            const statusTasks = getTasksForStatus(status as Task['status']);
            const IconComponent = config.icon;

            return (
              <div
                key={status}
                className={`p-4 ${config.headerColor} dark:bg-gray-700 ${
                  index < 3 ? 'border-r-2 border-gray-200 dark:border-gray-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {config.label}
                    </h3>
                    <span className="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                      {statusTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNewTaskModal(status)}
                    className={`${config.buttonColor} text-white p-1 rounded-md transition-colors hover:scale-105`}
                    title="Add new task"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* New Task Form */}
                {showNewTaskForm === status && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newTaskData.title}
                      onChange={(e) => setNewTaskData({ title: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      autoFocus
                    />
                    <textarea
                      placeholder="Description (optional)..."
                      value={newTaskData.description}
                      onChange={(e) => setNewTaskData({ description: e.target.value })}
                      className="w-full p-2 mt-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={2}
                    />
                    <UserDropdown
                      value={newTaskData.assignedTo}
                      onChange={(email) => setNewTaskData({ assignedTo: email })}
                      placeholder="Search and select user..."
                      className=""
                    />
                    <div className="flex items-center justify-between mt-3">
                      <select
                        value={newTaskData.priority}
                        onChange={(e) => setNewTaskData({ priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                        className="text-xs border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="URGENT">Urgent Priority</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowNewTaskForm(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          disabled={isCreatingTask}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateTask(status as Task['status'])}
                          disabled={!newTaskData.title.trim() || isCreatingTask}
                          className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreatingTask ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Horizontal Scrolling Columns, Desktop: Grid Layout */}
        <div className="md:hidden">
          {/* Mobile Horizontal Scrolling Layout */}
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 min-h-[600px]">
            {Object.entries(statusConfig).map(([status, config], index) => {
              const statusTasks = getTasksForStatus(status as Task['status']);

              return (
                <div
                  key={status}
                  className={`flex-shrink-0 w-80 p-4 border-r border-gray-200 dark:border-gray-600 last:border-r-0 transition-colors duration-300 ${
                    draggedTask && draggedTask.status !== status 
                      ? 'bg-pink-50/30 dark:bg-pink-900/10' 
                      : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status as Task['status'])}
                >
                  {/* Mobile Column Header */}
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 -m-2 rounded-lg">
                    <div className="flex items-center">
                      <config.icon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {config.label}
                      </h3>
                      <span className="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                        {statusTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openNewTaskModal(status)}
                      className={`${config.buttonColor} text-white p-2 rounded-md transition-colors hover:scale-105`}
                      title="Add new task"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Task List */}
                  <div className="space-y-3">
                    {statusTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={canMoveTask(task)}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openTaskDetail(task)}
                        className={`bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow transition-transform duration-150 ${
                          canMoveTask(task) ? 'cursor-move hover:scale-[1.02]' : 'cursor-pointer'
                        } ${draggedTask?.id === task.id ? 'opacity-50 scale-95 transition-opacity duration-100' : ''} ${
                          draggedTask && draggedTask.id !== task.id ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                        } touch-manipulation`}
                      >
                        {/* Task content remains the same */}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 flex-1 mr-2">
                            {task.title}
                          </h4>
                          <MoreHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Attachment Count */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex items-center gap-1 mb-3">
                            <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {task.attachments.length} attachment{task.attachments.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[task.priority].color}`}>
                            {priorityConfig[task.priority].label}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              Created by: {task.createdBy.name || task.createdBy.email}
                            </span>
                          </div>
                          {task.assignedUser ? (
                            <div className="flex items-center">
                              <UserPlus className="h-3 w-3 mr-1" />
                              <span className="truncate">
                                Assigned: {task.assignedUser.name || task.assignedUser.email}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <UserPlus className="h-3 w-3 mr-1" />
                              <span>Unassigned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty state for mobile */}
                    {statusTasks.length === 0 && !isLoading && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                          <config.icon className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium mb-1">No {config.label.toLowerCase()} tasks</p>
                        <p className="text-xs text-center">Tasks will appear here when created</p>
                      </div>
                    )}

                    {/* Loading skeletons for mobile */}
                    {statusTasks.length === 0 && (showMinimumSkeleton || isLoading) && (
                      <>
                        <TaskSkeleton />
                        <TaskSkeleton />
                      </>
                    )}

                    {/* Drop zone indicator for mobile */}
                    {draggedTask && draggedTask.status !== status && (
                      <div className="border-2 border-dashed border-pink-300 dark:border-pink-600 rounded-lg p-4 text-center text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/20">
                        <div className="text-sm font-medium">Drop here to move to {config.label}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Grid Layout */}
        <div className="hidden md:grid md:grid-cols-4 min-h-[600px]">
          {Object.entries(statusConfig).map(([status, config], index) => {
            const statusTasks = getTasksForStatus(status as Task['status']);

            return (
              <div
                key={status}
                className={`p-4 ${
                  index < 3 ? 'border-r-2 border-gray-200 dark:border-gray-600' : ''
                } transition-colors duration-300 ${
                  draggedTask && draggedTask.status !== status 
                    ? 'bg-pink-50/30 dark:bg-pink-900/10 border-pink-200 dark:border-pink-500' 
                    : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status as Task['status'])}
              >
                {/* Task List */}
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={canMoveTask(task)}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openTaskDetail(task)}
                      className={`bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow transition-transform duration-150 ${
                        canMoveTask(task) ? 'cursor-move hover:scale-[1.02]' : 'cursor-pointer'
                      } ${draggedTask?.id === task.id ? 'opacity-50 scale-95 transition-opacity duration-100' : ''} ${
                        draggedTask && draggedTask.id !== task.id ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                      }`}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-1 ml-2">
                          {session?.user?.role === 'ADMIN' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Attachment Count */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {task.attachments.length} attachment{task.attachments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Task Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {/* Priority Badge */}
                          <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig[task.priority].color}`}>
                            {priorityConfig[task.priority].label}
                          </span>
                          
                          {/* Permission Indicator */}
                          {canMoveTask(task) && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Can Edit
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          {/* Due Date */}
                          {task.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assignment Information */}
                      <div className="mt-3 space-y-1">
                        {/* Assigned To */}
                        {task.assignedUser ? (
                          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                            <User className="h-3 w-3 mr-1" />
                            <span className="font-medium">Assigned to:</span>
                            <span className="ml-1">{task.assignedUser.name || task.assignedUser.email?.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </div>
                        ) : task.assignedTo ? (
                          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                            <User className="h-3 w-3 mr-1" />
                            <span className="font-medium">Assigned to:</span>
                            <span className="ml-1">{task.assignedTo.includes('@') ? task.assignedTo.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : task.assignedTo}</span>
                          </div>
                        ) : null}
                        
                        {/* Created By (Assigner) */}
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <UserPlus className="h-3 w-3 mr-1" />
                          <span className="font-medium">Created by:</span>
                          <span className="ml-1 mr-2">{task.createdBy.name || task.createdBy.email?.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span className="text-gray-400 dark:text-gray-500">
                            {formatDate(task.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Move Permission Indicator */}
                      {!canMoveTask(task) && (
                        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
                          Contact admin or assignee to move
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty State */}
                  {statusTasks.length === 0 && !isLoading && (
                    <div className="text-center py-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${config.color} flex items-center justify-center opacity-50`}>
                        <config.icon className="h-8 w-8" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        No tasks in {config.label.toLowerCase()}
                      </p>
                      <button
                        onClick={() => openNewTaskModal(status)}
                        className="text-xs text-pink-500 hover:text-pink-600 font-medium"
                      >
                        Add the first task
                      </button>
                    </div>
                  )}

                  {/* Skeleton Loading State - Only shown when loading tasks for team switch */}
                  {statusTasks.length === 0 && (showMinimumSkeleton || isLoading) && (
                    <div className="space-y-3">
                      {/* Show consistent skeleton tasks during loading */}
                      {Array.from({ length: 2 }).map((_, taskIndex) => (
                        <TaskSkeleton key={`loading-${status}-${taskIndex}`} />
                      ))}
                    </div>
                  )}

                  {/* Drop Zone Indicator */}
                  {draggedTask && draggedTask.status !== status && (
                    <div className="border-2 border-dashed border-pink-300 dark:border-pink-500 rounded-lg p-6 text-center bg-pink-50/50 dark:bg-pink-900/20">
                      <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">
                        Drop here to move to {config.label}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-4xl border border-white/20 dark:border-gray-700/50 my-4 sm:my-8">
            {/* Modal Header */}
            <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[selectedTask.status].color.split(' ')[0]}`}></div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                      {selectedTask.teamName} • {statusConfig[selectedTask.status].label}
                    </span>
                  </div>
                  {isEditingTask ? (
                    <input
                      type="text"
                      value={editingTaskData.title || ''}
                      onChange={(e) => setEditingTaskData({ title: e.target.value })}
                      className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                      placeholder="Task title..."
                    />
                  ) : (
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight pr-4">
                      {selectedTask.title}
                    </h3>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-6 flex-shrink-0">
                  {!isEditingTask ? (
                    <>
                      {canEditTask(selectedTask) && (
                        <button
                          onClick={startEditingTask}
                          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )}
                      {!canEditTask(selectedTask) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2 sm:px-4 py-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg">
                          <span className="hidden sm:inline">View Only</span>
                          <span className="sm:hidden">View</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEditingTask}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <span className="hidden sm:inline">Cancel</span>
                        <span className="sm:hidden">✕</span>
                      </button>
                      <button
                        onClick={saveTaskChanges}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                      >
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden">Save</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={closeTaskDetail}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content - Mobile Responsive */}
            <div className="flex flex-col lg:flex-row">
              {/* Main Content - Mobile Responsive */}
              <div className="flex-1 p-4 sm:p-8">
                {isEditingTask ? (
                  <div className="space-y-6">
                    {/* Edit Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Description
                      </label>
                      <textarea
                        value={editingTaskData.description || ''}
                        onChange={(e) => setEditingTaskData({ description: e.target.value })}
                        rows={4}
                        placeholder="Add a description..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Attachments
                      </label>
                      <FileUpload
                        attachments={editingTaskData.attachments || []}
                        onAttachmentsChange={(attachments) => {
                          console.log('FileUpload onAttachmentsChange called with:', attachments);
                          setEditingTaskData({ attachments });
                          // Auto-save attachments immediately
                          autoSaveAttachments(attachments);
                        }}
                        maxFiles={5}
                        maxFileSize={10}
                        className="mb-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Edit Priority */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Priority
                        </label>
                        <select
                          value={editingTaskData.priority || 'MEDIUM'}
                          onChange={(e) => setEditingTaskData({ priority: e.target.value as Task['priority'] })}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        >
                          <option value="LOW">🟢 Low</option>
                          <option value="MEDIUM">🟡 Medium</option>
                          <option value="HIGH">🔴 High</option>
                          <option value="URGENT">🚨 Urgent</option>
                        </select>
                      </div>

                      {/* Edit Due Date */}
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Due Date
                          </label>
                          <input
                            type="checkbox"
                            id="has-due-date-edit"
                            checked={!!editingTaskData.dueDate}
                            onChange={(e) => {
                              if (!e.target.checked) {
                                setEditingTaskData({ dueDate: '' });
                              } else {
                                // Set to today's date as default when enabled
                                const today = new Date().toISOString().split('T')[0];
                                setEditingTaskData({ dueDate: today });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="has-due-date-edit" className="text-sm text-gray-700 dark:text-gray-300">
                            Set due date
                          </label>
                        </div>
                        {editingTaskData.dueDate ? (
                          <input
                            type="date"
                            value={editingTaskData.dueDate || ''}
                            onChange={(e) => setEditingTaskData({ dueDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                          />
                        ) : (
                          <div className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm italic">
                            No deadline set
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edit Assignee */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Assignee
                      </label>
                      <UserDropdown
                        value={editingTaskData.assignedTo || ''}
                        onChange={(email) => setEditingTaskData({ assignedTo: email })}
                        placeholder="Search and select user..."
                        className=""
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                        Description
                      </h4>
                      {selectedTask.description ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {linkifyText(selectedTask.description)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 italic">
                          No description provided
                        </p>
                      )}
                    </div>

                    {/* Attachments */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                        Attachments
                      </h4>
                      {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                        <AttachmentViewer
                          attachments={selectedTask.attachments}
                          showTitle={false}
                          compact={false}
                        />
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 italic">
                          No attachments
                        </p>
                      )}
                    </div>

                    {/* Activity Section (Placeholder) */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                        Activity
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {selectedTask.createdBy.name?.charAt(0) || selectedTask.createdBy.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {selectedTask.createdBy.name || selectedTask.createdBy.email}
                              </span>
                              {' '}created this task
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(selectedTask.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Mobile Responsive */}
              <div className="w-full lg:w-80 bg-gray-50/50 dark:bg-gray-800/30 border-t lg:border-t-0 lg:border-l border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Status - Interactive for authorized users */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Status
                    </label>
                    {canEditTask(selectedTask) ? (
                      <select
                        value={selectedTask.status}
                        onChange={(e) => updateTaskStatusInModal(e.target.value as Task['status'])}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <option key={status} value={status}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {React.createElement(statusConfig[selectedTask.status].icon, { 
                          className: "h-4 w-4 text-gray-500" 
                        })}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {statusConfig[selectedTask.status].label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Priority
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {selectedTask.priority === 'HIGH' ? '🔴' : 
                         selectedTask.priority === 'MEDIUM' ? '🟡' : '🟢'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Assignee
                    </label>
                    {selectedTask.assignedUser ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">
                            {selectedTask.assignedUser.name?.charAt(0) || selectedTask.assignedUser.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {selectedTask.assignedUser.name || selectedTask.assignedUser.email?.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {selectedTask.assignedUser.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Unassigned
                      </p>
                    )}
                  </div>

                  {/* Due Date */}
                  {selectedTask.dueDate && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Due Date
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Created */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Created
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {new Date(selectedTask.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">
                            {selectedTask.createdBy.name?.charAt(0) || selectedTask.createdBy.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {selectedTask.createdBy.name || selectedTask.createdBy.email?.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Last Updated
                    </label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {new Date(selectedTask.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Permissions
                    </label>
                    <div className="space-y-2 text-xs">
                      {session?.user?.role === 'ADMIN' && (
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="truncate">Admin - Full Access</span>
                        </div>
                      )}
                      {canEditTask(selectedTask) && session?.user?.role !== 'ADMIN' && (
                        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="truncate">Assignee - Can Edit</span>
                        </div>
                      )}
                      {!canEditTask(selectedTask) && (
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                          <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                          <span className="truncate">View Only Access</span>
                        </div>
                      )}
                      {canMoveTask(selectedTask) && (
                        <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Can Move Between Columns</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal - Mobile Responsive */}
      {(() => {
        console.log('Modal render check:', { showNewTaskModal, newTaskStatus, newTaskData });
        return null;
      })()}
      {showNewTaskModal && newTaskStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-2xl border border-white/20 dark:border-gray-700/50 my-4 sm:my-8">
            {/* Modal Header - Mobile Responsive */}
            <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className={`w-3 h-3 rounded-full ${statusConfig[newTaskStatus].color.split(' ')[0]} flex-shrink-0`}></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Create New Task
                    </h3>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 block sm:inline">
                      in {statusConfig[newTaskStatus].label}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={closeNewTaskModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors flex-shrink-0 ml-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Mobile Responsive */}
            <div className="p-4 sm:p-8">
              <div className="space-y-6">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTaskData.title}
                    onChange={(e) => {
                      console.log('Modal title onChange:', e.target.value, 'Current newTaskData:', newTaskData);
                      setNewTaskData({ title: e.target.value });
                    }}
                    placeholder="Enter task title..."
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    autoFocus
                  />
                </div>

                {/* Task Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Description
                  </label>
                  <textarea
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData({ description: e.target.value })}
                    rows={3}
                    placeholder="Add a description..."
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Attachments
                  </label>
                  <FileUpload
                    attachments={newTaskData.attachments}
                    onAttachmentsChange={(attachments) => setNewTaskData({ attachments })}
                    maxFiles={5}
                    maxFileSize={10}
                    className="mb-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Priority
                    </label>
                    <select
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData({ priority: e.target.value as Task['priority'] })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    >
                      <option value="LOW">🟢 Low</option>
                      <option value="MEDIUM">🟡 Medium</option>
                      <option value="HIGH">🔴 High</option>
                      <option value="URGENT">🚨 Urgent</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Due Date
                      </label>
                      <input
                        type="checkbox"
                        id="has-due-date-new"
                        checked={!!newTaskData.dueDate}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setNewTaskData({ dueDate: '' });
                          } else {
                            // Set to today's date as default when enabled
                            const today = new Date().toISOString().split('T')[0];
                            setNewTaskData({ dueDate: today });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="has-due-date-new" className="text-sm text-gray-700 dark:text-gray-300">
                        Set due date
                      </label>
                    </div>
                    {newTaskData.dueDate ? (
                      <input
                        type="date"
                        value={newTaskData.dueDate}
                        onChange={(e) => setNewTaskData({ dueDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    ) : (
                      <div className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm italic">
                        No deadline set
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Assignee
                  </label>
                  <UserDropdown
                    value={newTaskData.assignedTo}
                    onChange={(email) => setNewTaskData({ assignedTo: email })}
                    placeholder="Search and select user..."
                    className=""
                  />
                </div>

                {/* Action Buttons - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                  <button
                    onClick={closeNewTaskModal}
                    disabled={isCreatingTask}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTaskFromModal}
                    disabled={!newTaskData.title.trim() || isCreatingTask}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 order-1 sm:order-2"
                  >
                    {isCreatingTask ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Create Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
