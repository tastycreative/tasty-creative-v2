"use client";

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { ModelDetails } from '@/types/types';

// Types
export interface CreatorData {
  id: string;
  name: string;
  earnings?: string;
  rowNumber?: number;
}

export interface ClientData {
  chattingManagers?: string;
  [key: string]: any;
}

export interface APIError {
  message: string;
  code?: string;
  timestamp: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

export interface CreatorStore {
  // State
  currentCreator: CreatorData | null;
  currentModel: ModelDetails | null;
  currentClientData: ClientData | null;
  
  // Loading states
  loading: {
    creator: boolean;
    model: boolean;
    clientData: boolean;
  };
  
  // Errors
  errors: {
    creator: APIError | null;
    model: APIError | null;
    clientData: APIError | null;
  };
  
  // Cache
  cache: Record<string, CacheEntry<any>>;
  
  // Actions
  setCurrentCreator: (creator: CreatorData | null) => void;
  setCurrentModel: (model: ModelDetails | null) => void;
  setCurrentClientData: (clientData: ClientData | null) => void;
  
  // Data fetching
  fetchCreatorData: (creatorName: string, forceRefresh?: boolean, podData?: any) => Promise<void>;
  fetchModelData: (modelName: string, forceRefresh?: boolean) => Promise<void>;
  fetchClientData: (clientName: string, forceRefresh?: boolean) => Promise<void>;
  
  // Combined data fetching
  fetchCreatorAndModelData: (creatorName: string, forceRefresh?: boolean, podData?: any) => Promise<void>;
  fetchAllData: (creatorName: string, forceRefresh?: boolean, podData?: any) => Promise<void>;
  
  // Cache management
  getCachedData: <T>(key: string) => T | null;
  setCachedData: <T>(key: string, data: T, expiresIn?: number) => void;
  clearCache: (key?: string) => void;
  
  // Error handling
  setError: (key: keyof CreatorStore['errors'], error: APIError | null) => void;
  clearErrors: () => void;
  
  // Reset state
  reset: () => void;
}

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  CREATOR_DATA: 10 * 60 * 1000, // 10 minutes
  MODEL_DATA: 15 * 60 * 1000, // 15 minutes
  CLIENT_DATA: 5 * 60 * 1000, // 5 minutes (for Google Sheets data)
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

export const useCreatorStore = create<CreatorStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentCreator: null,
        currentModel: null,
        currentClientData: null,
        
        loading: {
          creator: false,
          model: false,
          clientData: false,
        },
        
        errors: {
          creator: null,
          model: null,
          clientData: null,
        },
        
        cache: {},
        
        // Actions
        setCurrentCreator: (creator) =>
          set({ currentCreator: creator }),
          
        setCurrentModel: (model) =>
          set({ currentModel: model }),
          
        setCurrentClientData: (clientData) =>
          set({ currentClientData: clientData }),
        
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
        
        setCachedData: <T>(key: string, data: T, expiresIn = CACHE_DURATIONS.CREATOR_DATA) => {
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
        fetchCreatorData: async (creatorName, forceRefresh = false, podData?: any) => {
          const cacheKey = `creator-data-${creatorName}`;
          
          // Check cache first unless force refresh
          if (!forceRefresh) {
            const cached = get().getCachedData<CreatorData>(cacheKey);
            if (cached) {
              set({ currentCreator: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, creator: true },
            errors: { ...state.errors, creator: null }
          }));
          
          try {
            let creatorData: CreatorData = {
              id: `creator-${Date.now()}`,
              name: decodeURIComponent(creatorName),
              earnings: "$0",
            };
            
            // Try to find creator in pod data if provided
            if (podData?.creators) {
              const foundCreator = podData.creators.find(
                (c: any) => c.name === decodeURIComponent(creatorName)
              );
              
              if (foundCreator) {
                creatorData = {
                  ...creatorData,
                  id: foundCreator.id,
                  earnings: foundCreator.earnings || "$0",
                  rowNumber: foundCreator.rowNumber,
                };
              }
            }
            
            // Cache and set data
            get().setCachedData(cacheKey, creatorData, CACHE_DURATIONS.CREATOR_DATA);
            
            set((state) => ({
              ...state,
              currentCreator: creatorData,
              loading: { ...state.loading, creator: false }
            }));
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch creator data',
              code: 'CREATOR_DATA_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, creator: apiError },
              loading: { ...state.loading, creator: false }
            }));
            
            throw error;
          }
        },
        
        fetchModelData: async (modelName, forceRefresh = false) => {
          const cacheKey = `model-data-${modelName}`;
          
          // Check cache first unless force refresh
          if (!forceRefresh) {
            const cached = get().getCachedData<ModelDetails>(cacheKey);
            if (cached) {
              set({ currentModel: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, model: true },
            errors: { ...state.errors, model: null }
          }));
          
          try {
            const result = await apiCall<{ models: any[] }>("/api/models?all=true");
            
            // Transform and find the model
            const { transformRawModel } = await import('@/lib/utils');
            const transformed = result.models.map(transformRawModel);
            const foundModel = transformed.find(
              (m: ModelDetails) => m.name === decodeURIComponent(modelName)
            );
            
            if (foundModel) {
              // Cache and set data
              get().setCachedData(cacheKey, foundModel, CACHE_DURATIONS.MODEL_DATA);
              
              set((state) => ({
                ...state,
                currentModel: foundModel,
                loading: { ...state.loading, model: false }
              }));
            } else {
              // Model not found, set null
              set((state) => ({
                ...state,
                currentModel: null,
                loading: { ...state.loading, model: false }
              }));
            }
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch model data',
              code: 'MODEL_DATA_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              errors: { ...state.errors, model: apiError },
              loading: { ...state.loading, model: false }
            }));
            
            throw error;
          }
        },
        
        fetchClientData: async (clientName, forceRefresh = false) => {
          const cacheKey = `client-data-${clientName}`;
          
          // Check cache first unless force refresh
          if (!forceRefresh) {
            const cached = get().getCachedData<ClientData>(cacheKey);
            if (cached) {
              set({ currentClientData: cached });
              return;
            }
          }
          
          set((state) => ({
            ...state,
            loading: { ...state.loading, clientData: true },
            errors: { ...state.errors, clientData: null }
          }));
          
          try {
            const result = await apiCall<ClientData[]>(`/api/google/cmsheets?clientName=${clientName}`);
            
            // Take the first result or create empty object
            const clientData = result && result.length > 0 ? result[0] : {};
            
            // Cache and set data
            get().setCachedData(cacheKey, clientData, CACHE_DURATIONS.CLIENT_DATA);
            
            set((state) => ({
              ...state,
              currentClientData: clientData,
              loading: { ...state.loading, clientData: false }
            }));
          } catch (error) {
            const apiError: APIError = {
              message: error instanceof Error ? error.message : 'Failed to fetch client data',
              code: 'CLIENT_DATA_FETCH_ERROR',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              ...state,
              currentClientData: null,
              errors: { ...state.errors, clientData: apiError },
              loading: { ...state.loading, clientData: false }
            }));
            
            throw error;
          }
        },
        
        fetchCreatorAndModelData: async (creatorName, forceRefresh = false, podData?: any) => {
          // Clear errors first
          set((state) => ({
            ...state,
            errors: { creator: null, model: null, clientData: null }
          }));
          
          try {
            // Fetch both creator and model data concurrently
            // Each function handles its own loading state
            const results = await Promise.allSettled([
              get().fetchCreatorData(creatorName, forceRefresh, podData),
              get().fetchModelData(creatorName, forceRefresh),
            ]);
            
            // Log any rejected promises for debugging
            results.forEach((result, index) => {
              if (result.status === 'rejected') {
                console.error(`Failed to fetch ${index === 0 ? 'creator' : 'model'} data:`, result.reason);
              }
            });
          } catch (error) {
            console.error('Error fetching creator and model data:', error);
            // Ensure loading states are cleared on error
            set((state) => ({
              ...state,
              loading: { creator: false, model: false, clientData: false }
            }));
          }
        },
        
        fetchAllData: async (creatorName, forceRefresh = false, podData?: any) => {
          // Clear all errors first
          set((state) => ({
            ...state,
            errors: { creator: null, model: null, clientData: null }
          }));
          
          try {
            // Fetch all data concurrently
            const results = await Promise.allSettled([
              get().fetchCreatorData(creatorName, forceRefresh, podData),
              get().fetchModelData(creatorName, forceRefresh),
              get().fetchClientData(creatorName, forceRefresh),
            ]);
            
            // Log any rejected promises for debugging
            results.forEach((result, index) => {
              if (result.status === 'rejected') {
                const dataTypes = ['creator', 'model', 'client'];
                console.error(`Failed to fetch ${dataTypes[index]} data:`, result.reason);
              }
            });
          } catch (error) {
            console.error('Error fetching all creator data:', error);
            // Ensure loading states are cleared on error
            set((state) => ({
              ...state,
              loading: { creator: false, model: false, clientData: false }
            }));
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
              creator: null,
              model: null,
              clientData: null,
            }
          })),
        
        // Reset state
        reset: () =>
          set({
            currentCreator: null,
            currentModel: null,
            currentClientData: null,
            loading: {
              creator: false,
              model: false,
              clientData: false,
            },
            errors: {
              creator: null,
              model: null,
              clientData: null,
            },
          }),
      }),
      {
        name: 'creator-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist current data, not loading states or errors
          currentCreator: state.currentCreator,
          currentModel: state.currentModel,
          currentClientData: state.currentClientData,
          // Don't persist cache as it has expiration logic
          // Don't persist loading states or errors as they should be fresh on reload
        }),
      }
    ),
    {
      name: 'creator-store',
    }
  )
);

// Utility hooks for easier access
export const useCreatorData = () => {
  const creator = useCreatorStore((state) => state.currentCreator);
  const loading = useCreatorStore((state) => state.loading.creator);
  const error = useCreatorStore((state) => state.errors.creator);
  const fetchCreatorData = useCreatorStore((state) => state.fetchCreatorData);
  const setCurrentCreator = useCreatorStore((state) => state.setCurrentCreator);
  
  return { creator, loading, error, fetchCreatorData, setCurrentCreator };
};

export const useModelData = () => {
  const model = useCreatorStore((state) => state.currentModel);
  const loading = useCreatorStore((state) => state.loading.model);
  const error = useCreatorStore((state) => state.errors.model);
  const fetchModelData = useCreatorStore((state) => state.fetchModelData);
  const setCurrentModel = useCreatorStore((state) => state.setCurrentModel);
  
  return { model, loading, error, fetchModelData, setCurrentModel };
};

export const useClientData = () => {
  const clientData = useCreatorStore((state) => state.currentClientData);
  const loading = useCreatorStore((state) => state.loading.clientData);
  const error = useCreatorStore((state) => state.errors.clientData);
  const fetchClientData = useCreatorStore((state) => state.fetchClientData);
  const setCurrentClientData = useCreatorStore((state) => state.setCurrentClientData);
  
  return { clientData, loading, error, fetchClientData, setCurrentClientData };
};

export const useCreatorAndModel = () => {
  const creator = useCreatorStore((state) => state.currentCreator);
  const model = useCreatorStore((state) => state.currentModel);
  const loading = useCreatorStore((state) => state.loading);
  const errors = useCreatorStore((state) => state.errors);
  const fetchCreatorAndModelData = useCreatorStore((state) => state.fetchCreatorAndModelData);
  const reset = useCreatorStore((state) => state.reset);
  
  const isLoading = loading.creator || loading.model;
  const hasError = errors.creator || errors.model;
  
  return { 
    creator, 
    model, 
    loading: isLoading, 
    error: hasError, 
    fetchCreatorAndModelData, 
    reset 
  };
};

export const useCreatorComplete = () => {
  const creator = useCreatorStore((state) => state.currentCreator);
  const model = useCreatorStore((state) => state.currentModel);
  const clientData = useCreatorStore((state) => state.currentClientData);
  const loading = useCreatorStore((state) => state.loading);
  const errors = useCreatorStore((state) => state.errors);
  const fetchAllData = useCreatorStore((state) => state.fetchAllData);
  const reset = useCreatorStore((state) => state.reset);
  
  const isLoading = loading.creator || loading.model || loading.clientData;
  const hasError = errors.creator || errors.model || errors.clientData;
  
  return { 
    creator, 
    model, 
    clientData,
    loading: isLoading, 
    error: hasError, 
    fetchAllData, 
    reset 
  };
};