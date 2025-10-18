// React hooks for forum functionality using React Query
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  forumAPI, 
  transformers, 
  FrontendForumPost, 
  FrontendForumComment, 
  ForumCategory, 
  ForumStats,
  GetPostsOptions,
  CreatePostDto,
  CreateCommentDto 
} from '../lib/forum-api';

export const useForumPosts = (options: GetPostsOptions = {}) => {
  const queryKey = ['forum', 'posts', options];
  
  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching posts with options:', options);
      const response = await forumAPI.getAllPosts(options);
      console.log('Raw API response:', response);
      const transformedPosts = response.posts.map(transformers.postToFrontend);
      console.log('Transformed posts:', transformedPosts);
      return {
        posts: transformedPosts,
        total: response.total
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return { 
    posts: data?.posts || [], 
    total: data?.total || 0, 
    loading, 
    error: error?.message || null, 
    refetch 
  };
};

export const useForumCategories = () => {
  const {
    data: categories = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => forumAPI.getAllCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes (categories don't change often)
    refetchOnWindowFocus: false,
  });

  return { 
    categories, 
    loading, 
    error: error?.message || null 
  };
};

export const useForumStats = () => {
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['forum', 'stats'],
    queryFn: () => forumAPI.getForumStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return { 
    stats: stats || null, 
    loading, 
    error: error?.message || null, 
    refetch 
  };
};

export const useForumPost = (postId: number | null) => {
  const {
    data: post,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['forum', 'post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const data = await forumAPI.getPostById(postId);
      return transformers.postToFrontend(data);
    },
    enabled: !!postId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return { 
    post: post || null, 
    loading, 
    error: error?.message || null 
  };
};

export const useForumActions = () => {
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: (postData: CreatePostDto) => forumAPI.createPost(postData),
    onSuccess: (newPost) => {
      // Transform and add to cache
      const transformedPost = transformers.postToFrontend(newPost);
      
      // Invalidate posts queries to refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      
      // Optionally add the new post to existing queries (optimistic update)
      queryClient.setQueriesData(
        { queryKey: ['forum', 'posts'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            posts: [transformedPost, ...oldData.posts],
            total: oldData.total + 1
          };
        }
      );
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (commentData: CreateCommentDto) => forumAPI.createComment(commentData),
    onSuccess: () => {
      // Invalidate posts queries to refetch updated comment counts
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: (voteData: {
      type: 'upvote' | 'downvote';
      target: 'post' | 'comment';
      postId?: number;
      commentId?: number;
    }) => forumAPI.vote(voteData),
    onSuccess: () => {
      // Invalidate posts and user votes to refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'userVotes'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => forumAPI.deletePost(postId),
    onSuccess: (_, postId) => {
      // Remove from cache and invalidate
      queryClient.setQueriesData(
        { queryKey: ['forum', 'posts'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            posts: oldData.posts.filter((post: FrontendForumPost) => post.id !== postId.toString()),
            total: oldData.total - 1
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => forumAPI.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
  });

  const seedForumDataMutation = useMutation({
    mutationFn: () => forumAPI.seedForumData(),
    onSuccess: () => {
      // Invalidate all forum data
      queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });

  return {
    createPost: createPostMutation.mutateAsync,
    createComment: createCommentMutation.mutateAsync,
    vote: async (voteData: any) => {
      try {
        const response = await voteMutation.mutateAsync(voteData);
        return { success: true, newScore: response.newScore };
      } catch {
        return { success: false };
      }
    },
    deletePost: async (postId: number) => {
      try {
        await deletePostMutation.mutateAsync(postId);
        return true;
      } catch {
        return false;
      }
    },
    deleteComment: async (commentId: number) => {
      try {
        await deleteCommentMutation.mutateAsync(commentId);
        return true;
      } catch {
        return false;
      }
    },
    seedForumData: async () => {
      try {
        await seedForumDataMutation.mutateAsync();
        return true;
      } catch {
        return false;
      }
    },
    loading: createPostMutation.isPending || 
             createCommentMutation.isPending || 
             voteMutation.isPending || 
             deletePostMutation.isPending || 
             deleteCommentMutation.isPending || 
             seedForumDataMutation.isPending,
    error: createPostMutation.error?.message || 
           createCommentMutation.error?.message || 
           voteMutation.error?.message || 
           deletePostMutation.error?.message || 
           deleteCommentMutation.error?.message || 
           seedForumDataMutation.error?.message || 
           null,
  };
};

// Custom hook for managing votes with optimistic updates using React Query
export const useVoteManager = () => {
  const queryClient = useQueryClient();
  const { vote } = useForumActions();

  // Load user votes using React Query
  const {
    data: userVotesData,
    isLoading
  } = useQuery({
    queryKey: ['forum', 'userVotes'],
    queryFn: async () => {
      const { postVotes, commentVotes } = await forumAPI.getUserVotes();
      
      const voteMap: Record<string, 'up' | 'down' | null> = {};
      
      // Map post votes
      postVotes.forEach(({ postId, type }) => {
        voteMap[postId.toString()] = type === 'upvote' ? 'up' : 'down';
      });
      
      // Map comment votes  
      commentVotes.forEach(({ commentId, type }) => {
        voteMap[`comment-${commentId}`] = type === 'upvote' ? 'up' : 'down';
      });
      
      return voteMap;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const userVotes = userVotesData || {};
  const votesLoaded = !isLoading;

  const voteMutation = useMutation({
    mutationFn: async (voteData: {
      itemId: string;
      voteType: 'up' | 'down';
      target: 'post' | 'comment';
      numericId: number;
      currentUpvotes?: number;
      currentDownvotes?: number;
    }) => {
      const apiVoteData = {
        type: voteData.voteType === 'up' ? 'upvote' as const : 'downvote' as const,
        target: voteData.target,
        ...(voteData.target === 'post' 
          ? { postId: voteData.numericId } 
          : { commentId: voteData.numericId }
        ),
      };
      
      return await vote(apiVoteData);
    },
    onMutate: async (voteData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['forum', 'userVotes'] });
      
      // Snapshot the previous value
      const previousUserVotes = queryClient.getQueryData(['forum', 'userVotes']);
      
      // Optimistically update user votes
      const currentVote = userVotes[voteData.itemId];
      const newVote = currentVote === voteData.voteType ? null : voteData.voteType;
      
      queryClient.setQueryData(['forum', 'userVotes'], (old: any) => ({
        ...old,
        [voteData.itemId]: newVote,
      }));
      
      // Return a context with the previous and new values
      return { previousUserVotes, voteData };
    },
    onError: (err, voteData, context) => {
      // Revert the optimistic update
      if (context?.previousUserVotes) {
        queryClient.setQueryData(['forum', 'userVotes'], context.previousUserVotes);
      }
    },
    onSuccess: () => {
      // Invalidate posts to refetch updated scores
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
    onSettled: () => {
      // Refetch user votes to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['forum', 'userVotes'] });
    },
  });

  const handleVote = async (
    itemId: string,
    voteType: 'up' | 'down',
    target: 'post' | 'comment',
    numericId: number,
    currentUpvotes: number = 0,
    currentDownvotes: number = 0
  ) => {
    await voteMutation.mutateAsync({
      itemId,
      voteType,
      target,
      numericId,
      currentUpvotes,
      currentDownvotes,
    });
  };

  // For display scores, we'll rely on the actual post data from the posts query
  // since React Query handles the cache updates automatically
  const getDisplayScores = (itemId: string, originalUpvotes: number, originalDownvotes: number) => {
    return { upvotes: originalUpvotes, downvotes: originalDownvotes };
  };

  return { 
    userVotes, 
    handleVote, 
    getDisplayScores, 
    votesLoaded: votesLoaded 
  };
};
