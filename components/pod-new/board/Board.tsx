'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Session } from 'next-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle
} from 'lucide-react';
import { useTaskUpdates } from '@/hooks/useTaskUpdates';
import { useBoardStore, useBoardTasks, useBoardFilters, useBoardTaskActions, useBoardColumns, type Task } from '@/lib/stores/boardStore';
import BoardHeader from './BoardHeader';
import BoardFilters from './BoardFilters';
import BoardSkeleton from './BoardSkeleton';
import BoardGrid from './BoardGrid';
import ColumnSettings from './ColumnSettings';
import ModularTaskDetailModal from './ModularTaskDetailModal';
import NewTaskModal from './NewTaskModal';

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
    columns, isLoadingColumns, fetchColumns, setShowColumnSettings
  } = useBoardColumns();


  // Team membership state
  const [teamMembers, setTeamMembers] = useState<Array<{id: string, email: string, name?: string}>>([]);
  const [teamAdmins, setTeamAdmins] = useState<Array<{id: string, email: string, name?: string}>>([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

  // UI State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Task['priority'],
    assignedTo: '',
    dueDate: '',
    attachments: []
  });
  const [isMobile, setIsMobile] = useState(false);

  // Auto-refresh hook
  useTaskUpdates(currentTeamId);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync team ID with store
  useEffect(() => {
    if (teamId && teamId !== currentTeamId) {
      console.log('🔄 Board: Setting current team ID:', teamId);
      setCurrentTeamId(teamId);
      fetchTasks(teamId);
      fetchColumns(teamId);
    }
  }, [teamId, currentTeamId, setCurrentTeamId, fetchTasks, fetchColumns]);

  // Fetch team members when team changes
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!teamId) return;

      setIsLoadingTeamMembers(true);
      try {
        const response = await fetch(`/api/pod/teams/${teamId}/members`);
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.members || []);
          setTeamAdmins(data.admins || []);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setIsLoadingTeamMembers(false);
      }
    };

    fetchTeamMembers();
  }, [teamId]);


  // Use columns from database (via board-columns API)
  const displayColumns = useMemo(() => {
    console.log('📋 Board: displayColumns updated, columns:', columns.length, columns);
    return columns;
  }, [columns]);

  // Task actions
  const canMoveTask = useCallback((task: Task) => {
    if (!session?.user) return false;
    return session.user.role === 'ADMIN' ||
           session.user.email === task.assignedTo ||
           session.user.id === task.createdById;
  }, [session]);

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    if (!canMoveTask(task)) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, [canMoveTask]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === status) return;

    try {
      await updateTaskStatus(draggedTask.id, status);
    } catch (error) {
      console.error('Error updating task status:', error);
    }

    setDraggedTask(null);
  }, [draggedTask, updateTaskStatus]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleCloseTaskModal = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [deleteTask]);

  const handleOpenNewTaskModal = useCallback((status?: string) => {
    if (status) {
      setNewTaskData(prev => ({ ...prev, title: '', description: '' }));
      setShowNewTaskForm(status);
    } else {
      setShowNewTaskModal(true);
    }
  }, []);

  const handleCreateTask = useCallback(async (status: Task['status']) => {
    if (!newTaskData.title.trim()) return;

    try {
      await createTask({
        ...newTaskData,
        title: newTaskData.title.trim(),
        description: newTaskData.description.trim(),
      }, teamId, teamName, status);

      setNewTaskData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignedTo: '',
        dueDate: '',
        attachments: []
      });
      setShowNewTaskForm(null);
      setShowNewTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }, [newTaskData, teamId, teamName, createTask]);

  // Date formatting
  const formatDate = useCallback((dateString: string | null): string | null => {
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
  }, []);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.assignedUser?.name?.toLowerCase().includes(search) ||
        task.assignedUser?.email?.toLowerCase().includes(search)
      );
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (assigneeFilter === 'ASSIGNED') {
      filtered = filtered.filter(task => task.assignedTo);
    } else if (assigneeFilter === 'UNASSIGNED') {
      filtered = filtered.filter(task => !task.assignedTo);
    } else if (assigneeFilter === 'MY_TASKS' && session?.user?.email) {
      filtered = filtered.filter(task => task.assignedTo === session.user.email);
    }

    if (dueDateFilter !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        switch (dueDateFilter) {
          case 'OVERDUE':
            return dueDateOnly < today;
          case 'TODAY':
            return dueDateOnly.getTime() === today.getTime();
          case 'WEEK':
            return dueDateOnly >= today && dueDateOnly <= weekFromNow;
          default:
            return false;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [tasks, searchTerm, priorityFilter, assigneeFilter, dueDateFilter, sortBy, sortOrder, session?.user?.email]);

  // Helper functions for BoardGrid (copied from old board)
  const getTasksForStatus = useCallback((status: Task['status']) => {
    return filteredAndSortedTasks.filter(task => task.status === status);
  }, [filteredAndSortedTasks]);

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
        return [];
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
  }, [columns, isLoadingColumns]);

  // Helper function to get grid classes and styles based on column count
  const getGridClasses = useCallback(() => {
    return 'grid-cols-none';
  }, []);

  const getGridStyles = useCallback(() => {
    const columnCount = columns.length || 4;
    return {
      gridTemplateColumns: `repeat(${columnCount}, minmax(350px, 1fr))`
    };
  }, [columns.length]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error loading tasks
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <button
            onClick={() => fetchTasks(teamId)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Board Header */}
      <BoardHeader
        teamName={teamName}
        availableTeams={availableTeams}
        selectedRow={selectedRow}
        onTeamChange={onTeamChange}
        onNewTask={() => handleOpenNewTaskModal()}
        session={session}
        isLoading={isLoading}
        totalTasks={filteredAndSortedTasks.length}
      />

      {/* Filters */}
      <BoardFilters
        searchTerm={searchTerm}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        dueDateFilter={dueDateFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        showFilters={showFilters}
        onSearchTermChange={setSearchTerm}
        onPriorityFilterChange={setPriorityFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onDueDateFilterChange={setDueDateFilter}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onShowFiltersChange={setShowFilters}
        session={session}
      />

      {/* Board Content */}
      <div className="flex-1 overflow-hidden w-full">
        {isLoading ? (
          <BoardSkeleton />
        ) : (
          <BoardGrid
            columns={displayColumns}
            tasks={filteredAndSortedTasks}
            session={session}
            draggedTask={draggedTask}
            showNewTaskForm={showNewTaskForm}
            newTaskData={newTaskData}
            isLoading={isLoading}
            showMinimumSkeleton={false}
            canMoveTask={canMoveTask}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTaskClick={handleTaskClick}
            onDeleteTask={handleDeleteTask}
            onOpenNewTaskModal={handleOpenNewTaskModal}
            onSetShowNewTaskForm={setShowNewTaskForm}
            onSetNewTaskData={setNewTaskData}
            onCreateTask={handleCreateTask}
            formatDate={formatDate}
            getColumnConfig={getColumnConfig}
            getTasksForStatus={getTasksForStatus}
            getGridClasses={getGridClasses}
            getGridStyles={getGridStyles}
          />
        )}
      </div>

      {/* Modals */}
      {selectedTask && (
        <ModularTaskDetailModal
          task={selectedTask}
          session={session}
          teamMembers={teamMembers}
          teamAdmins={teamAdmins}
          onClose={handleCloseTaskModal}
          onUpdate={updateTask}
          onDelete={handleDeleteTask}
          onUpdateStatus={(status) => updateTaskStatus(selectedTask.id, status)}
        />
      )}

      {showNewTaskModal && (
        <NewTaskModal
          isOpen={showNewTaskModal}
          onClose={() => setShowNewTaskModal(false)}
          onSubmit={(data) => handleCreateTask('NOT_STARTED')}
          teamId={teamId}
          teamName={teamName}
          session={session}
        />
      )}

      {/* Column Settings Modal */}
      <ColumnSettings
        teamId={teamId}
        onColumnsUpdate={fetchColumns}
      />
    </div>
  );
}