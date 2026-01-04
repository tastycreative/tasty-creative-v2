"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Session } from "next-auth";
import {
  X,
  Edit3,
  Calendar,
  Clock,
  Loader2,
  History,
  MessageCircle,
  Paperclip,
  Activity,
  ExternalLink,
  Info,
  FileText,
  Sparkles,
  Users,
  Image as ImageIcon,
  CheckCircle,
  Video,
  Package,
  Save,
  XCircle,
  DollarSign,
  Settings,
} from "lucide-react";
import { Task, useBoardStore } from "@/lib/stores/boardStore";
import {
  formatForTaskDetail,
  formatDueDate,
  toLocalDateTimeString,
  utcNow,
} from "@/lib/dateUtils";
import UserDropdown from "@/components/UserDropdown";
import FileUpload from "@/components/ui/FileUpload";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import TaskCardHistory from "./TaskCardHistory";
import TaskComments from "./TaskComments";
import UserProfile from "@/components/ui/UserProfile";
import { getStatusConfig } from "@/lib/config/boardConfig";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  {
    value: "NOT_STARTED",
    label: "Not Started",
    color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  },
  {
    value: "NEEDS_REVISION",
    label: "Needs Revision",
    color:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  },
  {
    value: "APPROVED",
    label: "Approved",
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  },
  {
    value: "HOLD",
    label: "Hold",
    color:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
  },
  {
    value: "WAITING_FOR_VO",
    label: "Waiting for VO",
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
  },
  {
    value: "SENT",
    label: "Sent",
    color:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
  },
  {
    value: "PUBLISHED",
    label: "Published",
    color:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
  },
];

// Helper function to get OFTV status config
const getOFTVStatusConfig = (status: string) => {
  return (
    oftvStatusOptions.find((opt) => opt.value === status) ||
    oftvStatusOptions[0]
  );
};

interface EnhancedTaskDetailModalProps {
  selectedTask: Task;
  isEditingTask?: boolean;
  editingTaskData?: Partial<Task>;
  session: Session | null;
  canEditTask: (task: Task) => boolean;
  isUserInTeam?: boolean;
  teamMembers?: Array<{ id: string; email: string; name?: string }>;
  teamAdmins?: Array<{ id: string; email: string; name?: string }>;
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

export default function EnhancedTaskDetailModalRedesigned({
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
  const [activeTab, setActiveTab] = useState("details");

  // OFTV task editing state
  const [editingOFTVData, setEditingOFTVData] = useState<any>(null);

  // Content type options state for editing
  const [contentTypeOptions, setContentTypeOptions] = useState<
    Array<{
      id: string;
      value: string;
      label: string;
      category: string;
      priceType?: string;
      priceFixed?: number;
      priceMin?: number;
      priceMax?: number;
      description?: string;
    }>
  >([]);
  const [loadingContentTypes, setLoadingContentTypes] = useState(false);

  // Determine if user should have view-only access
  const isViewOnly =
    !session?.user?.role ||
    (session.user.role !== "ADMIN" &&
      !isUserInTeam &&
      !canEditTask(selectedTask));

  // Get workflow data
  const workflowData = selectedTask.ModularWorkflow as any;
  const hasWorkflow = !!workflowData;

  // Get OFTV task data
  const oftvTaskData = (selectedTask as any).oftvTask;
  const isOFTVTeam = selectedTask.podTeam?.name === "OFTV";
  const hasOFTVTask = !!oftvTaskData && isOFTVTeam;

  // Determine which workflow accordions should be open by default
  const getWorkflowDefaultValues = () => {
    const defaults: string[] = [];

    // Content Details - always open if there's workflow data
    if (
      workflowData?.contentType ||
      workflowData?.contentLength ||
      workflowData?.contentCount
    ) {
      defaults.push("content-details");
    }

    // PGT Team - open if caption exists
    if (workflowData?.caption) {
      defaults.push("pgt-team");
    }

    // Flyer Team - open if gifUrl or notes exist
    if (workflowData?.gifUrl || workflowData?.notes) {
      defaults.push("flyer-team");
    }

    // QA Team - open if pricing or qaTeamNotes exist
    if (workflowData?.pricing || workflowData?.qaTeamNotes) {
      defaults.push("qa-team");
    }

    // Assets - open if images or driveLink exist
    if (workflowData?.images?.length > 0 || workflowData?.driveLink) {
      defaults.push("assets");
    }

    return defaults;
  };

  // Fetch content type options when editing starts
  useEffect(() => {
    const fetchContentTypeOptions = async () => {
      if (!isEditingTask || !hasWorkflow) return;
      
      setLoadingContentTypes(true);
      try {
        // Get current pricing category from workflow or editing data
        const currentCategory = 
          (editingTaskData as any)?.ModularWorkflow?.pricingCategory || 
          workflowData?.pricingCategory || 
          "EXPENSIVE_PORN";
        
        const url = `/api/content-type-options?category=${encodeURIComponent(currentCategory)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.contentTypeOptions)) {
          setContentTypeOptions(data.contentTypeOptions);
        }
      } catch (error) {
        console.error("Error fetching content type options:", error);
      } finally {
        setLoadingContentTypes(false);
      }
    };

    fetchContentTypeOptions();
  }, [isEditingTask, hasWorkflow, (editingTaskData as any)?.ModularWorkflow?.pricingCategory]);

  // Initialize OFTV editing data when edit mode starts
  React.useEffect(() => {
    if (isEditingTask && hasOFTVTask && !editingOFTVData) {
      setEditingOFTVData({
        model: oftvTaskData.model || "",
        folderLink: oftvTaskData.folderLink || "",
        videoDescription: oftvTaskData.videoDescription || "",
        videoEditor: oftvTaskData.videoEditorUser?.email || "",
        videoEditorUserId: oftvTaskData.videoEditorUserId || "",
        videoEditorStatus: oftvTaskData.videoEditorStatus || "NOT_STARTED",
        thumbnailEditor: oftvTaskData.thumbnailEditorUser?.email || "",
        thumbnailEditorUserId: oftvTaskData.thumbnailEditorUserId || "",
        thumbnailEditorStatus:
          oftvTaskData.thumbnailEditorStatus || "NOT_STARTED",
        specialInstructions: oftvTaskData.specialInstructions || "",
      });
    } else if (!isEditingTask) {
      setEditingOFTVData(null);
    }
  }, [isEditingTask, hasOFTVTask, oftvTaskData, editingOFTVData]);

  // Wrap the save function to handle OFTV data
  const handleSaveWithOFTV = async () => {
    if (hasOFTVTask && editingOFTVData && oftvTaskData?.id) {
      try {
        if (onUpdateOFTVTask) {
          await onUpdateOFTVTask(selectedTask.id, {
            ...editingOFTVData,
            id: oftvTaskData.id,
          });
        }
      } catch (error) {
        console.error("Error updating OFTV task:", error);
        alert("Failed to update OFTV task. Please try again.");
        return;
      }
    }
    if (onSaveChanges) {
      await onSaveChanges();
    }
  };

  // Handle OFTV status updates
  const handleOFTVStatusUpdate = async (
    field: "videoEditorStatus" | "thumbnailEditorStatus",
    newStatus: string
  ) => {
    if (!oftvTaskData?.id) return;
    try {
      if (onUpdateOFTVTask) {
        await onUpdateOFTVTask(selectedTask.id, {
          [field]: newStatus,
          id: oftvTaskData.id,
        });
      }
    } catch (error) {
      console.error("❌ Error updating OFTV status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-[10000] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 rounded-xl shadow-2xl w-full max-w-7xl border border-white/20 dark:border-gray-700/50 my-4 sm:my-8 min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-700/50 rounded-t-xl">
          <div className="px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      getStatusConfig(selectedTask.status).bgColor.split(
                        " "
                      )[0] || "bg-gray-500"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Task
                    </span>
                    {selectedTask.podTeam?.projectPrefix &&
                      selectedTask.taskNumber && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {selectedTask.podTeam.projectPrefix}-
                          {selectedTask.taskNumber}
                        </Badge>
                      )}
                    <Badge
                      className={cn(
                        getStatusConfig(selectedTask.status).bgColor
                      )}
                    >
                      {getStatusConfig(selectedTask.status).label ||
                        selectedTask.status}
                    </Badge>
                  </div>
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
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-gray-300 dark:via-pink-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent leading-tight pr-4">
                    {selectedTask.title}
                  </h3>
                )}
              </div>

              <div className="flex items-center gap-2 ml-2 sm:ml-6 flex-shrink-0">
                {!isEditingTask ? (
                  <>
                    {canEditTask(selectedTask) && (
                      <button
                        onClick={onStartEditing}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-xl"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}
                    {isViewOnly && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200"
                      >
                        <span className="hidden sm:inline">🔒 View Only</span>
                        <span className="sm:hidden">🔒</span>
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={onCancelEditing}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveWithOFTV}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {isSaving ? "Saving..." : "Save"}
                      </span>
                    </button>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start px-4 sm:px-8 pb-0 bg-transparent border-none rounded-none h-auto">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-50 dark:data-[state=active]:from-blue-900/20 dark:data-[state=active]:to-indigo-900/20"
              >
                <Info className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              {hasWorkflow && (
                <TabsTrigger
                  value="workflow"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-50 data-[state=active]:to-pink-50 dark:data-[state=active]:from-purple-900/20 dark:data-[state=active]:to-pink-900/20"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Workflow
                </TabsTrigger>
              )}
              {hasOFTVTask && (
                <TabsTrigger
                  value="oftv"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-50 data-[state=active]:to-amber-50 dark:data-[state=active]:from-orange-900/20 dark:data-[state=active]:to-amber-900/20"
                >
                  <Video className="h-4 w-4 mr-2" />
                  OFTV
                </TabsTrigger>
              )}
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-50 data-[state=active]:to-slate-50 dark:data-[state=active]:from-gray-800/20 dark:data-[state=active]:to-slate-800/20"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-50 dark:data-[state=active]:from-green-900/20 dark:data-[state=active]:to-emerald-900/20"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Comments
              </TabsTrigger>
            </TabsList>

            {/* Main Content with Sidebar */}
            <div className="flex flex-col lg:flex-row min-h-[60vh] max-h-[calc(95vh-200px)]">
              {/* Main Content Area */}
              <div className="flex-1 min-w-0 order-2 lg:order-1">
                <ScrollArea className="h-full">
                  <div className="p-4 sm:p-8">
                    {/* Details Tab */}
                    <TabsContent value="details" className="mt-0">
                      <Accordion
                        type="multiple"
                        defaultValue={[
                          "basic",
                          "description",
                          "attachments",
                          "metadata",
                        ]}
                        className="space-y-4"
                      >
                        {/* Basic Information */}
                        <AccordionItem
                          value="basic"
                          className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-300 dark:border-blue-700 rounded-xl overflow-visible"
                        >
                          <AccordionTrigger className="px-5 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Basic Information
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-5">
                            <div className="space-y-4">
                              {!hasOFTVTask && isEditingTask && (
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                  </label>
                                  <textarea
                                    value={editingTaskData.description || ""}
                                    onChange={(e) =>
                                      onSetEditingTaskData?.({
                                        description: e.target.value,
                                      })
                                    }
                                    rows={4}
                                    placeholder="Add a description..."
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                  />
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Priority */}
                                {isEditingTask ? (
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                      Priority
                                    </label>
                                    <select
                                      value={
                                        editingTaskData.priority || "MEDIUM"
                                      }
                                      onChange={(e) =>
                                        onSetEditingTaskData?.({
                                          priority: e.target
                                            .value as Task["priority"],
                                        })
                                      }
                                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50"
                                    >
                                      <option value="LOW">🟢 Low</option>
                                      <option value="MEDIUM">🟡 Medium</option>
                                      <option value="HIGH">🔴 High</option>
                                      <option value="URGENT">🚨 Urgent</option>
                                    </select>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Priority
                                    </label>
                                    <div className="flex items-center gap-2">
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
                                )}

                                {/* Due Date */}
                                {isEditingTask ? (
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Due Date
                                      </label>
                                      <input
                                        type="checkbox"
                                        checked={!!editingTaskData.dueDate}
                                        onChange={(e) => {
                                          if (!e.target.checked) {
                                            onSetEditingTaskData?.({
                                              dueDate: "",
                                            });
                                          } else {
                                            const today =
                                              toLocalDateTimeString(
                                                utcNow()
                                              ).split("T")[0];
                                            onSetEditingTaskData?.({
                                              dueDate: today,
                                            });
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600"
                                      />
                                    </div>
                                    {editingTaskData.dueDate && (
                                      <input
                                        type="date"
                                        value={editingTaskData.dueDate || ""}
                                        onChange={(e) =>
                                          onSetEditingTaskData?.({
                                            dueDate: e.target.value,
                                          })
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50"
                                      />
                                    )}
                                  </div>
                                ) : selectedTask.dueDate ? (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Due Date
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-gray-500" />
                                      <span
                                        className={cn(
                                          "text-sm",
                                          formatDueDate(selectedTask.dueDate)
                                            .className
                                        )}
                                      >
                                        {
                                          formatDueDate(selectedTask.dueDate)
                                            .formatted
                                        }
                                      </span>
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* Assignee - Hide for OFTV tasks */}
                              {!hasOFTVTask && (
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Assignee
                                  </label>
                                  {isEditingTask ? (
                                    <UserDropdown
                                      value={editingTaskData.assignedTo || ""}
                                      onChange={(email) =>
                                        onSetEditingTaskData?.({
                                          assignedTo: email,
                                        })
                                      }
                                      placeholder="Search and select team member..."
                                      teamId={
                                        selectedTask.podTeamId || undefined
                                      }
                                    />
                                  ) : selectedTask.assignedUser ? (
                                    <div className="flex items-center gap-3">
                                      <UserProfile
                                        user={selectedTask.assignedUser}
                                        size="md"
                                        showTooltip
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {selectedTask.assignedUser.name ||
                                            selectedTask.assignedUser.email}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {selectedTask.assignedUser.email}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">
                                      Unassigned
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Description - For non-OFTV tasks or view mode */}
                        {!hasOFTVTask && !isEditingTask && (
                          <AccordionItem
                            value="description"
                            className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-300 dark:border-purple-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Description
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                {selectedTask.description ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                                      {linkifyText(selectedTask.description)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-gray-400 dark:text-gray-500 italic">
                                    No description provided
                                  </p>
                                )}

                                {/* Content Type & Pricing Info */}
                                {hasWorkflow && workflowData?.contentTypeOption && (
                                  <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Content Type
                                      </p>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                        {workflowData.contentTypeOption.label || workflowData.contentTypeOption.value}
                                      </p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Pricing
                                      </p>
                                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        {workflowData.contentTypeOption.priceType === 'FIXED' && workflowData.contentTypeOption.priceFixed &&
                                          `$${workflowData.contentTypeOption.priceFixed.toFixed(2)}`}
                                        {workflowData.contentTypeOption.priceType === 'RANGE' && workflowData.contentTypeOption.priceMin && workflowData.contentTypeOption.priceMax &&
                                          `$${workflowData.contentTypeOption.priceMin.toFixed(2)}-$${workflowData.contentTypeOption.priceMax.toFixed(2)}`}
                                        {workflowData.contentTypeOption.priceType === 'MINIMUM' && workflowData.contentTypeOption.priceMin &&
                                          `$${workflowData.contentTypeOption.priceMin.toFixed(2)}+`}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Attachments */}
                        <AccordionItem
                          value="attachments"
                          className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300 dark:border-green-700 rounded-xl overflow-hidden"
                        >
                          <AccordionTrigger className="px-5 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                <Paperclip className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Attachments
                              </span>
                              {selectedTask.attachments &&
                                selectedTask.attachments.length > 0 && (
                                  <Badge variant="outline">
                                    {selectedTask.attachments.length}
                                  </Badge>
                                )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-5">
                            {isEditingTask ? (
                              <FileUpload
                                attachments={editingTaskData.attachments || []}
                                onAttachmentsChange={(attachments) => {
                                  onSetEditingTaskData?.({ attachments });
                                  onAutoSaveAttachments?.(attachments);
                                }}
                                maxFiles={5}
                                maxFileSize={10}
                              />
                            ) : selectedTask.attachments &&
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
                          </AccordionContent>
                        </AccordionItem>

                        {/* Metadata */}
                        <AccordionItem
                          value="metadata"
                          className="bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/20 dark:to-slate-800/20 border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden"
                        >
                          <AccordionTrigger className="px-5 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Metadata
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                  Created
                                </label>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {formatForTaskDetail(
                                        selectedTask.createdAt
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <UserProfile
                                      user={selectedTask.createdBy}
                                      size="sm"
                                      showTooltip
                                    />
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {selectedTask.createdBy.name ||
                                        selectedTask.createdBy.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                  Last Updated
                                </label>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatForTaskDetail(
                                      selectedTask.updatedAt
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>

                    {/* Workflow Tab */}
                    {hasWorkflow && (
                      <TabsContent value="workflow" className="mt-0">
                        <Accordion
                          type="multiple"
                          defaultValue={getWorkflowDefaultValues()}
                          className="space-y-4"
                        >
                          {/* Content Details Accordion */}
                          <AccordionItem
                            value="content-details"
                            className="bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-300 dark:border-indigo-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Content Details
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {workflowData?.contentType && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Content Type
                                    </label>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {workflowData.contentType}
                                    </div>
                                  </div>
                                )}
                                {workflowData?.contentLength && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Length
                                    </label>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {workflowData.contentLength}
                                    </div>
                                  </div>
                                )}
                                {workflowData?.contentCount && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Count
                                    </label>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {workflowData.contentCount}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {workflowData?.externalCreatorTags && (
                                <div className="mt-4">
                                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                    External Creators
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {workflowData.externalCreatorTags
                                      .split(" ")
                                      .filter((tag: string) => tag.trim())
                                      .map((tag: string, idx: number) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              )}
                              {workflowData?.internalModelTags &&
                                workflowData.internalModelTags.length > 0 && (
                                  <div className="mt-4">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Internal Models
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {workflowData.internalModelTags.map(
                                        (tag: string, idx: number) => (
                                          <Badge
                                            key={idx}
                                            className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-purple-800 dark:text-purple-300 border-0"
                                          >
                                            {tag}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </AccordionContent>
                          </AccordionItem>

                          {/* PGT Team Accordion */}
                          <AccordionItem
                            value="pgt-team"
                            className="bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-300 dark:border-pink-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  PGT Team
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Caption
                                </label>
                                {isEditingTask ? (
                                  <textarea
                                    value={
                                      (editingTaskData as any).ModularWorkflow
                                        ?.caption || ""
                                    }
                                    onChange={(e) =>
                                      onSetEditingTaskData?.({
                                        ModularWorkflow: {
                                          ...((editingTaskData as any)
                                            .ModularWorkflow || {}),
                                          caption: e.target.value,
                                        },
                                      })
                                    }
                                    rows={4}
                                    placeholder="Write the caption for this content..."
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                                  />
                                ) : workflowData?.caption ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                                      {linkifyText(workflowData.caption)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-gray-400 dark:text-gray-500 italic">
                                    No caption provided
                                  </p>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Flyer Team Accordion */}
                          <AccordionItem
                            value="flyer-team"
                            className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-300 dark:border-orange-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <ImageIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Flyer Team
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                {/* GIF URL */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    GIF URL
                                  </label>
                                  {isEditingTask ? (
                                    <input
                                      type="url"
                                      value={
                                        (editingTaskData as any).ModularWorkflow
                                          ?.gifUrl || ""
                                      }
                                      onChange={(e) =>
                                        onSetEditingTaskData?.({
                                          ModularWorkflow: {
                                            ...((editingTaskData as any)
                                              .ModularWorkflow || {}),
                                            gifUrl: e.target.value,
                                          },
                                        })
                                      }
                                      placeholder="https://giphy.com/... or https://i.imgur.com/..."
                                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                  ) : workflowData?.gifUrl ? (
                                    <a
                                      href={workflowData.gifUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      {workflowData.gifUrl}
                                    </a>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 italic">
                                      No GIF URL provided
                                    </p>
                                  )}
                                </div>

                                {/* Notes */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Notes
                                  </label>
                                  {isEditingTask ? (
                                    <textarea
                                      value={
                                        (editingTaskData as any).ModularWorkflow
                                          ?.notes || ""
                                      }
                                      onChange={(e) =>
                                        onSetEditingTaskData?.({
                                          ModularWorkflow: {
                                            ...((editingTaskData as any)
                                              .ModularWorkflow || {}),
                                            notes: e.target.value,
                                          },
                                        })
                                      }
                                      rows={3}
                                      placeholder="Add any additional notes or context..."
                                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                                    />
                                  ) : workflowData?.notes ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                                        {linkifyText(workflowData.notes)}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 italic">
                                      No notes provided
                                    </p>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* QA Team Accordion */}
                          <AccordionItem
                            value="qa-team"
                            className="bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-300 dark:border-emerald-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  QA Team
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                {/* Pricing */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Pricing
                                  </label>
                                  {isEditingTask ? (
                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                                        $
                                      </span>
                                      <input
                                        type="text"
                                        value={
                                          (editingTaskData as any)
                                            .ModularWorkflow?.pricing || ""
                                        }
                                        onChange={(e) => {
                                          const value = e.target.value.replace(
                                            /[^0-9\-\s]/g,
                                            ""
                                          );
                                          onSetEditingTaskData?.({
                                            ModularWorkflow: {
                                              ...((editingTaskData as any)
                                                .ModularWorkflow || {}),
                                              pricing: value,
                                            },
                                          });
                                        }}
                                        placeholder="25-40 or 30"
                                        className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                      />
                                    </div>
                                  ) : workflowData?.pricing ? (
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                      ${workflowData.pricing}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 italic">
                                      No pricing set
                                    </p>
                                  )}
                                </div>

                                {/* Pricing Details */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Pricing Details
                                  </label>
                                  {isEditingTask ? (
                                    <textarea
                                      value={
                                        (editingTaskData as any).ModularWorkflow
                                          ?.basePriceDescription || ""
                                      }
                                      onChange={(e) =>
                                        onSetEditingTaskData?.({
                                          ModularWorkflow: {
                                            ...((editingTaskData as any)
                                              .ModularWorkflow || {}),
                                            basePriceDescription:
                                              e.target.value,
                                          },
                                        })
                                      }
                                      rows={3}
                                      placeholder="Explain tiers, bundles, or special offers..."
                                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                    />
                                  ) : workflowData?.basePriceDescription ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                                        {linkifyText(
                                          workflowData.basePriceDescription
                                        )}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 italic">
                                      No pricing details provided
                                    </p>
                                  )}
                                </div>

                                {/* Content Tags */}
                                {workflowData?.contentTags &&
                                  workflowData.contentTags.length > 0 && (
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Content Tags
                                      </label>
                                      <div className="flex flex-wrap gap-1.5">
                                        {workflowData.contentTags.map(
                                          (tag: string, idx: number) => (
                                            <Badge
                                              key={idx}
                                              variant="secondary"
                                              className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                                            >
                                              {tag}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Assets & Resources Accordion */}
                          <AccordionItem
                            value="assets"
                            className="bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-300 dark:border-blue-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Assets & Resources
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                {/* Google Drive Link */}
                                {workflowData?.googleDriveLink && (
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                      Google Drive
                                    </label>
                                    <a
                                      href={workflowData.googleDriveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Open Drive Folder
                                    </a>
                                  </div>
                                )}

                                {/* Reference Attachments */}
                                {workflowData?.referenceAttachments &&
                                  workflowData.referenceAttachments.length >
                                    0 && (
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Reference Attachments
                                      </label>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {workflowData.referenceAttachments.map(
                                          (attachment: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                                            >
                                              <img
                                                src={attachment.url}
                                                alt={
                                                  attachment.name ||
                                                  `Reference ${idx + 1}`
                                                }
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                              />
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </TabsContent>
                    )}

                    {/* OFTV Tab */}
                    {hasOFTVTask && (
                      <TabsContent value="oftv" className="mt-0">
                        <Accordion
                          type="multiple"
                          defaultValue={["oftv-details", "video-editor"]}
                          className="space-y-4"
                        >
                          {/* OFTV Task Details Accordion */}
                          <AccordionItem
                            value="oftv-details"
                            className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-300 dark:border-orange-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <Video className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Task Details
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                {/* Model */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Model
                                  </label>
                                  {isEditingTask && editingOFTVData ? (
                                    <input
                                      type="text"
                                      value={editingOFTVData.model || ""}
                                      onChange={(e) =>
                                        setEditingOFTVData({
                                          ...editingOFTVData,
                                          model: e.target.value,
                                        })
                                      }
                                      placeholder="Model name..."
                                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                  ) : (
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {oftvTaskData?.model || "Not set"}
                                    </div>
                                  )}
                                </div>

                                {/* Folder Link */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Folder Link
                                  </label>
                                  {isEditingTask && editingOFTVData ? (
                                    <input
                                      type="url"
                                      value={editingOFTVData.folderLink || ""}
                                      onChange={(e) =>
                                        setEditingOFTVData({
                                          ...editingOFTVData,
                                          folderLink: e.target.value,
                                        })
                                      }
                                      placeholder="https://drive.google.com/..."
                                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                  ) : oftvTaskData?.folderLink ? (
                                    <a
                                      href={oftvTaskData.folderLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Open Folder
                                    </a>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 italic">
                                      No folder link
                                    </p>
                                  )}
                                </div>

                                {/* Video Description */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Video Description
                                  </label>
                                  {isEditingTask && editingOFTVData ? (
                                    <textarea
                                      value={
                                        editingOFTVData.videoDescription || ""
                                      }
                                      onChange={(e) =>
                                        setEditingOFTVData({
                                          ...editingOFTVData,
                                          videoDescription: e.target.value,
                                        })
                                      }
                                      rows={4}
                                      placeholder="Describe the video content..."
                                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                                    />
                                  ) : oftvTaskData?.videoDescription ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                                        {linkifyText(
                                          oftvTaskData.videoDescription
                                        )}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 italic">
                                      No description provided
                                    </p>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Video Editor Accordion */}
                          <AccordionItem
                            value="video-editor"
                            className="bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 border border-red-300 dark:border-red-700 rounded-xl overflow-visible"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <Video className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Video Editor
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                {isEditingTask && editingOFTVData ? (
                                  <>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Assigned Editor
                                      </label>
                                      <UserDropdown
                                        value={
                                          editingOFTVData.videoEditor || ""
                                        }
                                        onChange={(email, userId) =>
                                          setEditingOFTVData({
                                            ...editingOFTVData,
                                            videoEditor: email,
                                            videoEditorUserId: userId || "",
                                          })
                                        }
                                        placeholder="Select video editor..."
                                        teamId={
                                          selectedTask.podTeamId || undefined
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                      </label>
                                      <select
                                        value={
                                          editingOFTVData.videoEditorStatus ||
                                          "NOT_STARTED"
                                        }
                                        onChange={(e) =>
                                          setEditingOFTVData({
                                            ...editingOFTVData,
                                            videoEditorStatus: e.target.value,
                                          })
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                      >
                                        {oftvStatusOptions.map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {oftvTaskData?.videoEditorUser && (
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                          Assigned Editor
                                        </label>
                                        <div className="flex items-center gap-3">
                                          <UserProfile
                                            user={oftvTaskData.videoEditorUser}
                                            size="md"
                                            showTooltip
                                          />
                                          <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                              {oftvTaskData.videoEditorUser
                                                .name ||
                                                oftvTaskData.videoEditorUser
                                                  .email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {
                                                oftvTaskData.videoEditorUser
                                                  .email
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                        Status
                                      </label>
                                      <select
                                        value={
                                          oftvTaskData?.videoEditorStatus ||
                                          "NOT_STARTED"
                                        }
                                        onChange={(e) =>
                                          handleOFTVStatusUpdate(
                                            "videoEditorStatus",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                      >
                                        {oftvStatusOptions.map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Thumbnail Editor Accordion */}
                          <AccordionItem
                            value="thumbnail-editor"
                            className="bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-300 dark:border-cyan-700 rounded-xl overflow-visible"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <ImageIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Thumbnail Editor
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-4">
                                {isEditingTask && editingOFTVData ? (
                                  <>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Assigned Editor
                                      </label>
                                      <UserDropdown
                                        value={
                                          editingOFTVData.thumbnailEditor || ""
                                        }
                                        onChange={(email, userId) =>
                                          setEditingOFTVData({
                                            ...editingOFTVData,
                                            thumbnailEditor: email,
                                            thumbnailEditorUserId: userId || "",
                                          })
                                        }
                                        placeholder="Select thumbnail editor..."
                                        teamId={
                                          selectedTask.podTeamId || undefined
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                      </label>
                                      <select
                                        value={
                                          editingOFTVData.thumbnailEditorStatus ||
                                          "NOT_STARTED"
                                        }
                                        onChange={(e) =>
                                          setEditingOFTVData({
                                            ...editingOFTVData,
                                            thumbnailEditorStatus:
                                              e.target.value,
                                          })
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                      >
                                        {oftvStatusOptions.map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {oftvTaskData?.thumbnailEditorUser && (
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                          Assigned Editor
                                        </label>
                                        <div className="flex items-center gap-3">
                                          <UserProfile
                                            user={
                                              oftvTaskData.thumbnailEditorUser
                                            }
                                            size="md"
                                            showTooltip
                                          />
                                          <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                              {oftvTaskData.thumbnailEditorUser
                                                .name ||
                                                oftvTaskData.thumbnailEditorUser
                                                  .email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {
                                                oftvTaskData.thumbnailEditorUser
                                                  .email
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                        Status
                                      </label>
                                      <select
                                        value={
                                          oftvTaskData?.thumbnailEditorStatus ||
                                          "NOT_STARTED"
                                        }
                                        onChange={(e) =>
                                          handleOFTVStatusUpdate(
                                            "thumbnailEditorStatus",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                      >
                                        {oftvStatusOptions.map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Special Instructions Accordion */}
                          <AccordionItem
                            value="special-instructions"
                            className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-xl overflow-hidden"
                          >
                            <AccordionTrigger className="px-5 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  Special Instructions
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              {isEditingTask && editingOFTVData ? (
                                <textarea
                                  value={
                                    editingOFTVData.specialInstructions || ""
                                  }
                                  onChange={(e) =>
                                    setEditingOFTVData({
                                      ...editingOFTVData,
                                      specialInstructions: e.target.value,
                                    })
                                  }
                                  rows={4}
                                  placeholder="Add any special instructions or notes..."
                                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                                />
                              ) : oftvTaskData?.specialInstructions ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                                    {linkifyText(
                                      oftvTaskData.specialInstructions
                                    )}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-gray-400 dark:text-gray-500 italic">
                                  No special instructions
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>

                          {/* Date Fields */}
                          {(oftvTaskData?.dateAssigned ||
                            oftvTaskData?.dateCompleted) && (
                            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {oftvTaskData?.dateAssigned && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Date Assigned
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {formatForTaskDetail(
                                          oftvTaskData.dateAssigned
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {oftvTaskData?.dateCompleted && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                      Date Completed
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {formatForTaskDetail(
                                          oftvTaskData.dateCompleted
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Accordion>
                      </TabsContent>
                    )}

                    {/* History Tab */}
                    <TabsContent value="history" className="mt-0">
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        {selectedTask.podTeamId ? (
                          <TaskCardHistory
                            taskId={selectedTask.id}
                            teamId={selectedTask.podTeamId}
                            isModal={true}
                          />
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 italic text-center py-8">
                            No history available
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Comments Tab */}
                    <TabsContent value="comments" className="mt-0">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 p-5">
                        <TaskComments
                          taskId={selectedTask.id}
                          teamId={selectedTask.podTeamId || undefined}
                          currentUser={
                            session?.user
                              ? {
                                  id: session.user.id!,
                                  name: session.user.name,
                                  email: session.user.email!,
                                  image: session.user.image,
                                }
                              : null
                          }
                          isViewOnly={isViewOnly}
                        />
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-72 lg:flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/30 border-t lg:border-t-0 lg:border-l border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 order-1 lg:order-2">
                <div className="space-y-3">
                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                      Status
                    </label>
                    {canEditTask(selectedTask) ? (
                      <select
                        value={selectedTask.status}
                        onChange={(e) =>
                          onUpdateTaskStatus?.(e.target.value as Task["status"])
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      >
                        {getColumnConfig &&
                          getColumnConfig().map(([status, config]) => (
                            <option key={status} value={status}>
                              {config.label}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getColumnConfig
                          ? getColumnConfig().find(
                              ([status]) => status === selectedTask.status
                            )?.[1]?.label || selectedTask.status
                          : getStatusConfig(selectedTask.status as any).label ||
                            selectedTask.status}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  {!isEditingTask && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                        Priority
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">
                          {selectedTask.priority === "URGENT"
                            ? "🚨"
                            : selectedTask.priority === "HIGH"
                              ? "🔴"
                              : selectedTask.priority === "MEDIUM"
                                ? "🟡"
                                : "🟢"}
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {selectedTask.priority}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Assignee - Regular Tasks Only */}
                  {!hasOFTVTask &&
                    !isEditingTask &&
                    selectedTask.assignedUser && (
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                          Assignee
                        </label>
                        <div className="flex items-center gap-2">
                          <UserProfile
                            user={selectedTask.assignedUser}
                            size="sm"
                            showTooltip
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {selectedTask.assignedUser.name ||
                                selectedTask.assignedUser.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* OFTV-specific fields */}
                  {hasOFTVTask && oftvTaskData?.model && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                        Model
                      </label>
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {oftvTaskData.model}
                      </div>
                    </div>
                  )}

                  {/* Workflow-specific fields */}
                  {hasWorkflow && (
                    <>
                      {/* Compact: Type & Style in one row */}
                      {(workflowData?.submissionType || workflowData?.contentStyle) && (
                        <div className="grid grid-cols-2 gap-2">
                          {workflowData?.submissionType && (
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                                Type
                              </label>
                              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                {workflowData.submissionType}
                              </div>
                            </div>
                          )}
                          {workflowData?.contentStyle && (
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                                Style
                              </label>
                              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                {workflowData.contentStyle}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Model Name */}
                      {workflowData?.modelName && (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                            Model
                          </label>
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                            {workflowData.modelName}
                          </div>
                        </div>
                      )}

                      {/* Release Date */}
                      {(workflowData?.releaseDate || workflowData?.releaseTime) && (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                            Release
                          </label>
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {workflowData.releaseDate || "Not set"}
                            {workflowData.releaseTime && ` ${workflowData.releaseTime}`}
                          </div>
                        </div>
                      )}

                      {/* Pricing Tier (editable when in edit mode) */}
                      {(workflowData?.pricingCategory || isEditingTask) && (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                            Tier
                          </label>
                          {isEditingTask ? (
                            <select
                              value={(editingTaskData as any)?.ModularWorkflow?.pricingCategory || workflowData?.pricingCategory || "EXPENSIVE_PORN"}
                              onChange={(e) => {
                                onSetEditingTaskData?.({
                                  ModularWorkflow: {
                                    ...((editingTaskData as any).ModularWorkflow || {}),
                                    pricingCategory: e.target.value,
                                    // Clear content type when tier changes
                                    contentTypeOptionId: null,
                                    contentTypeOption: null,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            >
                              <option value="CHEAP_PORN">Cheap Porn</option>
                              <option value="EXPENSIVE_PORN">Expensive Porn</option>
                              <option value="GF_ACCURATE">GF Accurate</option>
                            </select>
                          ) : (
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {workflowData?.pricingCategory === 'CHEAP_PORN' && 'Cheap Porn'}
                              {workflowData?.pricingCategory === 'EXPENSIVE_PORN' && 'Expensive Porn'}
                              {workflowData?.pricingCategory === 'GF_ACCURATE' && 'GF Accurate'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content Type & Pricing (editable when in edit mode) */}
                      {(workflowData?.contentTypeOption || isEditingTask) && (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                            Content & Price
                          </label>
                          {isEditingTask ? (
                            <div className="space-y-2">
                              <select
                                value={(editingTaskData as any)?.ModularWorkflow?.contentTypeOptionId || workflowData?.contentTypeOptionId || ""}
                                onChange={(e) => {
                                  const selectedOption = contentTypeOptions.find(opt => opt.id === e.target.value);
                                  onSetEditingTaskData?.({
                                    ModularWorkflow: {
                                      ...((editingTaskData as any).ModularWorkflow || {}),
                                      contentTypeOptionId: e.target.value,
                                      contentTypeOption: selectedOption || null,
                                    },
                                  });
                                }}
                                disabled={loadingContentTypes}
                                className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                              >
                                <option value="">{loadingContentTypes ? "Loading..." : "Select content type..."}</option>
                                {contentTypeOptions.map((option) => {
                                  // Format price display
                                  let priceDisplay = " - $--.--";
                                  if (option.priceType === "FIXED" && option.priceFixed) {
                                    priceDisplay = ` - $${option.priceFixed.toFixed(2)}`;
                                  } else if (option.priceType === "RANGE" && option.priceMin && option.priceMax) {
                                    priceDisplay = ` - $${option.priceMin.toFixed(2)}-${option.priceMax.toFixed(2)}`;
                                  } else if (option.priceType === "MINIMUM" && option.priceMin) {
                                    priceDisplay = ` - $${option.priceMin.toFixed(2)}+`;
                                  }
                                  return (
                                    <option key={option.id} value={option.id}>
                                      {option.label}{priceDisplay}
                                    </option>
                                  );
                                })}
                              </select>
                              {/* Show current selection price */}
                              {(() => {
                                const currentOption = (editingTaskData as any)?.ModularWorkflow?.contentTypeOption || 
                                  contentTypeOptions.find(opt => opt.id === ((editingTaskData as any)?.ModularWorkflow?.contentTypeOptionId || workflowData?.contentTypeOptionId));
                                if (currentOption) {
                                  let priceText = "$--.--";
                                  if (currentOption.priceType === 'FIXED' && currentOption.priceFixed) {
                                    priceText = `$${currentOption.priceFixed.toFixed(2)}`;
                                  } else if (currentOption.priceType === 'RANGE' && currentOption.priceMin && currentOption.priceMax) {
                                    priceText = `$${currentOption.priceMin.toFixed(2)}-$${currentOption.priceMax.toFixed(2)}`;
                                  } else if (currentOption.priceType === 'MINIMUM' && currentOption.priceMin) {
                                    priceText = `$${currentOption.priceMin.toFixed(2)}+`;
                                  }
                                  return (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3 text-emerald-600" />
                                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        {priceText}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          ) : workflowData?.contentTypeOption ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {workflowData.contentTypeOption.label || workflowData.contentTypeOption.value}
                              </span>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded whitespace-nowrap">
                                {workflowData.contentTypeOption.priceType === 'FIXED' && workflowData.contentTypeOption.priceFixed
                                  ? `$${workflowData.contentTypeOption.priceFixed.toFixed(2)}`
                                  : workflowData.contentTypeOption.priceType === 'RANGE' && workflowData.contentTypeOption.priceMin && workflowData.contentTypeOption.priceMax
                                  ? `$${workflowData.contentTypeOption.priceMin.toFixed(2)}-$${workflowData.contentTypeOption.priceMax.toFixed(2)}`
                                  : workflowData.contentTypeOption.priceType === 'MINIMUM' && workflowData.contentTypeOption.priceMin
                                  ? `$${workflowData.contentTypeOption.priceMin.toFixed(2)}+`
                                  : '$--.--'}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic">Not set</div>
                          )}
                          {/* Settings hint link */}
                          <Link
                            href="/settings"
                            className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline mt-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Settings className="h-3 w-3" />
                            <span>Manage content types</span>
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  {/* Due Date */}
                  {!isEditingTask && selectedTask.dueDate && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                        Due Date
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span
                          className={cn(
                            "text-xs",
                            formatDueDate(selectedTask.dueDate).className
                          )}
                        >
                          {formatDueDate(selectedTask.dueDate).formatted}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Created Info - Compact */}
                  {!isEditingTask && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                        Created
                      </label>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400">
                            {formatForTaskDetail(selectedTask.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserProfile
                            user={selectedTask.createdBy}
                            size="sm"
                            showTooltip
                          />
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {selectedTask.createdBy.name ||
                              selectedTask.createdBy.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Updated Info - Compact */}
                  {!isEditingTask && (
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-wide">
                        Updated
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-[10px] text-gray-600 dark:text-gray-400">
                          {formatForTaskDetail(selectedTask.updatedAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
