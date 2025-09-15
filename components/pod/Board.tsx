'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Session } from 'next-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  AlertCircle
} from 'lucide-react';
import { useTaskUpdates } from '@/hooks/useTaskUpdates';
import { useBoardStore, useBoardTasks, useBoardFilters, useBoardTaskActions, useBoardColumns, type Task, type BoardColumn, type NewTaskData } from '@/lib/stores/boardStore';
import ColumnSettings from './ColumnSettings';
import BoardHeader from './BoardHeader';
import BoardFilters from './BoardFilters';
import BoardSkeleton from './BoardSkeleton';
import BoardGrid from './BoardGrid';
import TaskDetailModal from './TaskDetailModal';
import NewTaskModal from './NewTaskModal';

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
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    headerColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gray-600 hover:bg-gray-700'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    headerColor: 'bg-blue-50 border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    headerColor: 'bg-green-50 border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700 border-red-200',
    headerColor: 'bg-red-50 border-red-200',
    buttonColor: 'bg-red-600 hover:bg-red-700'
  }
};

export default function Board({ teamId, teamName, session, availableTeams, onTeamChange, selectedRow }: BoardProps) {
  // Navigation hooks
  const router = useRouter();
  const searchParams = useSearchParams();

  // Zustand store hooks
  const { tasks, isLoading, error, currentTeamId, fetchTasks, setCurrentTeamId } = useBoardTasks();
  const { 
    searchTerm, priorityFilter, assigneeFilter, dueDateFilter, sortBy, sortOrder, showFilters,
    setSearchTerm, setPriorityFilter, setAssigneeFilter, setDueDateFilter, setSortBy, setSortOrder, setShowFilters
  } = useBoardFilters();
  const { createTask, updateTaskStatus, updateTask, deleteTask } = useBoardTaskActions();
  const { 
    columns, isLoadingColumns, showColumnSettings, fetchColumns, setShowColumnSettings 
  } = useBoardColumns();
  
  // UI State from store
  const draggedTask = useBoardStore(state => state.draggedTask);
  const showNewTaskForm = useBoardStore(state => state.showNewTaskForm);
  const showNewTaskModal = useBoardStore(state => state.showNewTaskModal);
  const newTaskStatus = useBoardStore(state => state.newTaskStatus);
  const newTaskData = useBoardStore(state => state.newTaskData);
  const isCreatingTask = useBoardStore(state => state.isCreatingTask);
  const selectedTask = useBoardStore(state => state.selectedTask);
  const isEditingTask = useBoardStore(state => state.isEditingTask);
  const editingTaskData = useBoardStore(state => state.editingTaskData);
  
  // UI State setters from store
  const setDraggedTask = useBoardStore(state => state.setDraggedTask);
  const setShowNewTaskForm = useBoardStore(state => state.setShowNewTaskForm);
  const setShowNewTaskModal = useBoardStore(state => state.setShowNewTaskModal);
  const setNewTaskStatus = useBoardStore(state => state.setNewTaskStatus);
  const setNewTaskData = useBoardStore(state => state.setNewTaskData);
  const setSelectedTask = useBoardStore(state => state.setSelectedTask);
  const setIsEditingTask = useBoardStore(state => state.setIsEditingTask);
  const setEditingTaskData = useBoardStore(state => state.setEditingTaskData);

  // Local state for minimum skeleton display time
  const [showMinimumSkeleton, setShowMinimumSkeleton] = useState(false);

  // Effect to ensure skeleton shows for minimum time
  useEffect(() => {
    if (isLoading && tasks.length === 0) {
      setShowMinimumSkeleton(true);
      const timer = setTimeout(() => {
        if (!isLoading || tasks.length > 0) {
          setShowMinimumSkeleton(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
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
    const timeoutId = setTimeout(() => {
      fetchTasks(teamId);
      fetchColumns(teamId);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [teamId, currentTeamId, setCurrentTeamId, fetchTasks, fetchColumns]);

  // Handle URL parameter for task sharing - URL is the single source of truth
  useEffect(() => {
    const taskParam = searchParams?.get('task');
    
    if (taskParam && tasks.length > 0) {
      // URL has a task parameter - ensure task is selected
      const task = tasks.find(t => t.id === taskParam);
      if (task && (!selectedTask || selectedTask.id !== taskParam)) {
        setSelectedTask(task);
        setEditingTaskData({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          assignedTo: task.assignedTo || '',
          attachments: task.attachments || []
        });
      }
    } else if (!taskParam) {
      // No URL parameter - always clear the selection regardless of current state
      if (selectedTask !== null) {
        setSelectedTask(null);
      }
      if (isEditingTask) {
        setIsEditingTask(false);
      }
      setEditingTaskData({});
    }
  }, [searchParams, tasks]);

  // Synchronize scroll between header and body on desktop
  useEffect(() => {
    const headerScroll = document.getElementById('desktop-header-scroll');
    const bodyScroll = document.getElementById('desktop-body-scroll');
    
    if (!headerScroll || !bodyScroll) return;

    const syncScroll = (source: Element, target: Element) => {
      return () => {
        target.scrollLeft = source.scrollLeft;
      };
    };

    const headerToBody = syncScroll(headerScroll, bodyScroll);
    const bodyToHeader = syncScroll(bodyScroll, headerScroll);

    headerScroll.addEventListener('scroll', headerToBody);
    bodyScroll.addEventListener('scroll', bodyToHeader);

    return () => {
      headerScroll.removeEventListener('scroll', headerToBody);
      bodyScroll.removeEventListener('scroll', bodyToHeader);
    };
  }, [columns]);

  // Real-time task updates with debouncing
  const { broadcastTaskUpdate } = useTaskUpdates({
    teamId: currentTeamId,
    onTaskUpdate: useCallback((update: any) => {
      const timeoutId = setTimeout(() => {
        if (update.type === 'TASK_UPDATED' || update.type === 'TASK_CREATED' || update.type === 'TASK_DELETED') {
          fetchTasks(currentTeamId, true);
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }, [currentTeamId, fetchTasks])
  });

  // Initialize team from URL parameters on component mount
  useEffect(() => {
    const teamParam = searchParams?.get('team');
    if (teamParam && teamParam !== currentTeamId) {
      // Extract team row number from team-N format
      const teamRowMatch = teamParam.match(/^team-(\d+)$/);
      if (teamRowMatch) {
        const teamRow = parseInt(teamRowMatch[1]);
        // Only trigger if it's a valid team row and different from current
        if (teamRow >= 1 && teamRow <= availableTeams.length) {
          onTeamChange(teamRow);
        }
      }
    } else if (!teamParam && currentTeamId) {
      // If no team in URL but we have a current team, update the URL
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('team', currentTeamId);
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, currentTeamId, availableTeams.length, onTeamChange, router]);

  // Sync URL when teamId prop changes (handles initial load and external team changes)
  useEffect(() => {
    const teamParam = searchParams?.get('team');
    if (teamId && teamId !== teamParam) {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('team', teamId);
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [teamId, searchParams, router]);

  // Handle team change with immediate UI update
  const handleTeamChange = (newTeamRow: number) => {
    const newTeamId = `team-${newTeamRow}`;
    setCurrentTeamId(newTeamId);
    setShowNewTaskForm(null);
    onTeamChange(newTeamRow);
    
    // Update URL parameters to include team
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('team', newTeamId);
    router.push(`?${params.toString()}`);
  };

  // Task management functions
  const handleCreateTask = async (status: Task['status']) => {
    if (!newTaskData.title.trim()) return;

    try {
      await createTask(newTaskData, status);
      await fetchTasks(currentTeamId, true);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId);
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
    // Only update URL - the useEffect will handle state updates
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('task', task.id);
    router.push(`?${params.toString()}`);
  };

  const closeTaskDetail = () => {
    // Only update URL - the useEffect will handle state clearing
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('task');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl);
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

  const autoSaveAttachments = async (newAttachments: any[]) => {
    if (!selectedTask) return;

    try {
      await updateTask(selectedTask.id, { attachments: newAttachments });
      setSelectedTask({
        ...selectedTask,
        attachments: newAttachments
      });
    } catch (error) {
      console.error('Error auto-saving attachments:', error);
    }
  };

  const saveTaskChanges = async () => {
    if (!selectedTask) return;

    try {
      const updates = {
        title: editingTaskData.title,
        description: editingTaskData.description,
        priority: editingTaskData.priority,
        dueDate: editingTaskData.dueDate ? new Date(editingTaskData.dueDate).toISOString() : null,
        assignedTo: editingTaskData.assignedTo || null,
        attachments: editingTaskData.attachments || [],
      };

      await updateTask(selectedTask.id, updates);
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
    setNewTaskStatus(status as Task['status']);
    setShowNewTaskModal(true);
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
      await createTask(newTaskData, newTaskStatus);
      await fetchTasks(currentTeamId, true);
      closeNewTaskModal();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Permission functions
  const canMoveTask = (task: Task) => {
    if (!session?.user) return false;
    
    if (session.user.role === 'ADMIN') return true;
    if (task.createdById === session.user.id) return true;
    
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
    
    if (session.user.role === 'ADMIN') return true;
    
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
      await updateTaskStatus(selectedTask.id, newStatus);
      setSelectedTask({ ...selectedTask, status: newStatus });
      await broadcastTaskUpdate({
        type: 'TASK_UPDATED',
        taskId: selectedTask.id,
        data: { ...selectedTask, status: newStatus }
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canMoveTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
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
    setTimeout(() => {
      setDraggedTask(null);
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      return;
    }

    // Store the old status for notification purposes
    const oldStatus = draggedTask.status;

    // Update the task status first
    await updateTaskStatus(draggedTask.id, newStatus);

    // Send notifications to assigned members
    await sendColumnNotifications(draggedTask, oldStatus, newStatus);
  };

  // Function to send notifications to column members
  const sendColumnNotifications = async (task: Task, oldStatus: Task['status'], newStatus: Task['status']) => {
    try {
      // Find the target column to get assigned members
      const targetColumn = columns.find(column => column.status === newStatus);
      
      if (!targetColumn || !targetColumn.assignedMembers || targetColumn.assignedMembers.length === 0) {
        return;
      }

      // Get source column name for better logging
      const sourceColumn = columns.find(col => col.status === oldStatus);

      // Prepare notification data
      const notificationData = {
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description || '',
        assignedTo: task.assignedTo || 'Unassigned',
        priority: task.priority,
        oldColumn: sourceColumn?.label || oldStatus,
        newColumn: targetColumn.label,
        teamId: teamId,
        teamName: teamName,
        movedBy: session?.user?.name || 'Unknown User',
        movedById: session?.user?.id || '',
        assignedMembers: targetColumn.assignedMembers.map(assignment => ({
          userId: assignment.userId,
          userEmail: assignment.user.email,
          userName: assignment.user.name
        }))
      };

  // sending column movement notification payload

      // Send notifications via API
      const response = await fetch('/api/notifications/column-movement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to send column notifications:', errorData);
      }
    } catch (error) {
      console.error('❌ Error sending column notifications:', error);
    }
  };

  const getTasksForStatus = (status: Task['status']) => {
    return filteredAndSortedTasks.filter(task => task.status === status);
  };

  // Helper function to convert columns to statusConfig format
  const getColumnConfig = useMemo(() => {
    const columnConfig = () => {
      // If columns are still loading, return empty array to prevent using wrong status values
      if (isLoadingColumns) {
        return [];
      }
      
      if (columns.length === 0) {
        // Only use default config if explicitly no columns are configured
        console.log('Using default statusConfig, columns.length:', columns.length);
        return Object.entries(statusConfig);
      }
      
      return columns
        .sort((a, b) => a.position - b.position) // Ensure correct order
        .map(column => [
          column.status,
          {
            label: column.label,
            color: `text-gray-700 dark:text-gray-300`,
            headerColor: 'bg-gray-50 dark:bg-gray-700',
            buttonColor: `hover:bg-gray-700`
          }
        ] as [string, any]);
    };
    return columnConfig;
  }, [columns, isLoadingColumns]); // Dependency array ensures this updates when columns change

  // Helper function to get grid classes and styles based on column count
  const getGridClasses = () => {
    return 'grid-cols-none';
  };

  const getGridStyles = () => {
    const columnCount = columns.length || 4;
    return {
      gridTemplateColumns: `repeat(${columnCount}, minmax(300px, 1fr))`
    };
  };

  // Filter and sort functions
  const filterTasks = (tasksToFilter: Task[]) => {
    return tasksToFilter.filter(task => {
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

      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false;
      }

      if (assigneeFilter === 'ASSIGNED' && !task.assignedTo) {
        return false;
      }
      if (assigneeFilter === 'UNASSIGNED' && task.assignedTo) {
        return false;
      }
      if (assigneeFilter === 'MY_TASKS' && task.assignedTo !== session?.user?.email) {
        return false;
      }

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

  if (showMinimumSkeleton || (isLoading && tasks.length === 0) || isLoadingColumns) {
    return (
      <BoardSkeleton
        teamName={teamName}
        availableTeams={availableTeams}
        selectedRow={selectedRow}
        onTeamChange={handleTeamChange}
        getColumnConfig={getColumnConfig}
        getGridClasses={getGridClasses}
        getGridStyles={getGridStyles}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <BoardHeader
        teamName={teamName}
        availableTeams={availableTeams}
        selectedRow={selectedRow}
        onTeamChange={handleTeamChange}
        totalTasks={tasks.length}
        filteredTasksCount={filteredAndSortedTasks.length}
        isLoading={isLoading}
      />

      {/* Search, Filter, and Sort Controls */}
      <BoardFilters
        searchTerm={searchTerm}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        dueDateFilter={dueDateFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        showFilters={showFilters}
        filteredTasksCount={filteredAndSortedTasks.length}
        totalTasks={tasks.length}
        setSearchTerm={setSearchTerm}
        setPriorityFilter={setPriorityFilter}
        setAssigneeFilter={setAssigneeFilter}
        setDueDateFilter={setDueDateFilter}
        setSortBy={setSortBy}
        setSortOrder={setSortOrder}
        setShowFilters={setShowFilters}
        setShowColumnSettings={setShowColumnSettings}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-400">{error.message}</p>
          </div>
        </div>
      )}

      {/* Responsive Kanban Board */}
      <BoardGrid
        columns={columns}
        tasks={filteredAndSortedTasks}
        session={session}
        draggedTask={draggedTask}
        showNewTaskForm={showNewTaskForm}
        newTaskData={newTaskData}
        isLoading={isLoading}
        showMinimumSkeleton={showMinimumSkeleton}
        canMoveTask={canMoveTask}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTaskClick={openTaskDetail}
        onDeleteTask={handleDeleteTask}
        onOpenNewTaskModal={openNewTaskModal}
        onSetShowNewTaskForm={setShowNewTaskForm}
        onSetNewTaskData={setNewTaskData}
        onCreateTask={handleCreateTask}
        formatDate={formatDate}
        getColumnConfig={getColumnConfig}
        getTasksForStatus={getTasksForStatus}
        getGridClasses={getGridClasses}
        getGridStyles={getGridStyles}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          selectedTask={selectedTask}
          isEditingTask={isEditingTask}
          editingTaskData={editingTaskData}
          session={session}
          canEditTask={canEditTask}
          onClose={closeTaskDetail}
          onStartEditing={startEditingTask}
          onCancelEditing={cancelEditingTask}
          onSaveChanges={saveTaskChanges}
          onSetEditingTaskData={setEditingTaskData}
          onUpdateTaskStatus={updateTaskStatusInModal}
          onAutoSaveAttachments={autoSaveAttachments}
          getColumnConfig={getColumnConfig}
        />
      )}

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        newTaskStatus={newTaskStatus}
        newTaskData={newTaskData}
        isCreatingTask={isCreatingTask}
        columns={columns}
        onClose={closeNewTaskModal}
        onSetNewTaskData={setNewTaskData}
        onCreateTask={createTaskFromModal}
      />

      {/* Column Settings Modal */}
      <ColumnSettings currentTeamId={currentTeamId} />
    </div>
  );
}
