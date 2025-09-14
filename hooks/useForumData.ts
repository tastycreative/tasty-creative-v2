"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

// Types
interface ForumStats {
  totalThreads: number;
  todayThreads: number;
  activeUsers: number;
  totalPosts: number;
}

interface ForumCategory {
  id: string;
  modelId: string;
  key: string;
  name: string;
  threadCount?: number;
}

interface ForumThread {
  id: string;
  modelId: string;
  title: string;
  categoryKey: string;
  author: {
    id: string;
    username: string;
    name?: string;
    image?: string;
    role: string;
  };
  pinned: boolean;
  locked: boolean;
  solved: boolean;
  views: number;
  postCount: number;
  watcherCount?: number;
  watching?: boolean;
  lastActivity: string;
  createdAt: string;
}

interface ThreadsResponse {
  threads: ForumThread[];
  nextCursor?: string;
  hasMore: boolean;
}

// API functions
async function fetchForumStats(modelId: string): Promise<ForumStats> {
  const response = await fetch(`/api/models/${modelId}/forum/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch forum stats');
  }
  return response.json();
}

async function fetchForumCategories(modelId: string): Promise<ForumCategory[]> {
  const response = await fetch(`/api/models/${modelId}/forum/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

async function fetchForumThreads(
  modelId: string,
  options?: {
    category?: string;
    sort?: string;
    search?: string;
    limit?: number;
    cursor?: string;
  }
): Promise<ThreadsResponse> {
  const params = new URLSearchParams();
  if (options?.category && options.category !== 'all') params.set('category', options.category);
  if (options?.sort) params.set('sort', options.sort);
  if (options?.search) params.set('search', options.search);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('cursor', options.cursor);

  const response = await fetch(`/api/models/${modelId}/forum/threads?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch threads');
  }
  return response.json();
}

// React Query hooks
export function useForumStats(modelId: string) {
  return useQuery({
    queryKey: ['forum-stats', modelId],
    queryFn: () => fetchForumStats(modelId),
    enabled: !!modelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useForumCategories(modelId: string) {
  return useQuery({
    queryKey: ['forum-categories', modelId],
    queryFn: () => fetchForumCategories(modelId),
    enabled: !!modelId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useForumThreads(
  modelId: string,
  options?: {
    category?: string;
    sort?: string;
    search?: string;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ['forum-threads', modelId, options],
    queryFn: () => fetchForumThreads(modelId, options),
    enabled: !!modelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Mutation hooks for creating/updating content
export function useCreateThread(modelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      categoryKey: string;
      content: string;
    }) => {
      const response = await fetch(`/api/models/${modelId}/forum/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create thread');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch forum data
      queryClient.invalidateQueries({ queryKey: ['forum-threads', modelId] });
      queryClient.invalidateQueries({ queryKey: ['forum-stats', modelId] });
      queryClient.invalidateQueries({ queryKey: ['forum-categories', modelId] });
    },
  });
}

export function useCreatePost(modelId: string, threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      parentPostId?: string;
    }) => {
      const response = await fetch(`/api/models/${modelId}/forum/threads/${threadId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['forum-threads', modelId] });
      queryClient.invalidateQueries({ queryKey: ['forum-stats', modelId] });
    },
  });
}