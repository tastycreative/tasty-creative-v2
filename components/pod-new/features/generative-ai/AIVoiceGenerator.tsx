"use client";

import {
  Check,
  Loader2,
  RefreshCw,
  Volume2,
  Play,
  X,
  Download,
  Mic,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import VoiceNoteCard from "@/components/VoiceNoteCard";

import {
  generateVoice,
  downloadAudio,
  API_KEY_PROFILES,
  checkApiKeyBalance,
  ELEVEN_LABS_MODELS,
  fetchHistoryFromElevenLabs,
  getHistoryAudio,
  getVoiceParameters,
  getAllVoiceModels,
} from "@/app/services/elevenlabs-client";
import { truncateText, formatDate } from "@/lib/utils";

// Type definitions
interface ApiKeyBalance {
  character: {
    limit: number;
    remaining: number;
    used: number;
  };
  status?: string;
  error?: string;
  subscription?: any;
}

interface Voice {
  name: string;
  voiceId: string;
  category: string;
}

interface GeneratedAudio {
  audioBlob: Blob;
  audioUrl: string;
  voiceName?: string;
  profile?: string;
  voiceId?: string;
}

interface HistoryItem {
  history_item_id: string;
  text: string;
  voice_id: string;
  voice_name?: string;
  date_unix: number;
}

interface HistoryAudio {
  audioBlob: Blob;
  audioUrl: string;
  historyItemId: string;
}

type ProfileStatus = "healthy" | "low-credits" | "error";

const AIVoiceGenerator = () => {
  // State management (keeping all original state)
  const [voiceModels, setVoiceModels] = useState<any[]>([]);
  const [selectedApiKeyProfile, setSelectedApiKeyProfile] = useState<string>("");
  const [apiKeyBalance, setApiKeyBalance] = useState<ApiKeyBalance | null>(null);
  const [profileStatuses, setProfileStatuses] = useState<Record<string, ProfileStatus>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isCheckingStatuses, setIsCheckingStatuses] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voiceText, setVoiceText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("eleven_multilingual_v2");
  const [stability, setStability] = useState(0.5);
  const [clarity, setClarity] = useState(0.75);
  const [speed, setSpeed] = useState(1.0);
  const [styleExaggeration, setStyleExaggeration] = useState(0.3);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [voiceError, setVoiceError] = useState("");
  const [historyEntries, setHistoryEntries] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingHistoryAudio, setIsLoadingHistoryAudio] = useState(false);
  const [historyAudio, setHistoryAudio] = useState<HistoryAudio | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [speakerBoost] = useState(true);
  const [audioNo, setAudioNo] = useState<number>(1);
  const [salePrice, setSalePrice] = useState("");
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleSubmitStatus, setSaleSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [vnStats, setVnStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);
  const [historyItemForSale, setHistoryItemForSale] = useState<HistoryItem | null>(null);
  const [saleFormHighlighted, setSaleFormHighlighted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);
  const saleFormRef = useRef<HTMLDivElement | null>(null);
  const characterLimit = 1000;
  const [generationStatus, setGenerationStatus] = useState("");

  // All functions remain the same (loadVnStats, prepareHistoryItemForSale, etc.)
  const loadVnStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/vn-sales/stats");
      if (response.ok) {
        const stats = await response.json();
        setVnStats(stats);
      } else {
        setVnStats(null);
      }
    } catch (error) {
      setVnStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const prepareHistoryItemForSale = (historyItem: HistoryItem) => {
    setHistoryItemForSale(historyItem);
    setVoiceText(historyItem.text);
    setSalePrice("");
    setSaleSubmitStatus(null);
    setShowSaleSuccess(false);
    setSaleFormHighlighted(true);
    if (saleFormRef.current) {
      saleFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setSaleFormHighlighted(false), 3000);
    setGenerationStatus(`History item loaded for sale: "${truncateText(historyItem.text, 50)}"`);
    setTimeout(() => setGenerationStatus(""), 4000);
  };

  const determineProfileStatus = (balance: any, error?: string): ProfileStatus => {
    if (!balance || balance.status === "error" || error) return "error";
    if (balance.subscription) {
      const sub = balance.subscription;
      if (sub.status && (sub.status === "incomplete" || sub.status === "past_due" || sub.status === "unpaid")) return "error";
      if (sub.payment_failed || sub.billing_issue || sub.subscription_status === "past_due") return "error";
    }
    const remaining = balance.character?.remaining || 0;
    const limit = balance.character?.limit || 0;
    if (limit === 0 && remaining === 0) return "error";
    if (remaining === 0) return "error";
    if (remaining < 100000) return "low-credits";
    return "healthy";
  };

  const checkProfileStatus = async (profileKey: string): Promise<ProfileStatus> => {
    try {
      setProfileStatuses((prev) => ({ ...prev, [profileKey]: "error" }));
      setProfileErrors((prev) => ({ ...prev, [profileKey]: "" }));
      const balance = await checkApiKeyBalance(profileKey);
      const errorMessage = balance?.error || "";
      const status = determineProfileStatus(balance, errorMessage);
      if (errorMessage) {
        setProfileErrors((prev) => ({ ...prev, [profileKey]: errorMessage }));
      }
      setProfileStatuses((prev) => ({ ...prev, [profileKey]: status }));
      return status;
    } catch (error: any) {
      const errorMessage = error.message || error.toString();
      setProfileErrors((prev) => ({ ...prev, [profileKey]: errorMessage }));
      setProfileStatuses((prev) => ({ ...prev, [profileKey]: "error" }));
      return "error";
    }
  };

  const checkAllProfileStatuses = async () => {
    setIsCheckingStatuses(true);
    const profiles = voiceModels.map((model) => model.accountKey || model.id);
    const statusPromises = profiles.map((profileKey) => checkProfileStatus(profileKey));
    try {
      await Promise.allSettled(statusPromises);
    } catch (error) {
      console.error("Error checking profile statuses:", error);
    } finally {
      setIsCheckingStatuses(false);
    }
  };

  const getStatusIndicator = (status: ProfileStatus) => {
    switch (status) {
      case "healthy":
        return { color: "bg-green-400", pulse: false, tooltip: "Account is healthy with plenty of credits" };
      case "low-credits":
        return { color: "bg-yellow-400", pulse: true, tooltip: "Low credits (below 100,000 remaining)" };
      case "error":
      default:
        return { color: "bg-red-500", pulse: false, tooltip: "Account has problems or no credits" };
    }
  };

  const StatusIndicator = ({ status, profileKey }: { status: ProfileStatus; profileKey?: string }) => {
    const { color, pulse, tooltip } = getStatusIndicator(status);
    const errorMessage = profileKey ? profileErrors[profileKey] : "";
    let displayTooltip = tooltip;
    if (errorMessage) displayTooltip = `${tooltip}: ${errorMessage}`;
    return (
      <div className="relative group">
        <div className={`w-3 h-3 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} title={displayTooltip} />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 max-w-xs">
          {displayTooltip}
        </div>
      </div>
    );
  };

  const loadHistory = async (forceRefresh = false) => {
    if (!selectedVoice || !selectedApiKeyProfile) return;
    try {
      setIsLoadingHistory(true);
      setHistoryError("");
      const result = await fetchHistoryFromElevenLabs(selectedApiKeyProfile, selectedVoice, 100, 1, forceRefresh);
      setHistoryEntries(result.items || []);
    } catch (error: any) {
      setHistoryError("Failed to load history from ElevenLabs");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const reloadHistoryWithDelay = async () => {
    setTimeout(() => loadHistory(true), 1000);
  };

  const handleGenerateVoice = async () => {
    if (!selectedApiKeyProfile) {
      setVoiceError("API key profile must be selected");
      return;
    }
    if (!selectedVoice) {
      setVoiceError("Please select a voice");
      return;
    }
    if (!voiceText.trim()) {
      setVoiceError("Please enter some text");
      return;
    }
    setVoiceError("");
    setIsGeneratingVoice(true);
    setGenerationStatus("Generating voice with ElevenLabs...");
    try {
      const selectedVoiceDetails = availableVoices.find((voice) => voice.voiceId === selectedVoice);
      if (!selectedVoiceDetails) throw new Error("Voice not found");
      const result = await generateVoice(selectedApiKeyProfile, selectedVoice, voiceText, selectedModelId, { stability, clarity, speed, styleExaggeration, speakerBoost });
      setGeneratedAudio({ ...result, voiceName: selectedVoiceDetails.name });
      setGenerationStatus("Voice generated successfully!");
      const balance = await checkApiKeyBalance(selectedApiKeyProfile);
      setApiKeyBalance(balance);
      const errorMessage = balance?.error || "";
      const newStatus = determineProfileStatus(balance, errorMessage);
      setProfileStatuses((prev) => ({ ...prev, [selectedApiKeyProfile]: newStatus }));
      if (errorMessage) {
        setProfileErrors((prev) => ({ ...prev, [selectedApiKeyProfile]: errorMessage }));
      } else {
        setProfileErrors((prev) => ({ ...prev, [selectedApiKeyProfile]: "" }));
      }
      reloadHistoryWithDelay();
    } catch (error: any) {
      setVoiceError(error.message || "Failed to generate voice");
      setGenerationStatus("");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleSubmitSale = async () => {
    const isHistorySale = historyItemForSale && !generatedAudio;
    if (!isHistorySale && (!generatedAudio || !selectedApiKeyProfile || !salePrice)) {
      setSaleSubmitStatus({ type: "error", message: "Please generate a voice note first and enter a sale price" });
      return;
    }
    if (isHistorySale && (!historyItemForSale || !selectedApiKeyProfile || !salePrice)) {
      setSaleSubmitStatus({ type: "error", message: "Please select a history item and enter a sale price" });
      return;
    }
    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) {
      setSaleSubmitStatus({ type: "error", message: "Please enter a valid sale price" });
      return;
    }
    setIsSubmittingSale(true);
    setSaleSubmitStatus(null);
    setShowSaleSuccess(false);
    try {
      let saleData;
      if (isHistorySale && historyItemForSale) {
        const uniqueSaleId = `${historyItemForSale.history_item_id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const voiceName = historyItemForSale.voice_name || availableVoices.find((v) => v.voiceId === selectedVoice)?.name || "Unknown Voice";
        saleData = {
          id: uniqueSaleId,
          model: voiceName,
          voiceNote: historyItemForSale.text,
          sale: price,
          soldDate: new Date().toISOString(),
          status: "Completed",
          generatedDate: new Date(historyItemForSale.date_unix * 1000).toISOString(),
          originalHistoryId: historyItemForSale.history_item_id,
        };
      } else {
        const saleId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const voiceName = availableVoices.find((v) => v.voiceId === selectedVoice)?.name || "Unknown Voice";
        saleData = {
          id: saleId,
          model: voiceName,
          voiceNote: voiceText,
          sale: price,
          soldDate: new Date().toISOString(),
          status: "Completed",
          generatedDate: new Date().toISOString(),
        };
      }
      const response = await fetch("/api/vn-sales/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });
      if (response.ok) {
        const responseData = await response.json();
        setShowSaleSuccess(true);
        setSaleSubmitStatus({ type: "success", message: `Voice note sale of $${price.toFixed(2)} submitted successfully! 🎉` });
        setSalePrice("");
        setHistoryItemForSale(null);
        await loadVnStats();
        if (selectedApiKeyProfile) {
          const balance = await checkApiKeyBalance(selectedApiKeyProfile);
          setApiKeyBalance(balance);
          const errorMessage = balance?.error || "";
          const newStatus = determineProfileStatus(balance, errorMessage);
          setProfileStatuses((prev) => ({ ...prev, [selectedApiKeyProfile]: newStatus }));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("vnSaleSubmitted", {
            detail: {
              sale: price,
              model: saleData.model,
              saleData: responseData,
              source: isHistorySale ? "AIVoiceGenerator-history" : "AIVoiceGenerator-generated",
            },
          }));
        }
        setTimeout(() => {
          setSaleSubmitStatus(null);
          setShowSaleSuccess(false);
        }, 5000);
      } else {
        const errorData = await response.json();
        if (response.status === 401) {
          setSaleSubmitStatus({ type: "error", message: "Authentication required. Please sign in as an admin to submit sales." });
        } else if (response.status === 403) {
          if (errorData.error === "GooglePermissionDenied") {
            setSaleSubmitStatus({ type: "error", message: "Google authentication expired. Please refresh the page and sign in again." });
          } else {
            setSaleSubmitStatus({ type: "error", message: "Admin access required to submit sales." });
          }
        } else {
          throw new Error(errorData.error || "Failed to submit voice note sale");
        }
      }
    } catch (error: any) {
      if (error.message.includes("Access token expired")) {
        setSaleSubmitStatus({ type: "error", message: "Google authentication expired. Please refresh the page and sign in again." });
      } else if (error.message.includes("Not authenticated")) {
        setSaleSubmitStatus({ type: "error", message: "Please sign in as an admin to submit sales." });
      } else {
        setSaleSubmitStatus({ type: "error", message: error.message || "Failed to submit voice note sale" });
      }
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handlePlayHistoryAudio = async (historyItem: HistoryItem) => {
    try {
      setIsLoadingHistoryAudio(true);
      setSelectedHistoryItem(historyItem);
      setHistoryError("");
      const audio = await getHistoryAudio(selectedApiKeyProfile, historyItem.history_item_id);
      setHistoryAudio(audio);
      setTimeout(() => {
        if (historyAudioRef.current) {
          historyAudioRef.current.play().catch((err) => console.error("Failed to play history audio:", err));
        }
      }, 100);
    } catch (error: any) {
      setHistoryError("Failed to load audio from history");
    } finally {
      setIsLoadingHistoryAudio(false);
    }
  };

  const handleRefreshHistory = () => loadHistory(true);
  const handleStopHistoryAudio = () => {
    if (historyAudioRef.current) {
      historyAudioRef.current.pause();
      historyAudioRef.current.currentTime = 0;
    }
  };
  const handleDownloadHistoryAudio = (historyItem: HistoryItem) => {
    if (historyAudio?.audioBlob) {
      downloadAudio(historyAudio.audioBlob, `${historyItem.voice_name || "voice"}-${historyItem.history_item_id}.mp3`);
    }
  };
  const handleDownloadAudio = () => {
    if (generatedAudio?.audioBlob) {
      downloadAudio(generatedAudio.audioBlob, `${generatedAudio.voiceName}-voice.mp3`);
    }
  };
  const handlePlayAudio = () => {
    if (audioRef.current && generatedAudio?.audioUrl) {
      audioRef.current.play().catch((err) => console.error("Failed to play audio:", err));
    }
  };
  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
  const handleUseHistoryText = (historyItem: HistoryItem) => {
    setVoiceText(historyItem.text);
    const storedParams = getVoiceParameters(historyItem.history_item_id);
    if (storedParams) {
      if (storedParams.stability !== undefined) setStability(storedParams.stability);
      if (storedParams.clarity !== undefined) setClarity(storedParams.clarity);
      if (storedParams.speed !== undefined) setSpeed(storedParams.speed);
      if (storedParams.styleExaggeration !== undefined) setStyleExaggeration(storedParams.styleExaggeration);
      if (storedParams.modelId !== undefined) setSelectedModelId(storedParams.modelId);
      setGenerationStatus(`Voice parameters restored from history`);
      setTimeout(() => setGenerationStatus(""), 3000);
    } else {
      setGenerationStatus(`No saved parameters found for this history item`);
      setTimeout(() => setGenerationStatus(""), 3000);
    }
  };

  useEffect(() => { loadVnStats(); }, []);
  useEffect(() => {
    const fetchVoiceModels = async () => {
      try {
        const models = await getAllVoiceModels();
        setVoiceModels(models);
        if (!selectedApiKeyProfile && models.length > 0) {
          setSelectedApiKeyProfile(models[0].accountKey || models[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch voice models", err);
      }
    };
    fetchVoiceModels();
  }, []);
  useEffect(() => {
    if (!selectedApiKeyProfile) {
      setAvailableVoices([]);
      return;
    }
    const model = voiceModels.find((m) => (m.accountKey || m.id) === selectedApiKeyProfile);
    if (model && model.voiceId && model.voiceName) {
      setAvailableVoices([{ name: model.voiceName, voiceId: model.voiceId, category: model.category || "professional" }]);
      setSelectedVoice(model.voiceId);
    } else {
      setAvailableVoices([]);
    }
  }, [selectedApiKeyProfile, voiceModels]);
  useEffect(() => {
    if (voiceModels.length > 0) checkAllProfileStatuses();
  }, [voiceModels]);

  return (
    <div className="w-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-6 space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400">
          Professional AI Voice Generation
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
          Convert text to high-quality professional voices using ElevenLabs
        </p>
      </div>

      {/* Status Guide */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25 p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        <div className="relative">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-2">💡 Status Guide</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Understanding account status indicators</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-semibold">Green - Healthy</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">100,000+ credits remaining</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-semibold">Yellow - Low Credits</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Below 100,000 remaining</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-semibold">Red - Problems</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Issues, billing problems, or no credits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Profile & Balance Card */}
      <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-gray-600 dark:text-gray-400 text-sm font-medium">API Profile</Label>
              <div className="flex items-center gap-3">
                <Select value={selectedApiKeyProfile} onValueChange={setSelectedApiKeyProfile}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-lg flex-1">
                    <SelectValue placeholder="Select API profile" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10">
                    {voiceModels.map((model) => (
                      <SelectItem key={model.accountKey || model.id} value={model.accountKey || model.id}>
                        <div className="flex items-center gap-3 py-1">
                          <StatusIndicator status={profileStatuses[model.accountKey || model.id] || "error"} profileKey={model.accountKey || model.id} />
                          <span>{model.accountName || model.voiceName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700" onClick={checkAllProfileStatuses} disabled={isCheckingStatuses}>
                  {isCheckingStatuses ? <Loader2 size={12} className="mr-1 animate-spin" /> : <RefreshCw size={12} className="mr-1" />}
                  Refresh
                </Button>
              </div>
              {voiceModels.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
                  <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">No voice profiles available</p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-xs">Please sign in to access voice generation features</p>
                  </div>
                </div>
              )}
              {apiKeyBalance && (
                <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-pink-50 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30">
                  <span>API Connected</span>
                </div>
              )}
            </div>
            {apiKeyBalance && (
              <div className="flex flex-col justify-end items-end text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Characters remaining</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  {apiKeyBalance?.character?.remaining !== undefined ? apiKeyBalance.character.remaining.toLocaleString() : "N/A"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Voice Generation Panel */}
        <div className="space-y-6">
          {/* Voice & Model Selection */}
          <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Voice Selection</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Choose your voice and AI model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-gray-600 dark:text-gray-400 mb-3 block font-medium">
                  Select Voice ({availableVoices.length} available)
                </Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={availableVoices.length === 0}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-lg h-12">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 max-h-72">
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.voiceId} value={voice.voiceId}>{voice.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-400 mb-3 block font-medium">AI Model</Label>
                <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-lg h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10">
                    {ELEVEN_LABS_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {ELEVEN_LABS_MODELS.find((m) => m.id === selectedModelId)?.description || ""}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Text Input */}
          <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Voice Text</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Enter the text you want to convert to speech</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter text to convert to speech..."
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                maxLength={characterLimit}
                className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-lg min-h-32"
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Label className="text-gray-600 dark:text-gray-400">Audio No:</Label>
                  <Input value={audioNo} onChange={(e) => setAudioNo(Number(e.target.value))} type="number" min={1} className="w-20 bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 rounded-lg" />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{voiceText.length}/{characterLimit} characters</div>
              </div>
              {historyItemForSale && (
                <div className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-500/20 border border-pink-200 dark:border-pink-500/30 rounded-lg">
                  <CheckCircle size={16} className="text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  <span className="text-pink-700 dark:text-pink-300 text-sm">Text loaded from history item for sale submission</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Parameters */}
          <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Voice Parameters</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Fine-tune your voice generation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 dark:text-gray-400 font-medium">Stability</Label>
                    <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">{stability.toFixed(2)}</span>
                  </div>
                  <Slider value={[stability]} min={0} max={1} step={0.01} onValueChange={(value) => setStability(value[0])} className="py-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Higher values make the voice more consistent</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 dark:text-gray-400 font-medium">Similarity</Label>
                    <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">{clarity.toFixed(2)}</span>
                  </div>
                  <Slider value={[clarity]} min={0} max={1} step={0.01} onValueChange={(value) => setClarity(value[0])} className="py-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Higher values make the voice more similar to original</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 dark:text-gray-400 font-medium">Speed</Label>
                    <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">{speed.toFixed(2)}x</span>
                  </div>
                  <Slider value={[speed]} min={0.7} max={1.2} step={0.01} onValueChange={(value) => setSpeed(value[0])} className="py-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Adjust speaking speed (0.7x slower to 1.2x faster)</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 dark:text-gray-400 font-medium">Style Exaggeration</Label>
                    <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">{styleExaggeration.toFixed(2)}</span>
                  </div>
                  <Slider value={[styleExaggeration]} min={0} max={1} step={0.01} onValueChange={(value) => setStyleExaggeration(value[0])} className="py-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Higher values emphasize the voice style more strongly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="space-y-4">
            {voiceError && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{voiceError}</AlertDescription>
              </Alert>
            )}
            <Button
              className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-lg font-semibold shadow-md transition-all duration-200"
              onClick={handleGenerateVoice}
              disabled={isGeneratingVoice || !selectedApiKeyProfile || !selectedVoice || !voiceText.trim()}
            >
              {isGeneratingVoice ? (
                <>
                  <Loader2 size={20} className="mr-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 size={20} className="mr-3" />
                  Generate Professional Voice
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview & History Panel */}
        <div className="space-y-6">
          {/* Voice Preview */}
          <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">Voice Preview</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Listen to and download your generated voice</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedAudio ? (
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 rounded-2xl p-8 border border-pink-200 dark:border-pink-500/30">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                      <Volume2 size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{generatedAudio.voiceName}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                      {voiceText.length > 100 ? voiceText.substring(0, 100) + "..." : voiceText}
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700 px-6" onClick={handlePlayAudio}>
                      <Play size={16} className="mr-2" /> Play
                    </Button>
                    <Button variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700 px-6" onClick={handleStopAudio}>
                      <X size={16} className="mr-2" /> Stop
                    </Button>
                    <Button variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700 px-6" onClick={handleDownloadAudio}>
                      <Download size={16} className="mr-2" /> Download
                    </Button>
                  </div>
                </div>
              ) : selectedHistoryItem && historyAudio ? (
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 rounded-2xl p-8 border border-pink-200 dark:border-pink-500/30">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                      <Volume2 size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{selectedHistoryItem.voice_name || "Voice"}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                      {selectedHistoryItem.text && selectedHistoryItem.text.length > 100 ? selectedHistoryItem.text.substring(0, 100) + "..." : selectedHistoryItem.text || ""}
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700 px-6" onClick={() => historyAudioRef.current && historyAudioRef.current.play()}>
                      <Play size={16} className="mr-2" /> Play
                    </Button>
                    <Button variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700 px-6" onClick={handleStopHistoryAudio}>
                      <X size={16} className="mr-2" /> Stop
                    </Button>
                    <Button variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700 px-6" onClick={() => handleDownloadHistoryAudio(selectedHistoryItem)}>
                      <Download size={16} className="mr-2" /> Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mic size={64} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No Audio Generated Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">{!selectedVoice ? "Select a voice to get started" : "Generated voice will appear here"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice History */}
          {selectedVoice && (
            <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-800 dark:text-gray-200 flex items-center">
                      <Clock size={20} className="mr-2" />
                      Voice History
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Previous generations for this voice</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700" onClick={() => setShowHistory(!showHistory)}>
                      {showHistory ? "Hide" : "Show"}
                    </Button>
                    {showHistory && (
                      <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700" onClick={handleRefreshHistory} disabled={isLoadingHistory}>
                        {isLoadingHistory ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />}
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {showHistory && (
                <CardContent>
                  {historyError && (
                    <Alert variant="destructive" className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30">
                      <AlertDescription>{historyError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="max-h-96 overflow-y-auto border border-slate-200/50 dark:border-white/10 rounded-lg bg-white/60 dark:bg-slate-800/60 p-4">
                    {isLoadingHistory && historyEntries.length === 0 ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 size={32} className="animate-spin text-pink-600 dark:text-pink-400" />
                      </div>
                    ) : historyEntries.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {historyEntries.map((item) => (
                          <AccordionItem key={item.history_item_id} value={item.history_item_id} className="border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-center justify-between w-full text-left">
                                <div className="flex-1 mr-4">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">{truncateText(item.text, 50)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getVoiceParameters(item.history_item_id) && (
                                    <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-pink-100 dark:bg-pink-500/20 border border-pink-300 dark:border-pink-500/50 text-pink-700 dark:text-pink-300">
                                      <Check size={8} className="mr-1" />
                                      Params
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.date_unix * 1000)}</span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-white/60 dark:bg-gray-900/60 p-4 rounded-lg space-y-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Generated: {formatDate(item.date_unix * 1000)}</p>
                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700" onClick={() => handlePlayHistoryAudio(item)} disabled={isLoadingHistoryAudio && selectedHistoryItem?.history_item_id === item.history_item_id}>
                                    {isLoadingHistoryAudio && selectedHistoryItem?.history_item_id === item.history_item_id ? (
                                      <>
                                        <Loader2 size={12} className="mr-1 animate-spin" />
                                        Loading
                                      </>
                                    ) : (
                                      <>
                                        <Play size={12} className="mr-1" />
                                        Play
                                      </>
                                    )}
                                  </Button>
                                  <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700" onClick={() => handleUseHistoryText(item)}>
                                    <RefreshCw size={12} className="mr-1" />
                                    Use Text
                                  </Button>
                                  <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white" onClick={() => prepareHistoryItemForSale(item)}>
                                    <ShoppingCart size={12} className="mr-1" />
                                    Submit Sale
                                  </Button>
                                  {selectedHistoryItem?.history_item_id === item.history_item_id && historyAudio && (
                                    <>
                                      <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700" onClick={handleStopHistoryAudio}>
                                        <X size={12} className="mr-1" />
                                        Stop
                                      </Button>
                                      <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 border-slate-200/50 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-gray-700" onClick={() => handleDownloadHistoryAudio(item)}>
                                        <Download size={12} className="mr-1" />
                                        Download
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-8">
                        <Clock size={48} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-300 mb-1">No history found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Generate some audio to see it here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Voice Note Card */}
          <VoiceNoteCard
            voiceText={voiceText}
            model={availableVoices.find((m) => m.voiceId === selectedVoice)?.name || ""}
            audioNo={audioNo}
          />
        </div>
      </div>

      {/* Status Section */}
      {generationStatus && !voiceError && (
        <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Generation Status</h3>
                <p className="text-gray-600 dark:text-gray-300">{generationStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audio Elements */}
      {generatedAudio?.audioUrl && (
        <audio ref={audioRef} src={generatedAudio.audioUrl} preload="metadata" style={{ display: "none" }} />
      )}
      {historyAudio?.audioUrl && (
        <audio ref={historyAudioRef} src={historyAudio.audioUrl} preload="metadata" style={{ display: "none" }} />
      )}
    </div>
  );
};

export default AIVoiceGenerator;
