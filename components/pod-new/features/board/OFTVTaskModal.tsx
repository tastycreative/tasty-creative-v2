"use client";

import React from "react";
import { X, Plus } from "lucide-react";
import { Task } from "@/lib/stores/boardStore";
import UserDropdown from "@/components/UserDropdown";
import ModelsDropdownList from "@/components/ModelsDropdownList";

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

export interface OFTVTaskData {
  model: string;
  title: string;
  folderLink: string;
  videoEditor: string; // Keep for display purposes (email)
  videoEditorUserId: string; // Add userId
  videoEditorStatus: string;
  thumbnailEditor: string; // Keep for display purposes (email)
  thumbnailEditorUserId: string; // Add userId
  thumbnailEditorStatus: string;
  dueDate: string;
  specialInstructions: string;
}

interface OFTVTaskModalProps {
  isOpen: boolean;
  newTaskStatus: Task["status"] | null;
  taskData: OFTVTaskData;
  isCreatingTask: boolean;
  columns?: Array<{ status: string; label: string; color?: string }>;
  teamId?: string;
  onClose: () => void;
  onSetTaskData: (data: Partial<OFTVTaskData>) => void;
  onCreateTask: () => void;
}

export default function OFTVTaskModal({
  isOpen,
  newTaskStatus,
  taskData,
  isCreatingTask,
  columns = [],
  teamId,
  onClose,
  onSetTaskData,
  onCreateTask,
}: OFTVTaskModalProps) {
  if (!isOpen || !newTaskStatus) return null;

  // Find the column data for the current status
  const currentColumn = columns.find((col) => col.status === newTaskStatus);
  const fallbackConfig =
    statusConfig[newTaskStatus as keyof typeof statusConfig];

  const columnLabel =
    currentColumn?.label || fallbackConfig?.label || newTaskStatus;
  const columnColor =
    currentColumn?.color || fallbackConfig?.color || "bg-gray-400";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-3xl border border-white/20 dark:border-gray-700/50 my-4 sm:my-8">
        {/* Modal Header */}
        <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div
                className={`w-3 h-3 rounded-full ${columnColor.split(" ")[0]} flex-shrink-0`}
              ></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Create OFTV Task
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

        {/* Modal Content */}
        <div className="p-4 sm:p-8">
          <div className="space-y-6">
            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Model *
              </label>
              <ModelsDropdownList
                value={taskData.model}
                onValueChange={(value) => onSetTaskData({ model: value })}
                placeholder="Select a model..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Title *
              </label>
              <input
                type="text"
                value={taskData.title}
                onChange={(e) => onSetTaskData({ title: e.target.value })}
                placeholder="Enter task title..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Folder Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Folder Link
              </label>
              <input
                type="url"
                value={taskData.folderLink}
                onChange={(e) => onSetTaskData({ folderLink: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Video Editor Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Video Editor
                </label>
                <UserDropdown
                  value={taskData.videoEditor}
                  onChange={(userId, email) => onSetTaskData({ videoEditor: email, videoEditorUserId: userId })}
                  placeholder="Select video editor..."
                  teamId={teamId}
                  className=""
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Video Editor Status
                </label>
                <select
                  value={taskData.videoEditorStatus}
                  onChange={(e) =>
                    onSetTaskData({ videoEditorStatus: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NEEDS_REVISION">Needs Revision</option>
                </select>
              </div>
            </div>

            {/* Thumbnail Editor Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Thumbnail Editor
                </label>
                <UserDropdown
                  value={taskData.thumbnailEditor}
                  onChange={(userId, email) =>
                    onSetTaskData({ thumbnailEditor: email, thumbnailEditorUserId: userId })
                  }
                  placeholder="Select thumbnail editor..."
                  teamId={teamId}
                  className=""
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Thumbnail Editor Status
                </label>
                <select
                  value={taskData.thumbnailEditorStatus}
                  onChange={(e) =>
                    onSetTaskData({ thumbnailEditorStatus: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NEEDS_REVISION">Needs Revision</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Due Date
              </label>
              <input
                type="date"
                value={taskData.dueDate}
                onChange={(e) => onSetTaskData({ dueDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Special Instructions
              </label>
              <textarea
                value={taskData.specialInstructions}
                onChange={(e) =>
                  onSetTaskData({ specialInstructions: e.target.value })
                }
                rows={4}
                placeholder="Add any special instructions..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
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
                disabled={
                  !taskData.model.trim() ||
                  !taskData.title.trim() ||
                  isCreatingTask
                }
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
