"use client";

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { TaskAttachment } from './boardStore';

// Types
export type SubmissionType = 'otp' | 'ptr';
export type SubmissionPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SubmissionStatus = 'PENDING' | 'PROCESSING' | 'TASK_CREATED' | 'COMPLETED' | 'CANCELLED';

export interface ContentSubmission {
  id: string;
  submissionType: SubmissionType;
  modelName: string;
  priority: SubmissionPriority;
  driveLink: string;
  contentDescription: string;
  screenshotAttachments?: TaskAttachment[];
  status: SubmissionStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  notes?: string;
  // PTR-specific fields
  releaseDate?: string;
  releaseTime?: string;
  minimumPrice?: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  task?: {
    id: string;
    title: string;
    status: string;
    teamName: string;
    createdAt: string;
  };
}

export interface SubmissionFormData {
  modelName: string;
  priority: SubmissionPriority | '';
  driveLink: string;
  contentDescription: string;
  releaseDate: string;
  releaseTime: string;
  minimumPrice: string;
}

export interface SubmissionFilters {
  type: 'all' | 'otp' | 'ptr';
  status?: SubmissionStatus;
  page: number;
  limit: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SubmissionsResponse {
  success: boolean;
  submissions: ContentSubmission[];
  pagination: PaginationInfo;
}

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

interface ContentSubmissionStore {
  // Form state
  submissionType: SubmissionType;
  formData: SubmissionFormData;
  attachments: TaskAttachment[];
  isSubmitting: boolean;
  isSubmitted: boolean;

  // History state
  submissions: ContentSubmission[];
  filters: SubmissionFilters;
  pagination: PaginationInfo | null;
  loadingSubmissions: boolean;
  
  // Cache
  submissionsCache: Map<string, CacheEntry<SubmissionsResponse>>;
  cacheExpiry: number; // 5 minutes default

  // Form actions
  setSubmissionType: (type: SubmissionType) => void;
  updateFormData: (field: keyof SubmissionFormData, value: string) => void;
  setAttachments: (attachments: TaskAttachment[]) => void;
  resetForm: () => void;

  // Submission actions
  submitContent: () => Promise<boolean>;

  // History actions
  setFilters: (filters: Partial<SubmissionFilters>) => void;
  fetchSubmissions: (force?: boolean) => Promise<void>;
  refreshSubmissions: () => Promise<void>;

  // Cache actions
  clearCache: () => void;
  getCacheKey: (filters: SubmissionFilters) => string;
  isValidCache: (entry: CacheEntry<SubmissionsResponse>) => boolean;

  // Computed
  isFormValid: () => boolean;
}

const initialFormData: SubmissionFormData = {
  modelName: '',
  priority: '',
  driveLink: '',
  contentDescription: '',
  releaseDate: '',
  releaseTime: '',
  minimumPrice: ''
};

const initialFilters: SubmissionFilters = {
  type: 'all',
  page: 1,
  limit: 10
};

const initialPagination: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
};

export const useContentSubmissionStore = create<ContentSubmissionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        submissionType: 'otp',
        formData: initialFormData,
        attachments: [],
        isSubmitting: false,
        isSubmitted: false,

        submissions: [],
        filters: initialFilters,
        pagination: null,
        loadingSubmissions: false,

        submissionsCache: new Map(),
        cacheExpiry: 5 * 60 * 1000, // 5 minutes

        // Form actions
        setSubmissionType: (type) => set({ submissionType: type }),

        updateFormData: (field, value) =>
          set((state) => ({
            formData: { ...state.formData, [field]: value }
          })),

        setAttachments: (attachments) => set({ attachments }),

        resetForm: () =>
          set({
            formData: initialFormData,
            attachments: [],
            isSubmitted: false
          }),

        // Submission action
        submitContent: async () => {
          const state = get();
          
          if (!state.isFormValid() || state.isSubmitting) {
            return false;
          }

          set({ isSubmitting: true });

          try {
            const submissionData = {
              submissionType: state.submissionType,
              modelName: state.formData.modelName,
              priority: state.formData.priority,
              driveLink: state.formData.driveLink,
              contentDescription: state.formData.contentDescription,
              screenshotAttachments: state.attachments,
              ...(state.submissionType === 'ptr' && {
                releaseDate: state.formData.releaseDate,
                releaseTime: state.formData.releaseTime,
                minimumPrice: state.formData.minimumPrice
              })
            };

            const response = await fetch('/api/content-submissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submissionData)
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || 'Submission failed');
            }

            // Success
            toast.success(
              `${state.submissionType.toUpperCase()} submission created successfully!`,
              {
                description: `Task assigned to ${result.task.teamName} with ${result.task.priority} priority`,
                duration: 5000
              }
            );

            // Reset form and show success state
            set({ 
              isSubmitted: true,
              formData: initialFormData,
              attachments: []
            });

            // Clear cache to force refresh
            get().clearCache();

            // Auto-reset success state after 3 seconds
            setTimeout(() => set({ isSubmitted: false }), 3000);

            return true;
          } catch (error) {
            console.error('Submission failed:', error);
            toast.error('Submission failed', {
              description: error instanceof Error ? error.message : 'An unexpected error occurred',
              duration: 5000
            });
            return false;
          } finally {
            set({ isSubmitting: false });
          }
        },

        // History actions
        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 } // Reset to page 1 when filters change
          })),

        fetchSubmissions: async (force = false) => {
          const state = get();
          const cacheKey = state.getCacheKey(state.filters);
          
          // Check cache first
          if (!force && state.submissionsCache.has(cacheKey)) {
            const cachedEntry = state.submissionsCache.get(cacheKey)!;
            if (state.isValidCache(cachedEntry)) {
              set({
                submissions: cachedEntry.data.submissions,
                pagination: cachedEntry.data.pagination
              });
              return;
            }
          }

          set({ loadingSubmissions: true });

          try {
            const params = new URLSearchParams();
            
            if (state.filters.type !== 'all') {
              params.append('type', state.filters.type);
            }
            if (state.filters.status) {
              params.append('status', state.filters.status);
            }
            params.append('page', state.filters.page.toString());
            params.append('limit', state.filters.limit.toString());

            const response = await fetch(`/api/content-submissions/list?${params}`);
            const result: SubmissionsResponse = await response.json();

            if (!response.ok) {
              throw new Error('Failed to fetch submissions');
            }

            // Update state
            set({
              submissions: result.submissions,
              pagination: result.pagination
            });

            // Cache the result
            const newCache = new Map(state.submissionsCache);
            newCache.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
              expiresIn: state.cacheExpiry
            });
            set({ submissionsCache: newCache });

          } catch (error) {
            console.error('Error fetching submissions:', error);
            toast.error('Failed to load submission history');
            
            // Set empty state on error
            set({
              submissions: [],
              pagination: initialPagination
            });
          } finally {
            set({ loadingSubmissions: false });
          }
        },

        refreshSubmissions: () => get().fetchSubmissions(true),

        // Cache actions
        clearCache: () => set({ submissionsCache: new Map() }),

        getCacheKey: (filters) => 
          `${filters.type}-${filters.status || 'all'}-${filters.page}-${filters.limit}`,

        isValidCache: (entry) => 
          Date.now() - entry.timestamp < entry.expiresIn,

        // Computed
        isFormValid: () => {
          const { formData, submissionType } = get();
          const baseValid = !!(
            formData.modelName &&
            formData.priority &&
            formData.driveLink &&
            formData.contentDescription
          );
          
          // Additional validation for PTR submissions
          if (submissionType === 'ptr') {
            return baseValid && !!(
              formData.releaseDate &&
              formData.releaseTime &&
              formData.minimumPrice
            );
          }
          
          return baseValid;
        }
      }),
      {
        name: 'content-submission-store',
        storage: createJSONStorage(() => localStorage),
        // Only persist form data and settings, not submissions cache
        partialize: (state) => ({
          submissionType: state.submissionType,
          formData: state.formData,
          filters: state.filters
        })
      }
    ),
    { name: 'ContentSubmissionStore' }
  )
);