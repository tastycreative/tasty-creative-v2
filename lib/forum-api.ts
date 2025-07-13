// Forum API client that calls Next.js API routes directly
// This service handles all forum operations by calling /api/be/forum endpoints

export interface ForumComment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
  upvotes: number;
  downvotes: number;
  score: number;
  timestamp: string;
  replies?: ForumComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
  upvotes: number;
  downvotes: number;
  score: number;
  comments: ForumComment[];
  timestamp: string;
  category: {
    id: number;
    name: string;
    color: string;
  };
  modelName?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  viewCount: number;
  commentCount: number;
  awards: ForumPostAward[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumCategory {
  id: number;
  name: string;
  color: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumUser {
  id: number;
  username: string;
  avatar: string;
  email?: string;
  isVerified: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  totalKarma: number;
  totalPosts: number;
  totalComments: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPostAward {
  id: number;
  type: "silver" | "gold" | "platinum" | "helpful" | "wholesome";
  message?: string;
  givenBy: {
    id: number;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

export interface ForumStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  todayPosts: number;
  activeUsers: number;
}

export interface CreatePostDto {
  title: string;
  content: string;
  categoryId: number;
  modelName?: string;
  isPinned?: boolean;
}

export interface CreateCommentDto {
  content: string;
  postId: number;
  parentCommentId?: number;
}

export interface CreateVoteDto {
  type: "upvote" | "downvote";
  target: "post" | "comment";
  postId?: number;
  commentId?: number;
}

export interface PostsResponse {
  posts: ForumPost[];
  total: number;
}

export interface GetPostsOptions {
  categoryId?: number;
  modelName?: string;
  generalOnly?: boolean;
  sortBy?: "hot" | "new" | "top";
  page?: number;
  limit?: number;
  search?: string;
}

class ForumAPI {
  private readonly baseUrl = "/api/be/forum";

  // Helper method to handle API requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Forum API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // ================== POSTS ==================

  async createPost(postData: CreatePostDto): Promise<ForumPost> {
    return this.request<ForumPost>("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  async getAllPosts(options: GetPostsOptions = {}): Promise<PostsResponse> {
    const searchParams = new URLSearchParams();

    if (options.categoryId)
      searchParams.append("categoryId", options.categoryId.toString());
    if (options.modelName) searchParams.append("modelName", options.modelName);
    if (options.generalOnly) searchParams.append("generalOnly", "true");
    if (options.sortBy) searchParams.append("sortBy", options.sortBy);
    if (options.page) searchParams.append("page", options.page.toString());
    if (options.limit) searchParams.append("limit", options.limit.toString());
    if (options.search) searchParams.append("search", options.search);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/posts?${queryString}` : "/posts";

    return this.request<PostsResponse>(endpoint);
  }

  async getPostById(id: number): Promise<ForumPost> {
    return this.request<ForumPost>(`/posts/${id}`);
  }

  async updatePost(
    id: number,
    postData: Partial<CreatePostDto>
  ): Promise<ForumPost> {
    return this.request<ForumPost>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(postData),
    });
  }

  async deletePost(id: number): Promise<void> {
    await this.request(`/posts/${id}`, {
      method: "DELETE",
    });
  }

  // ================== COMMENTS ==================

  async createComment(commentData: CreateCommentDto): Promise<ForumComment> {
    return this.request<ForumComment>("/comments", {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async getCommentById(id: number): Promise<ForumComment> {
    return this.request<ForumComment>(`/comments/${id}`);
  }

  async updateComment(id: number, content: string): Promise<ForumComment> {
    return this.request<ForumComment>(`/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(id: number): Promise<void> {
    await this.request(`/comments/${id}`, {
      method: "DELETE",
    });
  }

  // ================== VOTES ==================

  async vote(
    voteData: CreateVoteDto
  ): Promise<{ message: string; newScore: number }> {
    return this.request<{ message: string; newScore: number }>("/votes", {
      method: "POST",
      body: JSON.stringify(voteData),
    });
  }

  // ================== GET USER VOTES ==================
  async getUserVotes(): Promise<{
    postVotes: Array<{ postId: number; type: "upvote" | "downvote" }>;
    commentVotes: Array<{ commentId: number; type: "upvote" | "downvote" }>;
  }> {
    return this.request<{
      postVotes: Array<{ postId: number; type: "upvote" | "downvote" }>;
      commentVotes: Array<{ commentId: number; type: "upvote" | "downvote" }>;
    }>("/votes/user");
  }

  // ================== CATEGORIES ==================

  async getAllCategories(): Promise<ForumCategory[]> {
    return this.request<ForumCategory[]>("/categories");
  }

  async getCategoryById(id: number): Promise<ForumCategory> {
    return this.request<ForumCategory>(`/categories/${id}`);
  }

  // ================== USERS ==================

  async createUser(userData: {
    username: string;
    avatar: string;
    email?: string;
  }): Promise<ForumUser> {
    return this.request<ForumUser>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getUserById(id: number): Promise<ForumUser> {
    return this.request<ForumUser>(`/users/${id}`);
  }

  async getUserByUsername(username: string): Promise<ForumUser> {
    return this.request<ForumUser>(`/users/username/${username}`);
  }

  // ================== STATISTICS ==================

  async getForumStats(): Promise<ForumStats> {
    // Get user's timezone offset in minutes
    const timezoneOffset = new Date().getTimezoneOffset();
    return this.request<ForumStats>(`/stats?timezoneOffset=${timezoneOffset}`);
  }

  // ================== ADMIN ==================

  async seedForumData(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/seed", {
      method: "POST",
    });
  }
}

// Export a singleton instance
export const forumAPI = new ForumAPI();

// Frontend interfaces (matching the existing UI)
export interface FrontendForumComment {
  id: string;
  content: string;
  author: string;
  avatar: string;
  upvotes: number;
  downvotes: number;
  timestamp: string;
  replies?: FrontendForumComment[];
}

export interface FrontendForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  upvotes: number;
  downvotes: number;
  comments: FrontendForumComment[];
  timestamp: string;
  category: string;
  modelName?: string;
  isPinned?: boolean;
  awards?: number;
}

// Helper functions for transforming data between frontend and backend formats
export const transformers = {
  // Transform backend post to frontend format (for compatibility with existing UI)
  postToFrontend: (backendPost: ForumPost): FrontendForumPost => ({
    id: backendPost.id.toString(),
    title: backendPost.title,
    content: backendPost.content,
    author: backendPost.author?.username || 'Unknown User',
    avatar: backendPost.author?.avatar || 'UN',
    upvotes: backendPost.upvotes,
    downvotes: backendPost.downvotes,
    comments: backendPost.comments.map(transformers.commentToFrontend),
    timestamp: transformers.formatTimestamp(backendPost.createdAt),
    category: backendPost.category.name,
    modelName: backendPost.modelName,
    isPinned: backendPost.isPinned,
    awards: backendPost.awards.length,
  }),

  // Transform backend comment to frontend format
  commentToFrontend: (backendComment: ForumComment): FrontendForumComment => ({
    id: backendComment.id.toString(),
    content: backendComment.content,
    author: backendComment.author?.username || 'Unknown User',
    avatar: backendComment.author?.avatar || 'U',
    upvotes: backendComment.upvotes,
    downvotes: backendComment.downvotes,
    timestamp: transformers.formatTimestamp(backendComment.createdAt),
    replies: backendComment.replies?.map(transformers.commentToFrontend) || [],
  }),

  // Format timestamp to relative time
  formatTimestamp: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
  },

  // Transform frontend category to match expected format
  categoryToBackend: (categoryName: string, categories: ForumCategory[]) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.id || 1; // Default to first category if not found
  },
};
