"use client";

import React, { useState } from "react";
import { Session } from "next-auth";
import {
  X,
  Edit3,
  Clock,
  Loader2,
  History,
  MessageCircle,
  Paperclip,
  Download,
  Eye,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Task } from "@/lib/stores/boardStore";
import TaskComments from "./TaskComments";
import TaskCardHistory from "./TaskCardHistory";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import UserProfile from "@/components/ui/UserProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          className="text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface EnhancedTaskDetailModalProps {
  selectedTask: Task;
  isEditingTask?: boolean;
  editingTaskData?: Partial<Task>;
  session: Session | null;
  canEditTask: (task: Task) => boolean;
  isUserInTeam?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => void;
  onStartEditing?: () => void;
  onCancelEditing?: () => void;
  onSaveChanges?: () => void;
  onSetEditingTaskData?: (data: Partial<Task>) => void;
  onUpdateTaskStatus?: (status: Task["status"]) => void;
  getColumnConfig?: () => Array<[string, any]>;
}

export default function EnhancedTaskDetailModal({
  selectedTask,
  isEditingTask = false,
  editingTaskData = {},
  session,
  canEditTask,
  isUserInTeam = false,
  isSaving = false,
  onClose,
  onUpdate,
  onDelete,
  onStartEditing,
  onCancelEditing,
  onSaveChanges,
  onSetEditingTaskData,
  onUpdateTaskStatus,
  getColumnConfig,
}: EnhancedTaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  if (!selectedTask) return null;

  const priorityConfig = {
    URGENT: { label: "URGENT", color: "bg-red-600 text-white", icon: "🚨" },
    HIGH: { label: "HIGH", color: "bg-orange-600 text-white", icon: "🔴" },
    MEDIUM: { label: "MEDIUM", color: "bg-yellow-600 text-white", icon: "🟡" },
    LOW: { label: "LOW", color: "bg-green-600 text-white", icon: "🟢" },
  };

  const statusOptions = getColumnConfig?.() || [];
  const currentStatus = statusOptions.find(([status]) => status === selectedTask.status);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] overflow-y-auto">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-800 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Task ID and Title */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-500">
                  TASK • {selectedTask.podTeam?.projectPrefix}-{selectedTask.taskNumber || '24'}
                </span>
              </div>
              {isEditingTask ? (
                <Input
                  type="text"
                  value={editingTaskData.title || selectedTask.title}
                  onChange={(e) => onSetEditingTaskData?.({ title: e.target.value })}
                  className="text-2xl font-bold bg-gray-800 border-gray-700 text-white"
                  placeholder="Task title..."
                />
              ) : (
                <h2 className="text-2xl font-bold text-white">
                  {selectedTask.title}
                </h2>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEditingTask ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                  {canEditTask(selectedTask) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onStartEditing}
                      className="text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelEditing}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSaveChanges}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Main Content */}
            <div className="lg:col-span-2 p-6 border-r border-gray-800">
              {/* Description Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Description
                </h3>
                {isEditingTask ? (
                  <Textarea
                    value={editingTaskData.description || selectedTask.description}
                    onChange={(e) => onSetEditingTaskData?.({ description: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-800 border-gray-700 text-gray-100"
                    placeholder="Add a description..."
                  />
                ) : (
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {selectedTask.description ? (
                      linkifyText(selectedTask.description)
                    ) : (
                      <span className="text-gray-500 italic">No description provided</span>
                    )}
                  </div>
                )}

                {/* Sample text from screenshot */}
                {!isEditingTask && selectedTask.description && (
                  <div className="mt-4 text-gray-400">
                    <p className="mb-2">sample</p>
                    <div className="text-blue-400">
                      Google Drive: <a href="#" className="underline hover:text-blue-300">
                        https://docs.google.com/spreadsheets/d/1sNtn_pl-jGPKFnEtM8-HpsstxXuKPYPe1rXU734n5AE/edit?gid=1563688054#gid=1563688054
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Attachments
                </h3>
                {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTask.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-700 rounded">
                            <Paperclip className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {attachment.name || `wallpaperflar...`}
                            </p>
                            <p className="text-xs text-gray-500">456.83 KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No attachments</p>
                )}
              </div>

              {/* Comments Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Comments
                  </h3>
                  <Badge variant="secondary" className="bg-gray-800 text-gray-400">
                    0
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-300">
                      J
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment... Use @ to mention team members and admins"
                        className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 min-h-[80px]"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          <Paperclip className="inline h-3 w-3 mr-1" />
                          Attach files (3 max, 10MB each)
                        </span>
                        <Button
                          size="sm"
                          className="bg-gray-700 hover:bg-gray-600 text-white"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="p-6 bg-gray-850 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Status
                </label>
                <Select
                  value={selectedTask.status}
                  onValueChange={(value) => onUpdateTaskStatus?.(value as Task["status"])}
                  disabled={!canEditTask(selectedTask)}
                >
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {statusOptions.map(([status, config]) => (
                      <SelectItem key={status} value={status} className="text-gray-100">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  <Badge className={priorityConfig[selectedTask.priority as keyof typeof priorityConfig]?.color || 'bg-gray-600'}>
                    {priorityConfig[selectedTask.priority as keyof typeof priorityConfig]?.icon} {selectedTask.priority}
                  </Badge>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Assignee
                </label>
                <p className="text-gray-300 text-sm">
                  {selectedTask.assignedUser?.email || 'Unassigned'}
                </p>
              </div>

              {/* Created */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Created
                </label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="h-4 w-4 text-gray-500" />
                    Sep 20, 2025, 10:09 PM
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                      K
                    </div>
                    <span className="text-sm text-gray-300">Kent John Liloc</span>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Last Updated
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Sep 20, 2025, 10:09 PM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}