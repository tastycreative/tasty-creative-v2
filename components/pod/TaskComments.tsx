"use client";

import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Loader2, AlertCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import UserProfile from '@/components/ui/UserProfile';
import CommentFilePreview from '@/components/ui/CommentFilePreview';
import MentionsInput, { type MentionUser, type Mention } from '@/components/ui/MentionsInput';
import { formatForDisplay, formatForTaskDetail } from '@/lib/dateUtils';
import { useTaskComments } from '@/lib/stores/boardStore';
import { useNotifications } from '@/contexts/NotificationContext';
import type { TaskComment, TaskAttachment } from '@/lib/stores/boardStore';
import type { PreviewFile } from '@/components/ui/CommentFilePreview';
import AttachmentViewer from '@/components/ui/AttachmentViewer';


interface UserData {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
}

// Hover card component for mentions
const MentionHoverCard = ({ userId, userName, children }: { 
  userId: string; 
  userName: string; 
  children: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = async () => {
    if (isLoading || userData) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const user = await response.json();
        setUserData(user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => {
        setIsVisible(true);
        fetchUserData();
      }}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div 
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px]"
          style={{ pointerEvents: 'none' }}
        >
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45"></div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : userData ? (
            <div className="flex items-center space-x-3">
              <UserProfile user={userData} size="md" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {userData.name || userData.email?.split('@')[0] || 'User'}
                </p>
                {userData.name && userData.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userData.email}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {userName}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

// Utility function to render text with clean mentions and clickable links
const renderTextWithMentionsAndLinks = (text: string) => {
  if (!text) return null;

  // First, process mentions - convert @[Name](id) to clean display with hover
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention (with links processed)
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      const beforeParts = linkifyText(beforeText);
      parts.push(...beforeParts.map((part, i) => ({ key: `before-${lastIndex}-${i}`, content: part })));
    }

    // Add the interactive mention with user ID
    const mentionName = match[1];
    const userId = match[2];
    parts.push({
      key: `mention-${match.index}`,
      content: (
        <MentionHoverCard userId={userId} userName={mentionName}>
          <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            {mentionName}
          </span>
        </MentionHoverCard>
      )
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text (with links processed)
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    const remainingParts = linkifyText(remainingText);
    parts.push(...remainingParts.map((part, i) => ({ key: `remaining-${lastIndex}-${i}`, content: part })));
  }

  // If no mentions were found, just process links
  if (parts.length === 0) {
    return linkifyText(text);
  }

  return parts.map((part, index) => (
    <React.Fragment key={part.key || index}>
      {part.content}
    </React.Fragment>
  ));
};

interface CommentUser {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
}

interface TaskCommentsProps {
  taskId: string;
  teamId?: string;
  currentUser?: CommentUser | null;
  isViewOnly?: boolean;
}

/**
 * Format comment timestamp using Luxon helpers
 * Shows smart relative time (e.g., "2 hours ago", "3 days ago") with tooltip showing full date
 */
const formatCommentTime = (dateString: string): { relative: string; full: string } => {
  return {
    relative: formatForDisplay(dateString, 'relative'),
    full: formatForTaskDetail(dateString)
  };
};

// Helper function for direct S3 upload
const uploadFileDirectlyToS3 = async (file: File): Promise<TaskAttachment> => {
  console.log(`🚀 Uploading ${file.name} directly to S3...`);
  
  try {
    // Step 1: Get pre-signed URL from our API
    const presignResponse = await fetch('/api/upload/s3/presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    if (!presignResponse.ok) {
      const errorData = await presignResponse.json();
      throw new Error(errorData.error || 'Failed to get pre-signed URL');
    }

    const { presignedUrl, attachment } = await presignResponse.json();
    
    console.log(`📤 Uploading directly to S3: ${file.name} -> ${attachment.s3Key}`);
    
    // Step 2: Upload directly to S3 using pre-signed URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Direct S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Step 3: Generate signed URL for accessing the file
    const signedUrlResponse = await fetch('/api/upload/s3/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3Key: attachment.s3Key,
      }),
    });

    if (signedUrlResponse.ok) {
      const { signedUrl } = await signedUrlResponse.json();
      attachment.url = signedUrl;
    } else {
      console.warn(`Failed to get signed URL for ${attachment.s3Key}, using fallback`);
      // Use a placeholder that can be resolved server-side
      attachment.url = `/api/upload/s3/signed-url?key=${encodeURIComponent(attachment.s3Key)}`;
    }

    console.log(`✅ Successfully uploaded ${file.name} directly to S3`);
    return attachment;
    
  } catch (error) {
    console.error(`❌ Direct S3 upload failed for ${file.name}:`, error);
    
    // Fallback to Vercel function upload
    console.log(`📤 Falling back to Vercel function upload for ${file.name}...`);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/s3', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const responseData = await response.json();
    console.log(`✅ Successfully uploaded ${file.name} via Vercel function (fallback)`);
    return responseData.attachment;
  }
};

export default function TaskComments({ taskId, teamId, currentUser, isViewOnly = false }: TaskCommentsProps) {
  const {
    comments,
    isLoading,
    error,
    fetchTaskComments,
    createTaskComment,
    updateTaskComment,
    deleteTaskComment,
  } = useTaskComments(taskId);

  // Subscribe to real-time notifications for comment updates
  const { notifications } = useNotifications();
  
  const [newComment, setNewComment] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for force updates
  const [newCommentPreviewFiles, setNewCommentPreviewFiles] = useState<PreviewFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPreviewFiles, setEditPreviewFiles] = useState<PreviewFile[]>([]);
  const [editExistingAttachments, setEditExistingAttachments] = useState<TaskAttachment[]>([]);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [isUpdatingComment, setIsUpdatingComment] = useState<string | null>(null);

  // New state for mentions
  const [teamMembers, setTeamMembers] = useState<MentionUser[]>([]);
  const [teamAdmins, setTeamAdmins] = useState<MentionUser[]>([]);
  const [newCommentMentions, setNewCommentMentions] = useState<Mention[]>([]);
  const [editCommentMentions, setEditCommentMentions] = useState<Mention[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Fetch team members and admins
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!teamId) {
        return;
      }
      
      setIsLoadingMembers(true);
      try {
        const response = await fetch(`/api/pod/teams/${teamId}/members`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (data.members) {
              setTeamMembers(data.members);
            }
            if (data.admins) {
              setTeamAdmins(data.admins);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, [teamId]);

  useEffect(() => {
    if (taskId) {
      fetchTaskComments(taskId);
    }
  }, [taskId, fetchTaskComments]);

  // Listen for real-time comment notifications and refresh comments
  useEffect(() => {
    if (!taskId) return;

    // Check recent notifications for comment-related activity on this task
    const recentCommentNotifications = notifications.filter(notification => {
      const isCommentNotification = [
        'TASK_COMMENT_ADDED',
        'TASK_COMMENT_UPDATED', 
        'TASK_COMMENT_DELETED'
      ].includes(notification.type);
      
      const isThisTask = notification.data?.taskId === taskId;
      const isRecent = new Date(notification.createdAt).getTime() > Date.now() - 5000; // Last 5 seconds
      
      return isCommentNotification && isThisTask && isRecent;
    });

    if (recentCommentNotifications.length > 0) {
      // Force component re-render
      setRefreshKey(prev => prev + 1);
      
      // Add a small delay to ensure the comment is saved to database
      setTimeout(async () => {
        try {
          await fetchTaskComments(taskId, true); // Force refresh to bypass cache
        } catch (error) {
          console.error('Error refreshing comments:', error);
        }
      }, 500); // 500ms delay
    }
  }, [notifications, taskId, fetchTaskComments]);

  // Send comment notifications to team members
  const sendCommentNotifications = async (commentId?: string, action: string = 'ADDED') => {
    if (!teamId) return;

    try {
      await fetch('/api/notifications/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          commentId,
          action,
        }),
      });
    } catch (error) {
      console.error('Failed to send comment notifications:', error);
    }
  };

  // Send mention notifications
  const sendMentionNotifications = async (mentions: Mention[], commentContent: string, taskTitle?: string) => {
    if (mentions.length === 0) return;

    try {
      await fetch('/api/notifications/mention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentionedUserIds: mentions.map(m => m.userId),
          taskId,
          commentContent,
          taskTitle,
          teamId,
        }),
      });
    } catch (error) {
      console.error('Failed to send mention notifications:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow submission if there's either comment text or attachments
    const hasComment = newComment.trim().length > 0;
    const hasAttachments = newCommentPreviewFiles.length > 0;
    
    if ((!hasComment && !hasAttachments) || !currentUser) return;
    
    try {
      setIsSubmitting(true);
      
      let uploadedAttachments: TaskAttachment[] = [];
      
      // Upload preview files to S3 if any
      if (newCommentPreviewFiles.length > 0) {
        console.log(`🚀 Using direct S3 upload for ${newCommentPreviewFiles.length} files in comment`);
        for (const previewFile of newCommentPreviewFiles) {
          try {
            const attachment = await uploadFileDirectlyToS3(previewFile.file);
            uploadedAttachments.push(attachment);
          } catch (uploadError) {
            console.error(`Failed to upload ${previewFile.name}:`, uploadError);
            // Continue with other files, but notify user
            alert(`Failed to upload ${previewFile.name}. Comment will be posted without this file.`);
          }
        }
      }
      
      // Use the actual comment text, or empty string if only attachments
      const commentText = newComment.trim() || '';
      await createTaskComment(taskId, commentText, uploadedAttachments);
      
      // Send mention notifications
      if (newCommentMentions.length > 0) {
        await sendMentionNotifications(newCommentMentions, commentText);
      }

      // Send comment notifications to team members (for real-time updates)
      // Add a small delay to ensure comment is saved to database first
      setTimeout(() => {
        sendCommentNotifications(undefined, 'ADDED');
      }, 200);
      
      setNewComment('');
      setNewCommentPreviewFiles([]);
      setNewCommentMentions([]);
      
      // Clean up preview URLs
      newCommentPreviewFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      
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
    setEditExistingAttachments(comment.attachments || []);
    setEditPreviewFiles([]);
    setEditCommentMentions([]);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
    setEditExistingAttachments([]);
    setEditPreviewFiles([]);
    setEditCommentMentions([]);
    
    // Clean up preview URLs
    editPreviewFiles.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
  };

  const handleUpdateComment = async (commentId: string) => {
    // Allow update if there's either comment text or attachments (existing or new)
    const hasContent = editContent.trim().length > 0;
    const hasExistingAttachments = editExistingAttachments.length > 0;
    const hasNewAttachments = editPreviewFiles.length > 0;
    
    if (!hasContent && !hasExistingAttachments && !hasNewAttachments) return;

    try {
      setIsUpdatingComment(commentId);
      
      let finalAttachments: TaskAttachment[] = [...editExistingAttachments];
      
      // Upload new preview files to S3 if any
      if (editPreviewFiles.length > 0) {
        console.log(`🚀 Using direct S3 upload for ${editPreviewFiles.length} files in comment edit`);
        for (const previewFile of editPreviewFiles) {
          try {
            const attachment = await uploadFileDirectlyToS3(previewFile.file);
            finalAttachments.push(attachment);
          } catch (uploadError) {
            console.error(`Failed to upload ${previewFile.name}:`, uploadError);
            alert(`Failed to upload ${previewFile.name}. Comment will be updated without this file.`);
          }
        }
      }
      
      const commentText = editContent.trim();
      await updateTaskComment(taskId, commentId, commentText, finalAttachments);
      
      // Send mention notifications for edited comments
      if (editCommentMentions.length > 0) {
        await sendMentionNotifications(editCommentMentions, commentText);
      }

      // Send comment update notifications to team members
      await sendCommentNotifications(commentId, 'UPDATED');
      
      setEditingCommentId(null);
      setEditContent('');
      setEditExistingAttachments([]);
      setEditPreviewFiles([]);
      setEditCommentMentions([]);
      
      // Clean up preview URLs
      editPreviewFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      
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
      
      // Send comment deletion notifications to team members
      await sendCommentNotifications(commentId, 'DELETED');
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeletingComment(null);
    }
  };

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setEditExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const canEditComment = (comment: TaskComment) => {
    return currentUser && currentUser.id === comment.user.id && !isViewOnly;
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

      {/* View-only message */}
      {isViewOnly && (
        <div className="p-3 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            🔒 You can view comments but cannot add or edit them. Only team members and admins can interact with comments.
          </p>
        </div>
      )}

      {/* New Comment Form */}
      {currentUser && !isViewOnly && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex space-x-3">
            <UserProfile user={currentUser} size="sm" />
            <div className="flex-1 relative">
              <MentionsInput
                value={newComment}
                onChange={setNewComment}
                onMentionsChange={setNewCommentMentions}
                teamMembers={teamMembers}
                teamAdmins={teamAdmins}
                currentUserId={currentUser?.id}
                placeholder="Add a comment... Use @ to mention team members and admins"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-3">
            <CommentFilePreview
              previewFiles={newCommentPreviewFiles}
              onPreviewFilesChange={setNewCommentPreviewFiles}
              maxFiles={3}
              maxFileSize={10}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={(newComment.trim().length === 0 && newCommentPreviewFiles.length === 0) || isSubmitting}
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
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4" key={refreshKey}>
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
                    <div className="flex items-center space-x-1">
                      <span 
                        className="text-xs text-gray-500 dark:text-gray-400 cursor-help"
                        title={formatCommentTime(comment.createdAt).full}
                      >
                        {formatCommentTime(comment.createdAt).relative}
                      </span>
                      {comment.updatedAt !== comment.createdAt && (
                        <span 
                          className="text-xs text-gray-400 dark:text-gray-500 italic cursor-help"
                          title={`Last edited: ${formatCommentTime(comment.updatedAt).full}`}
                        >
                          (edited)
                        </span>
                      )}
                    </div>
                  </div>
                  {canEditComment(comment) && (
                    <div className="flex items-center space-x-1">
                      {editingCommentId === comment.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={(editContent.trim().length === 0 && editExistingAttachments.length === 0 && editPreviewFiles.length === 0) || isUpdatingComment === comment.id}
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
                  <div className="space-y-3">
                    <MentionsInput
                      value={editContent}
                      onChange={setEditContent}
                      onMentionsChange={setEditCommentMentions}
                      teamMembers={teamMembers}
                      teamAdmins={teamAdmins}
                      currentUserId={currentUser?.id}
                      placeholder="Edit your comment... Use @ to mention team members and admins"
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={2}
                      disabled={isUpdatingComment === comment.id}
                      autoFocus
                    />
                    
                    {/* Existing Attachments Management */}
                    {editExistingAttachments.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Current Attachments:</h5>
                        <div className="flex flex-wrap gap-2">
                          {editExistingAttachments.map((attachment) => (
                            <div key={attachment.id} className="relative group">
                              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1">
                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[150px]">
                                  {attachment.name}
                                </span>
                                <button
                                  onClick={() => handleRemoveExistingAttachment(attachment.id)}
                                  disabled={isUpdatingComment === comment.id}
                                  className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove attachment"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* New Attachments Upload */}
                    <CommentFilePreview
                      previewFiles={editPreviewFiles}
                      onPreviewFilesChange={setEditPreviewFiles}
                      maxFiles={3}
                      maxFileSize={10}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {renderTextWithMentionsAndLinks(comment.content)}
                    </p>
                    
                    {/* Comment Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <AttachmentViewer
                        attachments={comment.attachments}
                        showTitle={false}
                        compact={true}
                        className="mt-2"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}