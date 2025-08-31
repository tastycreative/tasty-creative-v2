"use client";

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface Creator {
  id: string;
  name: string;
  guaranteed?: string;
  rowNumber?: number;
}

export interface TeamOption {
  row: number;
  name: string;
  label: string;
}

export interface PodData {
  teamName: string;
  teamMembers: TeamMember[];
  creators: Creator[];
  schedulerSpreadsheetUrl?: string;
  sheetLinks?: Array<{ name: string; url: string; cellGroup?: string; id?: string }>;
  rowNumber: number;
  lastUpdated: string;
}

export interface DriveSheet {
  id: string;
  name: string;
  url: string;
  lastModified: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: "not-started" | "in-progress" | "review" | "completed";
  progress: number;
  dueDate: string;
  priority: "low" | "medium" | "high";
}

export interface PricingItem {
  name: string;
  price: string;
  creator: string;
  totalCombinations?: number;
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
  podData: boolean;
  availableTeams: boolean;
  tasks: boolean;
  driveSheets: boolean;
  pricingPreview: boolean;
}

export interface PodStore {
  // State
  selectedRow: number;
  activeTab: 'dashboard' | 'sheets' | 'board' | 'admin' | 'pricing';
  
  // Data
  podData: PodData | null;
  availableTeams: TeamOption[];
  tasks: Task[];
  driveSheets: DriveSheet[];
  pricingPreview: PricingItem[];
  allPricingData: PricingItem[];
  
  // Cache
  cache: Record<string, CacheEntry<any>>;
  
  // Loading states
  loading: LoadingStates;
  
  // Errors
  errors: {
    podData: APIError | null;
    availableTeams: APIError | null;
    tasks: APIError | null;
    driveSheets: APIError | null;
    pricingPreview: APIError | null;
  };
  
  // UI state
  pricingRotationProgress: number;
  openSheetGroups: Record<string, boolean>;
  
  // Actions
  setSelectedRow: (row: number) => void;
  setActiveTab: (tab: 'dashboard' | 'sheets' | 'board' | 'admin' | 'pricing') => void;
  
  // Data fetching with caching
  fetchPodData: (rowNumber?: number, forceRefresh?: boolean) => Promise<void>;
  fetchAvailableTeams: (forceRefresh?: boolean) => Promise<void>;
  fetchTasks: (teamId: string, forceRefresh?: boolean) => Promise<void>;
  fetchDriveSheets: (creatorNames: string[], forceRefresh?: boolean) => Promise<void>;
  fetchPricingPreview: (creators: Creator[], forceRefresh?: boolean) => Promise<void>;
  
  // Cache management
  getCachedData: <T>(key: string) => T | null;
  setCachedData: <T>(key: string, data: T, expiresIn?: number) => void;
  clearCache: (key?: string) => void;
  
  // UI helpers
  toggleSheetGroup: (groupName: string) => void;
  setPricingRotationProgress: (progress: number | ((prev: number) => number)) => void;
  rotatePricingPreview: () => void;
  
  // Error handling
  setError: (key: keyof PodStore['errors'], error: APIError | null) => void;
  clearErrors: () => void;
}

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  POD_DATA: 5 * 60 * 1000, // 5 minutes
  AVAILABLE_TEAMS: 30 * 60 * 1000, // 30 minutes
  TASKS: 2 * 60 * 1000, // 2 minutes
  DRIVE_SHEETS: 10 * 60 * 1000, // 10 minutes
  PRICING_PREVIEW: 15 * 60 * 1000, // 15 minutes
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

export const usePodStore = create<PodStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - will be overridden by persisted value
        selectedRow: 8, // Default fallback if no persisted value exists
        activeTab: 'dashboard',
        
        podData: null,
        availableTeams: [],
        tasks: [],
        driveSheets: [],
        pricingPreview: [],
        allPricingData: [],
        
        cache: {},
        
        loading: {
          podData: false,
          availableTeams: false,
          tasks: false,
          driveSheets: false,
          pricingPreview: false,
        },
        
        errors: {
          podData: null,
          availableTeams: null,
          tasks: null,
          driveSheets: null,
          pricingPreview: null,
        },
        
        pricingRotationProgress: 0,
        openSheetGroups: {},
        
        // Actions
        setSelectedRow: (row) => {
          console.log(`🔄 setSelectedRow called:`, { oldRow: get().selectedRow, newRow: row });
          set({ selectedRow: row });
        },
          
        setActiveTab: (tab) =>
          set({ activeTab: tab }),
        
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
        
        setCachedData: <T>(key: string, data: T, expiresIn = CACHE_DURATIONS.POD_DATA) => {
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
        
        // Data fetching methods
        fetchPodData: async (rowNumber, forceRefresh = false) => {
          console.log(`📊 fetchPodData called:`, { requestedRowNumber: rowNumber, currentSelectedRow: get().selectedRow, forceRefresh });
          const row = rowNumber ?? get().selectedRow;
          const cacheKey = `pod-data-${row}`;
          
          // Check cache first unless force refresh
          if (!forceRefresh) {
            const cached = get().getCachedData<PodData>(cacheKey);
            if (cached) {
              set({ podData: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, podData: true },
            errors: { ...state.errors, podData: null }
          }));
          
          try {
            // Use new database API endpoint
            const result = await apiCall<{ success: boolean; data: PodData }>('/api/pod/fetch-db', {
              method: 'POST',
              body: JSON.stringify({
                rowId: row,
              }),
            });
            
            if (result.success && result.data) {
              // Note: Creator guaranteed data now comes from database via ModelPodInfoTab
              // This POD store is primarily used for team/sheet management
              // Individual creator guaranteed amounts are handled by useCreatorsDB hook
              
              // Cache and set data
              get().setCachedData(cacheKey, result.data, CACHE_DURATIONS.POD_DATA);
              
              set((state) => ({
                ...state,
                podData: result.data,
                loading: { ...state.loading, podData: false }
              }));
            } else {
              throw new Error(result.error || 'Failed to fetch pod data from database');
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch pod data from database',
              code: 'POD_DATA_DB_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, podData: apiError },
              loading: { ...state.loading, podData: false }
            }));
            
            throw error;
          }
        },
        
        fetchAvailableTeams: async (forceRefresh = false) => {
          const cacheKey = 'available-teams';
          
          if (!forceRefresh) {
            const cached = get().getCachedData<TeamOption[]>(cacheKey);
            if (cached) {
              set({ availableTeams: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, availableTeams: true },
            errors: { ...state.errors, availableTeams: null }
          }));
          
          try {
            // Use new database API endpoint
            const result = await apiCall<{ success: boolean; teams: any[] }>('/api/pod/teams-db');
            
            if (result.success && result.teams) {
              // Transform to TeamOption format
              const teamOptions: TeamOption[] = result.teams.map(team => ({
                row: team.row,
                name: team.name,
                label: team.label
              }));
              
              get().setCachedData(cacheKey, teamOptions, CACHE_DURATIONS.AVAILABLE_TEAMS);
              
              set((state) => ({
                ...state,
                availableTeams: teamOptions,
                loading: { ...state.loading, availableTeams: false }
              }));
            } else {
              throw new Error('Failed to fetch teams from database');
            }
          } catch (error) {
            // Fallback to basic team options
            const fallbackTeams = [
              { row: 8, name: "Team 8", label: "Team 8" },
              { row: 9, name: "Team 9", label: "Team 9" },
              { row: 10, name: "Team 10", label: "Team 10" },
            ];
            
            set((state) => ({
              ...state,
              availableTeams: fallbackTeams,
              errors: { 
                ...state.errors, 
                availableTeams: {
                  message: error instanceof Error ? error.message : 'Failed to fetch teams from database',
                  code: 'TEAMS_DB_FETCH_ERROR',
                  timestamp: Date.now(),
                }
              },
              loading: { ...state.loading, availableTeams: false }
            }));
          }
        },
        
        fetchTasks: async (teamId, forceRefresh = false) => {
          const cacheKey = `tasks-${teamId}`;
          
          if (!forceRefresh) {
            const cached = get().getCachedData<Task[]>(cacheKey);
            if (cached) {
              set({ tasks: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, tasks: true },
            errors: { ...state.errors, tasks: null }
          }));
          
          try {
            const result = await apiCall<{ success: boolean; tasks: any[] }>(`/api/tasks?teamId=${teamId}`);
            
            if (result.success && result.tasks) {
              // Transform tasks to match expected format
              const formattedTasks: Task[] = result.tasks.map((task: any) => {
                const statusMapping: Record<string, Task['status']> = {
                  NOT_STARTED: "not-started",
                  IN_PROGRESS: "in-progress",
                  COMPLETED: "completed",
                  CANCELLED: "review",
                };
                
                return {
                  id: task.id,
                  title: task.title,
                  assignee: task.assignedTo?.split('@')[0] || task.assignedTo || 'Unassigned',
                  status: statusMapping[task.status] || "not-started",
                  progress: task.status === "COMPLETED" ? 100 : task.status === "IN_PROGRESS" ? 50 : 0,
                  dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  priority: (task.priority?.toLowerCase() as Task['priority']) || 'medium',
                };
              });
              
              get().setCachedData(cacheKey, formattedTasks, CACHE_DURATIONS.TASKS);
              
              set((state) => ({
                ...state,
                tasks: formattedTasks,
                loading: { ...state.loading, tasks: false }
              }));
            } else {
              set((state) => ({
                ...state,
                tasks: [],
                loading: { ...state.loading, tasks: false }
              }));
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch tasks',
              code: 'TASKS_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              tasks: [],
              errors: { ...state.errors, tasks: apiError },
              loading: { ...state.loading, tasks: false }
            }));
          }
        },
        
        fetchDriveSheets: async (creatorNames, forceRefresh = false) => {
          const cacheKey = `drive-sheets-${creatorNames.sort().join('-')}`;
          
          if (!forceRefresh) {
            const cached = get().getCachedData<DriveSheet[]>(cacheKey);
            if (cached) {
              set({ driveSheets: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, driveSheets: true },
            errors: { ...state.errors, driveSheets: null }
          }));
          
          try {
            const result = await apiCall<{ success: boolean; sheets: DriveSheet[] }>('/api/drive/sheets', {
              method: 'POST',
              body: JSON.stringify({
                folderId: "1jV4H9nDmseNL8AdvokY8uAOM5am4YC_c",
                creatorNames,
              }),
            });
            
            if (result.success && result.sheets) {
              get().setCachedData(cacheKey, result.sheets, CACHE_DURATIONS.DRIVE_SHEETS);
              
              set((state) => ({
                ...state,
                driveSheets: result.sheets,
                loading: { ...state.loading, driveSheets: false }
              }));
            } else {
              throw new Error(result.error || 'Failed to fetch drive sheets');
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to load sheets from Google Drive',
              code: 'DRIVE_SHEETS_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              driveSheets: [],
              errors: { ...state.errors, driveSheets: apiError },
              loading: { ...state.loading, driveSheets: false }
            }));
          }
        },
        
        fetchPricingPreview: async (creators, forceRefresh = false) => {
          // Always fetch data, even if no creators assigned
          const creatorsToUse = creators && creators.length > 0 ? creators : [
            { id: 'default-1', name: 'Creator 1', rowNumber: 1 },
            { id: 'default-2', name: 'Creator 2', rowNumber: 2 }
          ];
          
          const cacheKey = `pricing-preview-${creatorsToUse.map(c => c.name).sort().join('-')}`;
          
          if (!forceRefresh) {
            const cached = get().getCachedData<{ preview: PricingItem[]; all: PricingItem[] }>(cacheKey);
            if (cached) {
              set((state) => ({
                ...state,
                pricingPreview: cached.preview,
                allPricingData: cached.all
              }));
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, pricingPreview: true },
            errors: { ...state.errors, pricingPreview: null }
          }));
          
          try {
            // Only fetch data for the creators assigned to this team
            const creatorNames = creatorsToUse.map(c => c.name).join(',');
            console.log('🎯 Fetching pricing data from Prisma DB for creators:', creatorNames);
            const result = await apiCall<{ creators: any[], pricingData: any[] }>(`/api/creators-db?creators=${encodeURIComponent(creatorNames)}`);
            console.log('📊 Prisma DB response received:', {
              creatorsCount: result.creators?.length || 0,
              pricingGroupsCount: result.pricingData?.length || 0,
              pricingGroups: result.pricingData?.map(g => ({ id: g.id, name: g.groupName, itemCount: g.items?.length }))
            });
            
            if (result.pricingData && Array.isArray(result.pricingData)) {
              const allItems: string[] = [];
              result.pricingData.forEach((group: any) => {
                if (group.items) {
                  group.items.forEach((item: any) => {
                    if (!allItems.includes(item.name)) {
                      allItems.push(item.name);
                    }
                  });
                }
              });
              
              const allCombinations: PricingItem[] = [];
              allItems.forEach((itemName) => {
                creatorsToUse.forEach((creator) => {
                  let actualPrice = "—";
                  result.pricingData.forEach((group: any) => {
                    if (
                      group.pricing &&
                      group.pricing[creator.name] &&
                      group.pricing[creator.name][itemName]
                    ) {
                      const price = group.pricing[creator.name][itemName];
                      if (price && price !== "—" && price !== "" && price.trim()) {
                        actualPrice = price;
                      }
                    }
                  });
                  
                  // Add all items, even those without pricing (show as "—")
                  allCombinations.push({
                    name: itemName,
                    price: actualPrice, // Will be "—" if no price found
                    creator: creator.name,
                    totalCombinations: 0, // Will be set later
                  });
                });
              });
              
              const totalItems = allCombinations.length;
              const allDataWithTotal = allCombinations.map((item) => ({
                ...item,
                totalCombinations: totalItems,
              }));
              
              const itemsToShow = Math.min(
                allCombinations.length,
                creatorsToUse.length >= 3 ? 5 : creatorsToUse.length * 2
              );
              const shuffledItems = [...allCombinations]
                .sort(() => 0.5 - Math.random())
                .slice(0, itemsToShow)
                .map((item) => ({
                  ...item,
                  totalCombinations: totalItems,
                }));
              
              const cacheData = { preview: shuffledItems, all: allDataWithTotal };
              get().setCachedData(cacheKey, cacheData, CACHE_DURATIONS.PRICING_PREVIEW);
              
              set((state) => ({
                ...state,
                pricingPreview: shuffledItems,
                allPricingData: allDataWithTotal,
                loading: { ...state.loading, pricingPreview: false }
              }));
            } else {
              throw new Error('Invalid pricing data format');
            }
          } catch (error) {
            // Fallback to database-based items matching ContentDetails structure
            const commonItems = [
              "Custom Video", "Custom Call", "$5-10 Bundle", "$10-15 Bundle", 
              "$15-20 Bundle", "$20-25 Bundle", "Boob Content", "Solo Content"
            ];
            
            const fallbackCombinations: PricingItem[] = [];
            commonItems.forEach((itemName) => {
              creatorsToUse.forEach((creator) => {
                fallbackCombinations.push({
                  name: itemName,
                  price: "—",
                  creator: creator.name,
                });
              });
            });
            
            const totalItems = fallbackCombinations.length;
            const fallbackData = fallbackCombinations.map((item) => ({
              ...item,
              totalCombinations: totalItems,
            }));
            
            const itemsToShow = Math.min(
              fallbackCombinations.length,
              creatorsToUse.length >= 3 ? 5 : creatorsToUse.length * 2
            );
            const shuffledItems = [...fallbackCombinations]
              .sort(() => 0.5 - Math.random())
              .slice(0, itemsToShow)
              .map((item) => ({
                ...item,
                totalCombinations: totalItems,
              }));
            
            set((state) => ({
              ...state,
              pricingPreview: shuffledItems,
              allPricingData: fallbackData,
              errors: { 
                ...state.errors, 
                pricingPreview: {
                  message: error instanceof Error ? error.message : 'Failed to load pricing data',
                  code: 'PRICING_PREVIEW_FETCH_ERROR',
                  timestamp: Date.now(),
                }
              },
              loading: { ...state.loading, pricingPreview: false }
            }));
          }
        },
        
        // UI helpers
        toggleSheetGroup: (groupName) =>
          set((state) => ({
            ...state,
            openSheetGroups: {
              ...state.openSheetGroups,
              [groupName]: !state.openSheetGroups[groupName]
            }
          })),
          
        setPricingRotationProgress: (progress) =>
          set((state) => ({
            ...state,
            pricingRotationProgress: typeof progress === 'function' 
              ? progress(state.pricingRotationProgress) 
              : progress
          })),
          
        rotatePricingPreview: () =>
          set((state) => {
            console.log('🔄 rotatePricingPreview called:', {
              allPricingDataLength: state.allPricingData.length,
              podDataCreatorsLength: state.podData?.creators?.length,
              currentPreviewLength: state.pricingPreview.length
            });

            if (state.allPricingData.length > 0 && state.podData?.creators) {
              const itemsToShow = Math.min(
                state.allPricingData.length,
                state.podData.creators.length >= 3 ? 5 : state.podData.creators.length * 2
              );
              const shuffledItems = [...state.allPricingData]
                .sort(() => 0.5 - Math.random())
                .slice(0, itemsToShow);
              
              console.log('✅ Rotating to new items:', {
                itemsToShow,
                shuffledItemsLength: shuffledItems.length,
                newItems: shuffledItems.map(item => ({ name: item.name, creator: item.creator, price: item.price }))
              });

              return {
                ...state,
                pricingPreview: shuffledItems
                // Don't reset progress here - let the hook handle it
              };
            }
            console.log('❌ Rotation conditions not met in store');
            return state;
          }),
        
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
              podData: null,
              availableTeams: null,
              tasks: null,
              driveSheets: null,
              pricingPreview: null,
            }
          })),
      }),
      {
        name: 'pod-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist UI state, not loading states, errors, or cache
          selectedRow: state.selectedRow,
          activeTab: state.activeTab,
          openSheetGroups: state.openSheetGroups,
          // Don't persist cache as it has expiration logic
          // Don't persist loading states or errors as they should be fresh on reload
        }),
      }
    ),
    {
      name: 'pod-store',
    }
  )
);


// Utility hooks for easier access to specific state slices
export const usePodData = () => {
  const podData = usePodStore((state) => state.podData);
  const loading = usePodStore((state) => state.loading.podData);
  const error = usePodStore((state) => state.errors.podData);
  const fetchPodData = usePodStore((state) => state.fetchPodData);
  
  return { podData, loading, error, fetchPodData };
};

export const useAvailableTeams = () => {
  const teams = usePodStore((state) => state.availableTeams);
  const loading = usePodStore((state) => state.loading.availableTeams);
  const error = usePodStore((state) => state.errors.availableTeams);
  const fetchAvailableTeams = usePodStore((state) => state.fetchAvailableTeams);
  
  return { teams, loading, error, fetchAvailableTeams };
};

export const useTasks = () => {
  const tasks = usePodStore((state) => state.tasks);
  const loading = usePodStore((state) => state.loading.tasks);
  const error = usePodStore((state) => state.errors.tasks);
  const fetchTasks = usePodStore((state) => state.fetchTasks);
  
  return { tasks, loading, error, fetchTasks };
};

export const useDriveSheets = () => {
  const sheets = usePodStore((state) => state.driveSheets);
  const loading = usePodStore((state) => state.loading.driveSheets);
  const error = usePodStore((state) => state.errors.driveSheets);
  const fetchDriveSheets = usePodStore((state) => state.fetchDriveSheets);
  
  return { sheets, loading, error, fetchDriveSheets };
};

export const usePricingPreview = () => {
  const preview = usePodStore((state) => state.pricingPreview);
  const allData = usePodStore((state) => state.allPricingData);
  const progress = usePodStore((state) => state.pricingRotationProgress);
  const loading = usePodStore((state) => state.loading.pricingPreview);
  const error = usePodStore((state) => state.errors.pricingPreview);
  const fetchPricingPreview = usePodStore((state) => state.fetchPricingPreview);
  const setPricingRotationProgress = usePodStore((state) => state.setPricingRotationProgress);
  const rotatePricingPreview = usePodStore((state) => state.rotatePricingPreview);
  
  return { 
    preview, 
    allData, 
    progress, 
    loading, 
    error, 
    fetchPricingPreview, 
    setPricingRotationProgress, 
    rotatePricingPreview 
  };
};