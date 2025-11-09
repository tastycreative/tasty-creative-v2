'use client';

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle
} from 'lucide-react';
import { useTaskUpdates } from '@/hooks/useTaskUpdates';
import { useMarkAsFinal } from '@/hooks/useMarkAsFinal';
import { useMarkAsPublished } from '@/hooks/useMarkAsPublished';
import { useBoardStore, useBoardTasks, useBoardFilters, useBoardTaskActions, useBoardColumns, type Task, type BoardColumn, type NewTaskData } from '@/lib/stores/boardStore';
import { useTasksQuery, useColumnsQuery, useTeamMembersQuery, useTeamSettingsQuery, boardQueryKeys, useUpdateTaskMutation, useUpdateTaskStatusMutation, useUpdateOFTVTaskMutation } from '@/hooks/useBoardQueries';
import { formatForDisplay, formatForTaskCard, formatDueDate, formatForTaskDetail, toLocalDateTimeString, parseUserDate } from '@/lib/dateUtils';
import { getTaskErrorMessage } from '@/lib/utils/errorMessages';
import ColumnSettings from './ColumnSettings';
import BoardHeader, { TabType } from './BoardHeader';
import BoardFilters from './BoardFilters';
import OFTVListFilters, { OFTVFilters } from './OFTVListFilters';
import Summary from './Summary';
import Resources from './Resources';
import StrikeSystem from './StrikeSystem';
import Gallery from './Gallery';
import BoardSkeleton from './BoardSkeleton';
import BoardGrid from './BoardGrid';
import BoardList from './BoardList';
import EnhancedTaskDetailModal from './EnhancedTaskDetailModal';
import NewTaskModal from './NewTaskModal';
import OFTVTaskModal, { OFTVTaskData } from './OFTVTaskModal';
import OnboardingTaskModal from '@/components/pod/OnboardingTaskModal';
import NoTeamSelected from '@/components/pod/NoTeamSelected';
import TeamSettings from './TeamSettings';

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

interface BoardProps {
  teamId: string;
  teamName: string;
  session: Session | null;
  availableTeams: Array<{ row: number; name: string; label: string; }>; // Keep for backward compatibility
  onTeamChange: (teamRow: number) => void; // Keep for backward compatibility  
  selectedRow: number; // Keep for backward compatibility
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
  const queryClient = useQueryClient();

  // Zustand store hooks
  const { tasks: storeTasks, isLoading: storeLoading, error, currentTeamId, fetchTasks, setCurrentTeamId } = useBoardTasks();
  const {
    searchTerm, priorityFilter, assigneeFilter, dueDateFilter, workflowFilter, sortBy, sortOrder, showFilters,
    setSearchTerm, setPriorityFilter, setAssigneeFilter, setDueDateFilter, setWorkflowFilter, setSortBy, setSortOrder, setShowFilters
  } = useBoardFilters();
  const { createTask, updateTaskStatus, updateTask, deleteTask } = useBoardTaskActions();
  const { 
    columns: storeColumns, isLoadingColumns: storeLoadingColumns, showColumnSettings, fetchColumns, setShowColumnSettings 
  } = useBoardColumns();

  // TanStack Query data sources
  const tasksQuery = useTasksQuery(teamId);
  const columnsQuery = useColumnsQuery(teamId);
  const membersQuery = useTeamMembersQuery(teamId);
  const settingsQuery = useTeamSettingsQuery(teamId);
  
  // Team membership state
  const [teamMembers, setTeamMembers] = useState<Array<{id: string, email: string, name?: string}>>([]);
  const [teamAdmins, setTeamAdmins] = useState<Array<{id: string, email: string, name?: string}>>([]);
  const isLoadingTeamMembers = membersQuery.isLoading;
  
  // Team settings state
  const [teamSettings, setTeamSettings] = useState<{columnNotificationsEnabled: boolean} | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('board');
  
  // OFTV Filters state
  const [oftvFilters, setOftvFilters] = useState<OFTVFilters>({
    weeklyDeadlines: false,
    completed: false,
    published: false,
    onHold: false,
    selectedModel: '',
  });
  
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
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingOFTVTask, setIsCreatingOFTVTask] = useState(false);
  const updateTaskMutation = useUpdateTaskMutation(teamId);
  const updateTaskStatusMutation = useUpdateTaskStatusMutation(teamId);
  const updateOFTVTaskMutation = useUpdateOFTVTaskMutation(teamId);

  // OFTV-specific task state
  const [oftvTaskData, setOftvTaskData] = useState<OFTVTaskData>({
    model: '',
    title: '',
    folderLink: '',
    videoDescription: '',
    videoEditor: '',
    videoEditorUserId: '',
    videoEditorStatus: 'NOT_STARTED',
    thumbnailEditor: '',
    thumbnailEditorUserId: '',
    thumbnailEditorStatus: 'NOT_STARTED',
    dueDate: '',
    specialInstructions: '',
  });

  // Mark as Final hook
  const { markAsFinal, loadingTaskId } = useMarkAsFinal({
    teamId,
    teamName,
    session,
    onSuccess: async () => {
      // Force immediate refetch of tasks to update UI
      await queryClient.invalidateQueries({ queryKey: ['tasks', teamId] });
      await queryClient.refetchQueries({ queryKey: ['tasks', teamId] });
    },
  });

  // Mark as Published hook (for OFTV)
  const { markAsPublished, loadingTaskId: loadingPublishedTaskId } = useMarkAsPublished({
    teamId,
    teamName,
    session,
    onSuccess: async () => {
      // Force immediate refetch of tasks to update UI
      await queryClient.invalidateQueries({ queryKey: ['tasks', teamId] });
      await queryClient.refetchQueries({ queryKey: ['tasks', teamId] });
    },
  });

  // Combined loading state for both operations
  const combinedLoadingTaskId = loadingTaskId || loadingPublishedTaskId;

  const handleSetOftvTaskData = useCallback((data: Partial<OFTVTaskData>) => {
    setOftvTaskData(prev => ({ ...prev, ...data }));
  }, []);

  // Fetch team members and admins
  // Wire TanStack members query into local state to avoid large refactor
  useEffect(() => {
    if (membersQuery.data?.success) {
      setTeamMembers(membersQuery.data.members || []);
      setTeamAdmins(membersQuery.data.admins || []);
    } else if (membersQuery.isError) {
      setTeamMembers([]);
      setTeamAdmins([]);
    }
  }, [membersQuery.data, membersQuery.isError]);

  // Fetch team settings including column notifications
  // Wire TanStack settings query into local state
  useEffect(() => {
    if (settingsQuery.data?.success) {
      setTeamSettings({ columnNotificationsEnabled: settingsQuery.data.data.columnNotificationsEnabled });
    } else if (settingsQuery.isError) {
      setTeamSettings(null);
    }
  }, [settingsQuery.data, settingsQuery.isError]);

  // Effect to ensure skeleton shows for minimum time
  // Use tasks/columns loading states from queries
  const qIsLoadingTasks = tasksQuery.isLoading;
  const qTasks = (tasksQuery.data?.tasks ?? []) as Task[];
  const qIsLoadingColumns = columnsQuery.isLoading;
  const qColumns = (columnsQuery.data?.columns ?? []) as BoardColumn[];

  useEffect(() => {
    if ((qIsLoadingTasks || qIsLoadingColumns) && qTasks.length === 0) {
      setShowMinimumSkeleton(true);
      const timer = setTimeout(() => {
        if (!(qIsLoadingTasks || qIsLoadingColumns) || qTasks.length > 0) {
          setShowMinimumSkeleton(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      if (!(qIsLoadingTasks || qIsLoadingColumns)) {
        setShowMinimumSkeleton(false);
      }
    }
  }, [qIsLoadingTasks, qIsLoadingColumns, qTasks.length]);

  // Consolidated team initialization and data fetching
  useEffect(() => {
    if (teamId !== currentTeamId) {
      setCurrentTeamId(teamId);
    }
    // Queries auto-fetch on key change; keep slight delay parity for UX if needed
  }, [teamId, currentTeamId, setCurrentTeamId]);

  // Handle URL parameter for task sharing - URL is the single source of truth
  useEffect(() => {
    const taskParam = searchParams?.get('task');
    
    if (taskParam && qTasks.length > 0) {
      // URL has a task parameter - find task by ID or podTeam.projectPrefix-taskNumber
      let task: Task | undefined;
      
      // Check if taskParam looks like projectPrefix-taskNumber format
      if (taskParam.includes('-') && /^[A-Z0-9]{3,5}-\d+$/.test(taskParam)) {
        const [projectPrefix, taskNumberStr] = taskParam.split('-');
        const taskNumber = parseInt(taskNumberStr, 10);
        task = qTasks.find(t => t.podTeam?.projectPrefix === projectPrefix && t.taskNumber === taskNumber);
      } else {
        // Fall back to finding by task ID
        task = qTasks.find(t => t.id === taskParam);
      }
      
      if (task && (!selectedTask || selectedTask.id !== task.id)) {
        console.log('🔍 Setting selectedTask from URL/click:', {
          taskId: task.id,
          hasOftvTask: !!(task as any).oftvTask,
          oftvTask: (task as any).oftvTask,
          podTeamName: task.podTeam?.name
        });
        setSelectedTask(task);
        // Initialize editing data only when selection changes
        setEditingTaskData({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          assignedTo: task.assignedTo || '',
          attachments: task.attachments || []
        });
      } else if (task) {
        // If a task is already selected and matches, avoid resetting editing data unless it's empty
        const isEditingEmpty = !editingTaskData || Object.keys(editingTaskData).length === 0;
        if (isEditingEmpty) {
          setEditingTaskData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            assignedTo: task.assignedTo || '',
            attachments: task.attachments || []
          });
        }
      }
    } else if (!taskParam) {
      // No URL parameter - always clear the selection regardless of current state
      if (selectedTask !== null) {
        setSelectedTask(null);
      }
      if (isEditingTask) {
        setIsEditingTask(false);
      }
      // Only clear editing data if it's not already empty to avoid infinite loops
      if (editingTaskData && Object.keys(editingTaskData).length > 0) {
        setEditingTaskData({});
      }
    }
    // Depend on the actual query string value to avoid reruns on stable renders
  }, [searchParams?.toString(), qTasks, selectedTask, isEditingTask]);

  // Refs for scroll synchronization (prevents memory leaks)
  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);

  // Stable scroll handlers using refs
  const headerToBodyScroll = useCallback(() => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    }
  }, []);

  const bodyToHeaderScroll = useCallback(() => {
    if (bodyScrollRef.current && headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  }, []);

  // Update selected task when tasks are refetched (to preserve OFTV relation data)
  useEffect(() => {
    if (selectedTask && qTasks.length > 0) {
      const updatedTask = qTasks.find(t => t.id === selectedTask.id);
      if (updatedTask && updatedTask.title) {
        // Only update if there's actual data difference (especially for relations like oftvTask)
        const hasOFTVDataChange = teamName === "OFTV" &&
          JSON.stringify((updatedTask as any).oftvTask) !== JSON.stringify((selectedTask as any).oftvTask);
        const hasStatusChange = updatedTask.status !== selectedTask.status;

        if (hasOFTVDataChange || hasStatusChange) {
          setSelectedTask(updatedTask as any);
        }
      }
    }
  }, [qTasks]);

  // Synchronize scroll between header and body on desktop
  useEffect(() => {
    const headerEl = document.getElementById('desktop-header-scroll') as HTMLDivElement;
    const bodyEl = document.getElementById('desktop-body-scroll') as HTMLDivElement;

    if (!headerEl || !bodyEl) return;

    // Store refs for cleanup
    headerScrollRef.current = headerEl;
    bodyScrollRef.current = bodyEl;

    // Attach listeners with stable callbacks
    headerEl.addEventListener('scroll', headerToBodyScroll);
    bodyEl.addEventListener('scroll', bodyToHeaderScroll);

    return () => {
      // Clean up with stable element references
      headerEl.removeEventListener('scroll', headerToBodyScroll);
      bodyEl.removeEventListener('scroll', bodyToHeaderScroll);
    };
  }, [headerToBodyScroll, bodyToHeaderScroll]); // Stable dependencies

  // Real-time task updates with debouncing
  const { broadcastTaskUpdate } = useTaskUpdates({
    teamId: currentTeamId,
    onTaskUpdate: useCallback((update: any) => {
      const timeoutId = setTimeout(async () => {
        if (update.type === 'TASK_UPDATED' || update.type === 'TASK_CREATED' || update.type === 'TASK_DELETED') {
          // Invalidate tasks to refetch
          await queryClient.invalidateQueries({ queryKey: boardQueryKeys.tasks(currentTeamId) });
          
          // If a task is currently selected and was updated, refresh it with new data from the store
          if (update.taskId && update.type === 'TASK_UPDATED') {
            setTimeout(() => {
              const currentSelectedTask = useBoardStore.getState().selectedTask;
              if (currentSelectedTask && currentSelectedTask.id === update.taskId) {
                const freshTasks: Task[] = ((queryClient.getQueryData(boardQueryKeys.tasks(currentTeamId)) as any)?.tasks || []) as Task[];
                const updatedTask = freshTasks.find((t: Task) => t.id === update.taskId);
                if (updatedTask) {
                  useBoardStore.getState().setSelectedTask(updatedTask as any);
                }
              }
            }, 100);
          }
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }, [currentTeamId, fetchTasks])
  });

  // Removed URL parameter detection - team selection now handled by parent component
  // The parent component (BoardPage) handles URL parameter changes and updates the teamId prop

  // Removed automatic URL sync - team selection now handled exclusively via LeftSidebar

  // Removed handleTeamChange function - team selection now handled via LeftSidebar

  // Task management functions
  const handleCreateTask = async (status: Task['status']) => {
    if (!newTaskData.title.trim()) return;

    // Security check: ensure user has access to this team
    if (!hasTeamAccess) {
      console.error('Unauthorized: User cannot create tasks for this team');
      return;
    }

    try {
  await createTask(newTaskData, status);
  await queryClient.invalidateQueries({ queryKey: boardQueryKeys.tasks(currentTeamId) });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    // Security check: ensure user has access to this team
    if (!hasTeamAccess) {
      console.error('Unauthorized: User cannot delete tasks for this team');
      return;
    }

    try {
  await deleteTask(taskId);
      await broadcastTaskUpdate({
        type: 'TASK_DELETED',
        taskId: taskId
      });
  await queryClient.invalidateQueries({ queryKey: boardQueryKeys.tasks(currentTeamId) });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleMarkAsFinal = async (taskId: string, isFinal: boolean) => {
    if (!isFinal) {
      const toast = (await import('sonner')).toast;
      toast.error('Unmarking as final is not supported');
      return;
    }

  const task = qTasks.find((t) => t.id === taskId);
    if (task) {
      await markAsFinal(task);
    }
  };

  const handleMarkAsPublished = async (taskId: string, isPublished: boolean) => {
    if (!isPublished) {
      const toast = (await import('sonner')).toast;
      toast.error('Unmarking as published is not supported');
      return;
    }

    const task = qTasks.find((t) => t.id === taskId);
    if (task) {
      await markAsPublished(task);
    }
  };

  // Task detail and editing functions
  const openTaskDetail = (task: Task) => {
    // Update URL for both onboarding and regular tasks for consistency
    const params = new URLSearchParams(searchParams?.toString() || '');
    // Use podTeam.projectPrefix-taskNumber if available, otherwise fall back to task ID
    const taskIdentifier = (task.podTeam?.projectPrefix && task.taskNumber)
      ? `${task.podTeam.projectPrefix}-${task.taskNumber}`
      : task.id;
    params.set('task', taskIdentifier);
    router.push(`?${params.toString()}`);
  };

  const closeTaskDetail = () => {
    // For Onboarding team, clear state AND update URL to remove task param
    if (teamName === "Onboarding") {
      setSelectedTask(null);
      setIsEditingTask(false);
      setEditingTaskData({});
      // Also remove task param from URL for onboarding
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('task');
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      router.push(newUrl);
      return;
    }

    // For other teams, update URL - the useEffect will handle state clearing
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('task');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl);
  };

  const startEditingTask = () => {
    if (selectedTask) {
      setEditingTaskData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '',
        assignedTo: selectedTask.assignedTo || '',
        attachments: selectedTask.attachments || [],
        ModularWorkflow: selectedTask.ModularWorkflow ? ({
          caption: selectedTask.ModularWorkflow.caption || '',
          pricing: selectedTask.ModularWorkflow.pricing || '',
          basePriceDescription: selectedTask.ModularWorkflow.basePriceDescription || '',
          gifUrl: selectedTask.ModularWorkflow.gifUrl || '',
          notes: selectedTask.ModularWorkflow.notes || '',
        } as any) : undefined
      });
    }
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
        attachments: selectedTask.attachments || [],
        ModularWorkflow: selectedTask.ModularWorkflow ? ({
          caption: selectedTask.ModularWorkflow.caption || '',
          pricing: selectedTask.ModularWorkflow.pricing || '',
          basePriceDescription: selectedTask.ModularWorkflow.basePriceDescription || '',
          gifUrl: selectedTask.ModularWorkflow.gifUrl || '',
          notes: selectedTask.ModularWorkflow.notes || '',
        } as any) : undefined
      });
    }
  };

  const autoSaveAttachments = async (newAttachments: any[]) => {
    if (!selectedTask) return;

    try {
      await updateTaskMutation.mutateAsync({ taskId: selectedTask.id, updates: { attachments: newAttachments } });
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

    // Security check: ensure user has access to this team
    if (!hasTeamAccess) {
      console.error('Unauthorized: User cannot save task changes for this team');
      return;
    }

    try {
      setIsSaving(true);
      const updates = {
        title: editingTaskData.title,
        description: editingTaskData.description,
        priority: editingTaskData.priority,
        dueDate: editingTaskData.dueDate ? new Date(editingTaskData.dueDate).toISOString() : null,
        assignedTo: editingTaskData.assignedTo || null,
        attachments: editingTaskData.attachments || [],
      };

      // Use TanStack mutation for task updates
      await updateTaskMutation.mutateAsync({ taskId: selectedTask.id, updates });

      // Update ModularWorkflow QA fields if they exist
      let updatedWorkflow = null;
      if ((editingTaskData as any).ModularWorkflow && selectedTask.ModularWorkflow) {
        const workflowUpdates = {
          caption: (editingTaskData as any).ModularWorkflow.caption,
          pricing: (editingTaskData as any).ModularWorkflow.pricing,
          basePriceDescription: (editingTaskData as any).ModularWorkflow.basePriceDescription,
          gifUrl: (editingTaskData as any).ModularWorkflow.gifUrl,
          notes: (editingTaskData as any).ModularWorkflow.notes,
          contentTags: (editingTaskData as any).ModularWorkflow.contentTags,
        };

        // Call API to update workflow
        const response = await fetch(`/api/modular-workflows/${selectedTask.ModularWorkflow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflowUpdates),
        });

        if (response.ok) {
          updatedWorkflow = await response.json();
        }
      }

      // Fetch the updated task from store (includes OFTV relations if updated)
      // Small delay to ensure store updates have propagated
  await new Promise(resolve => setTimeout(resolve, 100));
      
  const fresh: Task[] = ((queryClient.getQueryData(boardQueryKeys.tasks(currentTeamId)) as any)?.tasks || []) as Task[];
  const updatedTaskFromStore = fresh.find((t: any) => t.id === selectedTask.id);
      
      console.log('📊 Task from store after save:', {
        found: !!updatedTaskFromStore,
        oftvTask: updatedTaskFromStore?.oftvTask,
        oftvTaskFull: JSON.parse(JSON.stringify(updatedTaskFromStore?.oftvTask || {})),
        hasVideoEditorUser: !!(updatedTaskFromStore as any)?.oftvTask?.videoEditorUser,
        hasThumbnailEditorUser: !!(updatedTaskFromStore as any)?.oftvTask?.thumbnailEditorUser,
        videoEditorUser: (updatedTaskFromStore as any)?.oftvTask?.videoEditorUser,
        thumbnailEditorUser: (updatedTaskFromStore as any)?.oftvTask?.thumbnailEditorUser
      });
      
      const updatedTask: any = updatedTaskFromStore ? {
        ...selectedTask, // Keep original task data (includes podTeam relation)
        ...updates, // Apply new updates
        oftvTask: updatedTaskFromStore.oftvTask || selectedTask.oftvTask, // Use updated OFTV data from store
        ModularWorkflow: updatedWorkflow || updatedTaskFromStore.ModularWorkflow || selectedTask.ModularWorkflow
      } : {
        ...selectedTask,
        ...updates,
        ModularWorkflow: updatedWorkflow || selectedTask.ModularWorkflow
      };

      // Update selected task state immediately
      setSelectedTask(updatedTask as Task);

  await broadcastTaskUpdate({
        type: 'TASK_UPDATED',
        taskId: selectedTask.id,
        data: updatedTask
      });
  await queryClient.invalidateQueries({ queryKey: boardQueryKeys.tasks(currentTeamId) });
      setIsEditingTask(false);
      setEditingTaskData({});
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSaving(false);
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
    // Also reset OFTV task data when closing
    setOftvTaskData({
      model: '',
      title: '',
      folderLink: '',
      videoDescription: '',
      videoEditor: '',
      videoEditorUserId: '',
      videoEditorStatus: 'NOT_STARTED',
      thumbnailEditor: '',
      thumbnailEditorUserId: '',
      thumbnailEditorStatus: 'NOT_STARTED',
      dueDate: '',
      specialInstructions: '',
    });
  };

  const createOFTVTaskFromModal = async () => {
    if (!oftvTaskData.model.trim() || !oftvTaskData.title.trim() || !newTaskStatus) return;

    // Security check: ensure user has access to this team
    if (!hasTeamAccess) {
      console.error('Unauthorized: User cannot create tasks for this team');
      return;
    }

    setIsCreatingOFTVTask(true);
    try {
      // Call the OFTV-specific API endpoint with user IDs directly
      const response = await fetch('/api/oftv-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: currentTeamId,
          status: newTaskStatus,
          model: oftvTaskData.model,
          title: oftvTaskData.title,
          folderLink: oftvTaskData.folderLink,
          videoDescription: oftvTaskData.videoDescription,
          videoEditorUserId: oftvTaskData.videoEditorUserId || null,
          videoEditorStatus: oftvTaskData.videoEditorStatus,
          thumbnailEditorUserId: oftvTaskData.thumbnailEditorUserId || null,
          thumbnailEditorStatus: oftvTaskData.thumbnailEditorStatus,
          dueDate: oftvTaskData.dueDate,
          specialInstructions: oftvTaskData.specialInstructions,
          attachments: (oftvTaskData as any).attachments || [], // Include attachments
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create OFTV task');
      }

      // Notify assigned editors (video/thumbnail) on successful creation
      try {
        const createdTask: Task = result.task as Task;
        const createdOftv = result.oftvTask as any;
        const taskId = createdTask.id;
        const taskTitle = createdTask.title;
        const taskDescription = createdTask.description || '';
        const priority = createdTask.priority || 'MEDIUM';
        const dueDate = createdTask.dueDate || null;

        // Helper to post assignment notifications via API
        const notifyAssignment = async (assignedToUserId: string, previousAssigneeId: string | null = null) => {
          if (!assignedToUserId || !session?.user?.id) return;
          try {
            await fetch('/api/notifications/assignment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId,
                taskTitle,
                taskDescription,
                assignedToUserId,
                teamId: currentTeamId,
                teamName,
                assignedBy: session.user.name || session.user.email,
                assignedById: session.user.id,
                priority,
                dueDate,
                previousAssigneeId,
              })
            });
          } catch (e) {
            console.error('Failed to send OFTV assignment notification:', e);
          }
        };

        if (createdOftv?.videoEditorUserId) {
          await notifyAssignment(createdOftv.videoEditorUserId, null);
        }
        if (createdOftv?.thumbnailEditorUserId) {
          await notifyAssignment(createdOftv.thumbnailEditorUserId, null);
        }
      } catch (notifyErr) {
        console.warn('OFTV create: notification step failed (continuing):', notifyErr);
      }

      // Refresh tasks to show the new task
  await queryClient.invalidateQueries({ queryKey: boardQueryKeys.tasks(currentTeamId) });
      closeNewTaskModal();
    } catch (error) {
      console.error('Error creating OFTV task:', error);
    } finally {
      setIsCreatingOFTVTask(false);
    }
  };

  const createTaskFromModal = async () => {
    if (!newTaskData.title.trim() || !newTaskStatus) return;

    // Security check: ensure user has access to this team
    if (!hasTeamAccess) {
      console.error('Unauthorized: User cannot create tasks for this team');
      return;
    }

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

  // Check if user is part of the team (member or admin)
  const isUserInTeam = useCallback(() => {
    if (!session?.user) return false;

    // ADMIN and MODERATOR can access all teams
    if (session.user.role === 'ADMIN' || session.user.role === 'MODERATOR') {
      return true;
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Check if user is in team members
    const isMember = teamMembers.some(member =>
      member.id === userId || member.email === userEmail
    );

    // Check if user is in team admins
    const isAdmin = teamAdmins.some(admin =>
      admin.id === userId || admin.email === userEmail
    );

    return isMember || isAdmin;
  }, [session?.user, teamMembers, teamAdmins]);

  // Check if user has access to this team
  const hasTeamAccess = useMemo(() => {
    if (!session?.user) return false;

    // ADMIN and MODERATOR can access all teams
    if (session.user.role === 'ADMIN' || session.user.role === 'MODERATOR') {
      return true;
    }

    // For regular users, check if they're members of the team
    return isUserInTeam();
  }, [session?.user, isUserInTeam]);

  const canEditTask = (task: Task) => {
    if (!session?.user) return false;
    
    // Global admins can always edit
    if (session.user.role === 'ADMIN') return true;
    
    // Team members and team admins can edit tasks
    if (isUserInTeam()) return true;
    
    // Task assignees can edit their assigned tasks
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
      await updateTaskStatusMutation.mutateAsync({ taskId: selectedTask.id, status: newStatus });

      // Keep broadcasting for real-time collaborators
      await broadcastTaskUpdate({
        type: 'TASK_UPDATED',
        taskId: selectedTask.id,
        data: { ...selectedTask, status: newStatus }
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Centralized OFTV updates routed through Board for consistent invalidation/broadcast
  const updateOFTVTaskViaBoard = async (taskId: string, updates: any) => {
    try {
      // Capture previous editor assignments for notification diffing
      const prev = (qTasks.find(t => t.id === taskId) as any) || null;
      const prevOftv = prev?.oftvTask || null;
      const prevVideoId: string | null = prevOftv?.videoEditorUserId || null;
      const prevThumbId: string | null = prevOftv?.thumbnailEditorUserId || null;
  const prevVideoStatus: string | null = prevOftv?.videoEditorStatus || null;
  const prevThumbStatus: string | null = prevOftv?.thumbnailEditorStatus || null;

      await updateOFTVTaskMutation.mutateAsync({ taskId, updates });
      await broadcastTaskUpdate({ type: 'TASK_UPDATED', taskId, data: updates });

  // After successful update, send notifications if editor assignment or status changed
      try {
        const task = qTasks.find(t => t.id === taskId) as Task | undefined;
        const taskTitle = task?.title || updates?.title || 'Task';
        const taskDescription = task?.description || '';
        const priority = task?.priority || 'MEDIUM';
        const dueDate = task?.dueDate || null;

        const notifyAssignment = async (assignedToUserId: string, previousAssigneeId: string | null) => {
          if (!assignedToUserId || !session?.user?.id) return;
          try {
            await fetch('/api/notifications/assignment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId,
                taskTitle,
                taskDescription,
                assignedToUserId,
                teamId: currentTeamId,
                teamName,
                assignedBy: session.user.name || session.user.email,
                assignedById: session.user.id,
                priority,
                dueDate,
                previousAssigneeId,
              })
            });
          } catch (e) {
            console.error('Failed to send OFTV reassignment notification:', e);
          }
        };

        // Updates may include direct userIds or emails; prefer userIds when present
        if (typeof updates?.videoEditorUserId !== 'undefined' && updates.videoEditorUserId !== prevVideoId) {
          await notifyAssignment(updates.videoEditorUserId, prevVideoId);
        }
        if (typeof updates?.thumbnailEditorUserId !== 'undefined' && updates.thumbnailEditorUserId !== prevThumbId) {
          await notifyAssignment(updates.thumbnailEditorUserId, prevThumbId);
        }

        // Notify task creator when OFTV editor statuses change
        const notifyCreatorOnStatus = async (editorType: 'video' | 'thumbnail', newStatus: string) => {
          try {
            await fetch('/api/notifications/oftv-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId,
                teamId: currentTeamId,
                teamName,
                editorType,
                newStatus,
              })
            });
          } catch (e) {
            console.error('Failed to notify creator about OFTV status change:', e);
          }
        };

        if (typeof updates?.videoEditorStatus === 'string' && updates.videoEditorStatus !== prevVideoStatus) {
          await notifyCreatorOnStatus('video', updates.videoEditorStatus);
        }
        if (typeof updates?.thumbnailEditorStatus === 'string' && updates.thumbnailEditorStatus !== prevThumbStatus) {
          await notifyCreatorOnStatus('thumbnail', updates.thumbnailEditorStatus);
        }
      } catch (notifyErr) {
        console.warn('OFTV update: notification step failed (continuing):', notifyErr);
      }
    } catch (error) {
      console.error('Error updating OFTV task via mutation:', error);
      throw error;
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
    // Don't clear draggedTask here - it's cleared in handleDrop
    // This prevents clearing it when drag is cancelled (dropped outside valid zone)
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null); // Clear even if no action needed
      return;
    }

    // Store the old status for notification purposes
    const oldStatus = draggedTask.status;

    // Update the task status via TanStack mutation (handles cache invalidation)
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId: draggedTask.id, status: newStatus });

      // Force refetch tasks from Zustand store to sync with React Query
      await fetchTasks(teamId, true);
    } catch (err) {
      console.error('Error updating task status on drop:', err);
      // Still clear drag state to avoid UI being stuck
      setDraggedTask(null);
      return;
    }

    // For OFTV team, update the description based on column label
    if (teamName === "OFTV") {
      await updateOFTVTaskDescription(draggedTask, newStatus);
    }

    // Send notifications to assigned members
    await sendColumnNotifications(draggedTask, oldStatus, newStatus);

    // Clear dragged task immediately to remove opacity effect
    setDraggedTask(null);

    // Cache will refresh via mutation's invalidation; relations stay consistent after refetch
  };

  // Function to update OFTV task description based on column transitions
  // This function is ONLY for OFTV team tasks
  const updateOFTVTaskDescription = async (task: Task, newStatus: Task['status']) => {
    // Safety check: only process for OFTV team
    if (teamName !== "OFTV") {
      return;
    }

    // Find the new column to get its label
  const newColumn = qColumns.find(col => col.status === newStatus);
    if (!newColumn) return;

    const columnLabel = newColumn.label;
    let updatedDescription = task.description || '';

    // Parse the current description to extract the structured data
    const videoEditorMatch = updatedDescription.match(/Video Editor: ([^\s]+) \(([^)]+)\)/);
    const thumbnailEditorMatch = updatedDescription.match(/Thumbnail Editor: ([^\s]+) \(([^)]+)\)/);

    if (!videoEditorMatch || !thumbnailEditorMatch) {
      // If description doesn't match OFTV format, don't update
      return;
    }

    const videoEditor = videoEditorMatch[1];
    const thumbnailEditor = thumbnailEditorMatch[1];
    let videoEditorStatus = videoEditorMatch[2];
    let thumbnailEditorStatus = thumbnailEditorMatch[2];

    // Update statuses based on column label (trim to handle extra spaces)
    const trimmedLabel = columnLabel.trim();
    
    if (trimmedLabel === "Editing Team") {
      videoEditorStatus = "IN_PROGRESS";
    } else if (trimmedLabel === "Editing Completed") {
      videoEditorStatus = "COMPLETED";
    } else if (trimmedLabel === "Thumbnail In Progress") {
      thumbnailEditorStatus = "IN_PROGRESS";
    } else if (trimmedLabel === "Thumbnail Completed") {
      thumbnailEditorStatus = "COMPLETED";
    }

    // Log for debugging (can be removed later)
    console.log('🎬 OFTV Status Update:', {
      columnLabel: trimmedLabel,
      videoEditorStatus,
      thumbnailEditorStatus
    });

    // Reconstruct the description with updated statuses
    updatedDescription = updatedDescription
      .replace(
        /Video Editor: ([^\s]+) \(([^)]+)\)/,
        `Video Editor: ${videoEditor} (${videoEditorStatus})`
      )
      .replace(
        /Thumbnail Editor: ([^\s]+) \(([^)]+)\)/,
        `Thumbnail Editor: ${thumbnailEditor} (${thumbnailEditorStatus})`
      );

    // Update the task with the new description via mutation for consistency
    try {
      await updateTaskMutation.mutateAsync({ taskId: task.id, updates: { description: updatedDescription } });
      
      // Broadcast the update
      await broadcastTaskUpdate({
        type: 'TASK_UPDATED',
        taskId: task.id,
        data: { ...task, description: updatedDescription, status: newStatus }
      });
    } catch (error) {
      console.error('Error updating OFTV task description:', error);
    }
  };

  // Function to send notifications to column members
  const sendColumnNotifications = async (task: Task, oldStatus: Task['status'], newStatus: Task['status']) => {
    try {
      // Check if column notifications are enabled for this team
      if (!teamSettings?.columnNotificationsEnabled) {
        console.log('🔕 Column notifications are disabled for this team');
        return;
      }

      // Find the target column to get assigned members
    const targetColumn = qColumns.find(column => column.status === newStatus);
      
      if (!targetColumn || !targetColumn.assignedMembers || targetColumn.assignedMembers.length === 0) {
        return;
      }

  // Get source column name for better logging
  const sourceColumn = qColumns.find(col => col.status === oldStatus);

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
      if (qIsLoadingColumns) {
        return [];
      }
      
      if (qColumns.length === 0) {
        // Only use default config if explicitly no columns are configured
        console.log('Using default statusConfig, columns.length:', qColumns.length);
        return Object.entries(statusConfig);
      }
      
      return qColumns
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
  }, [qColumns, qIsLoadingColumns]); // Dependency array ensures this updates when columns change

  // Helper function to get grid classes and styles based on column count
  const getGridClasses = () => {
    return 'grid-cols-none';
  };

  const getGridStyles = () => {
    const columnCount = qColumns.length || 4;
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

      // Workflow filtering
      if (workflowFilter !== 'ALL') {
        switch (workflowFilter) {
          case 'NORMAL':
            if (!task.ModularWorkflow || task.ModularWorkflow.contentStyle !== 'NORMAL') return false;
            break;
          case 'GAME':
            if (!task.ModularWorkflow || task.ModularWorkflow.contentStyle !== 'GAME') return false;
            break;
          case 'POLL':
            if (!task.ModularWorkflow || task.ModularWorkflow.contentStyle !== 'POLL') return false;
            break;
          case 'LIVESTREAM':
            if (!task.ModularWorkflow || task.ModularWorkflow.contentStyle !== 'LIVESTREAM') return false;
            break;
          case 'LEGACY':
            if (!task.ContentSubmission) return false;
            break;
        }
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

  // Memoize filtered and sorted tasks to prevent recalculation on every render
  const filteredAndSortedTasks = useMemo(
    () => sortTasks(filterTasks(qTasks)),
    [qTasks, searchTerm, priorityFilter, assigneeFilter, dueDateFilter, workflowFilter, sortBy, sortOrder]
  );

  // OFTV-specific filtering
  const applyOFTVFilters = (tasks: Task[]) => {
    let filtered = tasks;

    // Model filter
    if (oftvFilters.selectedModel) {
      filtered = filtered.filter(task => {
        const oftvTask = (task as any).oftvTask;
        return oftvTask?.model === oftvFilters.selectedModel;
      });
    }

    // Weekly Deadlines - tasks due this week
    if (oftvFilters.weeklyDeadlines) {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= startOfWeek && dueDate < endOfWeek;
      });
    }

    // Completed - both video and thumbnail are Approved or Sent
    if (oftvFilters.completed) {
      filtered = filtered.filter(task => {
        const oftvTask = (task as any).oftvTask;
        if (!oftvTask) return false;
        
        const videoCompleted = oftvTask.videoEditorStatus === 'APPROVED' || oftvTask.videoEditorStatus === 'SENT';
        const thumbnailCompleted = oftvTask.thumbnailEditorStatus === 'APPROVED' || oftvTask.thumbnailEditorStatus === 'SENT';
        
        return videoCompleted && thumbnailCompleted;
      });
    }

    // Published - both statuses are Published
    if (oftvFilters.published) {
      filtered = filtered.filter(task => {
        const oftvTask = (task as any).oftvTask;
        if (!oftvTask) return false;
        
        return oftvTask.videoEditorStatus === 'PUBLISHED' && oftvTask.thumbnailEditorStatus === 'PUBLISHED';
      });
    }

    // On Hold - either status has Hold or Waiting for VO
    if (oftvFilters.onHold) {
      filtered = filtered.filter(task => {
        const oftvTask = (task as any).oftvTask;
        if (!oftvTask) return false;
        
        const videoOnHold = oftvTask.videoEditorStatus === 'HOLD' || oftvTask.videoEditorStatus === 'WAITING_FOR_VO';
        const thumbnailOnHold = oftvTask.thumbnailEditorStatus === 'HOLD' || oftvTask.thumbnailEditorStatus === 'WAITING_FOR_VO';
        
        return videoOnHold || thumbnailOnHold;
      });
    }

    return filtered;
  };

  // Get the final filtered tasks for OFTV team
  const displayTasks = useMemo(() => {
    const isOFTVTeam = teamName === 'OFTV';
    if (isOFTVTeam && activeTab === 'list') {
      return applyOFTVFilters(filteredAndSortedTasks);
    }
    return filteredAndSortedTasks;
  }, [filteredAndSortedTasks, teamName, activeTab, oftvFilters]);

  // Summary component expects Date objects for date fields
  const summaryTasks = useMemo(() => {
    return qTasks.map(t => ({
      id: t.id,
      status: t.status as string,
      priority: t.priority as string,
      assignedBy: (t as any).assignedBy ?? null,
      assignedTo: t.assignedTo ?? null,
      createdAt: new Date(t.createdAt as any),
      dueDate: t.dueDate ? new Date(t.dueDate as any) : null,
      completedAt: (t as any).completedAt ? new Date((t as any).completedAt) : null,
    }));
  }, [qTasks]);

  // Show unauthorized message if user doesn't have access to this team
  if (!hasTeamAccess && !isLoadingTeamMembers) {
    return (
      <div className="space-y-6">
        <BoardHeader
          teamName={teamName}
          totalTasks={0}
          filteredTasksCount={0}
          isLoading={false}
        />
        <NoTeamSelected variant="no-access" />
      </div>
    );
  }

  // Using Luxon dateUtils now instead of local formatDate function

  if (showMinimumSkeleton || ((qIsLoadingTasks || qIsLoadingColumns) && qTasks.length === 0)) {
    return (
      <BoardSkeleton
        teamName={teamName}
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
  totalTasks={qTasks.length}
        filteredTasksCount={filteredAndSortedTasks.length}
  isLoading={qIsLoadingTasks}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Render content based on active tab */}
      {activeTab === 'summary' ? (
        <Summary
          teamName={teamName}
          totalTasks={qTasks.length}
          filteredTasksCount={filteredAndSortedTasks.length}
          tasks={summaryTasks}
          teamMembers={teamMembers}
          columns={qColumns}
        />
      ) : activeTab === 'resources' ? (
        <Resources
          teamName={teamName}
          teamId={teamId}
        />
      ) : activeTab === 'gallery' ? (
        <Gallery
          teamName={teamName}
          teamId={teamId}
        />
      ) : activeTab === 'strikes' ? (
        <StrikeSystem
          teamId={teamId}
        />
      ) : activeTab === 'settings' ? (
        <TeamSettings
          teamId={teamId}
          teamName={teamName}
          teamMembers={teamMembers.concat(teamAdmins).map(member => ({
            id: member.id,
            name: member.name || member.email || 'Unknown',
            role: teamAdmins.some(admin => admin.id === member.id) ? 'ADMIN' : 'MEMBER',
            email: member.email,
            userId: member.id,
          }))}
          onTeamUpdate={() => {
            // Refresh team data after updates via invalidation
            queryClient.invalidateQueries({ queryKey: boardQueryKeys.members(teamId) });
            queryClient.invalidateQueries({ queryKey: boardQueryKeys.settings(teamId) });
          }}
        />
      ) : activeTab === 'list' ? (
        <>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 dark:text-red-400">{error.message}</p>
              </div>
            </div>
          )}

          {/* OFTV Filters */}
          {teamName === 'OFTV' && (
            <OFTVListFilters
              onFilterChange={setOftvFilters}
            />
          )}

          {/* List Table View */}
          <BoardList
            tasks={displayTasks}
            columns={qColumns}
            session={session}
            onTaskClick={openTaskDetail}
            teamName={teamName}
          />
        </>
      ) : (
        <>
          {/* Search, Filter, and Sort Controls */}
      <BoardFilters
        searchTerm={searchTerm}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        dueDateFilter={dueDateFilter}
        workflowFilter={workflowFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        showFilters={showFilters}
        filteredTasksCount={filteredAndSortedTasks.length}
  totalTasks={qTasks.length}
        setSearchTerm={setSearchTerm}
        setPriorityFilter={setPriorityFilter}
        setAssigneeFilter={setAssigneeFilter}
        setDueDateFilter={setDueDateFilter}
        setWorkflowFilter={setWorkflowFilter}
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
        columns={qColumns}
        session={session}
        draggedTask={draggedTask}
        showNewTaskForm={showNewTaskForm}
        newTaskData={newTaskData}
        isLoading={qIsLoadingTasks}
        showMinimumSkeleton={showMinimumSkeleton}
        canMoveTask={canMoveTask}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTaskClick={openTaskDetail}
        onDeleteTask={handleDeleteTask}
        onMarkAsFinal={handleMarkAsFinal}
        onMarkAsPublished={handleMarkAsPublished}
        loadingTaskId={combinedLoadingTaskId}
        onOpenNewTaskModal={openNewTaskModal}
        onSetShowNewTaskForm={setShowNewTaskForm}
        onSetNewTaskData={setNewTaskData}
        onCreateTask={handleCreateTask}
        teamName={teamName}
        getColumnConfig={getColumnConfig}
        getTasksForStatus={getTasksForStatus}
        getGridClasses={getGridClasses}
        getGridStyles={getGridStyles}
      />

      {/* Task Detail Modal */}
      {selectedTask && teamName !== "Onboarding" && (
        <EnhancedTaskDetailModal
          selectedTask={selectedTask}
          isEditingTask={isEditingTask}
          editingTaskData={editingTaskData}
          session={session}
          canEditTask={canEditTask}
          isUserInTeam={isUserInTeam()}
          teamMembers={teamMembers}
          teamAdmins={teamAdmins}
          isSaving={isSaving}
          onClose={closeTaskDetail}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onStartEditing={startEditingTask}
          onCancelEditing={cancelEditingTask}
          onSaveChanges={saveTaskChanges}
          onSetEditingTaskData={setEditingTaskData}
          onUpdateTaskStatus={updateTaskStatusInModal}
          onAutoSaveAttachments={autoSaveAttachments}
          getColumnConfig={getColumnConfig}
          onUpdateOFTVTask={updateOFTVTaskViaBoard}
        />
      )}

      {/* Onboarding Task Modal */}
      {selectedTask && teamName === "Onboarding" && (
        <OnboardingTaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={closeTaskDetail}
          session={session}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}

      {/* New Task Modal - OFTV or Standard */}
      {teamName === "OFTV" ? (
        <OFTVTaskModal
          isOpen={showNewTaskModal}
          newTaskStatus={newTaskStatus}
          taskData={oftvTaskData}
          isCreatingTask={isCreatingOFTVTask}
          columns={qColumns}
          teamId={teamId}
          onClose={closeNewTaskModal}
          onSetTaskData={handleSetOftvTaskData}
          onCreateTask={createOFTVTaskFromModal}
        />
      ) : (
        <NewTaskModal
          isOpen={showNewTaskModal}
          newTaskStatus={newTaskStatus}
          newTaskData={newTaskData}
          isCreatingTask={isCreatingTask}
          columns={qColumns}
          onClose={closeNewTaskModal}
          onSetNewTaskData={setNewTaskData}
          onCreateTask={createTaskFromModal}
        />
      )}

          {/* Column Settings Modal */}
          <ColumnSettings currentTeamId={currentTeamId} />
        </>
      )}
    </div>
  );
}
