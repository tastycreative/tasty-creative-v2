"use client";

import React, { useState } from "react";
import { Session } from "next-auth";
import { X, Edit3, Calendar, Clock, Loader2, History, MessageCircle, Paperclip, Activity, ExternalLink } from "lucide-react";
import { Task, useBoardStore } from "@/lib/stores/boardStore";
import { formatForTaskDetail, formatDueDate, toLocalDateTimeString, utcNow } from "@/lib/dateUtils";
import UserDropdown from "@/components/UserDropdown";
import FileUpload from "@/components/ui/FileUpload";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import TaskCardHistory from "./TaskCardHistory";
import TaskComments from "./TaskComments";
import UserProfile from "@/components/ui/UserProfile";
import { getStatusConfig } from "@/lib/config/boardConfig";
import { CONTENT_TAGS } from "@/lib/constants/contentTags";

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

// OFTV Task Status Options
const oftvStatusOptions = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  { value: 'NEEDS_REVISION', label: 'Needs Revision', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
  { value: 'HOLD', label: 'Hold', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
  { value: 'WAITING_FOR_VO', label: 'Waiting for VO', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
  { value: 'SENT', label: 'Sent', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' },
  { value: 'PUBLISHED', label: 'Published', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' },
];

// Helper function to get OFTV status config
const getOFTVStatusConfig = (status: string) => {
  return oftvStatusOptions.find(opt => opt.value === status) || oftvStatusOptions[0];
};

interface EnhancedTaskDetailModalProps {
  selectedTask: Task;
  isEditingTask?: boolean;
  editingTaskData?: Partial<Task>;
  session: Session | null;
  canEditTask: (task: Task) => boolean;
  isUserInTeam?: boolean;
  teamMembers?: Array<{id: string, email: string, name?: string}>;
  teamAdmins?: Array<{id: string, email: string, name?: string}>;
  isSaving?: boolean;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => void;
  onStartEditing?: () => void;
  onCancelEditing?: () => void;
  onSaveChanges?: () => void;
  onSetEditingTaskData?: (data: Partial<Task>) => void;
  onUpdateTaskStatus?: (status: Task["status"]) => void;
  onAutoSaveAttachments?: (attachments: any[]) => void;
  getColumnConfig?: () => Array<[string, any]>;
  onUpdateOFTVTask?: (taskId: string, updates: any) => Promise<void>;
}

export default function EnhancedTaskDetailModal({
  selectedTask,
  isEditingTask = false,
  editingTaskData = {},
  session,
  canEditTask,
  isUserInTeam = false,
  teamMembers = [],
  teamAdmins = [],
  isSaving = false,
  onClose,
  onUpdate,
  onDelete,
  onStartEditing,
  onCancelEditing,
  onSaveChanges,
  onSetEditingTaskData,
  onUpdateTaskStatus,
  onAutoSaveAttachments,
  getColumnConfig,
  onUpdateOFTVTask,
}: EnhancedTaskDetailModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(true);

  // OFTV task editing state
  const [editingOFTVData, setEditingOFTVData] = useState<any>(null);

  // Local state for content tags to enable real-time updates
  const [localContentTags, setLocalContentTags] = useState<string[]>(
    selectedTask.ModularWorkflow?.contentTags || []
  );

  // Determine if user should have view-only access
  const isViewOnly = !session?.user?.role ||
    (session.user.role !== 'ADMIN' && !isUserInTeam && !canEditTask(selectedTask));

  // Get workflow data
  // Cast to any to allow accessing optional fields that aren't in the strict type
  const workflowData = selectedTask.ModularWorkflow as any;
  const hasWorkflow = !!workflowData;

  // Get OFTV task data (only from database, no parsing)
  const oftvTaskData = (selectedTask as any).oftvTask;
  const isOFTVTeam = selectedTask.podTeam?.name === "OFTV";
  const hasOFTVTask = !!oftvTaskData && isOFTVTeam;

  console.log('🎯 EnhancedTaskDetailModal Render:', {
    hasOFTVTask,
    oftvTaskData,
    videoEditorUser: oftvTaskData?.videoEditorUser,
    thumbnailEditorUser: oftvTaskData?.thumbnailEditorUser,
    selectedTaskId: selectedTask.id,
    isOFTVTeam,
    podTeamName: selectedTask.podTeam?.name,
    fullSelectedTask: selectedTask
  });

  // Helper to find user by email
  const findUserByEmail = (email: string | null) => {
    if (!email) return null;
    return teamMembers.find(m => m.email === email) || teamAdmins.find(a => a.email === email);
  };

  // Initialize OFTV editing data when edit mode starts
  React.useEffect(() => {
    if (isEditingTask && hasOFTVTask && !editingOFTVData) {
      setEditingOFTVData({
        model: oftvTaskData.model || '',
        folderLink: oftvTaskData.folderLink || '',
        videoDescription: oftvTaskData.videoDescription || '',
        videoEditor: oftvTaskData.videoEditorUser?.email || '',
        videoEditorUserId: oftvTaskData.videoEditorUserId || '',
        videoEditorStatus: oftvTaskData.videoEditorStatus || 'NOT_STARTED',
        thumbnailEditor: oftvTaskData.thumbnailEditorUser?.email || '',
        thumbnailEditorUserId: oftvTaskData.thumbnailEditorUserId || '',
        thumbnailEditorStatus: oftvTaskData.thumbnailEditorStatus || 'NOT_STARTED',
        specialInstructions: oftvTaskData.specialInstructions || '',
      });
    } else if (!isEditingTask) {
      setEditingOFTVData(null);
    }
  }, [isEditingTask, hasOFTVTask, oftvTaskData, editingOFTVData]);

  // Wrap the save function to handle OFTV data
  const handleSaveWithOFTV = async () => {
    // Save OFTV data if it exists
    if (hasOFTVTask && editingOFTVData && oftvTaskData?.id) {
      try {
        // Delegate to Board so it can invalidate queries
        if (onUpdateOFTVTask) {
          await onUpdateOFTVTask(selectedTask.id, { ...editingOFTVData, id: oftvTaskData.id });
        }
      } catch (error) {
        console.error('Error updating OFTV task via store:', error);
        alert('Failed to update OFTV task. Please try again.');
        return; // Don't proceed with regular save if OFTV save fails
      }
    }

    // Call the regular save function
    if (onSaveChanges) {
      await onSaveChanges();
    }
  };

  // Handle OFTV status updates (for dropdown changes in view mode)
  const handleOFTVStatusUpdate = async (field: 'videoEditorStatus' | 'thumbnailEditorStatus', newStatus: string) => {
    if (!oftvTaskData?.id) return;
    try {
      if (onUpdateOFTVTask) {
        await onUpdateOFTVTask(selectedTask.id, { [field]: newStatus, id: oftvTaskData.id });
      }
    } catch (error) {
      console.error('❌ Error updating OFTV status via store:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-[10000] overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-6xl border border-white/20 dark:border-gray-700/50 my-4 sm:my-8 min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusConfig(selectedTask.status).bgColor.split(" ")[0] || "bg-gray-500"}`}
                ></div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                  Task •{" "}
                  {selectedTask.podTeam?.projectPrefix && selectedTask.taskNumber ? (
                    <span className="font-mono">{selectedTask.podTeam.projectPrefix}-{selectedTask.taskNumber}</span>
                  ) : (
                    getStatusConfig(selectedTask.status).label ||
                    selectedTask.status
                  )}
                </span>
              </div>
              {isEditingTask ? (
                <input
                  type="text"
                  value={editingTaskData.title || ""}
                  onChange={(e) =>
                    onSetEditingTaskData?.({ title: e.target.value })
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
                    <History className="h-4 w-4" />
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
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <span className="hidden sm:inline">Cancel</span>
                    <span className="sm:hidden">✕</span>
                  </button>
                  <button
                    onClick={handleSaveWithOFTV}
                    disabled={isSaving}
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
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
        <div className="flex flex-col lg:flex-row min-h-0 min-w-0">
          {/* Main Content - Mobile Responsive */}
          <div className="flex-1 min-w-0 p-4 sm:p-8 order-2 lg:order-1">
            {isEditingTask ? (
              <div className="space-y-6">
                {/* Edit Description - Hide for OFTV tasks */}
                {!hasOFTVTask && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Description
                    </label>
                    <textarea
                      value={editingTaskData.description || ""}
                      onChange={(e) =>
                        onSetEditingTaskData?.({ description: e.target.value })
                      }
                      rows={4}
                      placeholder="Add a description..."
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>
                )}

                {/* OFTV Task Fields in Edit Mode */}
                {hasOFTVTask && (
                  <div className="space-y-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                        OFTV Task Fields
                      </h4>
                    </div>

                    {/* Folder Link */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Folder Link
                      </label>
                      <input
                        type="url"
                        value={editingOFTVData?.folderLink || ''}
                        onChange={(e) => setEditingOFTVData({ ...editingOFTVData, folderLink: e.target.value })}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Video Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Video Description
                      </label>
                      <textarea
                        value={editingOFTVData?.videoDescription || ''}
                        onChange={(e) => setEditingOFTVData({ ...editingOFTVData, videoDescription: e.target.value })}
                        rows={3}
                        placeholder="Brief description of the video content..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Special Instructions
                      </label>
                      <textarea
                        value={editingOFTVData?.specialInstructions || ''}
                        onChange={(e) => setEditingOFTVData({ ...editingOFTVData, specialInstructions: e.target.value })}
                        rows={4}
                        placeholder="Add any special instructions or notes..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Attachments
                  </label>
                  <FileUpload
                    attachments={editingTaskData.attachments || []}
                    onAttachmentsChange={(attachments) => {
                      onSetEditingTaskData?.({ attachments });
                      onAutoSaveAttachments?.(attachments);
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
                        onSetEditingTaskData?.({
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
                            onSetEditingTaskData?.({ dueDate: "" });
                          } else {
                            const today = toLocalDateTimeString(utcNow()).split("T")[0];
                            onSetEditingTaskData?.({ dueDate: today });
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
                          onSetEditingTaskData?.({ dueDate: e.target.value })
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

                {/* Edit Assignee - Hide for OFTV tasks */}
                {!hasOFTVTask && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Assignee
                    </label>
                    <UserDropdown
                      value={editingTaskData.assignedTo || ""}
                      onChange={(email) =>
                        onSetEditingTaskData?.({ assignedTo: email })
                      }
                      placeholder="Search and select team member..."
                      className=""
                      teamId={selectedTask.podTeamId || undefined}
                    />
                  </div>
                )}

                {/* PGT Team Fields - Only show if task has ModularWorkflow */}
                {hasWorkflow && (
                  <>
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                        PGT Team Fields
                      </h4>
                    </div>

                    {/* Caption */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Caption
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Content caption for posts)</span>
                      </label>
                      <textarea
                        value={(editingTaskData as any).ModularWorkflow?.caption || ""}
                        onChange={(e) =>
                          onSetEditingTaskData?.({
                            ModularWorkflow: {
                              ...((editingTaskData as any).ModularWorkflow || {}),
                              caption: e.target.value
                            }
                          })
                        }
                        rows={4}
                        placeholder="Write the caption for this content..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Flyer Team Fields - Only show if task has ModularWorkflow */}
                {hasWorkflow && (
                  <>
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                        Flyer Team Fields
                      </h4>
                    </div>

                    {/* GIF URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        GIF URL
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(External link to promotional GIF or media)</span>
                      </label>
                      <input
                        type="url"
                        value={(editingTaskData as any).ModularWorkflow?.gifUrl || ""}
                        onChange={(e) =>
                          onSetEditingTaskData?.({
                            ModularWorkflow: {
                              ...((editingTaskData as any).ModularWorkflow || {}),
                              gifUrl: e.target.value
                            }
                          })
                        }
                        placeholder="https://giphy.com/... or https://i.imgur.com/..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Notes
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Optional, for context)</span>
                      </label>
                      <textarea
                        value={(editingTaskData as any).ModularWorkflow?.notes || ""}
                        onChange={(e) =>
                          onSetEditingTaskData?.({
                            ModularWorkflow: {
                              ...((editingTaskData as any).ModularWorkflow || {}),
                              notes: e.target.value
                            }
                          })
                        }
                        rows={3}
                        placeholder="Add any additional notes or context..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>
                  </>
                )}

                {/* QA Team Fields - Only show if task has ModularWorkflow */}
                {hasWorkflow && (
                  <>
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                        QA Team Fields
                      </h4>
                    </div>

                    {/* Pricing */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Pricing
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Final price or range for this content)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                          $
                        </span>
                        <input
                          type="text"
                          value={(editingTaskData as any).ModularWorkflow?.pricing || ""}
                          onChange={(e) => {
                            // Allow numbers, dash, and spaces for ranges like "25-40" or "25"
                            const value = e.target.value.replace(/[^0-9\-\s]/g, '');
                            onSetEditingTaskData?.({
                              ModularWorkflow: {
                                ...((editingTaskData as any).ModularWorkflow || {}),
                                pricing: value
                              }
                            });
                          }}
                          placeholder="32 or 25-40"
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Base Price Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Pricing Details
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Explain tiers, bundles, or special offers)</span>
                      </label>
                      <textarea
                        value={(editingTaskData as any).ModularWorkflow?.basePriceDescription || ""}
                        onChange={(e) =>
                          onSetEditingTaskData?.({
                            ModularWorkflow: {
                              ...((editingTaskData as any).ModularWorkflow || {}),
                              basePriceDescription: e.target.value
                            }
                          })
                        }
                        rows={3}
                        placeholder="e.g., Basic tier at $25, Premium at $40 includes extra content..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-8 min-w-0">
                {/* OFTV Task Details OR Description */}
                {hasOFTVTask ? (
                  <div className="min-w-0 space-y-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      OFTV Task Details
                    </h4>

                    {/* Folder Link */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Folder Link
                      </label>
                      {isEditingTask ? (
                        <input
                          type="url"
                          value={editingOFTVData?.folderLink || ''}
                          onChange={(e) => setEditingOFTVData({ ...editingOFTVData, folderLink: e.target.value })}
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                      ) : oftvTaskData?.folderLink ? (
                        <a
                          href={oftvTaskData.folderLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                          {oftvTaskData.folderLink}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">No folder link</span>
                      )}
                    </div>

                    {/* Video Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Video Description
                      </label>
                      {isEditingTask ? (
                        <textarea
                          value={editingOFTVData?.videoDescription || ''}
                          onChange={(e) => setEditingOFTVData({ ...editingOFTVData, videoDescription: e.target.value })}
                          rows={3}
                          placeholder="Brief description of the video content..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                        />
                      ) : oftvTaskData?.videoDescription ? (
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {oftvTaskData.videoDescription}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">No video description</span>
                      )}
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Special Instructions
                      </label>
                      {isEditingTask ? (
                        <textarea
                          value={editingOFTVData?.specialInstructions || ''}
                          onChange={(e) => setEditingOFTVData({ ...editingOFTVData, specialInstructions: e.target.value })}
                          rows={4}
                          placeholder="Add any special instructions or notes..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                        />
                      ) : oftvTaskData?.specialInstructions ? (
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {oftvTaskData.specialInstructions}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">No special instructions</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      Description
                    </h4>
                    {selectedTask.description ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                          {linkifyText(selectedTask.description)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">
                        No description provided
                      </p>
                    )}
                  </div>
                )}

                {/* Attachments */}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    Attachments
                  </h4>
                  {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
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
          <div className="w-full lg:w-80 lg:max-w-80 lg:flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/30 border-t lg:border-t-0 lg:border-l border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 order-1 lg:order-2">
            <div className="space-y-4 sm:space-y-6 min-w-0">
              {/* Workflow Details - Integrated with other fields */}
              {hasWorkflow && (
                <>
                  {/* Content Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Content Type
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {workflowData?.submissionType || 'PTR'}
                    </div>
                  </div>

                  {/* Content Style */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Content Style
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {workflowData?.contentStyle || 'BUNDLE'}
                    </div>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Model
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {workflowData?.modelName || 'Alaya'}
                    </div>
                  </div>

                  {/* Release Date */}
                  {(workflowData?.releaseDate || workflowData?.releaseTime) && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Release Date
                      </label>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {workflowData?.releaseDate || 'Not set'}
                        {workflowData?.releaseTime && ` at ${workflowData.releaseTime}`}
                      </div>
                    </div>
                  )}

                  {/* Content Details Section */}
                  {(workflowData?.contentType || workflowData?.contentLength || workflowData?.contentCount || workflowData?.externalCreatorTags || (workflowData?.internalModelTags && workflowData.internalModelTags.length > 0)) && (
                    <>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Content Details
                        </h4>
                      </div>

                      {/* Content Type (BG/Solo/GG/etc) */}
                      {workflowData?.contentType && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Content Type
                          </label>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {workflowData.contentType}
                          </div>
                        </div>
                      )}

                      {/* Content Length */}
                      {workflowData?.contentLength && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Length
                          </label>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {workflowData.contentLength}
                          </div>
                        </div>
                      )}

                      {/* Content Count */}
                      {workflowData?.contentCount && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Count
                          </label>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {workflowData.contentCount}
                          </div>
                        </div>
                      )}

                      {/* External Creator Tags */}
                      {workflowData?.externalCreatorTags && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            External Creators
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {workflowData.externalCreatorTags.split(' ').filter((tag: string) => tag.trim()).map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Internal Model Tags */}
                      {workflowData?.internalModelTags && workflowData.internalModelTags.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Internal Models
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {workflowData.internalModelTags.map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 dark:from-pink-900/30 dark:to-purple-900/30 dark:text-purple-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* PGT Team Section */}
                  {workflowData?.caption && (
                    <>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          PGT Team
                        </h4>
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          Caption
                        </label>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {workflowData.caption}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Flyer Team Section */}
                  {(workflowData?.gifUrl || workflowData?.notes) && (
                    <>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Flyer Team
                        </h4>
                      </div>

                      {/* GIF URL */}
                      {workflowData?.gifUrl && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            GIF URL
                          </label>
                          <a
                            href={workflowData.gifUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline break-all"
                          >
                            {workflowData.gifUrl}
                          </a>
                        </div>
                      )}

                      {/* Notes */}
                      {workflowData?.notes && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Notes
                          </label>
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                            {workflowData.notes}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* QA Team Section */}
                  {(workflowData?.pricing || workflowData?.basePriceDescription || workflowData?.contentTags) && (
                    <>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          QA Team
                        </h4>
                      </div>

                      {/* Pricing */}
                      {workflowData?.pricing && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Pricing
                          </label>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {workflowData.pricing}
                          </div>
                        </div>
                      )}

                      {/* Base Price Description */}
                      {workflowData?.basePriceDescription && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Pricing Details
                          </label>
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                            {workflowData.basePriceDescription}
                          </div>
                        </div>
                      )}

                      {/* Content Tags - Editable */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          Content Tags
                        </label>
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white/50 dark:bg-gray-800/50 max-h-[240px] overflow-y-auto">
                          <div className="grid grid-cols-2 gap-2">
                            {CONTENT_TAGS.map((tag) => {
                              const isSelected = localContentTags.includes(tag);

                              return (
                                <label
                                  key={tag}
                                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-500 dark:border-purple-400'
                                      : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={async (e) => {
                                      if (!selectedTask.ModularWorkflow?.id) return;

                                      const newTags = e.target.checked
                                        ? [...localContentTags, tag]
                                        : localContentTags.filter((t: string) => t !== tag);

                                      // Update local state immediately for instant UI feedback
                                      setLocalContentTags(newTags);

                                      // Save to API in background
                                      try {
                                        const response = await fetch(`/api/modular-workflows/${selectedTask.ModularWorkflow.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ contentTags: newTags }),
                                        });

                                        if (!response.ok) {
                                          const errorData = await response.json().catch(() => ({}));
                                          const errorMsg = errorData.details
                                            ? `${errorData.error}: ${errorData.details}`
                                            : (errorData.error || 'Failed to update content tags');

                                          // Revert local state on error
                                          setLocalContentTags(localContentTags);
                                          throw new Error(errorMsg);
                                        }

                                        const updatedWorkflow = await response.json();

                                        // Update the selectedTask with new contentTags
                                        if (onUpdate) {
                                          await onUpdate(selectedTask.id, {
                                            ...selectedTask,
                                            ModularWorkflow: updatedWorkflow
                                          } as any);
                                        }
                                      } catch (error) {
                                        console.error('Error updating content tags:', error);
                                        alert(`Failed to update content tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                      }
                                    }}
                                    disabled={isViewOnly}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 select-none">
                                    {tag}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          Select all tags that apply to this content
                        </p>
                      </div>
                    </>
                  )}

                  {/* Assets & Resources Section */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Assets & Resources
                    </label>

                    {/* Google Drive Link */}
                    <button
                      onClick={() => {
                        if (workflowData?.driveLink) {
                          window.open(workflowData.driveLink, '_blank');
                        }
                      }}
                      className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open Google Drive Folder</span>
                    </button>

                    {/* Reference Attachments */}
                    {workflowData?.referenceAttachments && Array.isArray(workflowData.referenceAttachments) && workflowData.referenceAttachments.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          Reference Images ({workflowData.referenceAttachments.length})
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {workflowData.referenceAttachments.map((attachment: any, idx: number) => (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all"
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.filename || `Reference ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Status - Show at top for OFTV tasks */}
              {hasOFTVTask && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Status
                  </label>
                  {canEditTask(selectedTask) ? (
                    <select
                      value={selectedTask.status}
                      onChange={(e) => {
                        if (onUpdateTaskStatus) {
                          onUpdateTaskStatus(e.target.value as Task["status"]);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    >
                      {getColumnConfig && getColumnConfig().map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {getColumnConfig 
                        ? getColumnConfig().find(([status]) => status === selectedTask.status)?.[1]?.label || selectedTask.status
                        : getStatusConfig(selectedTask.status as any).label || selectedTask.status
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Model - OFTV Tasks Only */}
              {hasOFTVTask && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Model
                  </label>
                  {isEditingTask ? (
                    <input
                      type="text"
                      value={editingOFTVData?.model || ''}
                      onChange={(e) => setEditingOFTVData({ ...editingOFTVData, model: e.target.value })}
                      placeholder="Model name"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {oftvTaskData?.model || 'Not set'}
                    </div>
                  )}
                </div>
              )}

              {/* Video Editor - OFTV Tasks Only */}
              {hasOFTVTask && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Video Editor
                  </label>
                  <div className="space-y-2">
                    {/* User Display/Editor */}
                    {isEditingTask ? (
                      <UserDropdown
                        value={editingOFTVData?.videoEditor || ''}
                        onChange={(userId, email) => setEditingOFTVData({ ...editingOFTVData, videoEditor: email, videoEditorUserId: userId })}
                        placeholder="Select video editor..."
                        teamId={selectedTask.podTeamId || undefined}
                      />
                    ) : (
                      oftvTaskData?.videoEditorUser ? (
                        <div className="flex items-center space-x-3 min-w-0">
                          <UserProfile
                            user={oftvTaskData.videoEditorUser}
                            size="md"
                            showTooltip
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {oftvTaskData.videoEditorUser.name || oftvTaskData.videoEditorUser.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {oftvTaskData.videoEditorUser.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic truncate">Unassigned</p>
                      )
                    )}
                    
                    {/* Status Dropdown - Always editable */}
                    <select
                      value={isEditingTask ? (editingOFTVData?.videoEditorStatus || 'NOT_STARTED') : oftvTaskData?.videoEditorStatus}
                      onChange={(e) => {
                        if (isEditingTask) {
                          setEditingOFTVData({ ...editingOFTVData, videoEditorStatus: e.target.value });
                        } else {
                          handleOFTVStatusUpdate('videoEditorStatus', e.target.value);
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isEditingTask 
                          ? 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          : getOFTVStatusConfig(oftvTaskData?.videoEditorStatus || 'NOT_STARTED').color
                      }`}
                    >
                      {oftvStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Thumbnail Editor - OFTV Tasks Only */}
              {hasOFTVTask && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Thumbnail Editor
                  </label>
                  <div className="space-y-2">
                    {/* User Display/Editor */}
                    {isEditingTask ? (
                      <UserDropdown
                        value={editingOFTVData?.thumbnailEditor || ''}
                        onChange={(userId, email) => setEditingOFTVData({ ...editingOFTVData, thumbnailEditor: email, thumbnailEditorUserId: userId })}
                        placeholder="Select thumbnail editor..."
                        teamId={selectedTask.podTeamId || undefined}
                      />
                    ) : (
                      oftvTaskData?.thumbnailEditorUser ? (
                        <div className="flex items-center space-x-3 min-w-0">
                          <UserProfile
                            user={oftvTaskData.thumbnailEditorUser}
                            size="md"
                            showTooltip
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {oftvTaskData.thumbnailEditorUser.name || oftvTaskData.thumbnailEditorUser.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {oftvTaskData.thumbnailEditorUser.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic truncate">Unassigned</p>
                      )
                    )}
                    
                    {/* Status Dropdown - Always editable */}
                    <select
                      value={isEditingTask ? (editingOFTVData?.thumbnailEditorStatus || 'NOT_STARTED') : oftvTaskData?.thumbnailEditorStatus}
                      onChange={(e) => {
                        if (isEditingTask) {
                          setEditingOFTVData({ ...editingOFTVData, thumbnailEditorStatus: e.target.value });
                        } else {
                          handleOFTVStatusUpdate('thumbnailEditorStatus', e.target.value);
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isEditingTask 
                          ? 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          : getOFTVStatusConfig(oftvTaskData?.thumbnailEditorStatus || 'NOT_STARTED').color
                      }`}
                    >
                      {oftvStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Date Assigned - OFTV Tasks Only */}
              {hasOFTVTask && oftvTaskData?.dateAssigned && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Date Assigned
                  </label>
                  <div className="flex items-center space-x-2 min-w-0">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {new Date(oftvTaskData.dateAssigned).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Date Completed - OFTV Tasks Only */}
              {hasOFTVTask && oftvTaskData?.dateCompleted && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Date Completed
                  </label>
                  <div className="flex items-center space-x-2 min-w-0">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-green-600 dark:text-green-400 truncate">
                      {new Date(oftvTaskData.dateCompleted).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Status - For non-OFTV tasks */}
              {!hasOFTVTask && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Status
                  </label>
                  {canEditTask(selectedTask) ? (
                    <select
                      value={selectedTask.status}
                      onChange={(e) => {
                        if (onUpdateTaskStatus) {
                          onUpdateTaskStatus(e.target.value as Task["status"]);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    >
                      {getColumnConfig && getColumnConfig().map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {getColumnConfig 
                        ? getColumnConfig().find(([status]) => status === selectedTask.status)?.[1]?.label || selectedTask.status
                        : getStatusConfig(selectedTask.status as any).label || selectedTask.status
                      }
                    </div>
                  )}
                </div>
              )}

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

              {/* Assignee - Hidden for OFTV tasks */}
              {!hasOFTVTask && (
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
              )}

              {/* Due Date */}
              {selectedTask.dueDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Due Date
                  </label>
                  <div className="flex items-center space-x-2 min-w-0">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className={`text-sm truncate ${formatDueDate(selectedTask.dueDate).className}`}>
                      {formatDueDate(selectedTask.dueDate).formatted}
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
                      {formatForTaskDetail(selectedTask.createdAt)}
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
                    {formatForTaskDetail(selectedTask.updatedAt)}
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