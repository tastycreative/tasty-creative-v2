import { useQuery } from "@tanstack/react-query";

export interface CreatorsData {
  creators: Creator[];
  pricingData: PricingGroup[];
}

// Query keys for consistent cache management
export const creatorsQueryKeys: {
  all: readonly ["creators"];
  lists: () => readonly ["creators", "list"];
  list: (creatorName?: string) => readonly ["creators", "list", string | undefined];
  detail: (creatorName: string) => readonly ["creators", "detail", string];
} = {
  all: ["creators"] as const,
  lists: () => [...creatorsQueryKeys.all, "list"] as const,
  list: (creatorName?: string) =>
    [...creatorsQueryKeys.lists(), creatorName] as const,
  detail: (creatorName: string) =>
    [...creatorsQueryKeys.all, "detail", creatorName] as const,
};

// Fetch function for creators API
async function fetchCreators(creatorName?: string): Promise<CreatorsData> {
  const url = creatorName
    ? `/api/creators-db?creatorName=${encodeURIComponent(creatorName)}`
    : "/api/creators-db";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch creators: ${response.statusText}`);
  }

  return response.json();
}

// Hook for fetching all creators
export function useAllCreators() {
  return useQuery({
    queryKey: creatorsQueryKeys.list(),
    queryFn: () => {
      console.log("🔄 TanStack Query: Fetching all creators");
      return fetchCreators();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching a specific creator
export function useCreator(creatorName?: string) {
  return useQuery({
    queryKey: creatorsQueryKeys.detail(creatorName || ""),
    queryFn: () => {
      console.log(`🔄 TanStack Query: Fetching creator "${creatorName}"`);
      return fetchCreators(creatorName);
    },
    enabled: !!creatorName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Legacy hook for backward compatibility (converts to TanStack Query)
export function useCreatorsQuery(creatorName?: string) {
  const allCreatorsQuery = useAllCreators();
  const specificCreatorQuery = useCreator(creatorName);

  // If creatorName is provided, use specific creator query, otherwise use all creators
  const activeQuery = creatorName ? specificCreatorQuery : allCreatorsQuery;

  return {
    data: activeQuery.data,
    creators: activeQuery.data?.creators || [],
    pricingData: activeQuery.data?.pricingData || [],
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
    // Legacy compatibility
    loading: activeQuery.isLoading,
  };
}
