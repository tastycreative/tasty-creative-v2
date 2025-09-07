"use client";

import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Loader2, AlertCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import UserProfile from '@/components/ui/UserProfile';
import { useTaskComments } from '@/lib/stores/boardStore';
import type { TaskComment } from '@/lib/stores/boardStore';

// Utility function to make links clickable
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface CommentUser {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
}

interface TaskCommentsProps {
  taskId: string;
  currentUser?: CommentUser | null;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
  });
};

export default function TaskComments({ taskId, currentUser }: TaskCommentsProps) {
  const {
    comments,
    isLoading,
    error,
    fetchTaskComments,
    createTaskComment,
    updateTaskComment,
    deleteTaskComment,
  } = useTaskComments(taskId);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [isUpdatingComment, setIsUpdatingComment] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      fetchTaskComments(taskId);
    }
  }, [taskId, fetchTaskComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUser) return;
    
    try {
      setIsSubmitting(true);
      await createTaskComment(taskId, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      // Error handling is managed by the store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setIsUpdatingComment(commentId);
      await updateTaskComment(taskId, commentId, editContent.trim());
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsUpdatingComment(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setIsDeletingComment(commentId);
      await deleteTaskComment(taskId, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeletingComment(null);
    }
  };

  const canEditComment = (comment: TaskComment) => {
    return currentUser && currentUser.id === comment.user.id;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
          <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{error.message}</span>
        </div>
      )}

      {/* New Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex space-x-3">
            <UserProfile user={currentUser} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <UserProfile user={comment.user} size="sm" showTooltip />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {comment.user.name || comment.user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  {canEditComment(comment) && (
                    <div className="flex items-center space-x-1">
                      {editingCommentId === comment.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={!editContent.trim() || isUpdatingComment === comment.id}
                            className="p-1 text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            title={isUpdatingComment === comment.id ? "Saving..." : "Save changes"}
                          >
                            {isUpdatingComment === comment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdatingComment === comment.id}
                            className="p-1 text-gray-500 hover:text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            title="Cancel editing"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="p-1 text-gray-500 hover:text-gray-600 transition-colors"
                            title="Edit comment"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isDeletingComment === comment.id}
                            className="p-1 text-red-500 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            title="Delete comment"
                          >
                            {isDeletingComment === comment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    disabled={isUpdatingComment === comment.id}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {linkifyText(comment.content)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}