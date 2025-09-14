import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
  threadCount: number;
  createdAt: string;
}

interface CreateTagParams {
  modelId: string;
  name: string;
  color?: string;
}

interface UpdateThreadTagsParams {
  modelId: string;
  threadId: string;
  tagIds: string[];
}

// Get all tags for a model
export function useForumTags(modelId: string) {
  return useQuery({
    queryKey: ["forum-tags", modelId],
    queryFn: async (): Promise<{ tags: Tag[] }> => {
      const response = await fetch(`/api/models/${modelId}/forum/tags`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      
      return response.json();
    },
    enabled: !!modelId,
  });
}

// Create a new tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, name, color }: CreateTagParams) => {
      const response = await fetch(`/api/models/${modelId}/forum/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tag");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`Tag "${variables.name}" created successfully`);
      queryClient.invalidateQueries({
        queryKey: ["forum-tags", variables.modelId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create tag");
    },
  });
}

// Get tags for a specific thread
export function useThreadTags(modelId: string, threadId: string) {
  return useQuery({
    queryKey: ["thread-tags", modelId, threadId],
    queryFn: async () => {
      const response = await fetch(
        `/api/models/${modelId}/forum/threads/${threadId}/tags`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch thread tags");
      }
      
      return response.json();
    },
    enabled: !!modelId && !!threadId,
  });
}

// Update thread tags
export function useUpdateThreadTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, threadId, tagIds }: UpdateThreadTagsParams) => {
      const response = await fetch(
        `/api/models/${modelId}/forum/threads/${threadId}/tags`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tagIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update thread tags");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success("Thread tags updated successfully");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["thread-tags", variables.modelId, variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum-threads", variables.modelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum-tags", variables.modelId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update thread tags");
    },
  });
}

// Search threads by tags
export function useSearchThreadsByTags(modelId: string, tagIds: string[]) {
  return useQuery({
    queryKey: ["threads-by-tags", modelId, tagIds.sort()],
    queryFn: async () => {
      const params = new URLSearchParams();
      tagIds.forEach(tagId => params.append("tagId", tagId));
      
      const response = await fetch(
        `/api/models/${modelId}/forum/threads?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to search threads by tags");
      }
      
      return response.json();
    },
    enabled: !!modelId && tagIds.length > 0,
  });
}