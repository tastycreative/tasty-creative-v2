"use client";

import React, { useState } from "react";
import { Session } from "next-auth";
import { X, Edit3, Calendar, Clock, Loader2, FileText, Tag, DollarSign, Upload, ExternalLink, Settings, MessageCircle } from "lucide-react";
import { Task } from "@/lib/stores/boardStore";
import { formatForTaskDetail, formatDueDate, toLocalDateTimeString, utcNow } from "@/lib/dateUtils";
import UserDropdown from "@/components/UserDropdown";
import FileUpload from "@/components/ui/FileUpload";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import TaskCardHistory from "./TaskCardHistory";
import TaskComments from "./TaskComments";
import UserProfile from "@/components/ui/UserProfile";
import WallPostDetailSection from "./WallPostDetailSection";

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
  isUserInTeam: boolean;
  teamMembers: Array<{id: string, email: string, name?: string}>;
  teamAdmins: Array<{id: string, email: string, name?: string}>;
  isSaving?: boolean;
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
  isUserInTeam,
  teamMembers,
  teamAdmins,
  isSaving = false,
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
  
  // Determine if user should have view-only access
  // View-only if user is not admin, not team member, and not assigned to task
  const isViewOnly = !session?.user?.role || 
    (session.user.role !== 'ADMIN' && !isUserInTeam && !canEditTask(selectedTask));
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/40 to-pink-900/40 backdrop-blur-lg flex items-start justify-center p-2 sm:p-4 z-[10000] overflow-y-auto">
      <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-xl shadow-2xl w-full max-w-6xl border border-gray-200/60 dark:border-gray-700/60 my-4 sm:my-8 min-w-0 backdrop-blur-sm">
        {/* Modal Header - UX Optimized for Cognitive Load Reduction */}
        <div className="relative border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-white/95 via-gray-50/80 to-purple-50/60 dark:from-gray-900/95 dark:via-gray-800/80 dark:to-purple-900/40 rounded-t-xl backdrop-blur-sm">
          {/* Primary Information Zone - Following Visual Hierarchy Principles */}
          <div className="px-6 sm:px-8 py-5">
            <div className="flex items-start justify-between gap-6">
              {/* Left Zone: Primary Task Information */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Task Title - Primary Focus Point */}
                <div className="flex items-center gap-3">
                  {isEditingTask ? (
                    <input
                      type="text"
                      value={editingTaskData.title || ""}
                      onChange={(e) => onSetEditingTaskData({ ...editingTaskData, title: e.target.value })}
                      className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none focus:ring-0 w-full min-w-0 placeholder:text-gray-400"
                      placeholder="Enter task title..."
                    />
                  ) : (
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {selectedTask.title}
                    </h1>
                  )}

                  {/* Task ID Badge - Secondary but Important */}
                  {selectedTask.podTeam?.projectPrefix && selectedTask.taskNumber && (
                    <span className="font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md text-sm font-semibold border border-blue-200/50 dark:border-blue-700/50 flex-shrink-0">
                      {selectedTask.podTeam.projectPrefix}-{selectedTask.taskNumber}
                    </span>
                  )}
                </div>

                {/* Status and Priority Row - Secondary Information */}
                <div className="flex items-center gap-3">
                  {/* Status Badge - Primary Status Indicator */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm border ${(statusConfig as any)[selectedTask.status]?.color || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${(statusConfig as any)[selectedTask.status]?.color?.includes('bg-') ? (statusConfig as any)[selectedTask.status]?.color?.split(' ')[0] : "bg-gray-500"}`}></div>
                    <span>{(statusConfig as any)[selectedTask.status]?.label || selectedTask.status}</span>
                  </div>

                  {/* Priority Indicator - Contextual Information */}
                  {selectedTask.priority && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      selectedTask.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                      selectedTask.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      selectedTask.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      <span className="text-xs">
                        {selectedTask.priority === 'URGENT' ? '🚨' :
                         selectedTask.priority === 'HIGH' ? '🔴' :
                         selectedTask.priority === 'MEDIUM' ? '🟡' :
                         '🟢'}
                      </span>
                      <span>{selectedTask.priority}</span>
                    </div>
                  )}

                  {/* Assignment Status */}
                  {selectedTask.assignedUser ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-xs">👤</span>
                      <span className="truncate max-w-32">{selectedTask.assignedUser.name || selectedTask.assignedUser.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 text-xs font-medium">
                      <span>⚠️</span>
                      <span>Unassigned</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Zone: Action Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isEditingTask ? (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                      showHistory
                        ? "text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-900/40 dark:to-blue-900/40 border border-purple-200/50 dark:border-purple-700/50 hover:from-purple-200/80 hover:to-blue-200/80 dark:hover:from-purple-900/60 dark:hover:to-blue-900/60"
                        : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 bg-white/80 dark:bg-gray-700/80 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 border border-gray-200/50 dark:border-gray-600/50"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">History</span>
                  </button>
                  {canEditTask(selectedTask) && (
                    <button
                      onClick={onStartEditing}
                      className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/40 dark:hover:to-purple-900/40 border border-pink-200/50 dark:border-pink-700/50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-pink-500/20"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}
                  {isViewOnly && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 px-2 sm:px-4 py-2 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <span className="hidden sm:inline">🔒 View Only - Not team member</span>
                      <span className="sm:hidden">🔒 View Only</span>
                    </div>
                  )}
                  {!isViewOnly && !canEditTask(selectedTask) && (
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
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200"
                  >
                    <span className="hidden sm:inline">Cancel</span>
                    <span className="sm:hidden">✕</span>
                  </button>
                  <button
                    onClick={onSaveChanges}
                    disabled={isSaving}
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 rounded-xl p-2 transition-all duration-200 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Temporal Information Bar - Following Chunking Principles */}
          <div className="border-t border-gray-100/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 px-6 sm:px-8 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Created</span>
                  <span className="text-gray-600 dark:text-gray-400">{formatForTaskDetail(selectedTask.createdAt)}</span>
                </div>
                {selectedTask.dueDate && (
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Due</span>
                    <span className={`${formatDueDate(selectedTask.dueDate).className}`}>{formatDueDate(selectedTask.dueDate).formatted}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated {formatForTaskDetail(selectedTask.updatedAt)}
              </div>
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
        <div className="flex flex-col lg:flex-row min-h-0 min-w-0">
          {/* Main Content - Mobile Responsive */}
          <div className="flex-1 min-w-0 p-4 sm:p-8 order-2 lg:order-1">
            {isEditingTask ? (
              <div className="space-y-8">
                {/* Section 1: Basic Information */}
                <div className="bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Task Details
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editingTaskData.description || ""}
                        onChange={(e) =>
                          onSetEditingTaskData({ description: e.target.value })
                        }
                        rows={4}
                        placeholder="Add a clear description of what needs to be done..."
                        className="w-full px-4 py-3 border border-gray-200/60 dark:border-gray-600/60 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-300/50 dark:focus:border-blue-600/50 transition-all duration-200 resize-none shadow-sm hover:shadow-md"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Be specific about requirements, acceptance criteria, and expected outcomes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Files & Resources */}
                <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/60 dark:border-purple-700/60">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Files & Resources
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload relevant files, images, or documents. Max 5 files, 10MB each.
                      </p>
                    </div>
                  </div>
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
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
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
                    placeholder="Search and select team member..."
                    className=""
                    teamId={selectedTask.podTeamId || undefined}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8 min-w-0">
                {/* Workflow Details - Rich Information Display */}
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Workflow Details
                  </h4>

                  {selectedTask.ModularWorkflow ? (
                    <div className="space-y-6">
                      {/* Workflow Overview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Content Type & Model */}
                        <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h5 className="font-semibold text-blue-900 dark:text-blue-100">Content Details</h5>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Type:</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200 uppercase">
                                {selectedTask.ModularWorkflow.submissionType}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Style:</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200 capitalize">
                                {selectedTask.ModularWorkflow.contentStyle}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Model:</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                {selectedTask.ModularWorkflow.modelName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Workflow Priority & Status */}
                        <div className="p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                          <div className="flex items-center gap-3 mb-3">
                            <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <h5 className="font-semibold text-purple-900 dark:text-purple-100">Workflow Status</h5>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                              <span className="font-medium text-purple-800 dark:text-purple-200 flex items-center gap-1">
                                {selectedTask.ModularWorkflow.priority === 'URGENT' ? '🚨' :
                                 selectedTask.ModularWorkflow.priority === 'HIGH' ? '🔴' :
                                 selectedTask.ModularWorkflow.priority === 'NORMAL' ? '🟡' : '🟢'}
                                {selectedTask.ModularWorkflow.priority}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <span className="font-medium text-purple-800 dark:text-purple-200 capitalize">
                                {selectedTask.ModularWorkflow.status?.replace('_', ' ') || 'In Progress'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Created:</span>
                              <span className="font-medium text-purple-800 dark:text-purple-200">
                                {new Date(selectedTask.ModularWorkflow.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Description */}
                      {selectedTask.ModularWorkflow.contentDescription && (
                        <div className="p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                          <div className="flex items-center gap-3 mb-3">
                            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <h5 className="font-semibold text-green-900 dark:text-green-100">Description</h5>
                          </div>
                          <div className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                            {selectedTask.ModularWorkflow.contentDescription}
                          </div>
                        </div>
                      )}

                      {/* Component Features */}
                      {selectedTask.ModularWorkflow.selectedComponents && selectedTask.ModularWorkflow.selectedComponents.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
                          <div className="flex items-center gap-3 mb-3">
                            <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            <h5 className="font-semibold text-orange-900 dark:text-orange-100">Workflow Components</h5>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedTask.ModularWorkflow.selectedComponents.map((component) => {
                              const componentInfo = selectedTask.ModularWorkflow?.componentData;
                              let displayValue = '';

                              if (component === 'pricing' && componentInfo?.basePrice) {
                                displayValue = `$${componentInfo.basePrice}`;
                              } else if (component === 'release' && componentInfo?.releaseDate) {
                                displayValue = new Date(componentInfo.releaseDate).toLocaleDateString();
                              }

                              return (
                                <div key={component} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 border border-orange-200/50 dark:border-orange-600/50 rounded-md shadow-sm">
                                  {component === 'pricing' && <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />}
                                  {component === 'upload' && <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                                  {component === 'release' && <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                    {component}
                                  </span>
                                  {displayValue && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                      {displayValue}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Drive Assets */}
                      {selectedTask.ModularWorkflow.driveLink && (
                        <div className="p-4 bg-gradient-to-r from-cyan-50/80 to-sky-50/80 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-lg border border-cyan-200/50 dark:border-cyan-700/50">
                          <div className="flex items-center gap-3 mb-3">
                            <ExternalLink className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            <h5 className="font-semibold text-cyan-900 dark:text-cyan-100">Assets & Resources</h5>
                          </div>
                          <a
                            href={selectedTask.ModularWorkflow.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Google Drive Folder
                          </a>
                        </div>
                      )}
                    </div>
                  ) : selectedTask.wallPostSubmission ? (
                    <WallPostDetailSection
                      task={selectedTask}
                      isEditing={isEditingTask}
                      onRefresh={() => window.location.reload()}
                    />
                  ) : selectedTask.ContentSubmission ? (
                    <div className="space-y-4">
                      {/* Legacy Content Submission */}
                      <div className="p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <h5 className="font-semibold text-amber-900 dark:text-amber-100">Legacy Submission</h5>
                        </div>
                        <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                          <div className="flex justify-between">
                            <span className="text-amber-600 dark:text-amber-400">Type:</span>
                            <span className="font-medium">{selectedTask.ContentSubmission.submissionType}</span>
                          </div>
                          {selectedTask.ContentSubmission.minimumPrice && (
                            <div className="flex justify-between">
                              <span className="text-amber-600 dark:text-amber-400">Price:</span>
                              <span className="font-medium">${selectedTask.ContentSubmission.minimumPrice}</span>
                            </div>
                          )}
                          {selectedTask.ContentSubmission.releaseDate && (
                            <div className="flex justify-between">
                              <span className="text-amber-600 dark:text-amber-400">Release:</span>
                              <span className="font-medium">
                                {selectedTask.ContentSubmission.releaseDate} {selectedTask.ContentSubmission.releaseTime}
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedTask.ContentSubmission.driveLink && (
                          <div className="mt-3">
                            <a
                              href={selectedTask.ContentSubmission.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors duration-200 text-sm"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Drive Folder
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 italic bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                      No workflow details available
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    Attachments
                  </h4>
                  {selectedTask.attachments &&
                  selectedTask.attachments.length > 0 ? (
                    <div className="min-w-0">
                      <AttachmentViewer
                        attachments={selectedTask.attachments}
                        showTitle={false}
                        compact={false}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      No attachments
                    </p>
                  )}
                </div>
                   {/* Comments Section */}
                <div className="min-w-0">
                  <TaskComments 
                    taskId={selectedTask.id}
                    teamId={selectedTask.podTeamId || undefined}
                    currentUser={session?.user ? {
                      id: session.user.id!,
                      name: session.user.name,
                      email: session.user.email!,
                      image: session.user.image
                    } : null}
                    isViewOnly={isViewOnly}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Mobile Responsive */}
          <div className="w-full lg:w-80 lg:max-w-80 lg:flex-shrink-0 bg-gradient-to-b from-blue-50/40 to-gray-50/40 dark:from-blue-900/10 dark:to-gray-800/30 border-t lg:border-t-0 lg:border-l border-blue-200/30 dark:border-blue-700/30 p-4 sm:p-6 order-1 lg:order-2 backdrop-blur-sm">
            <div className="space-y-4 sm:space-y-6 min-w-0">
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
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  >
                    {getColumnConfig().map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg min-w-0">
                    {(() => {
                      const columnConfig = getColumnConfig().find(
                        ([status]) => status === selectedTask.status
                      );
                      const IconComponent = (columnConfig && columnConfig[1] && columnConfig[1].icon)
                        ? columnConfig[1].icon
                        : Clock;
                      return (
                        <IconComponent className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      );
                    })()}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-sm flex-shrink-0">
                    {selectedTask.priority === "URGENT"
                      ? "🚨"
                      : selectedTask.priority === "HIGH"
                        ? "🔴"
                        : selectedTask.priority === "MEDIUM"
                          ? "🟡"
                          : "🟢"}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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
                  <div className="flex items-center space-x-3 min-w-0">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic truncate">
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
                  <div className="flex items-center space-x-2 min-w-0">
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
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center space-x-2 min-w-0">
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
                  <div className="flex items-center space-x-3 min-w-0">
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
                <div className="flex items-center space-x-2 min-w-0">
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
    </div>
  );
}
