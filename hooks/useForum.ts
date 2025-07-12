// React hooks for forum functionality
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [posts, setPosts] = useState<FrontendForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Destructure options to individual dependencies to avoid object recreation issues
  const { categoryId, modelName, sortBy, page, limit, search } = options;

  const fetchPosts = useCallback(async () => {
    console.log('Fetching posts with options:', { categoryId, modelName, sortBy, page, limit, search });
    try {
      setLoading(true);
      setError(null);
      const requestOptions = {
        categoryId,
        modelName,
        sortBy,
        page,
        limit,
        search,
      };
      const response = await forumAPI.getAllPosts(requestOptions);
      console.log('Raw API response:', response);
      const transformedPosts = response.posts.map(transformers.postToFrontend);
      console.log('Transformed posts:', transformedPosts);
      setPosts(transformedPosts);
      setTotal(response.total);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [categoryId, modelName, sortBy, page, limit, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const refetch = () => {
    fetchPosts();
  };

  return { posts, loading, error, total, refetch };
};

export const useForumCategories = () => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await forumAPI.getAllCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export const useForumStats = () => {
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await forumAPI.getForumStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refetch = async () => {
    try {
      const data = await forumAPI.getForumStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  };

  return { stats, loading, error, refetch };
};

export const useForumPost = (postId: number | null) => {
  const [post, setPost] = useState<FrontendForumPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await forumAPI.getPostById(postId);
        const transformedPost = transformers.postToFrontend(data);
        setPost(transformedPost);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  return { post, loading, error };
};

export const useForumActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (postData: CreatePostDto): Promise<FrontendForumPost | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await forumAPI.createPost(postData);
      return transformers.postToFrontend(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (commentData: CreateCommentDto): Promise<FrontendForumComment | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await forumAPI.createComment(commentData);
      return transformers.commentToFrontend(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const vote = async (voteData: {
    type: 'upvote' | 'downvote';
    target: 'post' | 'comment';
    postId?: number;
    commentId?: number;
  }): Promise<{ success: boolean; newScore?: number }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await forumAPI.vote(voteData);
      return { success: true, newScore: response.newScore };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await forumAPI.deletePost(postId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await forumAPI.deleteComment(commentId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const seedForumData = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await forumAPI.seedForumData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed forum data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPost,
    createComment,
    vote,
    deletePost,
    deleteComment,
    seedForumData,
    loading,
    error,
  };
};

// Custom hook for managing votes with optimistic updates
export const useVoteManager = () => {
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const [optimisticScores, setOptimisticScores] = useState<Record<string, { upvotes: number; downvotes: number }>>({});
  const [votesLoaded, setVotesLoaded] = useState(false);
  const { vote } = useForumActions();

  // Load user votes on mount
  useEffect(() => {
    const loadUserVotes = async () => {
      try {
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
        
        setUserVotes(voteMap);
        setVotesLoaded(true);
      } catch (error) {
        console.error('Failed to load user votes:', error);
        setVotesLoaded(true); // Still mark as loaded to avoid infinite loading
      }
    };

    loadUserVotes();
  }, []);

  const handleVote = useCallback(async (
    itemId: string,
    voteType: 'up' | 'down',
    target: 'post' | 'comment',
    numericId: number,
    currentUpvotes: number = 0,
    currentDownvotes: number = 0
  ) => {
    const currentVote = userVotes[itemId];
    
    // Determine the new vote state
    const newVote = currentVote === voteType ? null : voteType;
    
    // Calculate optimistic score changes
    let upvoteDelta = 0;
    let downvoteDelta = 0;
    
    if (currentVote === 'up' && newVote !== 'up') {
      upvoteDelta = -1; // Remove upvote
    }
    if (currentVote === 'down' && newVote !== 'down') {
      downvoteDelta = -1; // Remove downvote
    }
    if (newVote === 'up' && currentVote !== 'up') {
      upvoteDelta = 1; // Add upvote
    }
    if (newVote === 'down' && currentVote !== 'down') {
      downvoteDelta = 1; // Add downvote
    }
    
    // Apply optimistic updates
    setUserVotes(prev => ({
      ...prev,
      [itemId]: newVote,
    }));
    
    setOptimisticScores(prev => ({
      ...prev,
      [itemId]: {
        upvotes: (prev[itemId]?.upvotes ?? currentUpvotes) + upvoteDelta,
        downvotes: (prev[itemId]?.downvotes ?? currentDownvotes) + downvoteDelta,
      },
    }));

    // Always make API call - the backend handles vote removal vs creation/update
    const voteData = {
      type: voteType === 'up' ? 'upvote' as const : 'downvote' as const,
      target,
      ...(target === 'post' ? { postId: numericId } : { commentId: numericId }),
    };

    try {
      const result = await vote(voteData);
      if (!result.success) {
        // Revert optimistic updates on error
        setUserVotes(prev => ({
          ...prev,
          [itemId]: currentVote,
        }));
        setOptimisticScores(prev => ({
          ...prev,
          [itemId]: {
            upvotes: currentUpvotes,
            downvotes: currentDownvotes,
          },
        }));
      }
    } catch {
      // Revert optimistic updates on error
      setUserVotes(prev => ({
        ...prev,
        [itemId]: currentVote,
      }));
      setOptimisticScores(prev => ({
        ...prev,
        [itemId]: {
          upvotes: currentUpvotes,
          downvotes: currentDownvotes,
        },
      }));
    }
  }, [vote, userVotes]);

  const getDisplayScores = useCallback((itemId: string, originalUpvotes: number, originalDownvotes: number) => {
    const optimistic = optimisticScores[itemId];
    return optimistic || { upvotes: originalUpvotes, downvotes: originalDownvotes };
  }, [optimisticScores]);

  return { userVotes, handleVote, getDisplayScores, votesLoaded };
};
