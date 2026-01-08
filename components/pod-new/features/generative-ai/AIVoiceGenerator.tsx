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
  ArrowRight,
  ShoppingCart,
  Info,
  Receipt,
  BookOpen,
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
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import SubmittedSalesTab from "@/components/SubmittedSalesTab";

import {
  generateVoice,
  downloadAudio,
  API_KEY_PROFILES,
  checkApiKeyBalance,
  ELEVEN_LABS_MODELS,
  fetchHistoryFromElevenLabs,
  getHistoryAudio,
  getVoiceParameters,
  getVoicesForProfile,
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
  account_key?: string; // Track which API profile was used
  characters_used?: number; // Track how many characters were used
}

interface HistoryAudio {
  audioBlob: Blob;
  audioUrl: string;
  historyItemId: string;
}

// Profile status type - simplified to 3 states
type ProfileStatus = "healthy" | "low-credits" | "error";

const AIVoicePage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<"generation" | "history" | "sales">("generation");

  // Dynamic Voice Model Profiles
  const [voiceModels, setVoiceModels] = useState<any[]>([]);
  const [selectedApiKeyProfile, setSelectedApiKeyProfile] =
    useState<string>("");
  const [apiKeyBalance, setApiKeyBalance] = useState<ApiKeyBalance | null>(
    null
  );
  const [profileStatuses, setProfileStatuses] = useState<
    Record<string, ProfileStatus>
  >({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {}
  );
  const [isCheckingStatuses, setIsCheckingStatuses] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voiceText, setVoiceText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(
    "eleven_multilingual_v2"
  );
  const [stability, setStability] = useState(0.5);
  const [clarity, setClarity] = useState(0.75);
  const [speed, setSpeed] = useState(1.0);
  const [styleExaggeration, setStyleExaggeration] = useState(0.3);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(
    null
  );
  const [voiceError, setVoiceError] = useState("");

  // History states
  const [historyEntries, setHistoryEntries] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<HistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingHistoryAudio, setIsLoadingHistoryAudio] = useState(false);
  const [historyAudio, setHistoryAudio] = useState<HistoryAudio | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [speakerBoost, setSpeakerBoost] = useState(true);

  const [audioNo, setAudioNo] = useState<number>(1);

  // Audio tags dialog state
  const [showAudioTagsDialog, setShowAudioTagsDialog] = useState(false);

  // Voice Note Sale states
  const [salePrice, setSalePrice] = useState("");
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleSubmitStatus, setSaleSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // VN Stats states
  const [vnStats, setVnStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);

  // State for history item prepared for sale
  const [historyItemForSale, setHistoryItemForSale] =
    useState<HistoryItem | null>(null);
  const [saleFormHighlighted, setSaleFormHighlighted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);
  const saleFormRef = useRef<HTMLDivElement | null>(null);
  const characterLimit = 1000;

  const [generationStatus, setGenerationStatus] = useState("");

  // Function to load VN stats
  const loadVnStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/vn-sales/stats");
      if (response.ok) {
        const stats = await response.json();
        setVnStats(stats);
        console.log("VN Stats loaded in AIVoicePage:", stats);
      } else if (response.status === 401) {
        // Unauthorized - user doesn't have admin/moderator access
        // This is expected for regular users, so don't log as error
        console.log("VN Stats not available - admin access required");
        setVnStats(null);
      } else {
        console.error("Failed to load VN stats:", response.status);
        setVnStats(null);
      }
    } catch (error) {
      // Only log network errors, not authentication errors
      console.log("VN Stats service unavailable:", error);
      setVnStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Function to prepare history item for sale
  const prepareHistoryItemForSale = (historyItem: HistoryItem) => {
    // Set the history item for sale
    setHistoryItemForSale(historyItem);

    // Update the voice text to match the history item
    setVoiceText(historyItem.text);

    // Clear any existing sale price and status
    setSalePrice("");
    setSaleSubmitStatus(null);
    setShowSaleSuccess(false);

    // Switch to history tab
    setActiveTab("history");

    // Highlight the sale form
    setSaleFormHighlighted(true);

    // Scroll to the sale form after a short delay to allow tab switch
    setTimeout(() => {
      if (saleFormRef.current) {
        saleFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 300);

    // Remove highlight after 3 seconds
    setTimeout(() => {
      setSaleFormHighlighted(false);
    }, 3000);

    // Show success message
    setGenerationStatus(
      `History item loaded for sale: "${truncateText(historyItem.text, 50)}"`
    );
    setTimeout(() => setGenerationStatus(""), 4000);
  };

  // Function to determine profile status - simplified to 3 states
  const determineProfileStatus = (
    balance: any,
    error?: string
  ): ProfileStatus => {
    // If there's any error or API issues, it's red (error)
    if (!balance || balance.status === "error" || error) {
      return "error";
    }

    // Check for billing/payment issues in subscription data - also red
    if (balance.subscription) {
      const sub = balance.subscription;
      if (
        sub.status &&
        (sub.status === "incomplete" ||
          sub.status === "past_due" ||
          sub.status === "unpaid")
      ) {
        return "error";
      }
      if (
        sub.payment_failed ||
        sub.billing_issue ||
        sub.subscription_status === "past_due"
      ) {
        return "error";
      }
    }

    const remaining = balance.character?.remaining || 0;
    const limit = balance.character?.limit || 0;

    // If we have invalid numbers, it's an error (red)
    if (limit === 0 && remaining === 0) {
      return "error";
    }

    // If no credits remaining, it's an error (red)
    if (remaining === 0) {
      return "error";
    }

    // If below 100,000 credits, it's yellow (low-credits)
    if (remaining < 100000) {
      return "low-credits";
    }

    // Otherwise, it's green (healthy)
    return "healthy";
  };

  // Function to check status of a single profile - simplified
  const checkProfileStatus = async (
    profileKey: string
  ): Promise<ProfileStatus> => {
    try {
      setProfileStatuses((prev) => ({ ...prev, [profileKey]: "error" })); // Show red while checking
      setProfileErrors((prev) => ({ ...prev, [profileKey]: "" }));

      console.log(`Checking status for ${profileKey}...`);

      const balance = await checkApiKeyBalance(profileKey);
      console.log(`Balance result for ${profileKey}:`, balance);

      // Extract error message from the response
      const errorMessage = balance?.error || "";

      const status = determineProfileStatus(balance, errorMessage);

      // Store the error message for display
      if (errorMessage) {
        setProfileErrors((prev) => ({ ...prev, [profileKey]: errorMessage }));
      }

      setProfileStatuses((prev) => ({ ...prev, [profileKey]: status }));
      return status;
    } catch (error: any) {
      console.error(`Error checking status for ${profileKey}:`, error);

      const errorMessage = error.message || error.toString();
      setProfileErrors((prev) => ({ ...prev, [profileKey]: errorMessage }));

      setProfileStatuses((prev) => ({ ...prev, [profileKey]: "error" }));
      return "error";
    }
  };

  // Function to check all profile statuses (dynamic)
  const checkAllProfileStatuses = async () => {
    setIsCheckingStatuses(true);
    const profiles = voiceModels.map((model) => model.accountKey || model.id);
    const statusPromises = profiles.map((profileKey) =>
      checkProfileStatus(profileKey)
    );
    try {
      await Promise.allSettled(statusPromises);
    } catch (error) {
      console.error("Error checking profile statuses:", error);
    } finally {
      setIsCheckingStatuses(false);
    }
  };

  // Function to get status indicator props - simplified to 3 states
  const getStatusIndicator = (status: ProfileStatus) => {
    switch (status) {
      case "healthy":
        return {
          color: "bg-green-400",
          pulse: false,
          tooltip: "Account is healthy with plenty of credits",
        };
      case "low-credits":
        return {
          color: "bg-yellow-400",
          pulse: true,
          tooltip: "Low credits (below 100,000 remaining)",
        };
      case "error":
      default:
        return {
          color: "bg-red-500",
          pulse: false,
          tooltip: "Account has problems or no credits",
        };
    }
  };

  // Status Indicator Component - simplified
  const StatusIndicator = ({
    status,
    profileKey,
  }: {
    status: ProfileStatus;
    profileKey?: string;
  }) => {
    const { color, pulse, tooltip } = getStatusIndicator(status);
    const errorMessage = profileKey ? profileErrors[profileKey] : "";

    let displayTooltip = tooltip;
    if (errorMessage) {
      displayTooltip = `${tooltip}: ${errorMessage}`;
    }

    return (
      <div className="relative group">
        <div
          className={`w-3 h-3 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`}
          title={displayTooltip}
        />
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-gray-700 bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 max-w-xs">
          {displayTooltip}
        </div>
      </div>
    );
  };

  const loadHistory = async (forceRefresh = false) => {
    // Only require API profile, not voice selection - load user's own history
    if (!selectedApiKeyProfile) return;

    try {
      setIsLoadingHistory(true);
      setHistoryError("");

      // Fetch user's own voice note history from database
      // If "all" is selected, don't filter by accountKey to show combined history
      const url = selectedApiKeyProfile === 'all' 
        ? '/api/voice-history/list'
        : `/api/voice-history/list?accountKey=${selectedApiKeyProfile}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch voice history');
      }

      const result = await response.json();
      setHistoryEntries(result.items || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error loading history:", error);
      setHistoryError("Failed to load your voice history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const reloadHistoryWithDelay = async () => {
    setTimeout(() => {
      loadHistory(true);
    }, 1000);
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
      const selectedVoiceDetails = availableVoices.find(
        (voice) => voice.voiceId === selectedVoice
      );

      if (!selectedVoiceDetails) {
        throw new Error("Voice not found");
      }

      const result = await generateVoice(
        selectedApiKeyProfile,
        selectedVoice,
        voiceText,
        selectedModelId,
        {
          stability,
          clarity,
          speed,
          styleExaggeration,
          speakerBoost,
        }
      );

      setGeneratedAudio({
        ...result,
        voiceName: selectedVoiceDetails.name,
      });
      setGenerationStatus("Voice generated successfully!");

      // Save to user's history in database
      try {
        // Use the real ElevenLabs history ID if available, otherwise create a fallback
        const historyId = result.historyItemId || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('Saving voice history with ID:', historyId);

        await fetch('/api/voice-history/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            elevenLabsHistoryId: historyId,
            voiceId: selectedVoice,
            voiceName: selectedVoiceDetails.name,
            accountKey: selectedApiKeyProfile,
            text: voiceText,
            charactersUsed: voiceText.length, // Track character count used
            generatedAt: new Date().toISOString(),
          }),
        });
      } catch (saveError) {
        console.error('Failed to save voice history:', saveError);
        // Don't fail the whole operation if history save fails
      }

      const balance = await checkApiKeyBalance(selectedApiKeyProfile);
      setApiKeyBalance(balance);

      // Update status for the used profile
      const errorMessage = balance?.error || "";
      const newStatus = determineProfileStatus(balance, errorMessage);
      setProfileStatuses((prev) => ({
        ...prev,
        [selectedApiKeyProfile]: newStatus,
      }));

      // Update error message
      if (errorMessage) {
        setProfileErrors((prev) => ({
          ...prev,
          [selectedApiKeyProfile]: errorMessage,
        }));
      } else {
        setProfileErrors((prev) => ({ ...prev, [selectedApiKeyProfile]: "" }));
      }

      reloadHistoryWithDelay();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Voice generation error:", error);
      setVoiceError(error.message || "Failed to generate voice");
      setGenerationStatus("");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Enhanced function to handle voice note sale submission
  const handleSubmitSale = async () => {
    // Determine the source of the sale (generated audio or history item)
    const isHistorySale = historyItemForSale && !generatedAudio;

    if (
      !isHistorySale &&
      (!generatedAudio || !selectedApiKeyProfile || !salePrice)
    ) {
      setSaleSubmitStatus({
        type: "error",
        message: "Please generate a voice note first and enter a sale price",
      });
      return;
    }

    if (
      isHistorySale &&
      (!historyItemForSale || !selectedApiKeyProfile || !salePrice)
    ) {
      setSaleSubmitStatus({
        type: "error",
        message: "Please select a history item and enter a sale price",
      });
      return;
    }

    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) {
      setSaleSubmitStatus({
        type: "error",
        message: "Please enter a valid sale price",
      });
      return;
    }

    setIsSubmittingSale(true);
    setSaleSubmitStatus(null);
    setShowSaleSuccess(false);

    try {
      let saleData;

      if (isHistorySale && historyItemForSale) {
        // History item sale
        // Always use voice_name from history item first, as it's stored with the item
        // This is important when "All Profiles" is selected and availableVoices is empty
        const voiceName =
          historyItemForSale.voice_name ||
          availableVoices.find((v) => v.voiceId === historyItemForSale.voice_id)?.name ||
          voiceModels.find((m) => m.voiceId === historyItemForSale.voice_id)?.voiceName ||
          "Unknown Voice";

        saleData = {
          model: voiceName,
          voiceNote: historyItemForSale.text,
          sale: price,
          soldDate: new Date().toISOString(),
          status: "Completed",
          generatedDate: new Date(
            historyItemForSale.date_unix * 1000
          ).toISOString(),
          originalHistoryId: historyItemForSale.history_item_id,
          source: "AIVoicePage-history",
        };
      } else {
        // Generated audio sale
        // For generated audio, we can use generatedAudio.voiceName which is set during generation
        const voiceName =
          generatedAudio?.voiceName ||
          availableVoices.find((v) => v.voiceId === selectedVoice)?.name ||
          voiceModels.find((m) => m.voiceId === selectedVoice)?.voiceName ||
          "Unknown Voice";

        saleData = {
          model: voiceName,
          voiceNote: voiceText,
          sale: price,
          soldDate: new Date().toISOString(),
          status: "Completed",
          generatedDate: new Date().toISOString(),
          source: "AIVoicePage-generated",
        };
      }

      const response = await fetch("/api/vn-sales/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        const responseData = await response.json();

        setShowSaleSuccess(true);
        setSaleSubmitStatus({
          type: "success",
          message: `Voice note sale of $${price.toFixed(2)} submitted successfully! 🎉`,
        });

        // Clear the form
        setSalePrice("");
        setHistoryItemForSale(null); // Clear history item selection

        // Refresh VN stats to show updated revenue
        await loadVnStats();

        // Refresh API balance to show updated usage
        if (selectedApiKeyProfile) {
          const balance = await checkApiKeyBalance(selectedApiKeyProfile);
          setApiKeyBalance(balance);

          const errorMessage = balance?.error || "";
          const newStatus = determineProfileStatus(balance, errorMessage);
          setProfileStatuses((prev) => ({
            ...prev,
            [selectedApiKeyProfile]: newStatus,
          }));
        }

        // Dispatch event to notify VN Sales page
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("vnSaleSubmitted", {
              detail: {
                sale: price,
                model: saleData.model,
                saleData: responseData,
                source: isHistorySale
                  ? "AIVoicePage-history"
                  : "AIVoicePage-generated",
              },
            })
          );
        }

        console.log("Sale submitted successfully:", {
          saleId: responseData.data?.id || responseData.sale?.id,
          price,
          model: saleData.model,
          isHistorySale,
          responseData,
        });

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSaleSubmitStatus(null);
          setShowSaleSuccess(false);
        }, 5000);
      } else {
        const errorData = await response.json();

        // Handle specific authentication errors
        if (response.status === 401) {
          setSaleSubmitStatus({
            type: "error",
            message:
              "Authentication required. Please sign in to submit sales.",
          });
        } else if (response.status === 403) {
          setSaleSubmitStatus({
            type: "error",
            message: "You don't have permission to submit sales.",
          });
        } else {
          throw new Error(
            errorData.error || "Failed to submit voice note sale"
          );
        }
      }
    } catch (error: any) {
      console.error("Sale submission error:", error);

      // Handle specific error messages
      setSaleSubmitStatus({
        type: "error",
        message: error.message || "Failed to submit voice note sale. Please try again.",
      });
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handlePlayHistoryAudio = async (historyItem: HistoryItem) => {
    try {
      setIsLoadingHistoryAudio(true);
      setSelectedHistoryItem(historyItem);
      setHistoryError("");

      // Use the account_key from the history item, or fall back to selectedApiKeyProfile
      // This is important when "all" profiles are selected
      const profileToUse = historyItem.account_key || selectedApiKeyProfile;

      if (!profileToUse || profileToUse === 'all') {
        throw new Error('Cannot play audio: No valid API profile associated with this history item');
      }

      // Check if this looks like a valid ElevenLabs history ID
      // Local IDs start with "local-" prefix
      const isLocalId = historyItem.history_item_id.startsWith('local-');

      if (isLocalId) {
        throw new Error('This voice was generated and saved locally. Audio playback is only available for items synced with ElevenLabs history. Please generate a new voice to get playable audio.');
      }

      const audio = await getHistoryAudio(
        profileToUse,
        historyItem.history_item_id
      );
      setHistoryAudio(audio);

      setTimeout(() => {
        if (historyAudioRef.current) {
          historyAudioRef.current
            .play()
            .catch((err) =>
              console.error("Failed to play history audio:", err)
            );
        }
      }, 100);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error playing history audio:", error);
      setHistoryError(error.message || "Failed to load audio from history");
    } finally {
      setIsLoadingHistoryAudio(false);
    }
  };

  const handleRefreshHistory = () => {
    loadHistory(true);
  };

  const handleStopHistoryAudio = () => {
    if (historyAudioRef.current) {
      historyAudioRef.current.pause();
      historyAudioRef.current.currentTime = 0;
    }
  };

  const handleDownloadHistoryAudio = (historyItem: HistoryItem) => {
    if (historyAudio?.audioBlob) {
      downloadAudio(
        historyAudio.audioBlob,
        `${historyItem.voice_name || "voice"}-${
          historyItem.history_item_id
        }.mp3`
      );
    }
  };

  const handleDownloadAudio = () => {
    if (generatedAudio?.audioBlob) {
      downloadAudio(
        generatedAudio.audioBlob,
        `${generatedAudio.voiceName}-voice.mp3`
      );
    }
  };

  const handlePlayAudio = () => {
    console.log("Trying to play audio:", generatedAudio?.audioUrl);
    if (audioRef.current && generatedAudio?.audioUrl) {
      audioRef.current
        .play()
        .catch((err) => console.error("Failed to play audio:", err));
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
      if (storedParams.stability !== undefined)
        setStability(storedParams.stability);
      if (storedParams.clarity !== undefined) setClarity(storedParams.clarity);
      if (storedParams.speed !== undefined) setSpeed(storedParams.speed);
      if (storedParams.styleExaggeration !== undefined)
        setStyleExaggeration(storedParams.styleExaggeration);
      if (storedParams.speakerBoost !== undefined)
        setSpeakerBoost(storedParams.speakerBoost);
      if (storedParams.modelId !== undefined)
        setSelectedModelId(storedParams.modelId);

      setGenerationStatus(`Voice parameters restored from history`);
      setTimeout(() => setGenerationStatus(""), 3000);
    } else {
      setGenerationStatus(`No saved parameters found for this history item`);
      setTimeout(() => setGenerationStatus(""), 3000);
    }
  };

  // Load VN stats on component mount
  useEffect(() => {
    loadVnStats();
  }, []);

  // Fetch voice models on mount
  useEffect(() => {
    const fetchVoiceModels = async () => {
      try {
        const models = await getAllVoiceModels();
        setVoiceModels(models);
        // Set default selected profile if not set
        if (!selectedApiKeyProfile && models.length > 0) {
          setSelectedApiKeyProfile(models[0].accountKey || models[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch voice models", err);
      }
    };
    fetchVoiceModels();
  }, []);

  // Update available voices when selected profile changes
  useEffect(() => {
    if (!selectedApiKeyProfile) {
      setAvailableVoices([]);
      return;
    }
    const model = voiceModels.find(
      (m) => (m.accountKey || m.id) === selectedApiKeyProfile
    );
    if (model && model.voiceId && model.voiceName) {
      setAvailableVoices([
        {
          name: model.voiceName,
          voiceId: model.voiceId,
          category: model.category || "professional",
        },
      ]);
      setSelectedVoice(model.voiceId);
    } else {
      setAvailableVoices([]);
    }
  }, [selectedApiKeyProfile, voiceModels]);

  // Check all profile statuses when voiceModels change
  useEffect(() => {
    if (voiceModels.length > 0) {
      checkAllProfileStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceModels]);

  // Auto-load history when switching to history tab
  useEffect(() => {
    if (activeTab === "history" && selectedApiKeyProfile) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedApiKeyProfile]);

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 p-6 transition-colors relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-white/40 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto space-y-8 z-10">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
              Professional AI Voice Generation
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Convert text to high-quality professional voices using ElevenLabs
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex gap-2 p-1 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl shadow-lg">
            <button
              onClick={() => setActiveTab("generation")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "generation"
                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-pink-500/30"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Volume2 size={18} />
                <span>Voice Generation</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-pink-500/30"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>History & Sales</span>
                {historyEntries.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-full font-bold">
                    {historyEntries.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "sales"
                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-pink-500/30"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt size={18} />
                <span>Submitted Sales</span>
              </div>
            </button>
          </div>
        </div>

        {/* Generation Tab Content */}
        {activeTab === "generation" && (
          <>
            {/* Status Guide */}
            <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 dark:text-gray-200">
                  💡 Status Guide
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Understanding account status indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-200 font-medium">
                        Green - Healthy
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        100,000+ credits remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-200 font-medium">
                        Yellow - Low Credits
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Below 100,000 remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-200 font-medium">
                        Red - Problems
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Issues, billing problems, or no credits
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* API Profile & Balance Card */}
        <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - API Profile */}
              <div className="space-y-4">
                <Label className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  API Profile
                </Label>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedApiKeyProfile}
                    onValueChange={setSelectedApiKeyProfile}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 rounded-lg flex-1">
                      <SelectValue placeholder="Select API profile" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200">
                      {voiceModels.map((model) => (
                        <SelectItem
                          key={model.accountKey || model.id}
                          value={model.accountKey || model.id}
                        >
                          <div className="flex items-center gap-3 py-1">
                            <StatusIndicator
                              status={
                                profileStatuses[model.accountKey || model.id] ||
                                "error"
                              }
                              profileKey={model.accountKey || model.id}
                            />
                            <span>{model.accountName || model.voiceName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-600 text-xs"
                    onClick={checkAllProfileStatuses}
                    disabled={isCheckingStatuses}
                  >
                    {isCheckingStatuses ? (
                      <Loader2 size={12} className="mr-1 animate-spin" />
                    ) : (
                      <RefreshCw size={12} className="mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>
                {voiceModels.length === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
                    <AlertTriangle
                      size={16}
                      className="text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                    />
                    <div>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                        No voice profiles available
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                        Please sign in to access voice generation features, or
                        contact an admin if you're already signed in.
                      </p>
                    </div>
                  </div>
                )}
                {apiKeyBalance && (
                  <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-pink-50 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30">
                    <span>API Connected</span>
                  </div>
                )}
              </div>

              {/* Right side - Characters remaining */}
              {apiKeyBalance && (
                <div className="flex flex-col justify-end items-end text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Characters remaining
                  </p>
                  <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                    {apiKeyBalance?.character?.remaining !== undefined
                      ? apiKeyBalance.character.remaining.toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Voice Generation Panel */}
          <div className="space-y-6">
            {/* Voice & Model Selection */}
            <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 dark:text-gray-200">
                  Voice Selection
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Choose your voice and AI model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-3 block font-medium">
                    Select Voice ({availableVoices.length} available)
                  </Label>
                  <Select
                    value={selectedVoice}
                    onValueChange={setSelectedVoice}
                    disabled={availableVoices.length === 0}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 rounded-lg h-12">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 max-h-72">
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.voiceId} value={voice.voiceId}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-3 block font-medium">
                    AI Model
                  </Label>
                  <Select
                    value={selectedModelId}
                    onValueChange={setSelectedModelId}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 rounded-lg h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200">
                      {ELEVEN_LABS_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {ELEVEN_LABS_MODELS.find((m) => m.id === selectedModelId)
                      ?.description || ""}
                  </p>
                </div>

                {/* Audio Tags Button for Eleven v3 */}
                {selectedModelId === "eleven_v3" && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info size={20} className="text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            Audio Tags Available
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Use tags to control emotions, delivery, and effects
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAudioTagsDialog(true)}
                        className="bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        <BookOpen size={16} className="mr-2" />
                        View Guide
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 dark:text-gray-200">
                  Voice Text
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Enter the text you want to convert to speech
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter text to convert to speech..."
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  maxLength={characterLimit}
                  className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 rounded-lg min-h-32 text-base leading-relaxed"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Label className="text-gray-600 dark:text-gray-400">
                      Audio No:
                    </Label>
                    <Input
                      value={audioNo}
                      onChange={(e) => setAudioNo(Number(e.target.value))}
                      type="number"
                      min={1}
                      className="w-20 bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {voiceText.length}/{characterLimit} characters
                  </div>
                </div>
                {/* Show if text is from history item */}
                {historyItemForSale && (
                  <div className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-500/20 border border-pink-200 dark:border-pink-500/30 rounded-lg">
                    <CheckCircle
                      size={16}
                      className="text-blue-400 flex-shrink-0"
                    />
                    <span className="text-blue-300 dark:text-blue-400 text-sm">
                      Text loaded from history item for sale submission
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Parameters */}
            <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 dark:text-gray-200">
                  Voice Parameters
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Fine-tune your voice generation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Eleven v3 Model - Only Stability Parameter */}
                {selectedModelId === "eleven_v3" ? (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="relative group">
                        <Label className="text-gray-600 dark:text-gray-400 font-medium underline decoration-dotted cursor-help">
                          Stability
                        </Label>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <p className="font-semibold mb-2">Sets how adventurous the model can be.</p>
                          <ul className="space-y-1">
                            <li><span className="font-semibold">• Creative:</span> expressive, varied phrasing and tone, can even sing.</li>
                            <li><span className="font-semibold">• Natural:</span> conversational balance.</li>
                            <li><span className="font-semibold">• Robust:</span> precise, stable and predictable.</li>
                          </ul>
                          {/* Arrow */}
                          <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45"></div>
                        </div>
                      </div>
                      <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                        {stability === 0 && "Creative"}
                        {stability === 0.5 && "Natural"}
                        {stability === 1 && "Robust"}
                        {stability !== 0 && stability !== 0.5 && stability !== 1 && `${(stability * 100).toFixed(0)}%`}
                      </span>
                    </div>
                    <Slider
                      value={[stability]}
                      min={0}
                      max={1}
                      step={0.5}
                      onValueChange={(value) => setStability(value[0])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <span>Creative</span>
                      <span>Natural</span>
                      <span>Robust</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                      Choose the balance between creativity and consistency
                    </p>
                  </div>
                ) : (
                  /* Other Models - Full Parameters */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="relative group">
                          <Label className="text-gray-600 dark:text-gray-400 font-medium underline decoration-dotted cursor-help">
                            Stability
                          </Label>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-80 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <p>Increasing stability will make the voice more consistent between re-generations, but it can also make it sound a bit monotone. On longer text fragments we recommend lowering this value.</p>
                            {/* Arrow */}
                            <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45"></div>
                          </div>
                        </div>
                        <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                          {stability.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[stability]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => setStability(value[0])}
                        className="py-2"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Higher values make the voice more consistent between
                        generations
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="relative group">
                          <Label className="text-gray-600 dark:text-gray-400 font-medium underline decoration-dotted cursor-help">
                            Similarity
                          </Label>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-80 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <p>High enhancement boosts overall voice clarity and target speaker similarity. Very high values can cause artifacts, so adjusting this setting to find the optimal value is encouraged.</p>
                            {/* Arrow */}
                            <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45"></div>
                          </div>
                        </div>
                        <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                          {clarity.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[clarity]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => setClarity(value[0])}
                        className="py-2"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Higher values make the voice more similar to the original
                        voice
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="relative group">
                          <Label className="text-gray-600 dark:text-gray-400 font-medium underline decoration-dotted cursor-help">
                            Speed
                          </Label>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-80 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <p className="mb-2">Controls the speed of the generated speech.</p>
                            <p className="mb-2">Values below 1.0 will slow down the speech, while values above 1.0 will speed it up.</p>
                            <p>Extreme values may affect the quality of the generated speech.</p>
                            {/* Arrow */}
                            <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45"></div>
                          </div>
                        </div>
                        <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                          {speed.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        value={[speed]}
                        min={0.7}
                        max={1.2}
                        step={0.01}
                        onValueChange={(value) => setSpeed(value[0])}
                        className="py-2"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Adjust speaking speed (0.7x slower to 1.2x faster)
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="relative group">
                          <Label className="text-gray-600 dark:text-gray-400 font-medium underline decoration-dotted cursor-help">
                            Style Exaggeration
                          </Label>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-80 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <p>High values are recommended if the style of the speech should be exaggerated compared to the uploaded audio. Higher values can lead to more instability in the generated speech. Setting this to 0.0 will greatly increase generation speed and is the default setting.</p>
                            {/* Arrow */}
                            <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45"></div>
                          </div>
                        </div>
                        <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                          {styleExaggeration.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[styleExaggeration]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => setStyleExaggeration(value[0])}
                        className="py-2"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Higher values emphasize the voice style more strongly
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="space-y-4">
              {voiceError && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"
                >
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{voiceError}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full h-14 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-lg font-semibold shadow-md hover:shadow-pink-500/20 transform hover:-translate-y-0.5"
                onClick={handleGenerateVoice}
                disabled={
                  isGeneratingVoice ||
                  !selectedApiKeyProfile ||
                  !selectedVoice ||
                  !voiceText.trim()
                }
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
            <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 dark:text-gray-200">
                  Voice Preview
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Listen to and download your generated voice
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedAudio ? (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 backdrop-blur-sm rounded-2xl p-8 border border-pink-200">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                        <Volume2 size={40} className="text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {generatedAudio.voiceName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                        {voiceText.length > 100
                          ? voiceText.substring(0, 100) + "..."
                          : voiceText}
                      </p>
                      {generatedAudio.profile && (
                        <div className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-pink-100 dark:bg-pink-500/20 border border-pink-300 dark:border-pink-500/30 text-pink-700 dark:text-pink-300">
                          {generatedAudio.profile}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6"
                        onClick={handlePlayAudio}
                      >
                        <Play size={16} className="mr-2" /> Play
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6"
                        onClick={handleStopAudio}
                      >
                        <X size={16} className="mr-2" /> Stop
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6"
                        onClick={handleDownloadAudio}
                      >
                        <Download size={16} className="mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                ) : selectedHistoryItem && historyAudio ? (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 backdrop-blur-sm rounded-2xl p-8 border border-pink-200">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                        <Volume2 size={40} className="text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {selectedHistoryItem.voice_name || "Voice"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                        {selectedHistoryItem.text &&
                        selectedHistoryItem.text.length > 100
                          ? selectedHistoryItem.text.substring(0, 100) + "..."
                          : selectedHistoryItem.text || ""}
                      </p>
                      <div className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300">
                        History Item
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6"
                        onClick={() =>
                          historyAudioRef.current &&
                          historyAudioRef.current.play()
                        }
                      >
                        <Play size={16} className="mr-2" /> Play
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6"
                        onClick={handleStopHistoryAudio}
                      >
                        <X size={16} className="mr-2" /> Stop
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6"
                        onClick={() =>
                          handleDownloadHistoryAudio(selectedHistoryItem)
                        }
                      >
                        <Download size={16} className="mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mic
                      size={64}
                      className="mx-auto mb-4 text-gray-500 dark:text-gray-400"
                    />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                      No Audio Generated Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {!selectedVoice
                        ? "Select a voice to get started"
                        : "Generated voice will appear here"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </>
        )}

        {/* History & Sales Tab Content */}
        {activeTab === "history" && (
          <>
            <div className="space-y-8 max-w-5xl mx-auto">
              {/* Tab Header Info */}
              <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 border-pink-200 dark:border-pink-500/30 rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-pink-500/20">
                      <Clock size={24} className="text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        History & Sales Management
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        Select an API profile to view your voice generation history and submit sales for voice notes.
                        {historyEntries.length > 0 ? ` You have ${historyEntries.length} voice generations in your history.` : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Profile Selection for History */}
              <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-700 dark:text-gray-200">
                    Select API Profile
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Choose which account's history to view, or select "All Profiles" to see everything
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Select
                      value={selectedApiKeyProfile}
                      onValueChange={setSelectedApiKeyProfile}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 rounded-lg flex-1">
                        <SelectValue placeholder="Select API profile" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200">
                        <SelectItem value="all">
                          <div className="flex items-center gap-2 py-1">
                            <span className="font-semibold">All Profiles</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">(Combined history)</span>
                          </div>
                        </SelectItem>
                        <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                        {voiceModels.map((model) => (
                          <SelectItem
                            key={model.accountKey || model.id}
                            value={model.accountKey || model.id}
                          >
                            <div className="flex items-center gap-3 py-1">
                              <StatusIndicator
                                status={
                                  profileStatuses[model.accountKey || model.id] ||
                                  "error"
                                }
                                profileKey={model.accountKey || model.id}
                              />
                              <span>{model.accountName || model.voiceName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-600 text-xs"
                      onClick={checkAllProfileStatuses}
                      disabled={isCheckingStatuses}
                    >
                      {isCheckingStatuses ? (
                        <Loader2 size={12} className="mr-1 animate-spin" />
                      ) : (
                        <RefreshCw size={12} className="mr-1" />
                      )}
                      Refresh
                    </Button>
                  </div>
                  {selectedApiKeyProfile === 'all' && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg mt-4">
                      <Info
                        size={16}
                        className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                      />
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Showing all {historyEntries.length} voice generations across all profiles
                      </p>
                    </div>
                  )}
                  {!selectedApiKeyProfile && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg mt-4">
                      <AlertTriangle
                        size={16}
                        className="text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                      />
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        Please select an API profile to view your history
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voice Note Sale Submission - Always visible in history tab */}
              <Card
                ref={saleFormRef}
                className={`bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg transition-all duration-300 ${
                  saleFormHighlighted
                    ? "ring-2 ring-green-500 ring-opacity-50 bg-green-900/10"
                    : ""
                }`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-700 dark:text-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign size={20} className="mr-2" />
                      Submit Voice Note Sale
                    </div>
                    {vnStats && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-600 text-xs"
                          onClick={loadVnStats}
                          disabled={isLoadingStats}
                        >
                          {isLoadingStats ? (
                            <Loader2 size={12} className="mr-1 animate-spin" />
                          ) : (
                            <RefreshCw size={12} className="mr-1" />
                          )}
                          Refresh Stats
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Record a sale for your{" "}
                    {historyItemForSale ? "selected history" : "generated"}{" "}
                    voice note (requires admin access)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Stats Display */}
                  {vnStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 rounded-lg border border-pink-200 dark:border-pink-500/30">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Today&apos;s Sales
                        </p>
                        <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                          $
                          {isLoadingStats
                            ? "..."
                            : vnStats.vnSalesToday?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Revenue
                        </p>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                          $
                          {isLoadingStats
                            ? "..."
                            : vnStats.totalRevenue?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total VN Count
                        </p>
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                          {isLoadingStats
                            ? "..."
                            : vnStats.totalVnCount?.toLocaleString() || "0"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Avg Price
                        </p>
                        <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                          $
                          {isLoadingStats
                            ? "..."
                            : vnStats.averageVnPrice?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Admin Access Notice */}
                  <div className="bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle
                        size={16}
                        className="text-pink-600 dark:text-pink-400"
                      />
                      <span className="text-pink-700 dark:text-pink-300 font-medium">
                        Sale Submission
                      </span>
                    </div>
                    <p className="text-pink-600 dark:text-pink-300 text-sm">
                      Voice note sales are saved to the database and tracked in your sales history.
                      You can view all sales in the Sales Tracker page.
                    </p>
                  </div>

                  {/* Form Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 dark:text-gray-300 mb-2 block">
                        API Profile
                      </Label>
                      <div className="bg-pink-50 dark:bg-gray-800/60 border border-pink-200 dark:border-pink-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <StatusIndicator
                            status={
                              profileStatuses[selectedApiKeyProfile] || "error"
                            }
                            profileKey={selectedApiKeyProfile}
                          />
                          <span className="text-gray-700 dark:text-gray-200">
                            {
                              API_KEY_PROFILES[
                                selectedApiKeyProfile as keyof typeof API_KEY_PROFILES
                              ]?.name
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-600 dark:text-gray-300 mb-2 block">
                        Sale Price ($)
                      </Label>
                      <div className="relative">
                        <DollarSign
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                      {salePrice && parseFloat(salePrice) > 0 && (
                        <p className="text-xs text-green-400 dark:text-green-300 mt-1">
                          Loyalty points:{" "}
                          {Math.floor(parseFloat(salePrice) * 0.8)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Voice Note Preview */}
                  {(generatedAudio || historyItemForSale) ? (
                  <div className="bg-pink-50 dark:bg-gray-800/60 border border-pink-200 dark:border-pink-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2
                        size={16}
                        className="text-pink-600 dark:text-pink-400"
                      />
                      <span className="text-gray-700 dark:text-gray-200 font-medium">
                        {historyItemForSale
                          ? historyItemForSale.voice_name
                          : generatedAudio?.voiceName}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-700/60 px-2 py-1 rounded">
                        {voiceText.length} characters
                      </span>
                      {historyItemForSale && (
                        <span className="text-xs text-pink-600 dark:text-pink-300 bg-pink-100 dark:bg-pink-500/20 px-2 py-1 rounded">
                          From History
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {voiceText.length > 150
                        ? voiceText.substring(0, 150) + "..."
                        : voiceText}
                    </p>
                    {historyItemForSale && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-pink-200 dark:border-pink-500/30">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Generated:
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(historyItemForSale.date_unix * 1000)}
                        </span>
                      </div>
                    )}
                  </div>
                  ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
                      <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                        No Voice Note Selected
                      </span>
                    </div>
                    <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                      Generate a voice note in the Generation tab or select one from your history below to submit a sale.
                    </p>
                  </div>
                  )}

                  {/* Status Messages */}
                  {saleSubmitStatus && (
                    <Alert
                      className={`${
                        saleSubmitStatus.type === "success"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300"
                      } ${showSaleSuccess ? "animate-pulse" : ""}`}
                    >
                      {saleSubmitStatus.type === "success" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {saleSubmitStatus.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    className={`w-full h-12 text-white font-semibold transition-all duration-300 ${
                      showSaleSuccess
                        ? "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 dark:from-pink-500 dark:to-rose-500 dark:hover:from-pink-600 dark:hover:to-rose-600"
                        : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 dark:from-pink-500 dark:to-rose-500 dark:hover:from-pink-600 dark:hover:to-rose-600"
                    }`}
                    onClick={handleSubmitSale}
                    disabled={
                      isSubmittingSale ||
                      !salePrice ||
                      (!generatedAudio && !historyItemForSale) ||
                      parseFloat(salePrice || "0") <= 0
                    }
                  >
                    {isSubmittingSale ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Submitting Sale...
                      </>
                    ) : showSaleSuccess ? (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Sale Submitted Successfully!
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} className="mr-2" />
                        Submit Sale $
                        {salePrice ? parseFloat(salePrice).toFixed(2) : "0.00"}
                      </>
                    )}
                  </Button>

                  {/* Quick Price Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-sm text-gray-600 dark:text-gray-300 w-full mb-1">
                      Quick prices:
                    </span>
                    {[5, 10, 15, 20, 25, 30].map((price) => (
                      <Button
                        key={price}
                        variant="outline"
                        size="sm"
                        className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs"
                        onClick={() => setSalePrice(price.toString())}
                      >
                        ${price}
                      </Button>
                    ))}
                  </div>

                  {/* Clear History Selection Button */}
                  {historyItemForSale && (
                    <Button
                      variant="outline"
                      className="w-full bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                      onClick={() => {
                        setHistoryItemForSale(null);
                        setSalePrice("");
                        setSaleSubmitStatus(null);
                      }}
                    >
                      <X size={16} className="mr-2" />
                      Clear History Selection
                    </Button>
                  )}
                </CardContent>
              </Card>

            {/* Voice History - Show all history for the selected API profile */}
            <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-700 dark:text-gray-200 flex items-center">
                      <Clock size={20} className="mr-2" />
                      Your Voice History
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      All voice generations from your account
                    </CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-600"
                      onClick={handleRefreshHistory}
                      disabled={isLoadingHistory}
                    >
                      {isLoadingHistory ? (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      ) : (
                        <RefreshCw size={14} className="mr-1" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                    {historyError && (
                      <Alert
                        variant="destructive"
                        className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300"
                      >
                        <AlertDescription>{historyError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="max-h-96 overflow-y-auto border border-pink-200 dark:border-pink-500/30 rounded-lg bg-white/60 dark:bg-gray-800/60 p-4">
                      {isLoadingHistory && historyEntries.length === 0 ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2
                            size={32}
                            className="animate-spin text-pink-600 dark:text-pink-400"
                          />
                        </div>
                      ) : historyEntries.length > 0 ? (
                        <Accordion
                          type="single"
                          collapsible
                          className="w-full space-y-2"
                        >
                          {historyEntries.map((item) => (
                            <AccordionItem
                              key={item.history_item_id}
                              value={item.history_item_id}
                              className="border-pink-200 dark:border-pink-500/30 bg-white/60 dark:bg-gray-700/60 rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center justify-between w-full text-left">
                                  <div className="flex-1 mr-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
                                      {truncateText(item.text, 50)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Show account key indicator when viewing "All Profiles" */}
                                    {selectedApiKeyProfile === 'all' && item.account_key && (
                                      <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-300">
                                        <Mic size={8} className="mr-1" />
                                        {voiceModels.find(m => m.accountKey === item.account_key)?.accountName || item.account_key}
                                      </div>
                                    )}
                                    {/* Show credits usage */}
                                    {item.characters_used && (
                                      <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500/50 text-green-700 dark:text-green-300">
                                        <span className="font-mono">{item.characters_used.toLocaleString()}</span>
                                        <span className="ml-1">credits</span>
                                      </div>
                                    )}
                                    {getVoiceParameters(
                                      item.history_item_id
                                    ) && (
                                      <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-pink-100 dark:bg-pink-500/20 border border-pink-300 dark:border-pink-500/50 text-pink-700 dark:text-pink-300">
                                        <Check size={8} className="mr-1" />
                                        Params
                                      </div>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDate(item.date_unix * 1000)}
                                    </span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg space-y-4">
                                  {/* Show account information */}
                                  {item.account_key && (
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                                      <Mic size={14} className="text-blue-600 dark:text-blue-400" />
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        API Profile:
                                      </span>
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                        {voiceModels.find(m => m.accountKey === item.account_key)?.accountName || item.account_key}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {item.text}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>
                                      Generated:{" "}
                                      {formatDate(item.date_unix * 1000)}
                                    </span>
                                    {item.characters_used && (
                                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 font-semibold">
                                        <span className="font-mono">{item.characters_used.toLocaleString()}</span>
                                        <span className="ml-1">credits used</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                                      onClick={() =>
                                        handlePlayHistoryAudio(item)
                                      }
                                      disabled={
                                        isLoadingHistoryAudio &&
                                        selectedHistoryItem?.history_item_id ===
                                          item.history_item_id
                                      }
                                    >
                                      {isLoadingHistoryAudio &&
                                      selectedHistoryItem?.history_item_id ===
                                        item.history_item_id ? (
                                        <>
                                          <Loader2
                                            size={12}
                                            className="mr-1 animate-spin"
                                          />
                                          Loading
                                        </>
                                      ) : (
                                        <>
                                          <Play size={12} className="mr-1" />
                                          Play
                                        </>
                                      )}
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                                      onClick={() => handleUseHistoryText(item)}
                                    >
                                      <RefreshCw size={12} className="mr-1" />
                                      Use Text
                                    </Button>

                                    {/* New Submit Sale Button */}
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 dark:from-pink-500 dark:to-rose-500 dark:hover:from-pink-600 dark:hover:to-rose-600 text-white"
                                      onClick={() =>
                                        prepareHistoryItemForSale(item)
                                      }
                                    >
                                      <ShoppingCart
                                        size={12}
                                        className="mr-1"
                                      />
                                      Submit Sale
                                    </Button>

                                    {selectedHistoryItem?.history_item_id ===
                                      item.history_item_id &&
                                      historyAudio && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                                            onClick={handleStopHistoryAudio}
                                          >
                                            <X size={12} className="mr-1" />
                                            Stop
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                                            onClick={() =>
                                              handleDownloadHistoryAudio(item)
                                            }
                                          >
                                            <Download
                                              size={12}
                                              className="mr-1"
                                            />
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
                      ) : !selectedApiKeyProfile ? (
                        <div className="text-center py-8">
                          <AlertCircle
                            size={48}
                            className="mx-auto mb-3 text-yellow-500 dark:text-yellow-400"
                          />
                          <p className="text-gray-600 dark:text-gray-300 mb-1 font-medium">
                            No API Profile Selected
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Please select an API profile from the Generation tab to view your history
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock
                            size={48}
                            className="mx-auto mb-3 text-gray-500 dark:text-gray-400"
                          />
                          <p className="text-gray-600 dark:text-gray-300 mb-1">
                            No history found
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Generate some voice notes in the Generation tab to see them here
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
              </Card>

            {/* Voice Note Card */}
            <VoiceNoteCard
              voiceText={voiceText}
              model={
                availableVoices.find((m) => m.voiceId === selectedVoice)
                  ?.name || ""
              }
              audioNo={audioNo}
            />
            </div>
          </>
        )}

        {/* Submitted Sales Tab Content */}
        {activeTab === "sales" && (
          <SubmittedSalesTab onSaleUpdated={loadVnStats} />
        )}

        {/* Status Section */}
        {generationStatus && !voiceError && (
          <Card className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Generation Status
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {generationStatus}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Audio Elements */}
      {generatedAudio?.audioUrl && (
        <audio
          ref={audioRef}
          src={generatedAudio.audioUrl}
          preload="metadata"
          style={{ display: "none" }}
          onError={(e) => console.error("Audio error:", e)}
          onLoadedData={() => console.log("Audio loaded successfully")}
        />
      )}

      {historyAudio?.audioUrl && (
        <audio
          ref={historyAudioRef}
          src={historyAudio.audioUrl}
          preload="metadata"
          style={{ display: "none" }}
          onError={(e) => console.error("History audio error:", e)}
          onLoadedData={() => console.log("History audio loaded successfully")}
        />
      )}

      {/* Audio Tags Dialog */}
      <Dialog open={showAudioTagsDialog} onOpenChange={setShowAudioTagsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl text-blue-700 dark:text-blue-300 flex items-center">
              <Info size={24} className="mr-2" />
              Audio Tags - Eleven v3
            </DialogTitle>
            <DialogDescription className="text-blue-600 dark:text-blue-400">
              Control emotions, delivery, and sound effects with audio tags
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Introduction */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Eleven v3 introduces emotional control through audio tags. You can direct voices to laugh, whisper, act sarcastic, or express curiosity among many other styles. Speed is also controlled through audio tags.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                The voice you choose and its training samples will affect tag effectiveness. Some tags work well with certain voices while others may not. Don't expect a whispering voice to suddenly shout with a <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700 dark:text-blue-300">[shout]</code> tag.
              </p>
            </div>

            {/* Voice-related tags */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                <Mic size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                Voice-related
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">These tags control vocal delivery and emotional expression:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['[laughs]', '[laughs harder]', '[starts laughing]', '[wheezing]', '[whispers]', '[sighs]', '[exhales]', '[sarcastic]', '[curious]', '[excited]', '[crying]', '[snorts]', '[mischievously]'].map((tag) => (
                  <code key={tag} className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-sm text-blue-700 dark:text-blue-300 font-mono">
                    {tag}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
                💡 These are just examples! Feel free to experiment with other emotions and vocal expressions like [shout], [anxious], [relaxed], etc.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border-l-4 border-blue-400 dark:border-blue-500">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Example:</span> <span className="font-mono italic">[whispers] I never knew it could be this way, but I'm glad we're here.</span>
                </p>
              </div>
            </div>

            {/* Sound effects */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                <Volume2 size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                Sound effects
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Add environmental sounds and effects:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['[gunshot]', '[applause]', '[clapping]', '[explosion]', '[swallows]', '[gulps]'].map((tag) => (
                  <code key={tag} className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-sm text-blue-700 dark:text-blue-300 font-mono">
                    {tag}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
                💡 Many more sound effects are available! Try experimenting with tags like [thunder], [door slam], [footsteps], and other sounds.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border-l-4 border-blue-400 dark:border-blue-500">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Example:</span> <span className="font-mono italic">[applause] Thank you all for coming tonight! [gunshot] What was that?</span>
                </p>
              </div>
            </div>

            {/* Unique and special */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                <AlertCircle size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                Unique and special
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Experimental tags for creative applications:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['[strong X accent]', '[sings]', '[woo]', '[fart]'].map((tag) => (
                  <code key={tag} className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-sm text-blue-700 dark:text-blue-300 font-mono">
                    {tag}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
                💡 ElevenLabs supports many more experimental tags! Don't be afraid to try different accents, sounds, and creative expressions.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border-l-4 border-blue-400 dark:border-blue-500 mb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Example:</span> <span className="font-mono italic">[strong French accent] "Zat's life, my friend — you can't control everysing."</span>
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-start">
                  <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  Some experimental tags may be less consistent across different voices. Test thoroughly before production use.
                </p>
              </div>
            </div>

            {/* Punctuation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Punctuation
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Punctuation significantly affects delivery in v3:</p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-3 ml-4">
                <li>• <span className="font-semibold">Ellipses (…)</span> add pauses and weight</li>
                <li>• <span className="font-semibold">Capitalization</span> increases emphasis</li>
                <li>• <span className="font-semibold">Standard punctuation</span> provides natural speech rhythm</li>
              </ul>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border-l-4 border-blue-400 dark:border-blue-500">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Example:</span> <span className="font-mono italic">"It was a VERY long day [sigh] … nobody listens anymore."</span>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIVoicePage;
