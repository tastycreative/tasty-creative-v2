import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

interface ModelDetails {
  id: string;
  name: string;
  status: "active" | "dropped";
  launchDate: string;
  referrerName: string;
  personalityType: string;
  commonTerms: string[];
  commonEmojis: string[];
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  chattingManagers: string[];
  profileImage?: string;
  stats?: {
    totalRevenue: number;
    monthlyRevenue: number;
    subscribers: number;
    avgResponseTime: string;
  };
}

// Store structure following Zustand best practices
interface PersistedData {
  selectedModel: ModelDetails | null;
  timestamp: number | null;
}

interface SelectedModelState {
  selectedModel: ModelDetails | null;
  timestamp: number | null;
  setSelectedModel: (model: ModelDetails) => void;
  clearSelectedModel: () => void;
  isExpired: () => boolean;
  getTimeUntilExpiration: () => number | null;
  clearStorage: () => void;
  _hasHydrated?: boolean;
}

// Configuration for data expiration - easily adjustable
const EXPIRATION_TIME = {
  MINUTES_5: 5 * 60 * 1000,        // 5 minutes (for testing)
  MINUTES_30: 30 * 60 * 1000,      // 30 minutes
  HOURS_1: 60 * 60 * 1000,         // 1 hour
  HOURS_2: 2 * 60 * 60 * 1000,     // 2 hours (recommended)
  HOURS_6: 6 * 60 * 60 * 1000,     // 6 hours
  HOURS_12: 12 * 60 * 60 * 1000,   // 12 hours
  DAYS_1: 24 * 60 * 60 * 1000,     // 1 day
};

// Set your preferred expiration time here
const DATA_TTL = EXPIRATION_TIME.HOURS_2; // Data expires after 2 hours

// Storage key constant to avoid typos
const STORAGE_KEY = 'selected-model-storage';

const useSelectedModelStore = create<SelectedModelState>()(
  persist(
    (set, get) => ({
      selectedModel: null,
      timestamp: null,
      
      setSelectedModel: (model) => {
        // Store model with current timestamp
        set({ 
          selectedModel: model,
          timestamp: Date.now()
        });
      },
      
      clearSelectedModel: () => {
        set({ 
          selectedModel: null,
          timestamp: null 
        });
      },
      
      isExpired: () => {
        const state = get();
        if (!state.selectedModel || !state.timestamp) return false;
        
        const now = Date.now();
        const age = now - state.timestamp;
        
        return age > DATA_TTL;
      },
      
      getTimeUntilExpiration: () => {
        const state = get();
        if (!state.selectedModel || !state.timestamp) return null;
        
        const now = Date.now();
        const age = now - state.timestamp;
        const remaining = DATA_TTL - age;
        
        return remaining > 0 ? remaining : 0;
      },
      
      // Following Zustand best practice for clearing storage
      clearStorage: () => {
        // Clear the persisted storage completely
        localStorage.removeItem(STORAGE_KEY);
        set({ 
          selectedModel: null,
          timestamp: null 
        });
      },
      
      _hasHydrated: false,
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      
      // Use partialize to control what gets persisted (best practice)
      partialize: (state): PersistedData => ({
        selectedModel: state.selectedModel,
        timestamp: state.timestamp,
      }),
      
      // Handle rehydration with expiration check
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
          
          // Check expiration immediately on rehydration
          if (state.timestamp) {
            const age = Date.now() - state.timestamp;
            if (age > DATA_TTL) {
              console.log('[SelectedModelStore] Data expired, clearing...');
              state.clearSelectedModel();
            } else {
              const remainingHours = Math.floor((DATA_TTL - age) / (60 * 60 * 1000));
              const remainingMinutes = Math.floor(((DATA_TTL - age) % (60 * 60 * 1000)) / (60 * 1000));
              console.log(`[SelectedModelStore] Data restored, expires in ${remainingHours}h ${remainingMinutes}m`);
            }
          }
        }
      },
    }
  )
);

export default useSelectedModelStore;
export type { ModelDetails };