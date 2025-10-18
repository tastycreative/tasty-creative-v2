"use client";

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

// Onboarding types
export interface OnboardingProgress {
  id: string;
  clientModelDetailsId: string;
  onboardingListId: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingList {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStep {
  onboardingList: OnboardingList;
  progress: OnboardingProgress | null;
}

export interface ClientModelDetails {
  id: string;
  full_name: string | null;
  client_name: string | null;
  model_name: string | null;
  age: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  clothing_size: string | null;
  clothing_items: string | null;
  ethnicity: string | null;
  birthplace: string | null;
  current_city: string | null;
  timezone: string | null;
  background: string | null;
  favorite_colors: string | null;
  interests: string | null;
  personality: string | null;
  favorite_emojis: string | null;
  keywords: string | null;
  limitations: string | null;
  content_offered: string | null;
  oftv_channel_interest: string | null;
  custom_min_price: string | null;
  video_call_min_price: string | null;
  mm_restrictions: string | null;
  verbiage_restrictions: string | null;
  wall_restrictions: string | null;
  amazon_wishlist: string | null;
  tone_language: string | null;
  calendar_id: string | null;
  clientOnlyFansAlbum: string | null;
  clientSocialAlbums: string | null;
  clientCustomSheet: string | null;
  onboardingCompleted: boolean;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingData {
  clientModelDetails: ClientModelDetails | null;
  steps: OnboardingStep[];
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedOnboardingData {
  data: OnboardingData | null;
  timestamp: number;
  clientId: string;
}

interface OnboardingStore {
  // Cache
  cache: Map<string, CachedOnboardingData>;
  
  // Current state
  currentClientId: string | null;
  data: OnboardingData | null;
  isLoading: boolean;
  error: string | null;
  
  // UI state
  showDetails: boolean;
  showChecklist: boolean;
  
  // Actions
  setCurrentClientId: (clientId: string | null) => void;
  setShowDetails: (show: boolean) => void;
  setShowChecklist: (show: boolean) => void;
  fetchOnboardingData: (clientId: string, force?: boolean) => Promise<void>;
  updateOnboardingStep: (onboardingListId: string, completed: boolean) => Promise<void>;
  clearCache: () => void;
  clearCurrentData: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        cache: new Map(),
        currentClientId: null,
        data: null,
        isLoading: false,
        error: null,
        showDetails: true,
        showChecklist: true,

        // Actions
        setCurrentClientId: (clientId) => {
          set({ currentClientId: clientId });
        },

        setShowDetails: (show) => {
          set({ showDetails: show });
        },

        setShowChecklist: (show) => {
          set({ showChecklist: show });
        },

        fetchOnboardingData: async (clientId, force = false) => {
          const state = get();
          
          // Check cache first
          if (!force && state.cache.has(clientId)) {
            const cached = state.cache.get(clientId)!;
            const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
            
            if (!isExpired) {
              set({ 
                data: cached.data, 
                currentClientId: clientId,
                isLoading: false,
                error: null 
              });
              return;
            }
          }

          set({ isLoading: true, error: null, currentClientId: clientId });

          try {
            const response = await fetch(`/api/test-onboarding/status?clientModelDetailsId=${encodeURIComponent(clientId)}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const data = await response.json();

            // Cache the result
            const newCache = new Map(state.cache);
            newCache.set(clientId, {
              data,
              timestamp: Date.now(),
              clientId
            });

            set({ 
              data, 
              cache: newCache,
              isLoading: false,
              error: null 
            });

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch onboarding data';
            set({ 
              isLoading: false, 
              error: errorMessage,
              data: null 
            });
          }
        },

        updateOnboardingStep: async (onboardingListId, completed) => {
          const state = get();
          const { currentClientId, data } = state;
          
          if (!currentClientId || !data) return;

          // Optimistic update
          if (data.steps && Array.isArray(data.steps)) {
            const newSteps = data.steps.map((step) => {
              if (step.onboardingList?.id === onboardingListId) {
                return {
                  ...step,
                  progress: {
                    ...step.progress,
                    completed,
                    completedAt: completed ? new Date().toISOString() : null,
                    id: step.progress?.id || '',
                    clientModelDetailsId: currentClientId,
                    onboardingListId,
                    createdAt: step.progress?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                };
              }
              return step;
            });

            const newData = { ...data, steps: newSteps };
            
            // Update cache
            const newCache = new Map(state.cache);
            newCache.set(currentClientId, {
              data: newData,
              timestamp: Date.now(),
              clientId: currentClientId
            });

            set({ 
              data: newData,
              cache: newCache
            });
          }

          // Send API request
          try {
            const response = await fetch('/api/onboarding/toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientModelDetailsId: currentClientId,
                onboardingListId,
                completed
              })
            });

            if (!response.ok) {
              throw new Error('Failed to update step');
            }

          } catch (error) {
            // Revert optimistic update on error
            console.error('Failed to update onboarding step:', error);
            // Could implement revert logic here if needed
          }
        },

        clearCache: () => {
          set({ cache: new Map() });
        },

        clearCurrentData: () => {
          set({ 
            currentClientId: null,
            data: null,
            isLoading: false,
            error: null 
          });
        }
      }),
      {
        name: 'onboarding-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ 
          showDetails: state.showDetails,
          showChecklist: state.showChecklist 
        }),
      }
    ),
    {
      name: 'onboarding-store',
    }
  )
);

// Convenience hooks
export const useOnboardingData = () => {
  const data = useOnboardingStore((state) => state.data);
  const isLoading = useOnboardingStore((state) => state.isLoading);
  const error = useOnboardingStore((state) => state.error);
  const currentClientId = useOnboardingStore((state) => state.currentClientId);
  
  return { data, isLoading, error, currentClientId };
};

export const useOnboardingActions = () => {
  const fetchOnboardingData = useOnboardingStore((state) => state.fetchOnboardingData);
  const updateOnboardingStep = useOnboardingStore((state) => state.updateOnboardingStep);
  const clearCache = useOnboardingStore((state) => state.clearCache);
  const clearCurrentData = useOnboardingStore((state) => state.clearCurrentData);
  const setCurrentClientId = useOnboardingStore((state) => state.setCurrentClientId);
  
  return {
    fetchOnboardingData,
    updateOnboardingStep,
    clearCache,
    clearCurrentData,
    setCurrentClientId
  };
};

export const useOnboardingUI = () => {
  const showDetails = useOnboardingStore((state) => state.showDetails);
  const showChecklist = useOnboardingStore((state) => state.showChecklist);
  const setShowDetails = useOnboardingStore((state) => state.setShowDetails);
  const setShowChecklist = useOnboardingStore((state) => state.setShowChecklist);
  
  return {
    showDetails,
    showChecklist,
    setShowDetails,
    setShowChecklist
  };
};