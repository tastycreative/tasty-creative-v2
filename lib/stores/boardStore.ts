"use client";

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

// Attachment types
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  s3Key?: string; // S3 key for deletion
  size: number;
  type: string; // mime type
  uploadedAt: string;
}

// Task types based on Prisma schema
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  teamId: string;
  teamName: string;
  assignedTo: string | null;
  attachments: TaskAttachment[] | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null; // Email of the user who last updated the task
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

// Cache configuration
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

// Error types
export interface APIError {
  message: string;
  code?: string;
  timestamp: number;
}

// Filter and sort types
export type PriorityFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AssigneeFilter = 'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'MY_TASKS';
export type DueDateFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'WEEK';
export type SortField = 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
export type SortOrder = 'asc' | 'desc';

// New task data
export interface NewTaskData {
  title: string;
  description: string;
  priority: Task['priority'];
  assignedTo: string;
  dueDate: string;
  attachments: TaskAttachment[];
}

// Board Column Configuration
export interface BoardColumn {
  id: string;
  teamId: string;
  label: string;
  status: string;
  position: number;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task Activity types
export interface TaskActivity {
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

// Default column configurations
export const DEFAULT_COLUMNS: Omit<BoardColumn, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>[] = [
  {
    label: 'Not Started',
    status: 'NOT_STARTED',
    position: 0,
    color: '#6B7280',
    isDefault: true,
    isActive: true,
  },
  {
    label: 'In Progress', 
    status: 'IN_PROGRESS',
    position: 1,
    color: '#3B82F6',
    isDefault: true,
    isActive: true,
  },
  {
    label: 'Completed',
    status: 'COMPLETED', 
    position: 2,
    color: '#10B981',
    isDefault: true,
    isActive: true,
  },
  {
    label: 'Cancelled',
    status: 'CANCELLED',
    position: 3, 
    color: '#EF4444',
    isDefault: true,
    isActive: true,
  },
];

export interface BoardStore {
  // State
  tasks: Task[];
  currentTeamId: string;
  isLoading: boolean;
  error: APIError | null;
  
  // Cache
  cache: Record<string, CacheEntry<any>>;
  
  // UI State - Task Creation
  showNewTaskForm: string | null;
  showNewTaskModal: boolean;
  newTaskStatus: Task['status'] | null;
  newTaskData: NewTaskData;
  isCreatingTask: boolean;
  
  // UI State - Task Editing
  selectedTask: Task | null;
  isEditingTask: boolean;
  editingTaskData: Partial<Task>;
  
  // UI State - Drag and Drop
  draggedTask: Task | null;
  
  // UI State - Filters and Search
  searchTerm: string;
  priorityFilter: PriorityFilter;
  assigneeFilter: AssigneeFilter;
  dueDateFilter: DueDateFilter;
  sortBy: SortField;
  sortOrder: SortOrder;
  showFilters: boolean;
  
  // Actions - Data Management
  setCurrentTeamId: (teamId: string) => void;
  fetchTasks: (teamId: string, forceRefresh?: boolean) => Promise<void>;
  createTask: (taskData: NewTaskData, status: Task['status']) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Actions - Cache Management
  getCachedData: <T>(key: string) => T | null;
  setCachedData: <T>(key: string, data: T, expiresIn?: number) => void;
  clearCache: (key?: string) => void;
  
  // Actions - UI State Management
  setShowNewTaskForm: (status: string | null) => void;
  setShowNewTaskModal: (show: boolean) => void;
  setNewTaskStatus: (status: Task['status'] | null) => void;
  setNewTaskData: (data: Partial<NewTaskData>) => void;
  setSelectedTask: (task: Task | null) => void;
  setIsEditingTask: (editing: boolean) => void;
  setEditingTaskData: (data: Partial<Task>) => void;
  setDraggedTask: (task: Task | null) => void;
  
  // Actions - Filters and Search
  setSearchTerm: (term: string) => void;
  setPriorityFilter: (filter: PriorityFilter) => void;
  setAssigneeFilter: (filter: AssigneeFilter) => void;
  setDueDateFilter: (filter: DueDateFilter) => void;
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setShowFilters: (show: boolean) => void;
  
  // Column Configuration State
  columns: BoardColumn[];
  isLoadingColumns: boolean;
  showColumnSettings: boolean;
  
  // Task Activity History State
  taskActivities: Record<string, TaskActivity[]>; // key: taskId
  isLoadingActivities: Record<string, boolean>; // key: taskId
  activityError: Record<string, APIError | null>; // key: taskId
  
  // Actions - Column Management
  fetchColumns: (teamId: string, forceRefresh?: boolean) => Promise<void>;
  createColumn: (column: Omit<BoardColumn, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateColumn: (columnId: string, updates: Partial<BoardColumn>) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  reorderColumns: (columns: BoardColumn[]) => Promise<void>;
  resetToDefaultColumns: (teamId: string) => Promise<void>;
  setShowColumnSettings: (show: boolean) => void;
  
  // Actions - Task Activity History
  fetchTaskActivities: (taskId: string, teamId: string, forceRefresh?: boolean) => Promise<void>;
  clearTaskActivities: (taskId?: string) => void;
  
  // Actions - Error Handling
  setError: (error: APIError | null) => void;
  clearError: () => void;
}

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  TASKS: 2 * 60 * 1000, // 2 minutes (active updates)
  ACTIVITIES: 5 * 60 * 1000, // 5 minutes (less frequent changes)
};

// API helper with retry logic
async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  retryCount = 0,
  maxRetries = 3
): Promise<T> {
  const baseDelay = 1000; // 1 second
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If we get a 429 (quota exceeded) or 500 error, retry
    if ((response.status === 429 || response.status === 500) && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(
        `API request failed (${response.status}), retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`
      );
      
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiCall<T>(url, options, retryCount + 1, maxRetries);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    // For network errors, also retry
    if (retryCount < maxRetries && error instanceof Error && error.message.includes('fetch')) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(
        `Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`
      );
      
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiCall<T>(url, options, retryCount + 1, maxRetries);
    }
    
    throw error;
  }
}

export const useBoardStore = create<BoardStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tasks: [],
        currentTeamId: '',
        isLoading: false,
        error: null,
        
        cache: {},
        
        // UI State - Task Creation
        showNewTaskForm: null,
        showNewTaskModal: false,
        newTaskStatus: null,
        newTaskData: {
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignedTo: '',
          dueDate: '',
          attachments: []
        },
        isCreatingTask: false,
        
        // UI State - Task Editing
        selectedTask: null,
        isEditingTask: false,
        editingTaskData: {},
        
        // UI State - Drag and Drop
        draggedTask: null,
        
        // UI State - Filters and Search
        searchTerm: '',
        priorityFilter: 'ALL',
        assigneeFilter: 'ALL',
        dueDateFilter: 'ALL',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        showFilters: false,
        
        // Column Configuration State
        columns: [],
        isLoadingColumns: false,
        showColumnSettings: false,
        
        // Task Activity History State
        taskActivities: {},
        isLoadingActivities: {},
        activityError: {},
        
        // Cache management
        getCachedData: <T>(key: string): T | null => {
          const cached = get().cache[key];
          if (!cached) return null;
          
          const now = Date.now();
          if (now > cached.timestamp + cached.expiresIn) {
            // Remove expired cache
            const newCache = { ...get().cache };
            delete newCache[key];
            set({ cache: newCache });
            return null;
          }
          
          return cached.data;
        },
        
        setCachedData: <T>(key: string, data: T, expiresIn = CACHE_DURATIONS.TASKS) => {
          const newCache = { ...get().cache };
          newCache[key] = {
            data,
            timestamp: Date.now(),
            expiresIn,
          };
          set({ cache: newCache });
        },
        
        clearCache: (key) => {
          const newCache = { ...get().cache };
          if (key) {
            delete newCache[key];
          } else {
            // Clear all cache entries
            Object.keys(newCache).forEach(k => delete newCache[k]);
          }
          set({ cache: newCache });
        },
        
        // Data Management Actions
        setCurrentTeamId: (teamId) => {
          set((state) => ({
            ...state,
            currentTeamId: teamId,
            // Clear tasks when switching teams
            tasks: [],
            error: null,
            // Reset UI state
            showNewTaskForm: null,
            selectedTask: null,
            isEditingTask: false,
            editingTaskData: {}
          }));
        },
        
        fetchTasks: async (teamId, forceRefresh = false) => {
          if (!teamId) return;
          
          const cacheKey = `tasks-${teamId}`;
          const currentState = get();
          
          // Check cache first unless force refresh
          if (!forceRefresh) {
            const cached = get().getCachedData<Task[]>(cacheKey);
            if (cached) {
              // Only show loading if we don't have tasks yet or switching teams
              const shouldShowLoading = currentState.tasks.length === 0 || currentState.currentTeamId !== teamId;
              
              if (shouldShowLoading) {
                set((state) => ({
                  ...state,
                  isLoading: true,
                  error: null
                }));
                
                // Brief delay for smooth UX
                await new Promise(resolve => setTimeout(resolve, 150));
              }
              
              set({ 
                tasks: cached,
                isLoading: false 
              });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            isLoading: true,
            error: null
          }));
          
          try {
            const result = await apiCall<{ success: boolean; tasks: Task[] }>(`/api/tasks?teamId=${teamId}`);
            
            if (result.success && result.tasks) {
              // Cache and set data
              get().setCachedData(cacheKey, result.tasks, CACHE_DURATIONS.TASKS);
              
              set((state) => ({
                ...state,
                tasks: result.tasks,
                isLoading: false
              }));
            } else {
              throw new Error('Failed to load tasks');
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to load tasks',
              code: 'TASKS_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              error: apiError,
              isLoading: false
            }));
          }
        },
        
        createTask: async (taskData, status) => {
          const { currentTeamId } = get();
          
          set((state) => ({
            ...state,
            isCreatingTask: true,
            error: null
          }));
          
          try {
            const result = await apiCall<{ success: boolean; task: Task }>('/api/tasks', {
              method: 'POST',
              body: JSON.stringify({
                ...taskData,
                status,
                teamId: currentTeamId,
                teamName: `Team ${currentTeamId.replace('team-', '')}`,
              }),
            });
            
            if (result.success && result.task) {
              // Add new task to state
              set((state) => ({
                ...state,
                tasks: [...state.tasks, result.task],
                isCreatingTask: false,
                showNewTaskForm: null,
                showNewTaskModal: false,
                newTaskData: {
                  title: '',
                  description: '',
                  priority: 'MEDIUM',
                  assignedTo: '',
                  dueDate: '',
                  attachments: []
                }
              }));
              
              // Invalidate cache
              get().clearCache(`tasks-${currentTeamId}`);
            } else {
              throw new Error('Failed to create task');
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to create task',
              code: 'TASK_CREATE_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              error: apiError,
              isCreatingTask: false
            }));
            
            throw error;
          }
        },
        
        updateTaskStatus: async (taskId, newStatus) => {
          const currentTask = get().tasks.find(task => task.id === taskId);
          if (!currentTask) return;
          
          // Add small delay to prevent rapid visual updates
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Optimistic update
          const updatedTask = { ...currentTask, status: newStatus, updatedAt: new Date().toISOString() };
          set((state) => ({
            ...state,
            tasks: state.tasks.map(task => 
              task.id === taskId ? updatedTask : task
            )
          }));
          
          try {
            const result = await apiCall<{ success: boolean; task: Task }>('/api/tasks', {
              method: 'PUT',
              body: JSON.stringify({
                id: taskId,
                status: newStatus,
              }),
            });
            
            if (result.success && result.task) {
              // Update with server response
              set((state) => ({
                ...state,
                tasks: state.tasks.map(task => 
                  task.id === taskId ? result.task : task
                )
              }));
              
              // Invalidate cache
              get().clearCache(`tasks-${get().currentTeamId}`);
            } else {
              // Revert optimistic update
              set((state) => ({
                ...state,
                tasks: state.tasks.map(task => 
                  task.id === taskId ? currentTask : task
                )
              }));
              throw new Error('Failed to update task');
            }
          } catch (error) {
            // Revert optimistic update
            set((state) => ({
              ...state,
              tasks: state.tasks.map(task => 
                task.id === taskId ? currentTask : task
              )
            }));
            
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to update task',
              code: 'TASK_UPDATE_ERROR',
              timestamp: Date.now(),
            };
            
            set({ error: apiError });
            throw error;
          }
        },
        
        updateTask: async (taskId, updates) => {
          const currentTask = get().tasks.find(task => task.id === taskId);
          if (!currentTask) return;
          
          // Optimistic update
          const updatedTask = { ...currentTask, ...updates, updatedAt: new Date().toISOString() };
          set((state) => ({
            ...state,
            tasks: state.tasks.map(task => 
              task.id === taskId ? updatedTask : task
            )
          }));
          
          try {
            const result = await apiCall<{ success: boolean; task: Task }>('/api/tasks', {
              method: 'PUT',
              body: JSON.stringify({
                id: taskId,
                ...updates,
              }),
            });
            
            if (result.success && result.task) {
              // Update with server response
              const isAttachmentOnlyUpdate = Object.keys(updates).length === 1 && 'attachments' in updates;
              
              set((state) => ({
                ...state,
                tasks: state.tasks.map(task => 
                  task.id === taskId ? result.task : task
                ),
                selectedTask: result.task,
                // Don't close edit mode if it's just an attachment update
                isEditingTask: isAttachmentOnlyUpdate ? state.isEditingTask : false,
                editingTaskData: isAttachmentOnlyUpdate ? { ...state.editingTaskData, attachments: result.task.attachments } : {}
              }));
              
              // Invalidate cache
              get().clearCache(`tasks-${get().currentTeamId}`);
            } else {
              // Revert optimistic update
              set((state) => ({
                ...state,
                tasks: state.tasks.map(task => 
                  task.id === taskId ? currentTask : task
                )
              }));
              throw new Error('Failed to update task');
            }
          } catch (error) {
            // Revert optimistic update
            set((state) => ({
              ...state,
              tasks: state.tasks.map(task => 
                task.id === taskId ? currentTask : task
              )
            }));
            
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to update task',
              code: 'TASK_UPDATE_ERROR',
              timestamp: Date.now(),
            };
            
            set({ error: apiError });
            throw error;
          }
        },
        
        deleteTask: async (taskId) => {
          const currentTasks = get().tasks;
          
          // Optimistic update - remove task immediately
          set((state) => ({
            ...state,
            tasks: state.tasks.filter(task => task.id !== taskId),
            selectedTask: null
          }));
          
          try {
            const result = await apiCall<{ success: boolean }>(`/api/tasks?id=${taskId}`, {
              method: 'DELETE',
            });
            
            if (result.success) {
              // Invalidate cache
              get().clearCache(`tasks-${get().currentTeamId}`);
            } else {
              // Revert optimistic update
              set({ tasks: currentTasks });
              throw new Error('Failed to delete task');
            }
          } catch (error) {
            // Revert optimistic update
            set({ tasks: currentTasks });
            
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to delete task',
              code: 'TASK_DELETE_ERROR',
              timestamp: Date.now(),
            };
            
            set({ error: apiError });
            throw error;
          }
        },
        
        // UI State Management Actions
        setShowNewTaskForm: (status) => set({ showNewTaskForm: status }),
        setShowNewTaskModal: (show) => set({ showNewTaskModal: show }),
        setNewTaskStatus: (status) => set({ newTaskStatus: status }),
        setNewTaskData: (data) => {
          console.log('setNewTaskData called with:', data);
          set((state) => {
            const newData = { ...state.newTaskData, ...data };
            console.log('Current newTaskData:', state.newTaskData, 'New data:', newData);
            return {
              ...state,
              newTaskData: newData
            };
          });
        },
        setSelectedTask: (task) => set({ selectedTask: task }),
        setIsEditingTask: (editing) => set({ isEditingTask: editing }),
        setEditingTaskData: (data) => set((state) => ({
          ...state,
          editingTaskData: { ...state.editingTaskData, ...data }
        })),
        setDraggedTask: (task) => set({ draggedTask: task }),
        
        // Filters and Search Actions
        setSearchTerm: (term) => set({ searchTerm: term }),
        setPriorityFilter: (filter) => set({ priorityFilter: filter }),
        setAssigneeFilter: (filter) => set({ assigneeFilter: filter }),
        setDueDateFilter: (filter) => set({ dueDateFilter: filter }),
        setSortBy: (field) => set({ sortBy: field }),
        setSortOrder: (order) => set({ sortOrder: order }),
        setShowFilters: (show) => set({ showFilters: show }),
        
        // Column Management Actions
        fetchColumns: async (teamId: string, forceRefresh = false) => {
          const cacheKey = `columns-${teamId}`;
          const cached = get().getCachedData<BoardColumn[]>(cacheKey);
          
          if (!forceRefresh && cached) {
            set({ columns: cached, isLoadingColumns: false });
            return;
          }

          set({ isLoadingColumns: true });
          try {
            const response = await apiCall<{ success: boolean; columns: BoardColumn[] }>(
              `/api/board-columns?teamId=${encodeURIComponent(teamId)}`
            );

            if (response.success) {
              set({ columns: response.columns, isLoadingColumns: false });
              get().setCachedData(cacheKey, response.columns);
            }
          } catch (error) {
            console.error('Failed to fetch columns:', error);
            set({ 
              error: { 
                message: 'Failed to load board columns', 
                code: 'FETCH_COLUMNS_ERROR', 
                timestamp: Date.now() 
              },
              isLoadingColumns: false 
            });
          }
        },

        createColumn: async (column) => {
          try {
            const response = await apiCall<{ success: boolean; column: BoardColumn }>(
              '/api/board-columns',
              {
                method: 'POST',
                body: JSON.stringify(column),
              }
            );

            if (response.success) {
              // Add the new column to the state
              set((state) => ({
                columns: [...state.columns, response.column].sort((a, b) => a.position - b.position)
              }));
              
              // Clear cache to force refresh
              get().clearCache(`columns-${column.teamId}`);
            }
          } catch (error) {
            console.error('Failed to create column:', error);
            set({ 
              error: { 
                message: 'Failed to create column', 
                code: 'CREATE_COLUMN_ERROR', 
                timestamp: Date.now() 
              }
            });
          }
        },

        updateColumn: async (columnId: string, updates) => {
          try {
            const response = await apiCall<{ success: boolean; column: BoardColumn }>(
              '/api/board-columns',
              {
                method: 'PUT',
                body: JSON.stringify({ id: columnId, ...updates }),
              }
            );

            if (response.success) {
              // Update the column in state
              set((state) => ({
                columns: state.columns.map(col => 
                  col.id === columnId ? response.column : col
                ).sort((a, b) => a.position - b.position)
              }));
              
              // Clear cache to force refresh
              const column = get().columns.find(c => c.id === columnId);
              if (column) {
                get().clearCache(`columns-${column.teamId}`);
              }
            }
          } catch (error) {
            console.error('Failed to update column:', error);
            set({ 
              error: { 
                message: 'Failed to update column', 
                code: 'UPDATE_COLUMN_ERROR', 
                timestamp: Date.now() 
              }
            });
          }
        },

        deleteColumn: async (columnId: string) => {
          try {
            const response = await apiCall<{ success: boolean }>(
              `/api/board-columns?id=${encodeURIComponent(columnId)}`,
              { method: 'DELETE' }
            );

            if (response.success) {
              // Remove the column from state
              const column = get().columns.find(c => c.id === columnId);
              set((state) => ({
                columns: state.columns.filter(col => col.id !== columnId)
              }));
              
              // Clear cache to force refresh
              if (column) {
                get().clearCache(`columns-${column.teamId}`);
              }
            }
          } catch (error) {
            console.error('Failed to delete column:', error);
            set({ 
              error: { 
                message: 'Failed to delete column', 
                code: 'DELETE_COLUMN_ERROR', 
                timestamp: Date.now() 
              }
            });
          }
        },

        reorderColumns: async (columns) => {
          const teamId = columns[0]?.teamId;
          if (!teamId) return;

          // Optimistic update - immediately update local state
          set({ columns: columns.sort((a, b) => a.position - b.position) });

          try {
            const response = await apiCall<{ success: boolean; columns: BoardColumn[] }>(
              '/api/board-columns/reorder',
              {
                method: 'POST',
                body: JSON.stringify({
                  teamId,
                  columnIds: columns.map(c => c.id)
                }),
              }
            );

            if (response.success) {
              // Update with server response to ensure consistency
              set({ columns: response.columns });
              get().clearCache(`columns-${teamId}`);
            } else {
              // If server update failed, revert to original order
              // We could fetch fresh data here as a fallback
              console.error('Server reorder failed, consider reverting or refetching');
            }
          } catch (error) {
            console.error('Failed to reorder columns:', error);
            // In case of error, we could revert the optimistic update
            // For now, we'll let the user try again or the data will sync on next fetch
            set({ 
              error: { 
                message: 'Failed to reorder columns', 
                code: 'REORDER_COLUMNS_ERROR', 
                timestamp: Date.now() 
              }
            });
          }
        },

        resetToDefaultColumns: async (teamId: string) => {
          try {
            const response = await apiCall<{ success: boolean; columns: BoardColumn[] }>(
              '/api/board-columns/reset',
              {
                method: 'POST',
                body: JSON.stringify({ teamId }),
              }
            );

            if (response.success) {
              set({ columns: response.columns });
              get().clearCache(`columns-${teamId}`);
            }
          } catch (error) {
            console.error('Failed to reset columns:', error);
            set({ 
              error: { 
                message: 'Failed to reset columns', 
                code: 'RESET_COLUMNS_ERROR', 
                timestamp: Date.now() 
              }
            });
          }
        },

        setShowColumnSettings: (show) => set({ showColumnSettings: show }),
        
        // Task Activity History Actions
        fetchTaskActivities: async (taskId: string, teamId: string, forceRefresh = false) => {
          if (!taskId || !teamId) return;
          
          const cacheKey = `activities-${taskId}`;
          
          // Check cache first unless force refresh
          if (!forceRefresh) {
            const cached = get().getCachedData<TaskActivity[]>(cacheKey);
            if (cached) {
              set((state) => ({
                taskActivities: { ...state.taskActivities, [taskId]: cached },
                isLoadingActivities: { ...state.isLoadingActivities, [taskId]: false },
                activityError: { ...state.activityError, [taskId]: null }
              }));
              return;
            }
          }
          
          // Set loading state
          set((state) => ({
            isLoadingActivities: { ...state.isLoadingActivities, [taskId]: true },
            activityError: { ...state.activityError, [taskId]: null }
          }));
          
          try {
            // Fetch both activities and columns in parallel
            const [activitiesResponse, columnsResponse] = await Promise.all([
              apiCall<{ success: boolean; activities: TaskActivity[] }>(`/api/tasks/${taskId}/activity`),
              apiCall<{ success: boolean; columns: BoardColumn[] }>(`/api/board-columns?teamId=${teamId}`)
            ]);
            
            if (activitiesResponse.success) {
              const activities = (activitiesResponse.activities || []).reverse(); // Oldest first
              
              // Cache the data
              get().setCachedData(cacheKey, activities, CACHE_DURATIONS.ACTIVITIES);
              
              // Update state
              set((state) => ({
                taskActivities: { ...state.taskActivities, [taskId]: activities },
                isLoadingActivities: { ...state.isLoadingActivities, [taskId]: false },
                activityError: { ...state.activityError, [taskId]: null }
              }));
              
              // Update columns cache if successful
              if (columnsResponse.success && columnsResponse.columns) {
                const columnsCacheKey = `columns-${teamId}`;
                get().setCachedData(columnsCacheKey, columnsResponse.columns);
                set({ columns: columnsResponse.columns });
              }
            } else {
              throw new Error('Failed to fetch activity history');
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to load activity history',
              code: 'ACTIVITIES_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              activityError: { ...state.activityError, [taskId]: apiError },
              isLoadingActivities: { ...state.isLoadingActivities, [taskId]: false }
            }));
          }
        },
        
        clearTaskActivities: (taskId?: string) => {
          if (taskId) {
            // Clear specific task activities
            set((state) => {
              const newTaskActivities = { ...state.taskActivities };
              const newIsLoadingActivities = { ...state.isLoadingActivities };
              const newActivityError = { ...state.activityError };
              
              delete newTaskActivities[taskId];
              delete newIsLoadingActivities[taskId];
              delete newActivityError[taskId];
              
              return {
                taskActivities: newTaskActivities,
                isLoadingActivities: newIsLoadingActivities,
                activityError: newActivityError
              };
            });
            
            // Clear from cache
            get().clearCache(`activities-${taskId}`);
          } else {
            // Clear all task activities
            set({
              taskActivities: {},
              isLoadingActivities: {},
              activityError: {}
            });
            
            // Clear all activity caches
            const cache = get().cache;
            Object.keys(cache).forEach(key => {
              if (key.startsWith('activities-')) {
                get().clearCache(key);
              }
            });
          }
        },
        
        // Error Handling Actions
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'board-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist UI state, not data or cache
          searchTerm: state.searchTerm,
          priorityFilter: state.priorityFilter,
          assigneeFilter: state.assigneeFilter,
          dueDateFilter: state.dueDateFilter,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          showFilters: state.showFilters,
          // Don't persist tasks, cache, loading states, or errors
        }),
      }
    ),
    {
      name: 'board-store',
    }
  )
);

// Utility hooks for easier access to specific state slices
export const useBoardTasks = () => {
  const tasks = useBoardStore((state) => state.tasks);
  const isLoading = useBoardStore((state) => state.isLoading);
  const error = useBoardStore((state) => state.error);
  const currentTeamId = useBoardStore((state) => state.currentTeamId);
  const fetchTasks = useBoardStore((state) => state.fetchTasks);
  const setCurrentTeamId = useBoardStore((state) => state.setCurrentTeamId);
  
  return { tasks, isLoading, error, currentTeamId, fetchTasks, setCurrentTeamId };
};

export const useBoardFilters = () => {
  const searchTerm = useBoardStore((state) => state.searchTerm);
  const priorityFilter = useBoardStore((state) => state.priorityFilter);
  const assigneeFilter = useBoardStore((state) => state.assigneeFilter);
  const dueDateFilter = useBoardStore((state) => state.dueDateFilter);
  const sortBy = useBoardStore((state) => state.sortBy);
  const sortOrder = useBoardStore((state) => state.sortOrder);
  const showFilters = useBoardStore((state) => state.showFilters);
  
  const setSearchTerm = useBoardStore((state) => state.setSearchTerm);
  const setPriorityFilter = useBoardStore((state) => state.setPriorityFilter);
  const setAssigneeFilter = useBoardStore((state) => state.setAssigneeFilter);
  const setDueDateFilter = useBoardStore((state) => state.setDueDateFilter);
  const setSortBy = useBoardStore((state) => state.setSortBy);
  const setSortOrder = useBoardStore((state) => state.setSortOrder);
  const setShowFilters = useBoardStore((state) => state.setShowFilters);
  
  return {
    searchTerm,
    priorityFilter,
    assigneeFilter,
    dueDateFilter,
    sortBy,
    sortOrder,
    showFilters,
    setSearchTerm,
    setPriorityFilter,
    setAssigneeFilter,
    setDueDateFilter,
    setSortBy,
    setSortOrder,
    setShowFilters,
  };
};

export const useBoardTaskActions = () => {
  const createTask = useBoardStore((state) => state.createTask);
  const updateTaskStatus = useBoardStore((state) => state.updateTaskStatus);
  const updateTask = useBoardStore((state) => state.updateTask);
  const deleteTask = useBoardStore((state) => state.deleteTask);
  const clearCache = useBoardStore((state) => state.clearCache);
  
  return { createTask, updateTaskStatus, updateTask, deleteTask, clearCache };
};

export const useBoardColumns = () => {
  const columns = useBoardStore((state) => state.columns);
  const isLoadingColumns = useBoardStore((state) => state.isLoadingColumns);
  const showColumnSettings = useBoardStore((state) => state.showColumnSettings);
  
  const fetchColumns = useBoardStore((state) => state.fetchColumns);
  const createColumn = useBoardStore((state) => state.createColumn);
  const updateColumn = useBoardStore((state) => state.updateColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  const reorderColumns = useBoardStore((state) => state.reorderColumns);
  const resetToDefaultColumns = useBoardStore((state) => state.resetToDefaultColumns);
  const setShowColumnSettings = useBoardStore((state) => state.setShowColumnSettings);
  
  return {
    columns,
    isLoadingColumns,
    showColumnSettings,
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    resetToDefaultColumns,
    setShowColumnSettings,
  };
};

export const useTaskActivities = (taskId: string) => {
  const taskActivities = useBoardStore((state) => state.taskActivities[taskId]);
  const isLoadingActivities = useBoardStore((state) => state.isLoadingActivities[taskId]);
  const activityError = useBoardStore((state) => state.activityError[taskId]);
  const columns = useBoardStore((state) => state.columns);
  
  const fetchTaskActivities = useBoardStore((state) => state.fetchTaskActivities);
  const clearTaskActivities = useBoardStore((state) => state.clearTaskActivities);
  
  return {
    activities: taskActivities || [],
    isLoading: isLoadingActivities || false,
    error: activityError || null,
    columns,
    fetchTaskActivities,
    clearTaskActivities,
  };
};