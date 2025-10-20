import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
  emailVerified: Date | null;
}

interface PaginationInfo {
  page: number;
  limit: string;
  totalUsers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  showing: number;
}

interface AdminUsersResponse {
  success: boolean;
  users: User[];
  pagination: PaginationInfo;
}

interface AdminUsersParams {
  page?: number;
  limit?: string;
  search?: string;
  role?: string;
}

const fetchAdminUsers = async (params: AdminUsersParams): Promise<AdminUsersResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.search) searchParams.set('search', params.search);
  if (params.role && params.role !== 'all') searchParams.set('role', params.role);

  const response = await fetch(`/api/admin/users?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export const useAdminUsers = (params: AdminUsersParams) => {
  const queryKey = ['admin-users', params];
  
  const query = useQuery({
    queryKey,
    queryFn: () => fetchAdminUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });

  return {
    ...query,
    users: query.data?.users || [],
    pagination: query.data?.pagination,
  };
};

// Hook for invalidating and refetching admin users cache
export const useAdminUsersActions = () => {
  const queryClient = useQueryClient();

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }, [queryClient]);

  const refetchUsers = useCallback((params?: AdminUsersParams) => {
    if (params) {
      queryClient.refetchQueries({ queryKey: ['admin-users', params] });
    } else {
      queryClient.refetchQueries({ queryKey: ['admin-users'] });
    }
  }, [queryClient]);

  const setUsersData = useCallback((params: AdminUsersParams, data: AdminUsersResponse) => {
    queryClient.setQueryData(['admin-users', params], data);
  }, [queryClient]);

  return {
    invalidateUsers,
    refetchUsers,
    setUsersData,
  };
};

// Export types for use in components
export type { User, PaginationInfo, AdminUsersParams, AdminUsersResponse };