"use client";

import React, { useState } from "react";
import {
  X,
  Edit3,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  Globe,
  Heart,
  DollarSign,
  Camera,
  MessageCircle,
} from "lucide-react";

// No local mock client data: UI reads from live fetch only.

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
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part: string, index: number) => {
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

export default function TestOnboardingPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [withCheckbox] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [isEditingTask, setIsEditingTask] = useState(false);

  // live data
  const [clientId, setClientId] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const completedCount = checklist.filter((c) => c.completed).length;
  const totalCount = checklist.length;
  const completionPercentage = (completedCount / Math.max(1, totalCount)) * 100;

  const liveSteps = data?.steps ?? null;
  const liveCompletedCount = liveSteps ? liveSteps.filter((s: any) => s.progress?.completed).length : 0;
  const liveTotalCount = liveSteps ? liveSteps.length : 0;
  const liveCompletionPercentage = liveSteps ? (liveCompletedCount / Math.max(1, liveTotalCount)) * 100 : 0;

  async function fetchStatus() {
    if (!clientId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/test-onboarding/status?clientModelDetailsId=${encodeURIComponent(clientId)}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setMessage("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStep(onboardingListId: string, next: boolean) {
    if (!clientId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/onboarding/toggle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientModelDetailsId: clientId, onboardingListId, completed: next }) });
      const json = await res.json();
      setMessage(JSON.stringify(json));
      if (data && Array.isArray(data.steps)) {
        const newSteps = data.steps.map((s: any) => (s.onboardingList?.id === onboardingListId ? { ...s, progress: { ...s.progress, completed: next, completedAt: next ? new Date().toISOString() : null } } : s));
        setData({ ...data, steps: newSteps });
      }
      await fetchStatus();
    } catch (err) {
      setMessage("Toggle failed");
    } finally {
      setLoading(false);
    }
  }

  function handleChecklistToggleLocal(id: number) {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-[10000] overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-700 my-4 sm:my-8">
        <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Onboarding Preview</h3>
              </div>

              <div className="flex items-center space-x-2">
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="clientModelDetailsId (optional)" className="px-3 py-2 border rounded w-full max-w-sm bg-white dark:bg-gray-800 text-sm" />
                <button onClick={fetchStatus} className="px-3 py-2 bg-blue-600 text-white rounded">Fetch</button>
                <button onClick={() => { setData(null); setClientId(""); }} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded">Clear</button>
              </div>

              <div className="text-sm text-gray-500">{message}</div>
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={() => setIsEditingTask(!isEditingTask)} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-2 transition-colors"><X className="h-5 w-5" /></button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-4 sm:p-8">
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Description</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{linkifyText("Complete all necessary onboarding tasks for this model. Use Fetch to load live data.")}</p>
                </div>
              </div>

              {showDetails && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Client Information</h4>

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
                </div>
              )}

              {withCheckbox && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Onboarding Checklist</h4>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{liveTotalCount ? `${liveCompletedCount} of ${liveTotalCount} completed` : `${completedCount} of ${totalCount} completed`}</span>
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300" style={{ width: `${liveTotalCount ? liveCompletionPercentage : completionPercentage}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(data?.steps ?? checklist).map((entry: any, idx: number) => {
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
                                const copy = JSON.parse(JSON.stringify(data || { steps: [] }));
                                copy.steps[idx] = copy.steps[idx] || { onboardingList: step, progress: {} };
                                copy.steps[idx].progress.completed = next;
                                setData(copy);
                                try {
                                  await toggleStep(step.id, next);
                                  await fetchStatus();
                                } catch (err) {
                                  await fetchStatus();
                                }
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (clientId) {
                                  const next = e.target.checked;
                                  const copy = JSON.parse(JSON.stringify(data || { steps: [] }));
                                  copy.steps[idx] = copy.steps[idx] || { onboardingList: step, progress: {} };
                                  copy.steps[idx].progress.completed = next;
                                  setData(copy);
                                  toggleStep(step.id, next).then(fetchStatus).catch(() => fetchStatus());
                                }
                              }}
                            />
                            <span className="text-sm flex-1">{step.stepNumber}. {step.title}</span>
                          </div>
                        );
                      }

                      const item = entry;
                      return (
                        <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group" onClick={() => handleChecklistToggleLocal(item.id)}>
                          <button className={`flex-shrink-0 transition-all ${item.completed ? "text-green-500 dark:text-green-400" : "text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`}>
                            {item.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                          </button>
                          <span className={`text-sm flex-1 transition-all ${item.completed ? "text-gray-500 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-300"}`}>{item.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Attachments</h4>
                <p className="text-gray-400 dark:text-gray-500 italic">No attachments</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-gray-50 dark:bg-gray-800/30 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS" selected>In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Priority</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🔴</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">HIGH</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Assignee</label>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">JD</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">John Doe</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">john.doe@example.com</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Due Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Oct 15, 2025</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Created</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Today at 10:00 AM</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">JS</div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Jane Smith</p>
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