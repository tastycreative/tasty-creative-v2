"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface PostAttachment {
  id: string;
  url: string;
  filename: string;
  type: string;
  size: number;
}

export interface ThreadPost {
  id: string;
  content_md: string;
  content_html: string;
  author: {
    id: string;
    username: string;
    name?: string | null;
    image?: string | null;
    role: string;
  };
  createdAt: string;
  reactions: Array<{ type: string; count: number }>;
  attachments?: PostAttachment[];
}

export interface ThreadDetail {
  id: string;
  modelId: string;
  title: string;
  categoryKey: string;
  author: {
    id: string;
    username: string;
    name?: string | null;
    image?: string | null;
    role: string;
  };
  pinned: boolean;
  locked: boolean;
  solved: boolean;
  views: number;
  postCount: number;
  watcherCount: number;
  watching: boolean;
  createdAt: string;
  updatedAt: string;
  posts: ThreadPost[];
}

async function fetchThread(modelId: string, threadId: string): Promise<ThreadDetail> {
  const response = await fetch(`/api/models/${modelId}/forum/threads/${threadId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Thread not found");
    }
    if (response.status === 401) {
      throw new Error("Authentication required");
    }
    throw new Error("Failed to load thread");
  }

  return response.json();
}

async function createPost(
  modelId: string,
  threadId: string,
  content: string,
  attachments?: PostAttachment[]
): Promise<ThreadPost> {
  const response = await fetch(`/api/models/${modelId}/forum/threads/${threadId}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, attachments }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create post");
  }

  return response.json();
}

export function useThreadDetail(modelId: string, threadId: string) {
  return useQuery({
    queryKey: ["thread", modelId, threadId],
    queryFn: () => fetchThread(modelId, threadId),
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

export function useCreatePost(modelId: string, threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, attachments }: { content: string; attachments?: PostAttachment[] }) =>
      createPost(modelId, threadId, content, attachments),
    onSuccess: (newPost) => {
      // Optimistically update the thread data
      queryClient.setQueryData<ThreadDetail>(
        ["thread", modelId, threadId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            posts: [...old.posts, newPost],
            postCount: old.postCount + 1,
          };
        }
      );

      // Invalidate to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["thread", modelId, threadId] });

      toast.success("Reply posted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post reply");
    },
  });
}
