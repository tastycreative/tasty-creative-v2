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
      className="bg-white rounded-xl border border-pink-200 hover:border-pink-300 transition-all shadow-sm"
    >
      <div className="p-6">
        <div className="flex gap-4">
          {/* Vote section */}
          <div className="flex flex-col items-center gap-1 min-w-[40px]">
            <button
              onClick={() => onVote(post, "up")}
              className={`p-2 rounded-full transition-all ${
                userVotes[post.id] === "up"
                  ? "bg-pink-100 text-pink-600"
                  : "text-gray-400 hover:text-pink-600 hover:bg-pink-100"
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-gray-900">
              {(() => {
                const scores = getDisplayScores(post.id, post.upvotes, post.downvotes);
                return scores.upvotes - scores.downvotes;
              })()}
            </span>
            <button
              onClick={() => onVote(post, "down")}
              className={`p-2 rounded-full transition-all ${
                userVotes[post.id] === "down"
                  ? "bg-rose-100 text-rose-600"
                  : "text-gray-400 hover:text-rose-600 hover:bg-rose-100"
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
                <Pin className="w-4 h-4 text-pink-500" />
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  getCategoryColor(post.category) === "green"
                    ? "bg-green-100 text-green-700"
                    : getCategoryColor(post.category) === "blue"
                      ? "bg-blue-100 text-blue-700"
                      : getCategoryColor(post.category) === "purple"
                        ? "bg-pink-100 text-pink-700"
                        : getCategoryColor(post.category) === "red"
                          ? "bg-red-100 text-red-700"
                          : getCategoryColor(post.category) === "orange"
                            ? "bg-orange-100 text-orange-700"
                            : getCategoryColor(post.category) === "emerald"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
                }`}
              >
                {post.category}
              </span>
              {/* Model badge for model-specific posts */}
              {post.modelName && (
                <>
                  <span className="text-gray-600 text-sm">•</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-pink-100 text-pink-700 border border-pink-300">
                    👤 {post.modelName}
                  </span>
                </>
              )}
              <span className="text-gray-600 text-sm">•</span>
              <span className="text-gray-600 text-sm">
                {post.timestamp}
              </span>
              {post.awards && post.awards > 0 && (
                <>
                  <span className="text-gray-600 text-sm">•</span>
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
              className="text-xl font-semibold text-gray-900 mb-3 hover:text-pink-600 cursor-pointer transition-colors"
            >
              {post.title}
            </h3>

            {/* Content preview */}
            <p className="text-gray-600 mb-4 line-clamp-3">
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
                <span className="text-gray-600">
                  u/{post.author}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenComments(post)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-pink-50 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">{post.comments.length}</span>
                </button>
                <button className="p-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-pink-50 transition-all">
                  <Share className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-pink-50 transition-all">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-pink-50 transition-all">
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
