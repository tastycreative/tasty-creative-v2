import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ModerateThreadParams {
  modelId: string;
  threadId: string;
  action: "pin" | "unpin" | "lock" | "unlock" | "solve" | "unsolve";
  reason?: string;
}

export function useModerateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, threadId, action, reason }: ModerateThreadParams) => {
      const response = await fetch(
        `/api/models/${modelId}/forum/threads/${threadId}/moderate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, reason }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to moderate thread");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Authentication required');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const actionMessages = {
        pin: "Thread pinned successfully",
        unpin: "Thread unpinned successfully",
        lock: "Thread locked successfully",
        unlock: "Thread unlocked successfully",
        solve: "Thread marked as solved",
        unsolve: "Thread unmarked as solved",
      };

      toast.success(actionMessages[variables.action]);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["forum-threads", variables.modelId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["forum-thread", variables.threadId] 
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to moderate thread");
    },
  });
}

export function useModerationHistory(modelId: string, threadId: string) {
  return useQuery({
    queryKey: ["moderation-history", modelId, threadId],
    queryFn: async () => {
      const response = await fetch(
        `/api/models/${modelId}/forum/threads/${threadId}/moderate`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch moderation history");
      }

      return response.json();
    },
    enabled: !!modelId && !!threadId,
  });
}