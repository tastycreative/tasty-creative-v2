"use client";

import React from "react";
import { Session } from "next-auth";
import { Task, NewTaskData } from "@/lib/stores/boardStore";
import TaskColumn from "./TaskColumn";
import { useDraggableScroll } from "@/hooks/useDraggableScroll";

interface BoardGridProps {
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
  getColumnConfig: () => Array<[string, any]>;
  getTasksForStatus: (status: Task["status"]) => Task[];
  getGridClasses: () => string;
  getGridStyles: () => { gridTemplateColumns: string };
  columns: any[];
  teamName?: string;
  // Lazy loading props
  columnVisibleLimits?: Record<string, number>;
  onLoadMore?: (status: string) => void;
  isLoadingMore?: Record<string, boolean>;
}

export default function BoardGrid({
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
  getColumnConfig,
  getTasksForStatus,
  getGridClasses,
  getGridStyles,
  columns,
  teamName,
  columnVisibleLimits = {},
  onLoadMore,
  isLoadingMore = {},
}: BoardGridProps) {
  // Enable draggable scroll for mobile
  const mobileScrollRef = useDraggableScroll<HTMLDivElement>({
    enabled: true,
    sensitivity: 1.2,
  });

  // Enable draggable scroll for desktop
  const desktopScrollRef = useDraggableScroll<HTMLDivElement>({
    enabled: true,
    sensitivity: 1.2,
  });

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden h-full">
      {/* Mobile: Horizontal Scrolling Columns */}
      <div className="md:hidden">
        <div
          ref={mobileScrollRef}
          className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 min-h-[600px]"
          title="Click and drag to scroll horizontally"
        >
          {getColumnConfig().map(([status, config], index) => {
            const statusTasks = getTasksForStatus(status as Task["status"]);
            const visibleLimit = columnVisibleLimits[status] ?? 25;

            return (
              <TaskColumn
                key={status}
                status={status}
                config={config}
                tasks={statusTasks}
                session={session}
                draggedTask={draggedTask}
                showNewTaskForm={showNewTaskForm}
                newTaskData={newTaskData}
                isLoading={isLoading}
                showMinimumSkeleton={showMinimumSkeleton}
                canMoveTask={canMoveTask}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onTaskClick={onTaskClick}
                onDeleteTask={onDeleteTask}
                onMarkAsFinal={onMarkAsFinal}
                onMarkAsPublished={onMarkAsPublished}
                onMarkAsPosted={onMarkAsPosted}
                loadingTaskId={loadingTaskId}
                onOpenNewTaskModal={onOpenNewTaskModal}
                onSetShowNewTaskForm={onSetShowNewTaskForm}
                onSetNewTaskData={onSetNewTaskData}
                onCreateTask={onCreateTask}
                teamName={teamName}
                isMobile={true}
                isLastColumn={index === getColumnConfig().length - 1}
                visibleTasksLimit={visibleLimit}
                onLoadMore={onLoadMore}
                isLoadingMore={isLoadingMore[status] ?? false}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop: Unified Header + Body Scroll Container */}
      <div
        ref={desktopScrollRef}
        className="hidden md:block overflow-x-auto"
        title="Click and drag to scroll horizontally"
      >
        <div
          className="flex h-full"
        >
          {getColumnConfig().map(([status, config], index) => {
            const statusTasks = getTasksForStatus(status as Task["status"]);
            const visibleLimit = columnVisibleLimits[status] ?? 25;

            return (
              <TaskColumn
                key={status}
                status={status}
                config={config}
                tasks={statusTasks}
                session={session}
                draggedTask={draggedTask}
                showNewTaskForm={showNewTaskForm}
                newTaskData={newTaskData}
                isLoading={isLoading}
                showMinimumSkeleton={showMinimumSkeleton}
                canMoveTask={canMoveTask}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onTaskClick={onTaskClick}
                onDeleteTask={onDeleteTask}
                onMarkAsFinal={onMarkAsFinal}
                onMarkAsPublished={onMarkAsPublished}
                onMarkAsPosted={onMarkAsPosted}
                loadingTaskId={loadingTaskId}
                onOpenNewTaskModal={onOpenNewTaskModal}
                onSetShowNewTaskForm={onSetShowNewTaskForm}
                onSetNewTaskData={onSetNewTaskData}
                onCreateTask={onCreateTask}
                teamName={teamName}
                isMobile={false}
                isLastColumn={index === getColumnConfig().length - 1}
                includeHeader={true}
                visibleTasksLimit={visibleLimit}
                onLoadMore={onLoadMore}
                isLoadingMore={isLoadingMore[status] ?? false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
