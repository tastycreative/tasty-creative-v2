import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";

export interface UseModelsOptions {
  search?: string;
  status?: ModelStatus | "all";
  sort?: "name" | "date" | "revenue";
  limit?: number;
  creators?: string[];
  enabled?: boolean;
}

export interface ModelsResponse {
  models: ModelDetails[];
  nextCursor: number | null;
  hasMore: boolean;
  total: number;
}

// Query key factory for consistent cache management
export const modelsQueryKeys = {
  all: ["pod-new-models"] as const,
  lists: () => [...modelsQueryKeys.all, "list"] as const,
  list: (options: UseModelsOptions) =>
    [...modelsQueryKeys.lists(), options] as const,
  details: () => [...modelsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...modelsQueryKeys.details(), id] as const,
  count: (options: UseModelsOptions) =>
    [...modelsQueryKeys.all, "count", options] as const,
  stats: () => [...modelsQueryKeys.all, "stats"] as const,
};

// Cache configuration constants
export const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes after last use
  refetchOnWindowFocus: false, // Don't refetch when user returns to tab
  refetchOnMount: false, // Don't refetch on component mount if data exists
  retry: 3, // Retry failed requests 3 times
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
} as const;

// Fetch function for models with pagination
async function fetchModels({
  pageParam = 0,
  ...options
}: UseModelsOptions & { pageParam?: number }): Promise<ModelsResponse> {
  const params = new URLSearchParams({
    cursor: pageParam.toString(),
    limit: (options.limit || 1000).toString(),
    search: options.search || "",
    status: options.status || "all",
    sort: options.sort || "name",
  });

  // Add creators filter if provided
  if (options.creators && options.creators.length > 0) {
    params.append("creators", options.creators.join(","));
  }

  const response = await fetch(`/api/pod-new/models?${params}`);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch models" }));
    throw new Error(error.message || "Failed to fetch models");
  }

  return response.json();
}

// Hook for infinite scrolling models with advanced caching
export function useInfiniteModels(options: UseModelsOptions = {}) {
  return useInfiniteQuery({
    queryKey: modelsQueryKeys.list(options),
    queryFn: ({ pageParam }: { pageParam: number }) => fetchModels({ ...options, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
    ...CACHE_CONFIG,
    enabled: options.enabled !== false,
    // Prefetch next page when we're close to the end
    meta: {
      prefetchThreshold: 0.8, // Prefetch when 80% through current data
    },
  });
}

// Hook for fetching a single page of models (for traditional pagination)
export function useModelsPage(
  page: number = 1,
  options: UseModelsOptions = {}
) {
  const offset = (page - 1) * (options.limit || 20);

  return useQuery({
    queryKey: [...modelsQueryKeys.list(options), page],
    queryFn: async () => {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: (options.limit || 50).toString(),
        search: options.search || "",
        status: options.status || "all",
        sort: options.sort || "name",
      });

      if (options.creators && options.creators.length > 0) {
        params.append("creators", options.creators.join(","));
      }

      const response = await fetch(`/api/pod-new/models/page?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }

      return response.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: options.enabled !== false,
  });
}

// Hook for fetching model count
export function useModelsCount(options: UseModelsOptions = {}) {
  return useQuery({
    queryKey: modelsQueryKeys.count(options),
    queryFn: async () => {
      const params = new URLSearchParams({
        search: options.search || "",
        status: options.status || "all",
      });

      if (options.creators && options.creators.length > 0) {
        params.append("creators", options.creators.join(","));
      }

      const response = await fetch(`/api/pod-new/models/count?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch models count");
      }

      const data = await response.json();
      return data.count as number;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: options.enabled !== false,
  });
}

// Hook for fetching a single model by ID
export function useModelDetail(modelId: string, enabled = true) {
  return useQuery({
    queryKey: modelsQueryKeys.detail(modelId),
    queryFn: async () => {
      const response = await fetch(`/api/pod-new/models/${modelId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch model details");
      }

      return response.json() as Promise<ModelDetails>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!modelId,
  });
}

// Utility function to prefetch the next page
export async function prefetchNextModelsPage(
  queryClient: any,
  currentCursor: number,
  options: UseModelsOptions = {}
) {
  await queryClient.prefetchInfiniteQuery({
    queryKey: modelsQueryKeys.list(options),
    queryFn: ({ pageParam }: { pageParam: number }) => fetchModels({ ...options, pageParam }),
    initialPageParam: currentCursor,
    pages: 1,
  });
}

// Hook for prefetching models on hover/interaction
export function usePrefetchModels() {
  const queryClient = useQueryClient();

  const prefetchModelsWithOptions = (options: UseModelsOptions) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: modelsQueryKeys.list(options),
      queryFn: ({ pageParam }: { pageParam: number }) => fetchModels({ ...options, pageParam }),
      initialPageParam: 0,
      ...CACHE_CONFIG,
    });
  };

  const prefetchModelDetail = (modelId: string) => {
    queryClient.prefetchQuery({
      queryKey: modelsQueryKeys.detail(modelId),
      queryFn: async () => {
        const response = await fetch(`/api/pod-new/models/${modelId}`);
        if (!response.ok) throw new Error("Failed to fetch model details");
        return response.json();
      },
      ...CACHE_CONFIG,
    });
  };

  return {
    prefetchModelsWithOptions,
    prefetchModelDetail,
  };
}

// Hook for optimistic filter updates
export function useOptimisticModelsFilter(
  initialOptions: UseModelsOptions = {}
) {
  const queryClient = useQueryClient();

  const updateFiltersOptimistically = useMutation({
    mutationFn: async (newOptions: UseModelsOptions) => {
      // Simulate async operation for smooth UX
      await new Promise((resolve) => setTimeout(resolve, 50));
      return newOptions;
    },
    onMutate: async (newOptions) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: modelsQueryKeys.lists() });

      // Snapshot previous values
      const previousData = queryClient.getQueriesData({
        queryKey: modelsQueryKeys.lists(),
      });

      // Optimistically update cache with loading state
      queryClient.setQueriesData(
        { queryKey: modelsQueryKeys.lists() },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages:
              old.pages?.map((page: any) => ({
                ...page,
                isOptimistic: true,
              })) || [],
          };
        }
      );

      return { previousData };
    },
    onError: (err, newOptions, context) => {
      // Revert on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after mutations
      queryClient.invalidateQueries({ queryKey: modelsQueryKeys.lists() });
    },
  });

  return {
    updateFilters: updateFiltersOptimistically.mutate,
    isUpdating: updateFiltersOptimistically.isPending,
  };
}

// Hook for managing model cache invalidation
export function useModelsCache() {
  const queryClient = useQueryClient();

  const invalidateAllModels = () => {
    queryClient.invalidateQueries({ queryKey: modelsQueryKeys.all });
  };

  const invalidateModelsList = (options?: UseModelsOptions) => {
    if (options) {
      queryClient.invalidateQueries({
        queryKey: modelsQueryKeys.list(options),
      });
    } else {
      queryClient.invalidateQueries({ queryKey: modelsQueryKeys.lists() });
    }
  };

  const invalidateModelDetail = (modelId: string) => {
    queryClient.invalidateQueries({
      queryKey: modelsQueryKeys.detail(modelId),
    });
  };

  const clearModelsCache = () => {
    queryClient.removeQueries({ queryKey: modelsQueryKeys.all });
  };

  const getModelFromCache = (modelId: string): ModelDetails | undefined => {
    return queryClient.getQueryData(modelsQueryKeys.detail(modelId));
  };

  const setModelInCache = (modelId: string, model: ModelDetails) => {
    queryClient.setQueryData(modelsQueryKeys.detail(modelId), model);
  };

  // Background refetch for stale data
  const refreshStaleData = () => {
    queryClient.refetchQueries({
      queryKey: modelsQueryKeys.all,
      type: "active",
      stale: true,
    });
  };

  return {
    invalidateAllModels,
    invalidateModelsList,
    invalidateModelDetail,
    clearModelsCache,
    getModelFromCache,
    setModelInCache,
    refreshStaleData,
  };
}

// Hook for models statistics and analytics
export function useModelsStats(options: UseModelsOptions = {}) {
  return useQuery({
    queryKey: modelsQueryKeys.stats(),
    queryFn: async () => {
      const [totalResponse, activeResponse] = await Promise.all([
        fetch(
          `/api/pod-new/models/count?${new URLSearchParams({
            search: options.search || "",
            status: "all",
            creators: options.creators?.join(",") || "",
          })}`
        ),
        fetch(
          `/api/pod-new/models/count?${new URLSearchParams({
            search: options.search || "",
            status: "active",
            creators: options.creators?.join(",") || "",
          })}`
        ),
      ]);

      const [totalData, activeData] = await Promise.all([
        totalResponse.json(),
        activeResponse.json(),
      ]);

      return {
        total: totalData.count,
        active: activeData.count,
        dropped: totalData.count - activeData.count,
        activePercentage:
          totalData.count > 0 ? (activeData.count / totalData.count) * 100 : 0,
      };
    },
    ...CACHE_CONFIG,
    staleTime: 2 * 60 * 1000, // Refresh stats more frequently (2 minutes)
    enabled: options.enabled !== false,
  });
}
