import { useQuery } from '@tanstack/react-query';

interface ForumAnalytics {
  overview: {
    totalThreads: number;
    totalReplies: number;
    totalUsers: number;
    totalViews: number;
    activeThreads: number;
    pinnedThreads: number;
    solvedThreads: number;
    avgRepliesPerThread: number;
    avgViewsPerThread: number;
  };
  activity: Array<{
    date: string;
    threads: number;
    replies: number;
    views: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    color: string;
    _count: {
      threads: number;
    };
  }>;
  activeUsers: Array<{
    id: string;
    name: string;
    image: string | null;
    _count: {
      forumThreads: number;
      forumComments: number;
    };
  }>;
  moderation: Array<{
    id: string;
    action: string;
    reason: string | null;
    createdAt: string;
    moderator: {
      id: string;
      name: string;
      image: string | null;
    };
    thread: {
      id: string;
      title: string;
    };
  }>;
  timeframe: number;
}

export function useForumAnalytics(modelId: string, timeframe: string = '30') {
  return useQuery<ForumAnalytics>({
    queryKey: ['forum-analytics', modelId, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/models/${modelId}/forum/analytics?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forum analytics');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}

export function useForumAnalyticsRealtime(modelId: string, timeframe: string = '30') {
  return useQuery<ForumAnalytics>({
    queryKey: ['forum-analytics-realtime', modelId, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/models/${modelId}/forum/analytics?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forum analytics');
      }
      return response.json();
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
  });
}