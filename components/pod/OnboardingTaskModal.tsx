"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Edit3,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  DollarSign,
  Camera,
  MessageCircle,
  Eye,
  EyeOff,
  List,
} from "lucide-react";
import { Task } from "@/lib/stores/boardStore";
import { Session } from "next-auth";
import TaskComments from "./TaskComments";
import { formatForTaskDetail, formatDueDate } from "@/lib/dateUtils";
import UserProfile from "@/components/ui/UserProfile";
import { useOnboardingData, useOnboardingActions, useOnboardingUI } from "@/lib/stores/onboardingStore";

const defaultChecklist = [
  { id: 1, title: "Explain sexting scripts", description: "", completed: false },
  { id: 2, title: "Provide Google drive folders", description: "", completed: false },
  { id: 3, title: "Receive 4 sexting scripts", description: "", completed: false },
  { id: 4, title: "Edit and upload sexting scripts to vault", description: "", completed: false },
  { id: 5, title: "Set up & share Notion", description: "", completed: false },
  { id: 6, title: "Notify teams of launch date on iMessage", description: "", completed: false },
  { id: 7, title: "Fill out Client Info tab", description: "", completed: false },
  { id: 8, title: "Store passwords in client sheet", description: "", completed: false },
  { id: 9, title: "Confirm pricing with all teams", description: "", completed: false },
  { id: 10, title: "Schedule social posts for launch", description: "", completed: false },
  { id: 11, title: "Link accounts to Inflow and add team permissions", description: "", completed: false },
  { id: 12, title: "Set up telegram with model guide", description: "", completed: false },
];

const linkifyText = (text: string) => {
  // First handle markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let processedText = text;
  const markdownLinks: { text: string; url: string; placeholder: string }[] = [];
  
  // Replace markdown links with placeholders and store them
  let match;
  let counter = 0;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const placeholder = `__MARKDOWN_LINK_${counter}__`;
    markdownLinks.push({ text: match[1], url: match[2], placeholder });
    processedText = processedText.replace(match[0], placeholder);
    counter++;
  }
  
  // Then handle plain URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return processedText.split(/(__MARKDOWN_LINK_\d+__|https?:\/\/[^\s]+)/g).map((part: string, index: number) => {
    // Check if it's a markdown link placeholder
    const markdownLink = markdownLinks.find(link => link.placeholder === part);
    if (markdownLink) {
      return (
        <a key={index} href={markdownLink.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors">
          {markdownLink.text}
        </a>
      );
    }
    
    // Check if it's a plain URL
    if (urlRegex.test(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors">
          {part}
        </a>
      );
    }
    
    return part;
  });
};

const DetailSection = ({ icon: Icon, title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>
      {isOpen && <div className="px-4 py-3 bg-white dark:bg-gray-900 space-y-2">{children}</div>}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-1">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}:</span>
    <span className="text-sm text-gray-900 dark:text-gray-100 sm:text-right">{value}</span>
  </div>
);

interface OnboardingTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  session?: Session | null;
}

export default function OnboardingTaskModal({ task, isOpen, onClose, session }: OnboardingTaskModalProps) {
  const [withCheckbox] = useState(true);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [message, setMessage] = useState("");
  
  // Zustand store hooks
  const { data, isLoading, currentClientId } = useOnboardingData();
  const { fetchOnboardingData, updateOnboardingStep, setCurrentClientId, clearCurrentData } = useOnboardingActions();
  const { showDetails, showChecklist, setShowDetails, setShowChecklist } = useOnboardingUI();

  const liveSteps = data?.steps ?? null;
  const liveCompletedCount = liveSteps ? liveSteps.filter((s: any) => s.progress?.completed).length : 0;
  const liveTotalCount = liveSteps ? liveSteps.length : 0;
  const liveCompletionPercentage = liveSteps ? (liveCompletedCount / Math.max(1, liveTotalCount)) * 100 : 0;
  
  // Fallback to default checklist when no live data
  const completedCount = defaultChecklist.filter((c) => c.completed).length;
  const totalCount = defaultChecklist.length;
  const completionPercentage = (completedCount / Math.max(1, totalCount)) * 100;


  // Remove old toggleStep function - now handled by Zustand store

  function handleChecklistToggleLocal() {
    // This is for the default checklist fallback only (when no live data is available)
    // In practice, this won't be used when connected to the Zustand store
  }

  // Extract clientModelDetailsId from task title and auto-fetch on modal open using Zustand
  useEffect(() => {
    if (isOpen && task) {
      // Extract from title (format: "Name - ONBOARDING - clientModelDetailsId")
      const titleParts = task.title.split(' - ');
      let extractedClientId = '';
      
      if (titleParts.length >= 3) {
        // Check if second-to-last part is "ONBOARDING" and get the last part
        if (titleParts[titleParts.length - 2] === 'ONBOARDING') {
          extractedClientId = titleParts[titleParts.length - 1];
        }
      }
      
      // Only fetch if we have an ID and it's different from current
      if (extractedClientId && extractedClientId !== currentClientId) {
        setClientId(extractedClientId);
        setCurrentClientId(extractedClientId);
        fetchOnboardingData(extractedClientId);
        setMessage("");
      } else if (!extractedClientId) {
        setMessage("No client ID found in task title");
      }
    }
    
    // Reset when modal closes
    if (!isOpen) {
      clearCurrentData();
      setClientId("");
      setMessage("");
    }
  }, [isOpen, task?.id, task?.title, currentClientId, setCurrentClientId, fetchOnboardingData, clearCurrentData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-[10000] overflow-y-auto">
      <div className="rounded-xl shadow-2xl w-full max-w-5xl border my-4 sm:my-8 overflow-hidden isolate backdrop-blur-none bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] border-gray-200 dark:border-gray-700">
        <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {task.title.includes(' - ONBOARDING - ') 
                    ? task.title.split(' - ONBOARDING')[0] + ' - ONBOARDING'
                    : task.title
                  }
                </h3>
              </div>

              {clientId && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Client ID: <span className="font-mono text-blue-600 dark:text-blue-400">{clientId}</span>
                </div>
              )}

              <div className="text-sm text-gray-500">{message}</div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowDetails(!showDetails)} 
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showDetails 
                    ? "text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/20 hover:bg-blue-200/50 dark:hover:bg-blue-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {showDetails ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="hidden sm:inline">Client Info</span>
              </button>
              <button 
                onClick={() => setShowChecklist(!showChecklist)} 
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showChecklist 
                    ? "text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20 hover:bg-green-200/50 dark:hover:bg-green-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {showChecklist ? <List className="h-4 w-4" /> : <List className="h-4 w-4" />}
                <span className="hidden sm:inline">Checklist</span>
              </button>
              <button onClick={() => setIsEditingTask(!isEditingTask)} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-2 transition-colors"><X className="h-5 w-5" /></button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-4 sm:p-8 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)]">
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Description</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{linkifyText(task.description || "Complete all necessary onboarding tasks for this model. Use Fetch to load live data.")}</p>
                </div>
              </div>

              {showDetails && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Client Information</h4>

                  {isLoading ? (
                    // Skeleton loader for client information
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center space-x-3">
                              <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                            </div>
                          </div>
                          <div className="px-4 py-3 bg-white dark:bg-gray-900 space-y-2">
                            {[1, 2, 3, 4].map((j) => (
                              <div key={j} className="flex justify-between py-1">
                                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <DetailSection icon={User} title="Basic Info" defaultOpen={true}>
                        <DetailRow label="Full Name" value={data?.clientModelDetails?.full_name ?? ""} />
                        <DetailRow label="Client Name" value={data?.clientModelDetails?.client_name ?? ""} />
                        <DetailRow label="Model Name" value={data?.clientModelDetails?.model_name ?? ""} />
                        <DetailRow label="Age" value={data?.clientModelDetails?.age ?? ""} />
                        <DetailRow label="Birthday" value={data?.clientModelDetails?.birthday ?? ""} />
                        <DetailRow label="Height" value={data?.clientModelDetails?.height ?? ""} />
                        <DetailRow label="Weight" value={data?.clientModelDetails?.weight ?? ""} />
                        <DetailRow label="Clothing Size" value={data?.clientModelDetails?.clothing_size ?? ""} />
                        <DetailRow label="Clothing Items" value={data?.clientModelDetails?.clothing_items ?? ""} />
                        <DetailRow label="Ethnicity" value={data?.clientModelDetails?.ethnicity ?? ""} />
                        <DetailRow label="Birthplace" value={data?.clientModelDetails?.birthplace ?? ""} />
                        <DetailRow label="Current City" value={data?.clientModelDetails?.current_city ?? ""} />
                        <DetailRow label="Timezone" value={data?.clientModelDetails?.timezone ?? ""} />
                      </DetailSection>

                      <DetailSection icon={Heart} title="Personal">
                        <DetailRow label="Background" value={data?.clientModelDetails?.background ?? ""} />
                        <DetailRow label="Favorite Colors" value={data?.clientModelDetails?.favorite_colors ?? ""} />
                        <DetailRow label="Interests" value={data?.clientModelDetails?.interests ?? ""} />
                        <DetailRow label="Personality" value={data?.clientModelDetails?.personality ?? ""} />
                        <DetailRow label="Favorite Emojis" value={data?.clientModelDetails?.favorite_emojis ?? ""} />
                        <DetailRow label="Keywords" value={data?.clientModelDetails?.keywords ?? ""} />
                        <DetailRow label="Limitations" value={data?.clientModelDetails?.limitations ?? ""} />
                      </DetailSection>

                      <DetailSection icon={Camera} title="Content">
                        <DetailRow label="Content Offered" value={data?.clientModelDetails?.content_offered ?? ""} />
                        <DetailRow label="OFTV Interest" value={data?.clientModelDetails?.oftv_channel_interest ?? ""} />
                      </DetailSection>

                      <DetailSection icon={DollarSign} title="Pricing & Availability">
                        <DetailRow label="Custom Min Price" value={data?.clientModelDetails?.custom_min_price ?? ""} />
                        <DetailRow label="Video Call Min Price" value={data?.clientModelDetails?.video_call_min_price ?? ""} />
                      </DetailSection>

                      <DetailSection icon={MessageCircle} title="Restrictions & Preferences">
                        <DetailRow label="MM Restrictions" value={data?.clientModelDetails?.mm_restrictions ?? ""} />
                        <DetailRow label="Verbiage Restrictions" value={data?.clientModelDetails?.verbiage_restrictions ?? ""} />
                        <DetailRow label="Wall Restrictions" value={data?.clientModelDetails?.wall_restrictions ?? ""} />
                        <DetailRow label="Amazon Wishlist" value={data?.clientModelDetails?.amazon_wishlist ?? ""} />
                        <DetailRow label="Tone/Language" value={data?.clientModelDetails?.tone_language ?? ""} />
                      </DetailSection>

                      <DetailSection icon={User} title="Meta">
                        <DetailRow label="Calendar ID" value={data?.clientModelDetails?.calendar_id ?? ""} />
                        <DetailRow label="Onboarding Completed" value={String(data?.clientModelDetails?.onboardingCompleted ?? "")} />
                        <DetailRow label="Status" value={data?.clientModelDetails?.status ?? ""} />
                        <DetailRow label="Created At" value={data?.clientModelDetails?.createdAt ?? ""} />
                        <DetailRow label="Updated At" value={data?.clientModelDetails?.updatedAt ?? ""} />
                      </DetailSection>

                      {(data?.clientModelDetails?.clientOnlyFansAlbum || data?.clientModelDetails?.clientSocialAlbums || data?.clientModelDetails?.clientCustomSheet) && (
                        <DetailSection icon={MessageCircle} title="Client Links" defaultOpen={true}>
                          {data?.clientModelDetails?.clientOnlyFansAlbum && (
                            <DetailRow
                              label="OnlyFans Album"
                              value={
                                <a
                                  href={data.clientModelDetails.clientOnlyFansAlbum}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                                >
                                  View Album
                                </a>
                              }
                            />
                          )}
                          {data?.clientModelDetails?.clientSocialAlbums && (
                            <DetailRow
                              label="Social Albums"
                              value={
                                <a
                                  href={data.clientModelDetails.clientSocialAlbums}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                                >
                                  View Album
                                </a>
                              }
                            />
                          )}
                          {data?.clientModelDetails?.clientCustomSheet && (
                            <DetailRow
                              label="Custom Sheet"
                              value={
                                <a
                                  href={data.clientModelDetails.clientCustomSheet}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                                >
                                  View Sheet
                                </a>
                              }
                            />
                          )}
                        </DetailSection>
                      )}
                    </>
                  )}
                </div>
              )}

              {withCheckbox && showChecklist && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Onboarding Checklist</h4>
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{liveTotalCount ? `${liveCompletedCount} of ${liveTotalCount} completed` : `${completedCount} of ${totalCount} completed`}</span>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300" style={{ width: `${liveTotalCount ? liveCompletionPercentage : completionPercentage}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    // Skeleton loader for checklist
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(data?.steps ?? defaultChecklist).map((entry: any) => {
                      if (entry.onboardingList) {
                        const step = entry.onboardingList;
                        const prog = entry.progress || { completed: false };
                        const isCompleted = !!prog.completed;
                        return (
                          <div
                            key={step.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group ${isCompleted ? 'opacity-70' : ''}`}
                            onClick={async (e) => {
                              if ((e.target as HTMLElement).tagName === 'INPUT') return;
                              if (clientId) {
                                const next = !isCompleted;
                                await updateOnboardingStep(step.id, next);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={async (e) => {
                                e.stopPropagation();
                                if (clientId) {
                                  const next = e.target.checked;
                                  await updateOnboardingStep(step.id, next);
                                }
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 focus:ring-2 accent-green-600"
                            />
                            <span className={`text-sm flex-1 transition-all duration-200 ${
                              isCompleted 
                                ? "text-gray-500 dark:text-gray-500 line-through" 
                                : "text-gray-700 dark:text-gray-300"
                            }`}>
                              {step.stepNumber}. {step.title}
                            </span>
                          </div>
                        );
                      }

                      const item = entry;
                      return (
                        <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group" onClick={handleChecklistToggleLocal}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleChecklistToggleLocal();
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 focus:ring-2 accent-green-600"
                          />
                          <span className={`text-sm flex-1 transition-all duration-200 ${
                            item.completed 
                              ? "text-gray-500 dark:text-gray-500 line-through" 
                              : "text-gray-700 dark:text-gray-300"
                          }`}>
                            {item.title}
                          </span>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Attachments</h4>
                <p className="text-gray-400 dark:text-gray-500 italic">No attachments</p>
              </div>

              {/* Comments Section */}
              <div className="min-w-0">
                <TaskComments 
                  taskId={task.id}
                  teamId={task.podTeamId || undefined}
                  currentUser={session?.user ? {
                    id: session.user.id!,
                    name: session.user.name,
                    email: session.user.email!,
                    image: session.user.image
                  } : null}
                  isViewOnly={false}
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 lg:max-w-80 lg:flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6 min-w-0">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Status
                </label>
                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg min-w-0">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-sm flex-shrink-0">
                    {task.priority === "URGENT"
                      ? "🚨"
                      : task.priority === "HIGH"
                        ? "🔴"
                        : task.priority === "MEDIUM"
                          ? "🟡"
                          : "🟢"}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Assignee
                </label>
                {task.assignedUser ? (
                  <div className="flex items-center space-x-3 min-w-0">
                    <UserProfile
                      user={task.assignedUser}
                      size="md"
                      showTooltip
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {task.assignedUser.name ||
                          task.assignedUser.email
                            ?.split("@")[0]
                            .replace(/[._-]/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {task.assignedUser.email}
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
              {task.dueDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Due Date
                  </label>
                  <div className="flex items-center space-x-2 min-w-0">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className={`text-sm truncate ${formatDueDate(task.dueDate).className}`}>
                      {formatDueDate(task.dueDate).formatted}
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
                      {formatForTaskDetail(task.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 min-w-0">
                    <UserProfile
                      user={task.createdBy}
                      size="sm"
                      showTooltip
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {task.createdBy.name ||
                          task.createdBy.email
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
                    {formatForTaskDetail(task.updatedAt)}
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