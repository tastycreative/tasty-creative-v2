"use client";

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

// Types for different sheet viewers
export interface ScheduleDataItem {
  type: string;
  status: string;
}

export interface ScheduleCheckerItem {
  text: string;
  checker: string;
}

export interface ScheduleCheckerData {
  massMessages: ScheduleCheckerItem[];
  wallPosts: ScheduleCheckerItem[];
}

export interface FullScheduleSetupItem {
  mmTime: string;
  massMessageType: string;
  postTime: string;
  wallPostType: string;
  storyTime: string;
  storyPostTime: string;
}

export interface SchedulerData {
  schedulerData: ScheduleDataItem[];
  scheduleCheckerData: ScheduleCheckerData;
  fullScheduleSetup: FullScheduleSetupItem[];
  currentSchedule: string;
  lastUpdated: string;
}

export interface CreatorDataItem {
  text: string;
  checker: string;
}

export interface CreatorData {
  massMessages: CreatorDataItem[];
  wallPosts: CreatorDataItem[];
  currentSchedule?: string;
  lastUpdated: string;
}

export interface AnalystData {
  // Define analyst sheet data structure here  
  [key: string]: any;
}

export interface DefaultSheetData {
  // Define default sheet data structure here
  [key: string]: any;
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

// Loading states
export interface LoadingStates {
  schedulerData: boolean;
  creatorData: boolean;
  analystData: boolean;
  defaultSheetData: boolean;
}

export interface SheetStore {
  // Cache
  cache: Record<string, CacheEntry<any>>;
  
  // Data for different sheet types
  schedulerData: SchedulerData | null;
  creatorData: CreatorData | null;
  analystData: AnalystData | null;
  defaultSheetData: DefaultSheetData | null;
  
  // Loading states
  loading: LoadingStates;
  
  // Errors
  errors: {
    schedulerData: APIError | null;
    creatorData: APIError | null;
    analystData: APIError | null;
    defaultSheetData: APIError | null;
  };
  
  // UI state for scheduler
  selectedSchedule: string;
  isUpdating: boolean;
  
  // Actions
  setSelectedSchedule: (schedule: string) => void;
  setIsUpdating: (updating: boolean) => void;
  
  // Data fetching with caching
  fetchSchedulerData: (sheetUrl: string, forceRefresh?: boolean) => Promise<void>;
  updateSchedule: (sheetUrl: string, scheduleValue: string) => Promise<void>;
  fetchCreatorData: (sheetUrl: string, forceRefresh?: boolean) => Promise<void>;
  fetchAnalystData: (sheetUrl: string, forceRefresh?: boolean) => Promise<void>;
  fetchDefaultSheetData: (sheetUrl: string, forceRefresh?: boolean) => Promise<void>;
  
  // Data clearing
  clearSchedulerData: () => void;
  clearCreatorData: () => void;
  
  // Cache management
  getCachedData: <T>(key: string) => T | null;
  setCachedData: <T>(key: string, data: T, expiresIn?: number) => void;
  clearCache: (key?: string) => void;
  
  // Error handling
  setError: (key: keyof SheetStore['errors'], error: APIError | null) => void;
  clearErrors: () => void;
}

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  SCHEDULER_DATA: 2 * 60 * 1000, // 2 minutes
  CREATOR_DATA: 5 * 60 * 1000, // 5 minutes
  ANALYST_DATA: 5 * 60 * 1000, // 5 minutes
  DEFAULT_SHEET_DATA: 10 * 60 * 1000, // 10 minutes
};

// API helper with retry logic and better error handling
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

export const useSheetStore = create<SheetStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        cache: {},
        
        schedulerData: null,
        creatorData: null,
        analystData: null,
        defaultSheetData: null,
        
        loading: {
          schedulerData: false,
          creatorData: false,
          analystData: false,
          defaultSheetData: false,
        },
        
        errors: {
          schedulerData: null,
          creatorData: null,
          analystData: null,
          defaultSheetData: null,
        },
        
        selectedSchedule: "1A",
        isUpdating: false,
        
        // Actions
        setSelectedSchedule: (schedule) => set({ selectedSchedule: schedule }),
        setIsUpdating: (updating) => set({ isUpdating: updating }),
        
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
        
        setCachedData: <T>(key: string, data: T, expiresIn = CACHE_DURATIONS.SCHEDULER_DATA) => {
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
        
        // Data clearing methods
        clearSchedulerData: () => {
          set((state) => ({
            ...state,
            schedulerData: null
          }));
        },
        
        clearCreatorData: () => {
          set((state) => ({
            ...state,
            creatorData: null
          }));
        },

        // Data fetching methods
        fetchSchedulerData: async (sheetUrl, forceRefresh = false) => {
          const cacheKey = `scheduler-data-${sheetUrl}`;
          
          // Clear existing data first to prevent showing stale data
          get().clearSchedulerData();
          
          // Check cache first unless force refresh
          if (!forceRefresh) {
            const cached = get().getCachedData<SchedulerData>(cacheKey);
            if (cached) {
              set({ schedulerData: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, schedulerData: true },
            errors: { ...state.errors, schedulerData: null }
          }));
          
          try {
            const result = await apiCall<{
              schedulerData: ScheduleDataItem[];
              scheduleCheckerData: ScheduleCheckerData;
              fullScheduleSetup: FullScheduleSetupItem[];
              currentSchedule: string;
            }>('/api/pod/scheduler', {
              method: 'POST',
              body: JSON.stringify({ sheetUrl }),
            });
            
            const schedulerData: SchedulerData = {
              schedulerData: result.schedulerData || [],
              scheduleCheckerData: result.scheduleCheckerData || { massMessages: [], wallPosts: [] },
              fullScheduleSetup: result.fullScheduleSetup || [],
              currentSchedule: result.currentSchedule || 'Schedule #1A',
              lastUpdated: new Date().toISOString(),
            };
            
            // Cache and set data
            get().setCachedData(cacheKey, schedulerData, CACHE_DURATIONS.SCHEDULER_DATA);
            
            set((state) => ({
              ...state,
              schedulerData,
              loading: { ...state.loading, schedulerData: false }
            }));
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch scheduler data',
              code: 'SCHEDULER_DATA_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, schedulerData: apiError },
              loading: { ...state.loading, schedulerData: false }
            }));
            
            throw error;
          }
        },
        
        updateSchedule: async (sheetUrl, scheduleValue) => {
          set({ isUpdating: true });
          
          try {
            const result = await apiCall<{
              success: boolean;
              message: string;
              schedulerData: ScheduleDataItem[];
              scheduleCheckerData: ScheduleCheckerData;
              fullScheduleSetup: FullScheduleSetupItem[];
              currentSchedule: string;
            }>('/api/pod/scheduler/update', {
              method: 'POST',
              body: JSON.stringify({ sheetUrl, scheduleValue }),
            });
            
            if (result.success) {
              const schedulerData: SchedulerData = {
                schedulerData: result.schedulerData || [],
                scheduleCheckerData: result.scheduleCheckerData || { massMessages: [], wallPosts: [] },
                fullScheduleSetup: result.fullScheduleSetup || [],
                currentSchedule: result.currentSchedule || `Schedule #${scheduleValue}`,
                lastUpdated: new Date().toISOString(),
              };
              
              // Update cache and state
              const cacheKey = `scheduler-data-${sheetUrl}`;
              get().setCachedData(cacheKey, schedulerData, CACHE_DURATIONS.SCHEDULER_DATA);
              
              set((state) => ({
                ...state,
                schedulerData,
                selectedSchedule: scheduleValue,
                isUpdating: false
              }));
            } else {
              throw new Error(result.message || 'Failed to update schedule');
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to update schedule',
              code: 'SCHEDULER_UPDATE_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, schedulerData: apiError },
              isUpdating: false
            }));
            
            throw error;
          }
        },
        
        fetchCreatorData: async (sheetUrl, forceRefresh = false) => {
          const cacheKey = `creator-data-${sheetUrl}`;
          
          // Clear existing data first to prevent showing stale data
          get().clearCreatorData();
          
          if (!forceRefresh) {
            const cached = get().getCachedData<CreatorData>(cacheKey);
            if (cached) {
              set({ creatorData: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, creatorData: true },
            errors: { ...state.errors, creatorData: null }
          }));
          
          try {
            const result = await apiCall<{
              massMessages: CreatorDataItem[];
              wallPosts: CreatorDataItem[];
              currentSchedule?: string;
            }>('/api/pod/creator', {
              method: 'POST',
              body: JSON.stringify({ sheetUrl }),
            });
            
            const creatorData: CreatorData = {
              massMessages: result.massMessages || [],
              wallPosts: result.wallPosts || [],
              currentSchedule: result.currentSchedule,
              lastUpdated: new Date().toISOString(),
            };
            
            get().setCachedData(cacheKey, creatorData, CACHE_DURATIONS.CREATOR_DATA);
            
            set((state) => ({
              ...state,
              creatorData,
              loading: { ...state.loading, creatorData: false }
            }));
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch creator data',
              code: 'CREATOR_DATA_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, creatorData: apiError },
              loading: { ...state.loading, creatorData: false }
            }));
            
            throw error;
          }
        },
        
        fetchAnalystData: async (sheetUrl, forceRefresh = false) => {
          const cacheKey = `analyst-data-${sheetUrl}`;
          
          if (!forceRefresh) {
            const cached = get().getCachedData<AnalystData>(cacheKey);
            if (cached) {
              set({ analystData: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, analystData: true },
            errors: { ...state.errors, analystData: null }
          }));
          
          try {
            // TODO: Implement analyst data fetching API call
            const result = {}; // Placeholder
            
            get().setCachedData(cacheKey, result, CACHE_DURATIONS.ANALYST_DATA);
            
            set((state) => ({
              ...state,
              analystData: result,
              loading: { ...state.loading, analystData: false }
            }));
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch analyst data',
              code: 'ANALYST_DATA_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, analystData: apiError },
              loading: { ...state.loading, analystData: false }
            }));
            
            throw error;
          }
        },
        
        fetchDefaultSheetData: async (sheetUrl, forceRefresh = false) => {
          const cacheKey = `default-sheet-data-${sheetUrl}`;
          
          if (!forceRefresh) {
            const cached = get().getCachedData<DefaultSheetData>(cacheKey);
            if (cached) {
              set({ defaultSheetData: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, defaultSheetData: true },
            errors: { ...state.errors, defaultSheetData: null }
          }));
          
          try {
            // TODO: Implement default sheet data fetching API call
            const result = {}; // Placeholder
            
            get().setCachedData(cacheKey, result, CACHE_DURATIONS.DEFAULT_SHEET_DATA);
            
            set((state) => ({
              ...state,
              defaultSheetData: result,
              loading: { ...state.loading, defaultSheetData: false }
            }));
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch default sheet data',
              code: 'DEFAULT_SHEET_DATA_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, defaultSheetData: apiError },
              loading: { ...state.loading, defaultSheetData: false }
            }));
            
            throw error;
          }
        },
        
        // Error handling
        setError: (key, error) =>
          set((state) => ({
            ...state,
            errors: { ...state.errors, [key]: error }
          })),
          
        clearErrors: () =>
          set((state) => ({
            ...state,
            errors: {
              schedulerData: null,
              creatorData: null,
              analystData: null,
              defaultSheetData: null,
            }
          })),
      })),
      {
        name: 'sheet-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist UI state, not loading states, errors, or cache
          selectedSchedule: state.selectedSchedule,
          // Don't persist cache as it has expiration logic
          // Don't persist loading states or errors as they should be fresh on reload
        }),
      }
    )
);

// Utility hooks for easier access to specific state slices
export const useSchedulerData = () => {
  const schedulerData = useSheetStore((state) => state.schedulerData);
  const loading = useSheetStore((state) => state.loading.schedulerData);
  const error = useSheetStore((state) => state.errors.schedulerData);
  const selectedSchedule = useSheetStore((state) => state.selectedSchedule);
  const isUpdating = useSheetStore((state) => state.isUpdating);
  const fetchSchedulerData = useSheetStore((state) => state.fetchSchedulerData);
  const updateSchedule = useSheetStore((state) => state.updateSchedule);
  const setSelectedSchedule = useSheetStore((state) => state.setSelectedSchedule);
  const clearCache = useSheetStore((state) => state.clearCache);
  const clearSchedulerData = useSheetStore((state) => state.clearSchedulerData);
  
  return { 
    schedulerData, 
    loading, 
    error, 
    selectedSchedule,
    isUpdating,
    fetchSchedulerData, 
    updateSchedule,
    setSelectedSchedule,
    clearCache,
    clearSchedulerData
  };
};

export const useCreatorData = () => {
  const creatorData = useSheetStore((state) => state.creatorData);
  const loading = useSheetStore((state) => state.loading.creatorData);
  const error = useSheetStore((state) => state.errors.creatorData);
  const fetchCreatorData = useSheetStore((state) => state.fetchCreatorData);
  
  return { creatorData, loading, error, fetchCreatorData };
};

export const useAnalystData = () => {
  const analystData = useSheetStore((state) => state.analystData);
  const loading = useSheetStore((state) => state.loading.analystData);
  const error = useSheetStore((state) => state.errors.analystData);
  const fetchAnalystData = useSheetStore((state) => state.fetchAnalystData);
  
  return { analystData, loading, error, fetchAnalystData };
};

export const useDefaultSheetData = () => {
  const defaultSheetData = useSheetStore((state) => state.defaultSheetData);
  const loading = useSheetStore((state) => state.loading.defaultSheetData);
  const error = useSheetStore((state) => state.errors.defaultSheetData);
  const fetchDefaultSheetData = useSheetStore((state) => state.fetchDefaultSheetData);
  
  return { defaultSheetData, loading, error, fetchDefaultSheetData };
};