"use client";

import React from "react";
import { Session } from "next-auth";
import { Plus, Loader2, ChevronDown } from "lucide-react";
import { Task, NewTaskData } from "@/lib/stores/boardStore";
import TaskCard from "./TaskCard";
import { TaskSkeleton } from "./BoardSkeleton";
import UserDropdown from "@/components/UserDropdown";

// Default number of tasks to show initially per column
const INITIAL_TASKS_LIMIT = 25;

interface TaskColumnProps {
  status: string;
  config: {
    label: string;
    color: string;
    headerColor: string;
    buttonColor: string;
  };
  tasks: Task[];
  session: Session | null;
  draggedTask: Task | null;
  showNewTaskForm: string | null;
  newTaskData: NewTaskData;
  isLoading: boolean;
  showMinimumSkeleton: boolean;
  canMoveTask: (task: Task) => boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Task["status"]) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMarkAsFinal: (taskId: string, isFinal: boolean) => void;
  onMarkAsPublished?: (taskId: string, isPublished: boolean) => void;
  onMarkAsPosted?: (taskId: string, isPosted: boolean) => void;
  loadingTaskId: string | null;
  onOpenNewTaskModal: (status: string) => void;
  onSetShowNewTaskForm: (status: string | null) => void;
  onSetNewTaskData: (data: Partial<NewTaskData>) => void;
  onCreateTask: (status: Task["status"]) => void;
  teamName?: string;
  isMobile?: boolean;
  isLastColumn?: boolean;
  includeHeader?: boolean;
  // Lazy loading props
  totalTasksCount?: number;
  visibleTasksLimit?: number;
  onLoadMore?: (status: string) => void;
  isLoadingMore?: boolean;
}

export default function TaskColumn({
  status,
  config,
  tasks,
  session,
  draggedTask,
  showNewTaskForm,
  newTaskData,
  isLoading,
  showMinimumSkeleton,
  canMoveTask,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onDeleteTask,
  onMarkAsFinal,
  onMarkAsPublished,
  onMarkAsPosted,
  loadingTaskId,
  onOpenNewTaskModal,
  onSetShowNewTaskForm,
  onSetNewTaskData,
  onCreateTask,
  teamName,
  isMobile = false,
  isLastColumn = false,
  includeHeader = false,
  totalTasksCount,
  visibleTasksLimit = INITIAL_TASKS_LIMIT,
  onLoadMore,
  isLoadingMore = false,
}: TaskColumnProps) {
  const hasMoreTasks = totalTasksCount !== undefined && tasks.length < totalTasksCount;
  const remainingTasks = totalTasksCount !== undefined ? totalTasksCount - tasks.length : 0;
  const visibleTasks = tasks.slice(0, visibleTasksLimit);
  const hasHiddenTasks = tasks.length > visibleTasksLimit;
  const hiddenCount = tasks.length - visibleTasksLimit;

  return (
    <div
      className={`${isMobile ? "shrink-0 w-80 p-4 border-r border-gray-200 dark:border-gray-600 last:border-r-0" : `flex flex-col flex-1 min-w-[300px] ${!isLastColumn ? "border-r-2 border-gray-200 dark:border-gray-600" : ""}`} transition-colors duration-300 ${
        draggedTask && draggedTask.status !== status
          ? "bg-pink-50/30 dark:bg-pink-900/10 border-pink-200 dark:border-pink-500"
          : ""
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status as Task["status"])}
    >
      {!isMobile && includeHeader && (
        <div className={`p-4 ${config.headerColor} dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {config.label}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                (totalTasksCount ?? tasks.length) > 50
                  ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                  : (totalTasksCount ?? tasks.length) > 20
                  ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}>
                {totalTasksCount !== undefined ? `${visibleTasks.length}/${totalTasksCount}` : tasks.length}
              </span>
            </div>
            <button
              onClick={() => onOpenNewTaskModal(status)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg p-1 transition-colors"
              title={`Add task to ${config.label}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {showNewTaskForm === status && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              <input
                type="text"
                placeholder="Task title..."
                value={newTaskData.title}
                onChange={(e) => onSetNewTaskData({ title: e.target.value })}
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)..."
                value={newTaskData.description}
                onChange={(e) => onSetNewTaskData({ description: e.target.value })}
                className="w-full p-2 mt-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={2}
              />
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={() => onSetShowNewTaskForm(null)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onCreateTask(status as Task["status"])}
                  disabled={!newTaskData.title.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Task
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isMobile && (
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 -m-2 rounded-lg z-10">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {config.label}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              (totalTasksCount ?? tasks.length) > 50
                ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                : (totalTasksCount ?? tasks.length) > 20
                ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
            }`}>
              {totalTasksCount !== undefined ? `${visibleTasks.length}/${totalTasksCount}` : tasks.length}
            </span>
          </div>
          <button
            onClick={() => onOpenNewTaskModal(status)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
            title={`Add task to ${config.label}`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className={`${includeHeader && !isMobile ? 'p-4 flex-1 overflow-y-auto board-scrollbar' : ''}`}>
        {!isMobile && !includeHeader && showNewTaskForm === status && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
            <input
              type="text"
              placeholder="Task title..."
              value={newTaskData.title}
              onChange={(e) => onSetNewTaskData({ title: e.target.value })}
              className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)..."
              value={newTaskData.description}
              onChange={(e) => onSetNewTaskData({ description: e.target.value })}
              className="w-full p-2 mt-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={2}
            />
            <UserDropdown
              value={newTaskData.assignedTo}
              onChange={(email) => onSetNewTaskData({ assignedTo: email })}
              placeholder="Search and select user..."
              className=""
            />
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => onSetShowNewTaskForm(null)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => onCreateTask(status as Task["status"])}
                disabled={!newTaskData.title.trim()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              draggedTask={draggedTask}
              session={session}
              canMoveTask={canMoveTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onTaskClick={onTaskClick}
              onDeleteTask={onDeleteTask}
              onMarkAsFinal={onMarkAsFinal}
              onMarkAsPublished={onMarkAsPublished}
              onMarkAsPosted={onMarkAsPosted}
              loadingTaskId={loadingTaskId}
              columnName={config.label}
              columnStatus={status}
              teamName={teamName}
              isMobile={isMobile}
            />
          ))}

          {tasks.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <p className="text-sm font-medium mb-1">
                No {config.label.toLowerCase()} tasks
              </p>
              <p className="text-xs text-center">
                Tasks will appear here when created
              </p>
            </div>
          )}

          {tasks.length === 0 && (showMinimumSkeleton || isLoading) && (
            <>
              <TaskSkeleton />
              <TaskSkeleton />
            </>
          )}

          {draggedTask && draggedTask.status !== status && (
            <div className="border-2 border-dashed border-pink-300 dark:border-pink-600 rounded-lg p-4 text-center text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/20">
              <div className="text-sm font-medium">
                Drop here to move to {config.label}
              </div>
            </div>
          )}
        </div>

        {hasHiddenTasks && onLoadMore && (
          <button
            onClick={() => onLoadMore(status)}
            disabled={isLoadingMore}
            className="w-full mt-4 py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load {Math.min(hiddenCount, 25)} more ({hiddenCount} remaining)
              </>
            )}
          </button>
        )}

        {!hasHiddenTasks && hasMoreTasks && onLoadMore && (
          <button
            onClick={() => onLoadMore(status)}
            disabled={isLoadingMore}
            className="w-full mt-4 py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more tasks...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load more ({remainingTasks} remaining)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}