"use client";

import React, { useState } from "react";
import { Session } from "next-auth";
import { X, Edit3, Calendar, Clock } from "lucide-react";
import { Task } from "@/lib/stores/boardStore";
import UserDropdown from "@/components/UserDropdown";
import FileUpload from "@/components/ui/FileUpload";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import TaskCardHistory from "./TaskCardHistory";
import TaskComments from "./TaskComments";
import UserProfile from "@/components/ui/UserProfile";

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

const statusConfig = {
  NOT_STARTED: {
    label: "Not Started",
    icon: Clock,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    headerColor: "bg-gray-50 border-gray-200",
    buttonColor: "bg-gray-600 hover:bg-gray-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    headerColor: "bg-blue-50 border-blue-200",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  COMPLETED: {
    label: "Completed",
    icon: Clock,
    color: "bg-green-100 text-green-700 border-green-200",
    headerColor: "bg-green-50 border-green-200",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Clock,
    color: "bg-red-100 text-red-700 border-red-200",
    headerColor: "bg-red-50 border-red-200",
    buttonColor: "bg-red-600 hover:bg-red-700",
  },
};

interface TaskDetailModalProps {
  selectedTask: Task;
  isEditingTask: boolean;
  editingTaskData: Partial<Task>;
  session: Session | null;
  canEditTask: (task: Task) => boolean;
  onClose: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveChanges: () => void;
  onSetEditingTaskData: (data: Partial<Task>) => void;
  onUpdateTaskStatus: (status: Task["status"]) => void;
  onAutoSaveAttachments: (attachments: any[]) => void;
  getColumnConfig: () => Array<[string, any]>;
}

export default function TaskDetailModal({
  selectedTask,
  isEditingTask,
  editingTaskData,
  session,
  canEditTask,
  onClose,
  onStartEditing,
  onCancelEditing,
  onSaveChanges,
  onSetEditingTaskData,
  onUpdateTaskStatus,
  onAutoSaveAttachments,
  getColumnConfig,
}: TaskDetailModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-4xl border border-white/20 dark:border-gray-700/50 my-4 sm:my-8">
        {/* Modal Header */}
        <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className={`w-2 h-2 rounded-full ${(statusConfig as any)[selectedTask.status]?.color?.split(" ")[0] || "bg-gray-500"}`}
                ></div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                  Task •{" "}
                  {(statusConfig as any)[selectedTask.status]?.label ||
                    selectedTask.status}
                </span>
              </div>
              {isEditingTask ? (
                <input
                  type="text"
                  value={editingTaskData.title || ""}
                  onChange={(e) =>
                    onSetEditingTaskData({ title: e.target.value })
                  }
                  className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                  placeholder="Task title..."
                />
              ) : (
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight pr-4">
                  {selectedTask.title}
                </h3>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-6 flex-shrink-0">
              {!isEditingTask ? (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      showHistory
                        ? "text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/20 hover:bg-purple-200/50 dark:hover:bg-purple-900/30"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">History</span>
                  </button>
                  {canEditTask(selectedTask) && (
                    <button
                      onClick={onStartEditing}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}
                  {!canEditTask(selectedTask) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2 sm:px-4 py-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg">
                      <span className="hidden sm:inline">View Only</span>
                      <span className="sm:hidden">View</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={onCancelEditing}
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <span className="hidden sm:inline">Cancel</span>
                    <span className="sm:hidden">✕</span>
                  </button>
                  <button
                    onClick={onSaveChanges}
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        {/* Task History - Shows when toggled */}
        {showHistory && selectedTask.podTeamId && (
          <div>
            <TaskCardHistory
              taskId={selectedTask.id}
              teamId={selectedTask.podTeamId}
              isModal={true}
            />
          </div>
        )}

        {/* Modal Content - Mobile Responsive */}
        <div className="flex flex-col lg:flex-row">
          {/* Main Content - Mobile Responsive */}
          <div className="flex-1 p-4 sm:p-8">
            {isEditingTask ? (
              <div className="space-y-6">
                {/* Edit Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Description
                  </label>
                  <textarea
                    value={editingTaskData.description || ""}
                    onChange={(e) =>
                      onSetEditingTaskData({ description: e.target.value })
                    }
                    rows={4}
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
                    attachments={editingTaskData.attachments || []}
                    onAttachmentsChange={(attachments) => {
                      onSetEditingTaskData({ attachments });
                      onAutoSaveAttachments(attachments);
                    }}
                    maxFiles={5}
                    maxFileSize={10}
                    className="mb-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Edit Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Priority
                    </label>
                    <select
                      value={editingTaskData.priority || "MEDIUM"}
                      onChange={(e) =>
                        onSetEditingTaskData({
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

                  {/* Edit Due Date */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Due Date
                      </label>
                      <input
                        type="checkbox"
                        id="has-due-date-edit"
                        checked={!!editingTaskData.dueDate}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            onSetEditingTaskData({ dueDate: "" });
                          } else {
                            const today = new Date()
                              .toISOString()
                              .split("T")[0];
                            onSetEditingTaskData({ dueDate: today });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="has-due-date-edit"
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Set due date
                      </label>
                    </div>
                    {editingTaskData.dueDate ? (
                      <input
                        type="date"
                        value={editingTaskData.dueDate || ""}
                        onChange={(e) =>
                          onSetEditingTaskData({ dueDate: e.target.value })
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

                {/* Edit Assignee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Assignee
                  </label>
                  <UserDropdown
                    value={editingTaskData.assignedTo || ""}
                    onChange={(email) =>
                      onSetEditingTaskData({ assignedTo: email })
                    }
                    placeholder="Search and select user..."
                    className=""
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    Description
                  </h4>
                  {selectedTask.description ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {linkifyText(selectedTask.description)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      No description provided
                    </p>
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    Attachments
                  </h4>
                  {selectedTask.attachments &&
                  selectedTask.attachments.length > 0 ? (
                    <AttachmentViewer
                      attachments={selectedTask.attachments}
                      showTitle={false}
                      compact={false}
                    />
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      No attachments
                    </p>
                  )}
                </div>
                   {/* Comments Section */}
                <div className=" ">
                  <TaskComments 
                    taskId={selectedTask.id} 
                    currentUser={session?.user ? {
                      id: session.user.id!,
                      name: session.user.name,
                      email: session.user.email!,
                      image: session.user.image
                    } : null} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Mobile Responsive */}
          <div className="w-full lg:w-80 bg-gray-50/50 dark:bg-gray-800/30 border-t lg:border-t-0 lg:border-l border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Status - Interactive for authorized users */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Status
                </label>
                {canEditTask(selectedTask) ? (
                  <select
                    value={selectedTask.status}
                    onChange={(e) =>
                      onUpdateTaskStatus(e.target.value as Task["status"])
                    }
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {getColumnConfig().map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {(() => {
                      const columnConfig = getColumnConfig().find(
                        ([status]) => status === selectedTask.status
                      );
                      const IconComponent = columnConfig
                        ? columnConfig[1].icon
                        : Clock;
                      return (
                        <IconComponent className="h-4 w-4 text-gray-500" />
                      );
                    })()}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {(() => {
                        const columnConfig = getColumnConfig().find(
                          ([status]) => status === selectedTask.status
                        );
                        return columnConfig
                          ? columnConfig[1].label
                          : selectedTask.status;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    {selectedTask.priority === "URGENT"
                      ? "🚨"
                      : selectedTask.priority === "HIGH"
                        ? "🔴"
                        : selectedTask.priority === "MEDIUM"
                          ? "🟡"
                          : "🟢"}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Assignee
                </label>
                {selectedTask.assignedUser ? (
                  <div className="flex items-center space-x-3">
                    <UserProfile
                      user={selectedTask.assignedUser}
                      size="md"
                      showTooltip
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {selectedTask.assignedUser.name ||
                          selectedTask.assignedUser.email
                            ?.split("@")[0]
                            .replace(/[._-]/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {selectedTask.assignedUser.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Unassigned
                  </p>
                )}
              </div>

              {/* Due Date */}
              {selectedTask.dueDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Due Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {new Date(selectedTask.dueDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Created */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Created
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {new Date(selectedTask.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <UserProfile
                      user={selectedTask.createdBy}
                      size="sm"
                      showTooltip
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {selectedTask.createdBy.name ||
                          selectedTask.createdBy.email
                            ?.split("@")[0]
                            .replace(/[._-]/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Last Updated
                </label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {new Date(selectedTask.updatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
