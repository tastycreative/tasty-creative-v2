"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageSquare } from "lucide-react";
import { FrontendForumPost, FrontendForumComment } from "../../lib/forum-api";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: FrontendForumPost | null;
  currentUser: { username: string | null } | null;
  onAddComment: (content: string) => Promise<FrontendForumComment | undefined>;
  loading: boolean;
  onUsernameRequired: () => void;
}

export function CommentsModal({
  isOpen,
  onClose,
  post,
  currentUser,
  onAddComment,
  loading,
  onUsernameRequired,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!currentUser?.username) {
      onUsernameRequired();
      return;
    }

    if (!newComment.trim()) return;

    const comment = await onAddComment(newComment);
    if (comment) {
      setNewComment("");
    }
  };

  if (!post) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-100/95 rounded-xl border border-gray-200 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Comments
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-200/80 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Post */}
            <div className="bg-pink-50 rounded-lg p-4 mb-6 border border-pink-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {post.avatar}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  u/{post.author}
                </span>
                <span className="text-gray-600 text-sm">
                  •
                </span>
                <span className="text-gray-600 text-sm">
                  {post.timestamp}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {post.title}
              </h4>
              <p className="text-gray-600 text-sm">
                {post.content}
              </p>
            </div>

            {/* Add Comment */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-pink-200">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : "CU"}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-100/80 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || loading}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? "Adding..." : "Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-100/80 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {comment.author.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      u/{comment.author}
                    </span>
                    <span className="text-gray-600 text-sm">
                      •
                    </span>
                    <span className="text-gray-600 text-xs">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm">
                    {comment.content}
                  </p>
                </div>
              ))}

              {post.comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
