import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface ActivityData {
  id: string;
  actionType: string;
  oldRole: string | null;
  newRole: string;
  reason: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  targetUser: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface ActivityPaginationInfo {
  page: number;
  limit: string;
  totalActivities: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  showing: number;
}

interface ActivityHistoryResponse {
  success: boolean;
  activities: ActivityData[];
  pagination: ActivityPaginationInfo;
}

interface ActivityHistoryParams {
  page?: number;
  limit?: string;
  search?: string;
  actionType?: string;
  actorId?: string;
  targetUserId?: string;
  startDate?: string;
  endDate?: string;
}

const fetchActivityHistory = async (params: ActivityHistoryParams): Promise<ActivityHistoryResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.search) searchParams.set('search', params.search);
  if (params.actionType && params.actionType !== 'ALL') searchParams.set('actionType', params.actionType);
  if (params.actorId) searchParams.set('actorId', params.actorId);
  if (params.targetUserId) searchParams.set('targetUserId', params.targetUserId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const response = await fetch(`/api/admin/user-activity-history?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity history');
  }

  return response.json();
};

export const useActivityHistory = (params: ActivityHistoryParams) => {
  const queryKey = ['activity-history', params];
  
  const query = useQuery({
    queryKey,
    queryFn: () => fetchActivityHistory(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });

  return {
    ...query,
    activities: query.data?.activities || [],
    pagination: query.data?.pagination,
  };
};

// Hook for invalidating and refetching activity history cache
export const useActivityHistoryActions = () => {
  const queryClient = useQueryClient();

  const invalidateActivities = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['activity-history'] });
  }, [queryClient]);

  const refetchActivities = useCallback((params?: ActivityHistoryParams) => {
    if (params) {
      queryClient.refetchQueries({ queryKey: ['activity-history', params] });
    } else {
      queryClient.refetchQueries({ queryKey: ['activity-history'] });
    }
  }, [queryClient]);

  const setActivitiesData = useCallback((params: ActivityHistoryParams, data: ActivityHistoryResponse) => {
    queryClient.setQueryData(['activity-history', params], data);
  }, [queryClient]);

  return {
    invalidateActivities,
    refetchActivities,
    setActivitiesData,
  };
};

// Export types for use in components
export type { ActivityData, ActivityPaginationInfo, ActivityHistoryParams, ActivityHistoryResponse };