"use client";

import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Share,
  Bookmark,
  MoreHorizontal,
  Award,
  Pin,
} from "lucide-react";
import { FrontendForumPost } from "../../lib/forum-api";

interface ForumPostItemProps {
  post: FrontendForumPost;
  index: number;
  userVotes: Record<string, "up" | "down" | null>;
  onVote: (post: FrontendForumPost, voteType: "up" | "down") => void;
  onOpenComments: (post: FrontendForumPost) => void;
  getDisplayScores: (postId: string, upvotes: number, downvotes: number) => { upvotes: number; downvotes: number };
  getCategoryColor: (category: string) => string;
}

export function ForumPostItem({
  post,
  index,
  userVotes,
  onVote,
  onOpenComments,
  getDisplayScores,
  getCategoryColor,
}: ForumPostItemProps) {
  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all"
    >
      <div className="p-6">
        <div className="flex gap-4">
          {/* Vote section */}
          <div className="flex flex-col items-center gap-1 min-w-[40px]">
            <button
              onClick={() => onVote(post, "up")}
              className={`p-2 rounded-full transition-all ${
                userVotes[post.id] === "up"
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {(() => {
                const scores = getDisplayScores(post.id, post.upvotes, post.downvotes);
                return scores.upvotes - scores.downvotes;
              })()}
            </span>
            <button
              onClick={() => onVote(post, "down")}
              className={`p-2 rounded-full transition-all ${
                userVotes[post.id] === "down"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
              }`}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              {post.isPinned && (
                <Pin className="w-4 h-4 text-green-400" />
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  getCategoryColor(post.category) === "green"
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : getCategoryColor(post.category) === "blue"
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      : getCategoryColor(post.category) === "purple"
                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                        : getCategoryColor(post.category) === "red"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                          : getCategoryColor(post.category) === "orange"
                            ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                            : getCategoryColor(post.category) === "emerald"
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                }`}
              >
                {post.category}
              </span>
              {/* Model badge for model-specific posts */}
              {post.modelName && (
                <>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">•</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    👤 {post.modelName}
                  </span>
                </>
              )}
              <span className="text-gray-600 dark:text-gray-400 text-sm">•</span>
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                {post.timestamp}
              </span>
              {post.awards && post.awards > 0 && (
                <>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">•</span>
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">{post.awards}</span>
                  </div>
                </>
              )}
            </div>

            {/* Title */}
            <h3
              onClick={() => onOpenComments(post)}
              className="text-xl font-semibold text-gray-800 dark:text-white mb-3 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors"
            >
              {post.title}
            </h3>

            {/* Content preview */}
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
              {post.content}
            </p>

            {/* Author and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {post.avatar}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  u/{post.author}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenComments(post)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">{post.comments.length}</span>
                </button>
                <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all">
                  <Share className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
