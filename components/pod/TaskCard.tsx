"use client";

import React from "react";
import { Session } from "next-auth";
import { MoreHorizontal, UserPlus, Trash2 } from "lucide-react";
import { Task } from "@/lib/stores/boardStore";
import { formatForTaskCard, formatDueDate } from "@/lib/dateUtils";
import UserProfile from "@/components/ui/UserProfile";

const priorityConfig = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", color: "bg-red-100 text-red-700" },
  URGENT: { label: "Urgent", color: "bg-red-500 text-white" },
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
  isMobile?: boolean;
}

export default function TaskCard({
  task,
  draggedTask,
  session,
  canMoveTask,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onDeleteTask,
  isMobile = false,
}: TaskCardProps) {
  return (
    <div
      key={task.id}
      draggable={canMoveTask(task)}
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onTaskClick(task)}
      className={`bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg ${isMobile ? "p-4" : "p-3"} shadow-sm hover:shadow-md transition-all duration-150 ${
        canMoveTask(task) ? "cursor-move hover:scale-[1.02]" : "cursor-pointer"
      } ${draggedTask?.id === task.id ? "opacity-50 scale-95 transition-opacity duration-100" : ""} ${
        draggedTask && draggedTask.id !== task.id
          ? "hover:bg-gray-100 dark:hover:bg-gray-700"
          : ""
      } ${isMobile ? "touch-manipulation" : ""}`}
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
          {!isMobile && session?.user?.role === "ADMIN" && (
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
              <span className={`text-xs ${formatDueDate(task.dueDate).className}`}>
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
                Created: {formatForTaskCard(task.createdAt)}
              </span>
            </div>
            {task.assignedUser ? (
              <div className="flex items-center">
                <UserProfile
                  user={task.assignedUser}
                  size="xs"
                  className="mr-1"
                />
                <span className="truncate">
                  {task.assignedUser.name || task.assignedUser.email}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <UserPlus className="h-3 w-3 mr-1" />
                <span>Unassigned</span>
              </div>
            )}
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
            <span className={`text-xs ${formatDueDate(task.dueDate).className}`}>
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
              {formatForTaskCard(task.createdAt)}
            </span>
          </div>
          {task.assignedUser ? (
            <div className="flex items-center">
              <UserProfile
                user={task.assignedUser}
                size="xs"
                className="mr-1 flex-shrink-0"
              />
              <span className="truncate">
                {task.assignedUser.name || task.assignedUser.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-amber-600 dark:text-amber-400">
              <UserPlus className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
