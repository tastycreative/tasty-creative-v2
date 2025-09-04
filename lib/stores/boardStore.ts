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
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
  
  // Actions - Error Handling
  setError: (error: APIError | null) => void;
  clearError: () => void;
}

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  TASKS: 2 * 60 * 1000, // 2 minutes (active updates)
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