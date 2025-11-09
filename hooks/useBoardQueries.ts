import { useMutation, useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { Task, BoardColumn, type TaskComment, type TaskAttachment } from "@/lib/stores/boardStore";

export const boardQueryKeys = {
  all: ["board"] as const,
  team: (teamId: string) => [...boardQueryKeys.all, teamId] as const,
  tasks: (teamId: string) => [...boardQueryKeys.team(teamId), "tasks"] as const,
  columns: (teamId: string) => [...boardQueryKeys.team(teamId), "columns"] as const,
  members: (teamId: string) => [...boardQueryKeys.team(teamId), "members"] as const,
  settings: (teamId: string) => [...boardQueryKeys.team(teamId), "settings"] as const,
  comments: (teamId: string, taskId: string) => [...boardQueryKeys.team(teamId), "tasks", taskId, "comments"] as const,
  activities: (teamId: string, taskId: string) => [...boardQueryKeys.team(teamId), "tasks", taskId, "activities"] as const,
  attachmentUrl: (s3Key: string) => [...boardQueryKeys.all, "attachment-url", s3Key] as const,
  resources: (teamId: string) => [...boardQueryKeys.team(teamId), "resources"] as const,
  strikes: (teamId: string) => [...boardQueryKeys.team(teamId), "strikes"] as const,
};

export function useTasksQuery(teamId: string) {
  return useQuery<{ success: boolean; tasks: Task[] }>({
    queryKey: boardQueryKeys.tasks(teamId),
    queryFn: async () => {
      const res = await fetch(`/api/tasks?teamId=${encodeURIComponent(teamId)}`);
      if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.statusText}`);
      return res.json();
    },
    enabled: !!teamId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useColumnsQuery(teamId: string) {
  return useQuery<{ success: boolean; columns: BoardColumn[] }>({
    queryKey: boardQueryKeys.columns(teamId),
    queryFn: async () => {
      const res = await fetch(`/api/board-columns?teamId=${encodeURIComponent(teamId)}`);
      if (!res.ok) throw new Error(`Failed to fetch columns: ${res.statusText}`);
      return res.json();
    },
    enabled: !!teamId,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// Attachment URL queries (presigned URLs)
export function useAttachmentUrlQuery(s3Key?: string, expiresInSec: number = 3600) {
  return useQuery<{ url: string } | null>({
    queryKey: s3Key ? boardQueryKeys.attachmentUrl(s3Key) : ["attachment-url", "disabled"],
    queryFn: async () => {
      if (!s3Key) return null;
      const res = await fetch('/api/upload/s3/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key, expiresIn: expiresInSec }),
      });
      if (!res.ok) throw new Error(`Failed to get presigned URL: ${res.statusText}`);
      return res.json();
    },
    enabled: !!s3Key,
    staleTime: 30 * 60_000, // 30 minutes
    gcTime: 60 * 60_000, // 1 hour
  });
}

export function useAttachmentUrlsQueries(attachments: TaskAttachment[], expiresInSec: number = 3600) {
  const needs = (attachments || []).filter(a => !a.url && !!a.s3Key);
  const queries = useQueries({
    queries: needs.map(a => ({
      queryKey: boardQueryKeys.attachmentUrl(a.s3Key as string),
      queryFn: async () => {
        const res = await fetch('/api/upload/s3/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key: a.s3Key, expiresIn: expiresInSec }),
        });
        if (!res.ok) throw new Error(`Failed to get presigned URL: ${res.statusText}`);
        return res.json() as Promise<{ url: string }>;
      },
      enabled: !!a.s3Key && !a.url,
      staleTime: 30 * 60_000,
      gcTime: 60 * 60_000,
    }))
  });

  const urlMap = new Map<string, string>();
  // Seed with existing URLs
  for (const att of attachments || []) {
    if (att.url) urlMap.set(att.id, att.url);
  }
  // Map fetched URLs to attachment ids
  needs.forEach((att, idx) => {
    const data = queries[idx]?.data as { url: string } | undefined;
    if (data?.url) urlMap.set(att.id, data.url);
  });

  const isLoading = queries.some(q => q.isLoading);
  const isError = queries.some(q => q.isError);
  return { urlMap, isLoading, isError };
}

// Team Resources
export interface TeamResource {
  id: string;
  name: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export function useTeamResourcesQuery(teamId: string) {
  return useQuery<TeamResource[]>({
    queryKey: boardQueryKeys.resources(teamId),
    queryFn: async () => {
      const res = await fetch(`/api/team-resources?teamId=${encodeURIComponent(teamId)}`);
      if (!res.ok) throw new Error(`Failed to fetch resources: ${res.statusText}`);
      return res.json();
    },
    enabled: !!teamId,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreateTeamResourceMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; link: string }) => {
      const res = await fetch('/api/team-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, name: params.name, link: params.link })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create resource: ${res.statusText}`);
      }
      return res.json() as Promise<TeamResource>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.resources(teamId) });
    }
  });
}

export function useUpdateTeamResourceMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; name: string; link: string }) => {
      const res = await fetch(`/api/team-resources/${encodeURIComponent(params.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: params.name, link: params.link })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update resource: ${res.statusText}`);
      }
      return res.json() as Promise<TeamResource>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.resources(teamId) });
    }
  });
}

export function useDeleteTeamResourceMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string }) => {
      const res = await fetch(`/api/team-resources/${encodeURIComponent(params.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to delete resource: ${res.statusText}`);
      }
      return { success: true } as const;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.resources(teamId) });
    }
  });
}

// Strikes
export interface StrikeRecord {
  id: string;
  user: { id: string; name?: string; email: string; image?: string | null };
  createdAt: string;
  reason: string;
  notes?: string | null;
  issuedBy: { name?: string; email: string; image?: string | null };
  attachments?: TaskAttachment[];
}

export function useStrikesQuery(teamId: string) {
  return useQuery<{ strikes: StrikeRecord[] }>({
    queryKey: boardQueryKeys.strikes(teamId),
    queryFn: async () => {
      const res = await fetch(`/api/strikes?teamId=${encodeURIComponent(teamId)}`);
      if (!res.ok) throw new Error(`Failed to fetch strikes: ${res.statusText}`);
      return res.json();
    },
    enabled: !!teamId,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useAddStrikeMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { userId: string; reason: string; notes?: string | null; attachments?: TaskAttachment[]; }) => {
      const res = await fetch('/api/strikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: params.userId, podTeamId: teamId, reason: params.reason, notes: params.notes ?? null, attachments: params.attachments ?? [] })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to add strike: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.strikes(teamId) });
    }
  });
}

export function useDeleteStrikeMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string }) => {
  const res = await fetch(`/api/strikes?strikeId=${encodeURIComponent(params.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to delete strike: ${res.statusText}`);
      }
      return { success: true } as const;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.strikes(teamId) });
    }
  });
}

// Column mutations
export function useCreateColumnMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (column: Omit<BoardColumn, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await fetch('/api/board-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(column),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create column: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.columns(teamId) });
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
    },
  });
}

export function useUpdateColumnMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<BoardColumn> }) => {
      const res = await fetch('/api/board-columns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, ...params.updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update column: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.columns(teamId) });
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
    },
  });
}

export function useDeleteColumnMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string }) => {
      const res = await fetch(`/api/board-columns?id=${encodeURIComponent(params.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to delete column: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.columns(teamId) });
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
    },
  });
}

export function useReorderColumnsMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { columnIds: string[] }) => {
      const res = await fetch('/api/board-columns/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, columnIds: params.columnIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to reorder columns: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.columns(teamId) });
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
    },
  });
}

export function useResetColumnsMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/board-columns/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to reset columns: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: boardQueryKeys.columns(teamId) });
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
    },
  });
}

export interface TeamMembersResponse {
  success: boolean;
  members: Array<{ id: string; email: string; name?: string }>;
  admins: Array<{ id: string; email: string; name?: string }>;
}

export function useTeamMembersQuery(teamId: string) {
  return useQuery<TeamMembersResponse>({
    queryKey: boardQueryKeys.members(teamId),
    queryFn: async () => {
      const res = await fetch(`/api/pod/teams/${teamId}/members`);
      if (!res.ok) throw new Error(`Failed to fetch team members: ${res.statusText}`);
      return res.json();
    },
    enabled: !!teamId,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export interface TeamSettingsResponse {
  success: boolean;
  data: { columnNotificationsEnabled: boolean };
}

export function useTeamSettingsQuery(teamId: string) {
  return useQuery<TeamSettingsResponse>({
    queryKey: boardQueryKeys.settings(teamId),
    queryFn: async () => {
      const res = await fetch(`/api/pod/teams/${teamId}/details`);
      if (!res.ok) throw new Error(`Failed to fetch team settings: ${res.statusText}`);
      return res.json();
    },
    enabled: !!teamId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// Task comments
export interface TaskCommentsResponse {
  success: boolean;
  comments: TaskComment[];
}

export function useTaskCommentsQuery(teamId: string, taskId: string) {
  return useQuery<TaskCommentsResponse>({
    queryKey: boardQueryKeys.comments(teamId || "unknown", taskId),
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/comments`);
      if (!res.ok) throw new Error(`Failed to fetch comments: ${res.statusText}`);
      return res.json();
    },
    enabled: !!taskId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

// Task activities (history)
export interface TaskActivitiesResponse {
  success: boolean;
  activities: import("@/lib/stores/boardStore").TaskActivity[];
}

export function useTaskActivitiesQuery(teamId: string, taskId: string) {
  return useQuery<TaskActivitiesResponse>({
    queryKey: boardQueryKeys.activities(teamId || "unknown", taskId),
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/activities`);
      if (!res.ok) throw new Error(`Failed to fetch activities: ${res.statusText}`);
      return res.json();
    },
    enabled: !!taskId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateTaskCommentMutation(teamId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { content: string; attachments?: TaskAttachment[] }) => {
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: params.content, attachments: params.attachments || [] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create comment: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardQueryKeys.comments(teamId || "unknown", taskId) });
    },
  });
}

export function useUpdateTaskCommentMutation(teamId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { commentId: string; content: string; attachments?: TaskAttachment[] }) => {
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(params.commentId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: params.content, attachments: params.attachments || [] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update comment: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardQueryKeys.comments(teamId || "unknown", taskId) });
    },
  });
}

export function useDeleteTaskCommentMutation(teamId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { commentId: string }) => {
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(params.commentId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to delete comment: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardQueryKeys.comments(teamId || "unknown", taskId) });
    },
  });
}

// Update task (wrap store action with a TanStack mutation for proper invalidation)
export function useUpdateTaskMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { taskId: string; updates: Partial<Task> }) => {
      console.log('🟡 useUpdateTaskMutation - Calling API directly:', params);
      
      // Call the API directly
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.taskId,
          ...params.updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update task: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🟢 useUpdateTaskMutation - API response:', result);
      
      return result;
    },
    onSuccess: async () => {
      // Wait for database to commit
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Invalidate and wait for refetch to complete before returning
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
      await qc.refetchQueries({ queryKey: boardQueryKeys.tasks(teamId) });
    },
  });
}

// Update task status (thin wrapper for symmetry with explicit input)
export function useUpdateTaskStatusMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { taskId: string; status: Task['status'] }) => {
      console.log('🟡 useUpdateTaskStatusMutation - Starting mutation:', params);
      console.log('🟡 Calling API directly instead of through Zustand store...');
      
      // Call the API directly instead of going through Zustand store
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.taskId,
          status: params.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update task: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('🟢 API response:', { 
        success: result.success, 
        taskId: result.task?.id,
        newStatus: result.task?.status
      });
      
      return result;
    },
    onMutate: async (params) => {
      console.log('🔵 onMutate - Setting optimistic update for:', params);
      
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await qc.cancelQueries({ queryKey: boardQueryKeys.tasks(teamId) });

      // Snapshot the previous value for rollback
      const previousTasks = qc.getQueryData(boardQueryKeys.tasks(teamId));

      // Optimistically update the cache
      qc.setQueryData(boardQueryKeys.tasks(teamId), (old: any) => {
        if (!old?.tasks) return old;
        
        const updatedData = {
          ...old,
          tasks: old.tasks.map((task: Task) =>
            task.id === params.taskId
              ? { ...task, status: params.status, updatedAt: new Date().toISOString() }
              : task
          ),
        };
        
        console.log('🔵 onMutate - Cache updated, task new status:', 
          updatedData.tasks.find((t: Task) => t.id === params.taskId)?.status
        );
        
        return updatedData;
      });

      return { previousTasks };
    },
    onError: (err, params, context) => {
      // Rollback to previous state on error
      if (context?.previousTasks) {
        qc.setQueryData(boardQueryKeys.tasks(teamId), context.previousTasks);
      }
    },
    onSettled: async () => {
      console.log('🟣 onSettled (useUpdateTaskStatusMutation) - Waiting 800ms before refetch...');
      
      // Wait longer for database to commit (increased to 800ms for reliability)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('🟣 onSettled (useUpdateTaskStatusMutation) - Invalidating cache and refetching...');
      
      // Invalidate and refetch to sync with server
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
      
      // Get the updated data from cache after refetch
      const updatedCache = qc.getQueryData(boardQueryKeys.tasks(teamId));
      console.log('🟣 onSettled (useUpdateTaskStatusMutation) - Refetch complete. Cache now contains:', {
        taskCount: (updatedCache as any)?.tasks?.length,
        sample: (updatedCache as any)?.tasks?.[0]
      });
    },
  });
}

// Update OFTV-related fields while keeping tasks cache in sync
export function useUpdateOFTVTaskMutation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { taskId: string; updates: any }) => {
      console.log('🟡 useUpdateOFTVTaskMutation - Starting mutation:', params);
      
      // First, get the OFTV task ID from React Query cache
      const cachedData: any = qc.getQueryData(boardQueryKeys.tasks(teamId));
      const task = cachedData?.tasks?.find((t: Task) => t.id === params.taskId);
      const oftvTaskId = (task as any)?.oftvTask?.id;
      
      if (!oftvTaskId) {
        throw new Error('OFTV task not found');
      }
      
      console.log('🟡 Calling /api/oftv-tasks PATCH with:', { id: oftvTaskId, ...params.updates });
      
      // Call the API directly
      const response = await fetch('/api/oftv-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: oftvTaskId, ...params.updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update OFTV task');
      }

      const result = await response.json();
      
      console.log('🟢 /api/oftv-tasks PATCH response:', result);
      
      return result;
    },
    onMutate: async (params) => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await qc.cancelQueries({ queryKey: boardQueryKeys.tasks(teamId) });

      // Snapshot the previous value for rollback
      const previousTasks = qc.getQueryData(boardQueryKeys.tasks(teamId));

      // Optimistically update the cache
      qc.setQueryData(boardQueryKeys.tasks(teamId), (old: any) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((task: Task) => {
            if (task.id === params.taskId && (task as any).oftvTask) {
              return {
                ...task,
                oftvTask: {
                  ...(task as any).oftvTask,
                  ...params.updates,
                },
                updatedAt: new Date().toISOString()
              };
            }
            return task;
          }),
        };
      });

      return { previousTasks };
    },
    onError: (err, params, context) => {
      // Rollback to previous state on error
      if (context?.previousTasks) {
        qc.setQueryData(boardQueryKeys.tasks(teamId), context.previousTasks);
      }
    },
    onSettled: async () => {
      // Wait longer for database to commit (increased to 800ms for reliability)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Invalidate and refetch to sync with server
      await qc.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) });
    },
  });
}
