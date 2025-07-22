"use client";

import { RefreshCw, MessageSquare } from "lucide-react";
import { ForumPostItem } from "./ForumPostItem";
import { FrontendForumPost } from "../../lib/forum-api";

interface ForumPostsListProps {
  posts: FrontendForumPost[];
  loading: boolean;
  userVotes: Record<string, "up" | "down" | null>;
  onVote: (post: FrontendForumPost, voteType: "up" | "down") => void;
  onOpenComments: (post: FrontendForumPost) => void;
  onCreateFirstPost: () => void;
  getDisplayScores: (postId: string, upvotes: number, downvotes: number) => { upvotes: number; downvotes: number };
  getCategoryColor: (category: string) => string;
  emptyStateMessage?: string;
}

export function ForumPostsList({
  posts,
  loading,
  userVotes,
  onVote,
  onOpenComments,
  onCreateFirstPost,
  getDisplayScores,
  getCategoryColor,
  emptyStateMessage = "Be the first to start a discussion!",
}: ForumPostsListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-pink-500" />
        <p className="text-gray-600">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No posts yet
        </h3>
        <p className="text-gray-600 mb-4">
          {emptyStateMessage}
        </p>
        <button
          onClick={onCreateFirstPost}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-sm"
        >
          Create First Post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <ForumPostItem
          key={post.id}
          post={post}
          index={index}
          userVotes={userVotes}
          onVote={onVote}
          onOpenComments={onOpenComments}
          getDisplayScores={getDisplayScores}
          getCategoryColor={getCategoryColor}
        />
      ))}
    </div>
  );
}
