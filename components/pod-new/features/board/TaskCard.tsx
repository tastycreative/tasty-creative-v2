"use client";

import React from "react";
import { Session } from "next-auth";
import { MoreHorizontal, UserPlus, Trash2, Gamepad2, BarChart3, Video, FileText, Tag, DollarSign, Upload, Calendar, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Task } from "@/lib/stores/boardStore";
import UserProfile from "@/components/ui/UserProfile";
import { formatForTaskCard, formatForDisplay, formatDueDate } from "@/lib/dateUtils";

const priorityConfig = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", color: "bg-red-100 text-red-700" },
  URGENT: { label: "Urgent", color: "bg-red-500 text-white" },
};

// Workflow type indicators
const getWorkflowTypeIndicator = (task: Task) => {
  // Check if task has modular workflow
  if (task.ModularWorkflow) {
    const { contentStyle, selectedComponents } = task.ModularWorkflow;

    return (
      <div className="flex items-center space-x-2 mb-3">
        {/* Content Style Icon with enhanced gradient styling */}
        <div className="flex items-center space-x-2">
          {contentStyle === 'GAME' && (
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-pink-50 to-rose-100 dark:from-pink-900/30 dark:to-rose-800/30 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-pink-200/50 dark:border-pink-700/50">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Game</span>
            </div>
          )}
          {contentStyle === 'POLL' && (
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Poll</span>
            </div>
          )}
          {contentStyle === 'LIVESTREAM' && (
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-amber-200/50 dark:border-amber-700/50">
              <Video className="w-3.5 h-3.5" />
              <span>Live</span>
            </div>
          )}
          {contentStyle === 'NORMAL' && (
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <FileText className="w-3.5 h-3.5" />
              <span>Normal</span>
            </div>
          )}
        </div>

        {/* Component Badges */}
        <div className="flex items-center space-x-1.5">
          {selectedComponents.includes('PRICING') && (
            <div className="bg-gradient-to-r from-pink-50 to-rose-100 dark:from-pink-900/30 dark:to-rose-800/30 text-pink-700 dark:text-pink-300 p-1.5 rounded-lg shadow-sm border border-pink-200/50 dark:border-pink-700/50 hover:shadow-pink-500/20 transition-all duration-200" title="Pricing Component">
              <DollarSign className="w-3 h-3" />
            </div>
          )}
          {selectedComponents.includes('UPLOAD') && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 p-1.5 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-gray-500/20 transition-all duration-200" title="Upload Component">
              <Upload className="w-3 h-3" />
            </div>
          )}
          {selectedComponents.includes('RELEASE') && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/30 text-amber-700 dark:text-amber-300 p-1.5 rounded-lg shadow-sm border border-amber-200/50 dark:border-amber-700/50 hover:shadow-amber-500/20 transition-all duration-200" title="Release Component">
              <Calendar className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if task has legacy content submission
  if (task.ContentSubmission) {
    const { submissionType } = task.ContentSubmission;

    return (
      <div className="flex items-center space-x-2 mb-3">
        <div className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-amber-200/50 dark:border-amber-700/50">
          <Tag className="w-3.5 h-3.5" />
          <span>Legacy {submissionType}</span>
        </div>
      </div>
    );
  }

  // Check if task has Wall Post submission
  if (task.wallPostSubmission) {
    const photoCount = task.wallPostSubmission.photos.length;

    // Count photos by status
    const statusCounts = {
      PENDING_REVIEW: 0,
      READY_TO_POST: 0,
      POSTED: 0,
      REJECTED: 0,
    };

    task.wallPostSubmission.photos.forEach(photo => {
      if (statusCounts[photo.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[photo.status as keyof typeof statusCounts]++;
      }
    });

    return (
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-1.5 bg-gradient-to-r from-pink-50 to-purple-100 dark:from-pink-900/30 dark:to-purple-800/30 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-pink-200/50 dark:border-pink-700/50">
          <Upload className="w-3.5 h-3.5" />
          <span>Wall Post Bulk</span>
          {photoCount > 0 && <span className="ml-1">({photoCount})</span>}
        </div>

        {/* Photo Status Indicators */}
        {photoCount > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            {statusCounts.PENDING_REVIEW > 0 && (
              <div className="flex items-center gap-1" title={`${statusCounts.PENDING_REVIEW} Pending Review`}>
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{statusCounts.PENDING_REVIEW}</span>
              </div>
            )}
            {statusCounts.READY_TO_POST > 0 && (
              <div className="flex items-center gap-1" title={`${statusCounts.READY_TO_POST} Ready to Post`}>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{statusCounts.READY_TO_POST}</span>
              </div>
            )}
            {statusCounts.POSTED > 0 && (
              <div className="flex items-center gap-1" title={`${statusCounts.POSTED} Posted`}>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">{statusCounts.POSTED}</span>
              </div>
            )}
            {statusCounts.REJECTED > 0 && (
              <div className="flex items-center gap-1" title={`${statusCounts.REJECTED} Rejected`}>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">{statusCounts.REJECTED}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular task (no workflow association)
  return null;
};

// Helper function to render assignment section for OFTV vs regular teams
const renderAssignmentSection = (task: Task, teamName?: string) => {
  if (teamName === "OFTV" && task.oftvTask) {
    const { 
      videoEditorStatus, 
      thumbnailEditorStatus,
      videoEditorUser,
      thumbnailEditorUser
    } = task.oftvTask;

    // Helper to get status display text to match dropdown
    const getStatusText = (status: string) => {
      switch (status) {
        case 'NOT_STARTED':
          return 'Not Started';
        case 'IN_PROGRESS':
          return 'In Progress';
        case 'NEEDS_REVISION':
          return 'Needs Revision';
        case 'APPROVED':
          return 'Approved';
        case 'HOLD':
          return 'On Hold';
        case 'WAITING_FOR_VO':
          return 'Waiting';
        case 'SENT':
          return 'Sent';
        case 'PUBLISHED':
          return 'Published';
        default:
          return 'Not Started';
      }
    };

    // Helper to get status color classes
    const getStatusClasses = (status: string) => {
      switch (status) {
        case 'PUBLISHED':
        case 'SENT':
          return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
        case 'APPROVED':
          return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
        case 'IN_PROGRESS':
          return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
        case 'NEEDS_REVISION':
          return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
        case 'HOLD':
        case 'WAITING_FOR_VO':
          return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700';
        default:
          return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      }
    };

    return (
      <div className="space-y-2">
        {videoEditorUser && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Video className="h-3 w-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <UserProfile
                user={videoEditorUser}
                size="xs"
                className="flex-shrink-0"
              />
              <span className="text-gray-900 dark:text-gray-100 text-xs truncate">
                {videoEditorUser.name || videoEditorUser.email}
              </span>
            </div>
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClasses(videoEditorStatus)}`}>
              {getStatusText(videoEditorStatus)}
            </span>
          </div>
        )}
        {thumbnailEditorUser && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <FileText className="h-3 w-3 flex-shrink-0 text-purple-600 dark:text-purple-400" />
              <UserProfile
                user={thumbnailEditorUser}
                size="xs"
                className="flex-shrink-0"
              />
              <span className="text-gray-900 dark:text-gray-100 text-xs truncate">
                {thumbnailEditorUser.name || thumbnailEditorUser.email}
              </span>
            </div>
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClasses(thumbnailEditorStatus)}`}>
              {getStatusText(thumbnailEditorStatus)}
            </span>
          </div>
        )}
        {!videoEditorUser && !thumbnailEditorUser && (
          <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs">
            <UserPlus className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>No editors assigned</span>
          </div>
        )}
      </div>
    );
  }

  // Regular team assignment display
  if (task.assignedUser) {
    return (
      <div className="flex items-center text-xs">
        <UserProfile
          user={task.assignedUser}
          size="xs"
          className="mr-1 flex-shrink-0"
        />
        <span className="text-gray-900 dark:text-gray-100 truncate">
          {task.assignedUser.name || task.assignedUser.email}
        </span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs">
        <UserPlus className="h-3 w-3 mr-1 flex-shrink-0" />
        <span>Unassigned</span>
      </div>
    );
  }
};

interface TaskCardProps {
  task: Task;
  draggedTask: Task | null;
  session: Session | null;
  canMoveTask: (task: Task) => boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMarkAsFinal: (taskId: string, isFinal: boolean) => void;
  onMarkAsPublished?: (taskId: string, isPublished: boolean) => void;
  onMarkAsPosted?: (taskId: string, isPosted: boolean) => void;
  loadingTaskId: string | null;
  columnName: string;
  columnStatus: string;
  teamName?: string;
  isMobile?: boolean;
}

function TaskCard({
  task,
  draggedTask,
  session,
  canMoveTask,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onDeleteTask,
  onMarkAsFinal,
  onMarkAsPublished,
  onMarkAsPosted,
  loadingTaskId,
  columnName,
  columnStatus,
  teamName,
  isMobile = false,
}: TaskCardProps) {
  // Show button if: 1) Task has ModularWorkflow, 2) Column name is "Ready to Deploy", 3) Task's status matches this column
  const showMarkAsFinalButton = task.ModularWorkflow && columnName === "Ready to Deploy" && task.status === columnStatus;
  const isFinal = task.ModularWorkflow?.isFinal || false;

  // Show "Mark as Published" button if: 1) Team is OFTV, 2) Column name is "Posted", 3) Task has oftvTask
  const showMarkAsPublishedButton = teamName === "OFTV" && columnName === "Posted" && task.status === columnStatus && task.oftvTask;
  const isPublished = task.oftvTask?.videoEditorStatus === 'PUBLISHED' && task.oftvTask?.thumbnailEditorStatus === 'PUBLISHED';

  // Show "Mark as Posted" button if: 1) Team is Wall Post, 2) Column name is "Ready to Post" OR "Posted Today", 3) Task has wallPostSubmission
  const showMarkAsPostedButton = teamName === "Wall Post" && (columnName === "Ready to Post" || columnName === "Posted Today") && task.status === columnStatus && task.wallPostSubmission;
  const isPosted = task.wallPostSubmission?.photos?.some(photo => photo.status === 'POSTED') || false;

  const isThisTaskLoading = loadingTaskId === task.id;
  return (
    <div
      key={task.id}
      draggable={canMoveTask(task)}
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onTaskClick(task)}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl ${isMobile ? "p-4" : "p-4"} shadow-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 ${
        canMoveTask(task) ? "cursor-move hover:scale-[1.02] hover:border-pink-200 dark:hover:border-pink-700" : "cursor-pointer hover:border-pink-200 dark:hover:border-pink-700"
      } ${draggedTask?.id === task.id ? "opacity-50 scale-95 transition-opacity duration-100" : ""} ${
        draggedTask && draggedTask.id !== task.id
          ? "hover:bg-pink-50/50 dark:hover:bg-pink-900/10"
          : ""
      } ${isMobile ? "touch-manipulation" : ""} relative overflow-hidden group`}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium text-gray-900 dark:text-gray-100 text-sm ${isMobile ? "line-clamp-2" : "leading-tight"} flex items-center gap-2`}
          >
            {/* Task Identifier - Subtle prefix */}
            {task.podTeam?.projectPrefix && task.taskNumber && (
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">
                {task.podTeam.projectPrefix}-{task.taskNumber}
              </span>
            )}
            <span className="truncate">{task.title}</span>
          </h4>
        </div>
        <div
          className={`flex items-center ${isMobile ? "flex-shrink-0 ml-2" : "space-x-1 ml-2"}`}
        >
          {!isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {isMobile ? (
            <MoreHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Workflow Type Indicator */}
      {getWorkflowTypeIndicator(task)}

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Attachment Count */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <svg
            className="w-3 h-3 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {task.attachments.length} attachment
            {task.attachments.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Task Meta */}
      {isMobile ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[task.priority || 'MEDIUM'].color}`}
            >
              {priorityConfig[task.priority || 'MEDIUM'].label}
            </span>
            {task.dueDate && (
              <span className={`text-xs font-medium ${formatDueDate(task.dueDate).className}`}>
                {formatDueDate(task.dueDate).formatted}
              </span>
            )}
          </div>

          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
              </svg>
              <span className="truncate">
                Created: {formatForDisplay(task.createdAt)}
              </span>
            </div>
            {renderAssignmentSection(task, teamName)}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Priority Badge */}
            <span
              className={`text-xs px-2 py-1 rounded-full ${priorityConfig[task.priority || 'MEDIUM'].color}`}
            >
              {priorityConfig[task.priority || 'MEDIUM'].label}
            </span>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <span className={`text-xs font-medium ${formatDueDate(task.dueDate).className}`}>
              {formatDueDate(task.dueDate).formatted}
            </span>
          )}
        </div>
      )}

      {/* Desktop Date and Assignment Info (only for desktop) */}
      {!isMobile && (
        <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
            <span className="truncate">
              {formatForDisplay(task.createdAt)}
            </span>
          </div>
          {renderAssignmentSection(task, teamName)}
        </div>
      )}

      {/* Mark as Final Button - Only in Ready to Deploy column */}
      {showMarkAsFinalButton && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsFinal(task.id, !isFinal);
            }}
            disabled={isThisTaskLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              isFinal
                ? "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/20"
                : "bg-gradient-to-r from-pink-50 to-purple-100 dark:from-pink-900/30 dark:to-purple-800/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700 hover:shadow-md hover:shadow-pink-500/20"
            }`}
          >
            {isThisTaskLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isFinal ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Final</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>Mark as Final</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mark as Published Button - Only in Posted column for OFTV */}
      {showMarkAsPublishedButton && onMarkAsPublished && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsPublished(task.id, !isPublished);
            }}
            disabled={isThisTaskLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              isPublished
                ? "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/20"
                : "bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:shadow-md hover:shadow-blue-500/20"
            }`}
          >
            {isThisTaskLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isPublished ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Published</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>Mark as Published</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mark as Posted Button - Only in Ready to Post column for Wall Post */}
      {showMarkAsPostedButton && onMarkAsPosted && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsPosted(task.id, !isPosted);
            }}
            disabled={isThisTaskLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              isPosted
                ? "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/20"
                : "bg-gradient-to-r from-pink-50 to-purple-100 dark:from-pink-900/30 dark:to-purple-800/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700 hover:shadow-md hover:shadow-pink-500/20"
            }`}
          >
            {isThisTaskLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isPosted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Posted</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>Mark as Posted</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(TaskCard);
