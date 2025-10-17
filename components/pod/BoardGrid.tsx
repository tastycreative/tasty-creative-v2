"use client";

import React from "react";
import { Session } from "next-auth";
import { Plus } from "lucide-react";
import { Task, NewTaskData } from "@/lib/stores/boardStore";
import TaskColumn from "./TaskColumn";
import { TaskSkeleton } from "./BoardSkeleton";

interface BoardGridProps {
  columns: Array<{ status: string; label: string }>;
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
  onOpenNewTaskModal: (status: string) => void;
  onSetShowNewTaskForm: (status: string | null) => void;
  onSetNewTaskData: (data: Partial<NewTaskData>) => void;
  onCreateTask: (status: Task["status"]) => void;
  getColumnConfig: () => Array<[string, any]>;
  getTasksForStatus: (status: Task["status"]) => Task[];
  getGridClasses: () => string;
  getGridStyles: () => { gridTemplateColumns: string };
}

export default function BoardGrid({
  columns,
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
  onOpenNewTaskModal,
  onSetShowNewTaskForm,
  onSetNewTaskData,
  onCreateTask,
  getColumnConfig,
  getTasksForStatus,
  getGridClasses,
  getGridStyles,
}: BoardGridProps) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
      {/* Mobile Column Navigation - Only visible on mobile */}
      <div className="md:hidden border-b border-gray-200 dark:border-gray-600">
        <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {getColumnConfig().map(([status, config]) => {
            const statusTasks = getTasksForStatus(status as Task["status"]);
            return (
              <button
                key={status}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  status === "NOT_STARTED" // Default selected for demo
                    ? `${config.headerColor} border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100`
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span>{config.label}</span>
                <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                  {statusTasks.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
                onOpenNewTaskModal={onOpenNewTaskModal}
                onSetShowNewTaskForm={onSetShowNewTaskForm}
                onSetNewTaskData={onSetNewTaskData}
                onCreateTask={onCreateTask}
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
                onOpenNewTaskModal={onOpenNewTaskModal}
                onSetShowNewTaskForm={onSetShowNewTaskForm}
                onSetNewTaskData={onSetNewTaskData}
                onCreateTask={onCreateTask}
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
