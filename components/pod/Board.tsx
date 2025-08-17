'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
// import { UserSearchInput } from '@/components/UserSearchInput';

// Task types based on Prisma schema
interface Task {
id: string;
title: string;
description: string | null;
status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
priority: 'LOW' | 'MEDIUM' | 'HIGH';
dueDate: string | null;
teamId: string;
teamName: string;
assignedTo: string | null;
createdById: string;
createdAt: string;
updatedAt: string;
createdBy: {
id: string;
name: string | null;
email: string | null;
};
assignedUser?: {
id: string;
name: string | null;
email: string | null;
} | null;
}

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
  HIGH: { label: 'High', color: 'bg-red-100 text-red-700' }
};

// Skeleton loading component
const TaskSkeleton = () => (
  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 animate-pulse">
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
);

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(teamId);

  // Filter, Search, and Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'MY_TASKS'>('ALL');
  const [dueDateFilter, setDueDateFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'WEEK'>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState<Partial<Task>>({});

  // Real-time task updates
  const { broadcastTaskUpdate } = useSocketTasks({
    teamId: currentTeamId,
    onTaskUpdate: (update) => {
      console.log('Board received task update:', update);
      console.log('Current tasks before update:', tasks.length);
      
      // Handle real-time task updates
      if (update.type === 'TASK_UPDATED' && update.data) {
        console.log('Updating task:', update.taskId, 'with data:', update.data);
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.map(task => 
            task.id === update.taskId 
              ? { ...task, ...update.data }
              : task
          );
          console.log('Tasks after update:', updatedTasks.length);
          return updatedTasks;
        });
      } else if (update.type === 'TASK_CREATED' && update.data) {
        console.log('Adding new task:', update.data);
        setTasks(prevTasks => [...prevTasks, update.data]);
      } else if (update.type === 'TASK_DELETED') {
        console.log('Deleting task:', update.taskId);
        setTasks(prevTasks => prevTasks.filter(task => task.id !== update.taskId));
      }
    }
  });

  const fetchTasks = useCallback(async (targetTeamId: string) => {
    if (!targetTeamId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks?teamId=${targetTeamId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const result = await response.json();
      
      if (result.success && result.tasks) {
        setTasks(result.tasks);
      } else {
        setError('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle team change with immediate UI update
  const handleTeamChange = (newTeamRow: number) => {
    const newTeamId = `team-${newTeamRow}`;
    
    // Immediate visual update
    setCurrentTeamId(newTeamId);
    setTasks([]); // Clear current tasks immediately
    setError(null);
    setShowNewTaskForm(null); // Close any open forms
    
    // Update parent component
    onTeamChange(newTeamRow);
    
    // Fetch new data in background
    fetchTasks(newTeamId);
  };

  // Initial load and when teamId prop changes
  useEffect(() => {
    if (teamId !== currentTeamId) {
      setCurrentTeamId(teamId);
      fetchTasks(teamId);
    }
  }, [teamId, currentTeamId, fetchTasks]);

  // Initial load
  useEffect(() => {
    fetchTasks(currentTeamId);
  }, [fetchTasks, currentTeamId]);

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    // Find the task to get its current data
    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) return;

    // Optimistic update - update UI immediately
    const updatedTask = { ...currentTask, status: newStatus, updatedAt: new Date().toISOString() };
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? updatedTask : task
      )
    );

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const result = await response.json();
      
      if (result.success && result.task) {
        // Broadcast the update to other users
        await broadcastTaskUpdate({
          type: 'TASK_UPDATED',
          taskId: taskId,
          data: result.task
        });
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task status');
      // Revert optimistic update on error
      fetchTasks(currentTeamId);
    }
  };

  const createTask = async (status: Task['status']) => {
    if (!newTaskTitle.trim()) return;

    setIsCreatingTask(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          priority: newTaskPriority,
          assignedTo: newTaskAssignee.trim() || null,
          teamId: currentTeamId,
          teamName,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const result = await response.json();
      
      if (result.success && result.task) {
        // Add the new task to local state
        setTasks(prevTasks => [result.task, ...prevTasks]);
        
        // Broadcast the new task to other users
        await broadcastTaskUpdate({
          type: 'TASK_CREATED',
          taskId: result.task.id,
          data: result.task
        });
        
        // Reset form
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskPriority('MEDIUM');
        setNewTaskAssignee('');
        setShowNewTaskForm(null);
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      const result = await response.json();
      
      if (result.success) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        
        // Broadcast the task deletion to other users
        await broadcastTaskUpdate({
          type: 'TASK_DELETED',
          taskId: taskId
        });
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
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
      assignedTo: task.assignedTo || ''
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
        assignedTo: selectedTask.assignedTo || ''
      });
    }
  };

  const saveTaskChanges = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedTask.id,
          title: editingTaskData.title,
          description: editingTaskData.description,
          priority: editingTaskData.priority,
          dueDate: editingTaskData.dueDate ? new Date(editingTaskData.dueDate).toISOString() : null,
          assignedTo: editingTaskData.assignedTo || null,
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
        
        setSelectedTask(result.task);
        setIsEditingTask(false);
        
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
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const canMoveTask = (task: Task) => {
    if (!session?.user) return false;
    
    // Admin can move any task
    if (session.user.role === 'ADMIN') return true;
    
    // Task creator can move their own tasks
    if (task.createdById === session.user.id) return true;
    
    // Assigned user can move their assigned tasks
    if (task.assignedTo === session.user.id) return true;
    
    return false;
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
      e.target.style.transform = 'rotate(5deg)';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.transform = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    updateTaskStatus(draggedTask.id, newStatus);
    setDraggedTask(null);
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
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
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

  if (isLoading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        {/* Board Header Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg shadow-lg p-6 animate-pulse">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-10"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Board */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Column Headers Skeleton */}
          <div className="grid grid-cols-4 border-b-2 border-gray-200 dark:border-gray-600">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`${index < 3 ? 'border-r-2 border-gray-200 dark:border-gray-600' : ''}`}
              >
                <ColumnHeaderSkeleton />
              </div>
            ))}
          </div>

          {/* Column Content Skeleton */}
          <div className="grid grid-cols-4 min-h-[600px]">
            {[0, 1, 2, 3].map((columnIndex) => (
              <div
                key={columnIndex}
                className={`p-4 ${
                  columnIndex < 3 ? 'border-r-2 border-gray-200 dark:border-gray-600' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Show 2-3 skeleton tasks per column */}
                  {Array.from({ length: Math.floor(Math.random() * 2) + 2 }).map((_, taskIndex) => (
                    <TaskSkeleton key={taskIndex} />
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
      {/* Board Header with Team Selection */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Task Board
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {teamName} • {filteredAndSortedTasks.length} of {tasks.length} tasks
              </p>
            </div>
            
            {/* Team Selector */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Team:
              </label>
              <select
                value={selectedRow}
                onChange={(e) => handleTeamChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              >
                {availableTeams.map((team) => (
                  <option key={team.row} value={team.row}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                <span>Loading tasks...</span>
              </div>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Drag tasks to change status
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 space-y-4">
        {/* Search Bar and Filter Toggle */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, assignees, or descriptions..."
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
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
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
          <div className="flex items-center space-x-2">
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
              <span>My Tasks</span>
            </button>

            <span className="text-sm text-gray-500 dark:text-gray-400">
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
              <span>Filters</span>
              {(priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || dueDateFilter !== 'ALL') && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full">
                  Active
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
                Clear all
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

      {/* Unified Kanban Board */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {/* Column Headers */}
        <div className="grid grid-cols-4 border-b-2 border-gray-200 dark:border-gray-600">
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
                    onClick={() => setShowNewTaskForm(status)}
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
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      autoFocus
                    />
                    <textarea
                      placeholder="Description (optional)..."
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="w-full p-2 mt-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={2}
                    />
                    <input
                      type="email"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      placeholder="Assign to (enter email)..."
                      className="w-full px-3 py-2 mt-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                        className="text-xs border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
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
                          onClick={() => createTask(status as Task['status'])}
                          disabled={!newTaskTitle.trim() || isCreatingTask}
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

        {/* Column Content Area */}
        <div className={`grid grid-cols-4 min-h-[600px] transition-all duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
          {Object.entries(statusConfig).map(([status, config], index) => {
            const statusTasks = getTasksForStatus(status as Task['status']);

            return (
              <div
                key={status}
                className={`p-4 ${
                  index < 3 ? 'border-r-2 border-gray-200 dark:border-gray-600' : ''
                } transition-all duration-200 ${
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
                      className={`bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 ${
                        canMoveTask(task) ? 'cursor-move hover:scale-[1.02]' : 'cursor-pointer'
                      } ${draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''} ${
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
                                deleteTask(task.id);
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
                            <span className="ml-1">{task.assignedUser.name || task.assignedUser.email?.split('@')[0] || 'Unknown'}</span>
                          </div>
                        ) : task.assignedTo ? (
                          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                            <User className="h-3 w-3 mr-1" />
                            <span className="font-medium">Assigned to:</span>
                            <span className="ml-1">{task.assignedTo.includes('@') ? task.assignedTo.split('@')[0] : task.assignedTo}</span>
                          </div>
                        ) : null}
                        
                        {/* Created By (Assigner) */}
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <UserPlus className="h-3 w-3 mr-1" />
                          <span className="font-medium">Created by:</span>
                          <span className="ml-1 mr-2">{task.createdBy.name || task.createdBy.email?.split('@')[0] || 'Unknown'}</span>
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
                        onClick={() => setShowNewTaskForm(status)}
                        className="text-xs text-pink-500 hover:text-pink-600 font-medium"
                      >
                        Add the first task
                      </button>
                    </div>
                  )}

                  {/* Loading State for Team Switch */}
                  {statusTasks.length === 0 && isLoading && (
                    <div className="space-y-3">
                      {/* Show 1-2 skeleton tasks during team switch */}
                      {Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map((_, taskIndex) => (
                        <TaskSkeleton key={`loading-${taskIndex}`} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 dark:border-gray-700/50">
            {/* Modal Header */}
            <div className="relative px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[selectedTask.status].color.split(' ')[0]}`}></div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {selectedTask.teamName} • {statusConfig[selectedTask.status].label}
                    </span>
                  </div>
                  {isEditingTask ? (
                    <input
                      type="text"
                      value={editingTaskData.title || ''}
                      onChange={(e) => setEditingTaskData(prev => ({ ...prev, title: e.target.value }))}
                      className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                      placeholder="Task title..."
                    />
                  ) : (
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {selectedTask.title}
                    </h3>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 ml-6">
                  {!isEditingTask ? (
                    <button
                      onClick={startEditingTask}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEditingTask}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveTaskChanges}
                        className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                  <button
                    onClick={closeTaskDetail}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex max-h-[calc(90vh-120px)] overflow-hidden">
              {/* Main Content */}
              <div className="flex-1 p-8 overflow-y-auto">
                {isEditingTask ? (
                  <div className="space-y-6">
                    {/* Edit Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Description
                      </label>
                      <textarea
                        value={editingTaskData.description || ''}
                        onChange={(e) => setEditingTaskData(prev => ({ ...prev, description: e.target.value }))}
                        rows={6}
                        placeholder="Add a description..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
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
                          onChange={(e) => setEditingTaskData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        >
                          <option value="LOW">🟢 Low</option>
                          <option value="MEDIUM">🟡 Medium</option>
                          <option value="HIGH">🔴 High</option>
                        </select>
                      </div>

                      {/* Edit Due Date */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={editingTaskData.dueDate || ''}
                          onChange={(e) => setEditingTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Edit Assignee */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Assignee
                      </label>
                      <input
                        type="email"
                        value={editingTaskData.assignedTo || ''}
                        onChange={(e) => setEditingTaskData(prev => ({ ...prev, assignedTo: e.target.value }))}
                        placeholder="Enter email to assign..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
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
                            {selectedTask.description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 italic">
                          No description provided
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

              {/* Sidebar */}
              <div className="w-80 bg-gray-50/50 dark:bg-gray-800/30 border-l border-gray-200/50 dark:border-gray-700/50 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-3">
                      {React.createElement(statusConfig[selectedTask.status].icon, { 
                        className: "h-4 w-4 text-gray-500" 
                      })}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {statusConfig[selectedTask.status].label}
                      </span>
                    </div>
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
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {selectedTask.assignedUser.name?.charAt(0) || selectedTask.assignedUser.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {selectedTask.assignedUser.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
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
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
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
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {selectedTask.createdBy.name?.charAt(0) || selectedTask.createdBy.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {selectedTask.createdBy.name || 'Unknown'}
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
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
