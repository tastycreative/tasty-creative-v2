"use client";

import React from "react";
import { Session } from "next-auth";
import { Task, NewTaskData } from "@/lib/stores/boardStore";
import TaskColumn from "./TaskColumn";

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
}: BoardGridProps) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
      {/* Mobile: Horizontal Scrolling Columns */}
      <div className="md:hidden">
        <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 min-h-[600px]">
          {getColumnConfig().map(([status, config], index) => {
            const statusTasks = getTasksForStatus(status as Task["status"]);

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
                loadingTaskId={loadingTaskId}
                onOpenNewTaskModal={onOpenNewTaskModal}
                onSetShowNewTaskForm={onSetShowNewTaskForm}
                onSetNewTaskData={onSetNewTaskData}
                onCreateTask={onCreateTask}
                teamName={teamName}
                isMobile={true}
                isLastColumn={index === getColumnConfig().length - 1}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop: Unified Header + Body Scroll Container */}
      <div className="hidden md:block overflow-x-auto">
        <div
          className={`grid ${getGridClasses()} min-h-[600px]`}
          style={getGridStyles()}
        >
          {getColumnConfig().map(([status, config], index) => {
            const statusTasks = getTasksForStatus(status as Task["status"]);

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
                loadingTaskId={loadingTaskId}
                onOpenNewTaskModal={onOpenNewTaskModal}
                onSetShowNewTaskForm={onSetShowNewTaskForm}
                onSetNewTaskData={onSetNewTaskData}
                onCreateTask={onCreateTask}
                teamName={teamName}
                isMobile={false}
                isLastColumn={index === getColumnConfig().length - 1}
                includeHeader={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
