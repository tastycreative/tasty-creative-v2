"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageSquare, Share } from "lucide-react";
import { FrontendForumPost, FrontendForumComment } from "../../lib/forum-api";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: FrontendForumPost | null;
  currentUser: { username: string | null } | null;
  onAddComment: (content: string) => Promise<FrontendForumComment | undefined>;
  onSharePost?: (post: FrontendForumPost) => void;
  loading: boolean;
  onUsernameRequired: () => void;
}

export function CommentsModal({
  isOpen,
  onClose,
  post,
  currentUser,
  onAddComment,
  onSharePost,
  loading,
  onUsernameRequired,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Create or get a unique portal container
    let container = document.getElementById('comments-modal-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'comments-modal-portal';
      document.body.appendChild(container);
    }
    setPortalContainer(container);
    
    return () => {
      setMounted(false);
      // Clean up the container when component unmounts
      const existingContainer = document.getElementById('comments-modal-portal');
      if (existingContainer && existingContainer.children.length === 0) {
        document.body.removeChild(existingContainer);
      }
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  if (!post || !mounted || !portalContainer) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="flex items-center justify-center min-h-full overflow-y-auto py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-100/95 dark:bg-gray-800/95 rounded-xl border border-gray-200 dark:border-gray-600 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative backdrop-blur-sm"
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Comments
              </h3>
              <div className="flex items-center gap-2">
                {onSharePost && (
                  <button
                    onClick={() => onSharePost(post)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-all"
                    title="Share post"
                  >
                    <Share className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Original Post */}
            <div className="bg-pink-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-pink-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {post.avatar}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  u/{post.author}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  •
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {post.timestamp}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {post.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {post.content}
              </p>
            </div>

            {/* Add Comment */}
            <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-pink-200 dark:border-gray-600">
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
                    className="w-full px-3 py-2 bg-gray-100/80 dark:bg-gray-600/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 resize-none"
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
              {post.comments
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-100/80 dark:bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {comment.author.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      u/{comment.author}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      •
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 text-sm">
                    {comment.content}
                  </p>
                </div>
              ))}

              {post.comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, portalContainer);
}
