"use client";

import React from "react";
import { X, Plus } from "lucide-react";
import { Task, NewTaskData } from "@/lib/stores/boardStore";
import UserDropdown from "@/components/UserDropdown";
import FileUpload from "@/components/ui/FileUpload";

const statusConfig = {
  NOT_STARTED: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
  },
};

interface NewTaskModalProps {
  isOpen: boolean;
  newTaskStatus: Task["status"] | null;
  newTaskData: NewTaskData;
  isCreatingTask: boolean;
  columns?: Array<{ status: string; label: string; color?: string }>;
  onClose: () => void;
  onSetNewTaskData: (data: Partial<NewTaskData>) => void;
  onCreateTask: () => void;
}

export default function NewTaskModal({
  isOpen,
  newTaskStatus,
  newTaskData,
  isCreatingTask,
  columns = [],
  onClose,
  onSetNewTaskData,
  onCreateTask,
}: NewTaskModalProps) {
  if (!isOpen || !newTaskStatus) return null;

  // Find the column data for the current status
  const currentColumn = columns.find(col => col.status === newTaskStatus);
  const fallbackConfig = statusConfig[newTaskStatus as keyof typeof statusConfig];
  
  const columnLabel = currentColumn?.label || fallbackConfig?.label || newTaskStatus;
  const columnColor = currentColumn?.color || fallbackConfig?.color || 'bg-gray-400';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-2xl border border-white/20 dark:border-gray-700/50 my-4 sm:my-8">
        {/* Modal Header - Mobile Responsive */}
        <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div
                className={`w-3 h-3 rounded-full ${columnColor.split(" ")[0]} flex-shrink-0`}
              ></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Create New Task
                </h3>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 block sm:inline">
                  in {columnLabel}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors flex-shrink-0 ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Mobile Responsive */}
        <div className="p-4 sm:p-8">
          <div className="space-y-6">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Task Title *
              </label>
              <input
                type="text"
                value={newTaskData.title}
                onChange={(e) => onSetNewTaskData({ title: e.target.value })}
                placeholder="Enter task title..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                autoFocus
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Description
              </label>
              <textarea
                value={newTaskData.description}
                onChange={(e) =>
                  onSetNewTaskData({ description: e.target.value })
                }
                rows={3}
                placeholder="Add a description..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Attachments
              </label>
              <FileUpload
                attachments={newTaskData.attachments || []}
                onAttachmentsChange={(attachments) =>
                  onSetNewTaskData({ attachments })
                }
                maxFiles={5}
                maxFileSize={10}
                className="mb-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Priority
                </label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) =>
                    onSetNewTaskData({
                      priority: e.target.value as Task["priority"],
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                  <option value="URGENT">🚨 Urgent</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Due Date
                  </label>
                  <input
                    type="checkbox"
                    id="has-due-date-new"
                    checked={!!newTaskData.dueDate}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        onSetNewTaskData({ dueDate: "" });
                      } else {
                        const today = new Date().toISOString().split("T")[0];
                        onSetNewTaskData({ dueDate: today });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="has-due-date-new"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Set due date
                  </label>
                </div>
                {newTaskData.dueDate ? (
                  <input
                    type="date"
                    value={newTaskData.dueDate}
                    onChange={(e) =>
                      onSetNewTaskData({ dueDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm italic">
                    No deadline set
                  </div>
                )}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Assignee
              </label>
              <UserDropdown
                value={newTaskData.assignedTo}
                onChange={(email) => onSetNewTaskData({ assignedTo: email })}
                placeholder="Search and select user..."
                className=""
              />
            </div>

            {/* Action Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={onClose}
                disabled={isCreatingTask}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={onCreateTask}
                disabled={!newTaskData.title.trim() || isCreatingTask}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 order-1 sm:order-2"
              >
                {isCreatingTask ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
