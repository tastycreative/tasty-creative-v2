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
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";
import VoiceNoteCard from "./VoiceNoteCard";

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
} from "@/app/services/elevenlabs-implementation";
import { truncateText, formatDate } from "@/lib/utils";

// Profile status type - simplified to 3 states
type ProfileStatus = "healthy" | "low-credits" | "error";

const AIVoicePage = () => {
  // API Key Profile state
  const [selectedApiKeyProfile, setSelectedApiKeyProfile] =
    useState("account_1");
  const [apiKeyBalance, setApiKeyBalance] = useState<ApiKeyBalance | null>(
    null
  );
  // Profile statuses state - simplified
  const [profileStatuses, setProfileStatuses] = useState<
    Record<string, ProfileStatus>
  >({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {}
  );
  const [isCheckingStatuses, setIsCheckingStatuses] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [showHistory, setShowHistory] = useState(false);
  const [speakerBoost, setSpeakerBoost] = useState(true);

  const [audioNo, setAudioNo] = useState<number>(1);

  // Voice Note Sale states
  const [salePrice, setSalePrice] = useState("");
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleSubmitStatus, setSaleSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // History sale states
  const [historySalePrice, setHistorySalePrice] = useState<
    Record<string, string>
  >({});
  const [isSubmittingHistorySale, setIsSubmittingHistorySale] = useState<
    Record<string, boolean>
  >({});
  const [historySaleStatus, setHistorySaleStatus] = useState<
    Record<
      string,
      {
        type: "success" | "error";
        message: string;
      }
    >
  >({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);
  const characterLimit = 1000;

  const [generationStatus, setGenerationStatus] = useState("");

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

  // Function to check all profile statuses
  const checkAllProfileStatuses = async () => {
    setIsCheckingStatuses(true);

    const profiles = Object.keys(API_KEY_PROFILES);
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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 max-w-xs">
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

      const result = await fetchHistoryFromElevenLabs(
        selectedApiKeyProfile,
        selectedVoice,
        100,
        1,
        forceRefresh
      );

      setHistoryEntries(result.items || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error loading history:", error);
      setHistoryError("Failed to load history from ElevenLabs");
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

  // Function to handle voice note sale submission
  const handleSubmitSale = async () => {
    if (!generatedAudio || !selectedApiKeyProfile || !salePrice) {
      setSaleSubmitStatus({
        type: "error",
        message: "Please generate a voice note first and enter a sale price",
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

    try {
      // Generate a unique ID for this sale (since we don't have history_item_id for newly generated audio)
      const saleId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch("/api/vn-sales/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: saleId,
          model:
            generatedAudio.voiceName ||
            availableVoices.find((v) => v.voiceId === selectedVoice)?.name ||
            "Unknown Voice",
          voiceNote: voiceText,
          sale: price,
          soldDate: new Date().toISOString(),
          status: "Completed",
        }),
      });

      if (response.ok) {
        setSaleSubmitStatus({
          type: "success",
          message: `Voice note sale of ${price.toFixed(2)} submitted successfully!`,
        });
        setSalePrice("");

        // Clear the status after 5 seconds
        setTimeout(() => {
          setSaleSubmitStatus(null);
        }, 5000);
      } else {
        const errorData = await response.json();

        // Handle specific authentication errors
        if (response.status === 401) {
          setSaleSubmitStatus({
            type: "error",
            message:
              "Authentication required. Please sign in as an admin to submit sales.",
          });
        } else if (response.status === 403) {
          if (errorData.error === "GooglePermissionDenied") {
            setSaleSubmitStatus({
              type: "error",
              message:
                "Google authentication expired. Please refresh the page and sign in again.",
            });
          } else {
            setSaleSubmitStatus({
              type: "error",
              message: "Admin access required to submit sales.",
            });
          }
        } else {
          throw new Error(
            errorData.error || "Failed to submit voice note sale"
          );
        }
      }
    } catch (error: any) {
      console.error("Sale submission error:", error);

      // Handle specific error messages
      if (error.message.includes("Access token expired")) {
        setSaleSubmitStatus({
          type: "error",
          message:
            "Google authentication expired. Please refresh the page and sign in again.",
        });
      } else if (error.message.includes("Not authenticated")) {
        setSaleSubmitStatus({
          type: "error",
          message: "Please sign in as an admin to submit sales.",
        });
      } else {
        setSaleSubmitStatus({
          type: "error",
          message: error.message || "Failed to submit voice note sale",
        });
      }
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Function to handle history item sale submission
  const handleSubmitHistorySale = async (historyItem: HistoryItem) => {
    const itemId = historyItem.history_item_id;
    const price = parseFloat(historySalePrice[itemId] || "");

    if (isNaN(price) || price <= 0) {
      setHistorySaleStatus((prev) => ({
        ...prev,
        [itemId]: {
          type: "error",
          message: "Please enter a valid sale price",
        },
      }));
      return;
    }

    setIsSubmittingHistorySale((prev) => ({ ...prev, [itemId]: true }));
    setHistorySaleStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[itemId];
      return newStatus;
    });

    try {
      const response = await fetch("/api/vn-sales/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: historyItem.history_item_id,
          model:
            historyItem.voice_name ||
            availableVoices.find((v) => v.voiceId === selectedVoice)?.name ||
            "Unknown Voice",
          voiceNote: historyItem.text,
          sale: price,
          soldDate: new Date().toISOString(),
          status: "Completed",
          generatedDate: new Date(historyItem.date_unix * 1000).toISOString(),
        }),
      });

      if (response.ok) {
        setHistorySaleStatus((prev) => ({
          ...prev,
          [itemId]: {
            type: "success",
            message: `Sale of ${price.toFixed(2)} submitted successfully!`,
          },
        }));
        setHistorySalePrice((prev) => ({ ...prev, [itemId]: "" }));

        // Clear the status after 5 seconds
        setTimeout(() => {
          setHistorySaleStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[itemId];
            return newStatus;
          });
        }, 5000);
      } else {
        const errorData = await response.json();

        // Handle specific authentication errors
        if (response.status === 401) {
          setHistorySaleStatus((prev) => ({
            ...prev,
            [itemId]: {
              type: "error",
              message:
                "Authentication required. Please sign in as an admin to submit sales.",
            },
          }));
        } else if (response.status === 403) {
          if (errorData.error === "GooglePermissionDenied") {
            setHistorySaleStatus((prev) => ({
              ...prev,
              [itemId]: {
                type: "error",
                message:
                  "Google authentication expired. Please refresh the page and sign in again.",
              },
            }));
          } else {
            setHistorySaleStatus((prev) => ({
              ...prev,
              [itemId]: {
                type: "error",
                message: "Admin access required to submit sales.",
              },
            }));
          }
        } else {
          throw new Error(
            errorData.error || "Failed to submit voice note sale"
          );
        }
      }
    } catch (error: any) {
      console.error("History sale submission error:", error);

      // Handle specific error messages
      if (error.message.includes("Access token expired")) {
        setHistorySaleStatus((prev) => ({
          ...prev,
          [itemId]: {
            type: "error",
            message:
              "Google authentication expired. Please refresh the page and sign in again.",
          },
        }));
      } else if (error.message.includes("Not authenticated")) {
        setHistorySaleStatus((prev) => ({
          ...prev,
          [itemId]: {
            type: "error",
            message: "Please sign in as an admin to submit sales.",
          },
        }));
      } else {
        setHistorySaleStatus((prev) => ({
          ...prev,
          [itemId]: {
            type: "error",
            message: error.message || "Failed to submit voice note sale",
          },
        }));
      }
    } finally {
      setIsSubmittingHistorySale((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handlePlayHistoryAudio = async (historyItem: HistoryItem) => {
    try {
      setIsLoadingHistoryAudio(true);
      setSelectedHistoryItem(historyItem);
      setHistoryError("");

      const audio = await getHistoryAudio(
        selectedApiKeyProfile,
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
      setHistoryError("Failed to load audio from history");
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

  useEffect(() => {
    const fetchApiData = async () => {
      if (!selectedApiKeyProfile) return;

      setVoiceError("");

      try {
        const balance = await checkApiKeyBalance(selectedApiKeyProfile);
        setApiKeyBalance(balance);

        // Extract error message from the response
        const errorMessage = balance?.error || "";

        // Update status for the selected profile
        const status = determineProfileStatus(balance, errorMessage);
        setProfileStatuses((prev) => ({
          ...prev,
          [selectedApiKeyProfile]: status,
        }));

        // Store error message if present
        if (errorMessage) {
          setProfileErrors((prev) => ({
            ...prev,
            [selectedApiKeyProfile]: errorMessage,
          }));
        } else {
          setProfileErrors((prev) => ({
            ...prev,
            [selectedApiKeyProfile]: "",
          }));
        }

        const profileVoices = getVoicesForProfile(selectedApiKeyProfile);
        setAvailableVoices(profileVoices);

        setSelectedVoice(profileVoices[0]?.voiceId || "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error fetching API data:", error);
        setApiKeyBalance({
          character: {
            limit: 0,
            remaining: 0,
            used: 0,
          },
          status: "error",
        });
        setProfileStatuses((prev) => ({
          ...prev,
          [selectedApiKeyProfile]: "error",
        }));
        setProfileErrors((prev) => ({
          ...prev,
          [selectedApiKeyProfile]: error.message || error.toString(),
        }));
        setVoiceError("There was an issue connecting to the API.");
      } finally {
      }
    };

    fetchApiData();
  }, [selectedApiKeyProfile]);

  // Check all profile statuses on component mount
  useEffect(() => {
    checkAllProfileStatuses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white mb-2">
            Professional AI Voice Generation
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Convert text to high-quality professional voices using ElevenLabs
          </p>
        </div>

        {/* Status Guide */}
        <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">💡 Status Guide</CardTitle>
            <CardDescription className="text-gray-400">
              Understanding account status indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-white font-medium">Green - Healthy</p>
                  <p className="text-sm text-gray-400">
                    100,000+ credits remaining
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-white font-medium">Yellow - Low Credits</p>
                  <p className="text-sm text-gray-400">
                    Below 100,000 remaining
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-white font-medium">Red - Problems</p>
                  <p className="text-sm text-gray-400">
                    Issues, billing problems, or no credits
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Profile & Balance Card */}
        <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - API Profile */}
              <div className="space-y-4">
                <Label className="text-gray-300 text-sm font-medium">
                  API Profile
                </Label>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedApiKeyProfile}
                    onValueChange={setSelectedApiKeyProfile}
                  >
                    <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg flex-1">
                      <SelectValue placeholder="Select API profile" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      {Object.entries(API_KEY_PROFILES).map(
                        ([key, profile]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-3 py-1">
                              <StatusIndicator
                                status={profileStatuses[key] || "error"}
                                profileKey={key}
                              />
                              <span>{profile.name}</span>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black/60 border-white/10 text-white hover:bg-black/80 text-xs"
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
                {apiKeyBalance && (
                  <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-green-900/30 text-green-300 border border-green-500/30">
                    <span>API Connected</span>
                  </div>
                )}
              </div>

              {/* Right side - Characters remaining */}
              {apiKeyBalance && (
                <div className="flex flex-col justify-end items-end text-right">
                  <p className="text-sm text-gray-400 mb-1">
                    Characters remaining
                  </p>
                  <p className="text-2xl font-semibold text-white">
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
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Voice Selection</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose your voice and AI model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-300 mb-3 block font-medium">
                    Select Voice ({availableVoices.length} available)
                  </Label>
                  <Select
                    value={selectedVoice}
                    onValueChange={setSelectedVoice}
                    disabled={availableVoices.length === 0}
                  >
                    <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg h-12">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white max-h-72">
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.voiceId} value={voice.voiceId}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300 mb-3 block font-medium">
                    AI Model
                  </Label>
                  <Select
                    value={selectedModelId}
                    onValueChange={setSelectedModelId}
                  >
                    <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      {ELEVEN_LABS_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-400 mt-2">
                    {ELEVEN_LABS_MODELS.find((m) => m.id === selectedModelId)
                      ?.description || ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Voice Text</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the text you want to convert to speech
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter text to convert to speech..."
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  maxLength={characterLimit}
                  className="bg-black/60 border-white/10 text-white rounded-lg min-h-32 text-base leading-relaxed"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Label className="text-gray-300">Audio No:</Label>
                    <Input
                      value={audioNo}
                      onChange={(e) => setAudioNo(Number(e.target.value))}
                      type="number"
                      min={1}
                      className="w-20 bg-black/60 border-white/10 text-white rounded-lg"
                    />
                  </div>
                  <div className="text-sm text-gray-400">
                    {voiceText.length}/{characterLimit} characters
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Parameters */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Voice Parameters</CardTitle>
                <CardDescription className="text-gray-400">
                  Fine-tune your voice generation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 font-medium">
                        Stability
                      </Label>
                      <span className="text-sm text-purple-300 font-mono">
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
                    <p className="text-xs text-gray-400 mt-2">
                      Higher values make the voice more consistent between
                      generations
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 font-medium">
                        Similarity
                      </Label>
                      <span className="text-sm text-purple-300 font-mono">
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
                    <p className="text-xs text-gray-400 mt-2">
                      Higher values make the voice more similar to the original
                      voice
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 font-medium">Speed</Label>
                      <span className="text-sm text-purple-300 font-mono">
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
                    <p className="text-xs text-gray-400 mt-2">
                      Adjust speaking speed (0.7x slower to 1.2x faster)
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 font-medium">
                        Style Exaggeration
                      </Label>
                      <span className="text-sm text-purple-300 font-mono">
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
                    <p className="text-xs text-gray-400 mt-2">
                      Higher values emphasize the voice style more strongly
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="space-y-4">
              {voiceError && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/20 border-red-500/30 text-red-200"
                >
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{voiceError}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-lg font-semibold"
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
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Voice Preview</CardTitle>
                <CardDescription className="text-gray-400">
                  Listen to and download your generated voice
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedAudio ? (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                        <Volume2 size={40} className="text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {generatedAudio.voiceName}
                      </h3>
                      <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
                        {voiceText.length > 100
                          ? voiceText.substring(0, 100) + "..."
                          : voiceText}
                      </p>
                      {generatedAudio.profile && (
                        <div className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-purple-800/50 border border-purple-400/30">
                          {generatedAudio.profile}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-6"
                        onClick={handlePlayAudio}
                      >
                        <Play size={16} className="mr-2" /> Play
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-6"
                        onClick={handleStopAudio}
                      >
                        <X size={16} className="mr-2" /> Stop
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-6"
                        onClick={handleDownloadAudio}
                      >
                        <Download size={16} className="mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                ) : selectedHistoryItem && historyAudio ? (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                        <Volume2 size={40} className="text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {selectedHistoryItem.voice_name || "Voice"}
                      </h3>
                      <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
                        {selectedHistoryItem.text &&
                        selectedHistoryItem.text.length > 100
                          ? selectedHistoryItem.text.substring(0, 100) + "..."
                          : selectedHistoryItem.text || ""}
                      </p>
                      <div className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-blue-800/50 border border-blue-400/30">
                        History Item
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-6"
                        onClick={() =>
                          historyAudioRef.current &&
                          historyAudioRef.current.play()
                        }
                      >
                        <Play size={16} className="mr-2" /> Play
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-6"
                        onClick={handleStopHistoryAudio}
                      >
                        <X size={16} className="mr-2" /> Stop
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-6"
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
                    <Mic size={64} className="mx-auto mb-4 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      No Audio Generated Yet
                    </h3>
                    <p className="text-gray-400">
                      {!selectedVoice
                        ? "Select a voice to get started"
                        : "Generated voice will appear here"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Note Sale Submission */}
            {generatedAudio && (
              <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center">
                    <DollarSign size={20} className="mr-2" />
                    Submit Voice Note Sale
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Record a sale for your generated voice note (requires admin
                    access)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-blue-400" />
                      <span className="text-blue-300 font-medium">
                        Admin Required
                      </span>
                    </div>
                    <p className="text-blue-200 text-sm">
                      Voice note sales are saved to Google Sheets and require
                      admin authentication. If you get an authentication error,
                      please refresh the page and sign in again.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">
                        API Profile
                      </Label>
                      <div className="bg-black/60 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <StatusIndicator
                            status={
                              profileStatuses[selectedApiKeyProfile] || "error"
                            }
                            profileKey={selectedApiKeyProfile}
                          />
                          <span className="text-white">
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
                      <Label className="text-gray-300 mb-2 block">
                        Sale Price ($)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="Enter sale amount"
                        className="bg-black/60 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-black/60 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 size={16} className="text-purple-400" />
                      <span className="text-white font-medium">
                        {generatedAudio.voiceName}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {voiceText.length > 100
                        ? voiceText.substring(0, 100) + "..."
                        : voiceText}
                    </p>
                  </div>

                  {saleSubmitStatus && (
                    <Alert
                      className={
                        saleSubmitStatus.type === "success"
                          ? "bg-green-900/20 border-green-500/30 text-green-200"
                          : "bg-red-900/20 border-red-500/30 text-red-200"
                      }
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

                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    onClick={handleSubmitSale}
                    disabled={isSubmittingSale || !salePrice || !generatedAudio}
                  >
                    {isSubmittingSale ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Submitting Sale...
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} className="mr-2" />
                        Submit Sale
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Voice History */}
            {selectedVoice && (
              <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center">
                        <Clock size={20} className="mr-2" />
                        Voice History
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Previous generations for this voice
                      </CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-black/60 border-white/10 text-white hover:bg-black/80"
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        {showHistory ? "Hide" : "Show"}
                      </Button>
                      {showHistory && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-black/60 border-white/10 text-white hover:bg-black/80"
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
                      )}
                    </div>
                  </div>
                </CardHeader>

                {showHistory && (
                  <CardContent>
                    {historyError && (
                      <Alert
                        variant="destructive"
                        className="mb-4 bg-red-900/20 border-red-500/30 text-red-200"
                      >
                        <AlertDescription>{historyError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="max-h-96 overflow-y-auto border border-white/10 rounded-lg bg-black/40 p-4">
                      {isLoadingHistory && historyEntries.length === 0 ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2
                            size={32}
                            className="animate-spin text-purple-400"
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
                              className="border-white/10 bg-black/20 rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center justify-between w-full text-left">
                                  <div className="flex-1 mr-4">
                                    <p className="text-sm text-gray-300 truncate max-w-xs">
                                      {truncateText(item.text, 50)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getVoiceParameters(
                                      item.history_item_id
                                    ) && (
                                      <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-green-800/50 border border-green-400/30">
                                        <Check size={8} className="mr-1" />
                                        Params
                                      </div>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {formatDate(item.date_unix * 1000)}
                                    </span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="bg-black/30 p-4 rounded-lg space-y-4">
                                  <p className="text-sm text-gray-300 leading-relaxed">
                                    {item.text}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Generated:{" "}
                                    {formatDate(item.date_unix * 1000)}
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
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
                                      className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                      onClick={() => handleUseHistoryText(item)}
                                    >
                                      <RefreshCw size={12} className="mr-1" />
                                      Use Text
                                    </Button>

                                    {selectedHistoryItem?.history_item_id ===
                                      item.history_item_id &&
                                      historyAudio && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                            onClick={handleStopHistoryAudio}
                                          >
                                            <X size={12} className="mr-1" />
                                            Stop
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
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

                                  {/* History Sale Submission Section */}
                                  <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                      <DollarSign
                                        size={14}
                                        className="text-green-400"
                                      />
                                      <span className="text-sm font-medium text-white">
                                        Submit Sale
                                      </span>
                                    </div>

                                    <div className="flex gap-2 items-end">
                                      <div className="flex-1">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={
                                            historySalePrice[
                                              item.history_item_id
                                            ] || ""
                                          }
                                          onChange={(e) =>
                                            setHistorySalePrice((prev) => ({
                                              ...prev,
                                              [item.history_item_id]:
                                                e.target.value,
                                            }))
                                          }
                                          placeholder="Sale price ($)"
                                          className="bg-white/5 border-white/10 text-white text-sm h-8"
                                        />
                                      </div>
                                      <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white h-8"
                                        onClick={() =>
                                          handleSubmitHistorySale(item)
                                        }
                                        disabled={
                                          isSubmittingHistorySale[
                                            item.history_item_id
                                          ] ||
                                          !historySalePrice[
                                            item.history_item_id
                                          ]
                                        }
                                      >
                                        {isSubmittingHistorySale[
                                          item.history_item_id
                                        ] ? (
                                          <>
                                            <Loader2
                                              size={12}
                                              className="mr-1 animate-spin"
                                            />
                                            Submitting
                                          </>
                                        ) : (
                                          <>
                                            <DollarSign
                                              size={12}
                                              className="mr-1"
                                            />
                                            Submit
                                          </>
                                        )}
                                      </Button>
                                    </div>

                                    {/* History Sale Status */}
                                    {historySaleStatus[
                                      item.history_item_id
                                    ] && (
                                      <Alert
                                        className={`mt-2 ${
                                          historySaleStatus[
                                            item.history_item_id
                                          ].type === "success"
                                            ? "bg-green-900/20 border-green-500/30 text-green-200"
                                            : "bg-red-900/20 border-red-500/30 text-red-200"
                                        }`}
                                      >
                                        {historySaleStatus[item.history_item_id]
                                          .type === "success" ? (
                                          <CheckCircle className="h-3 w-3" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        <AlertDescription className="text-xs">
                                          {
                                            historySaleStatus[
                                              item.history_item_id
                                            ].message
                                          }
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-8">
                          <Clock
                            size={48}
                            className="mx-auto mb-3 text-gray-500"
                          />
                          <p className="text-gray-400 mb-1">No history found</p>
                          <p className="text-sm text-gray-500">
                            Generate some audio to see it here
                          </p>
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
              model={
                availableVoices.find((m) => m.voiceId === selectedVoice)
                  ?.name || ""
              }
              audioNo={audioNo}
            />
          </div>
        </div>

        {/* Status Section */}
        {generationStatus && !voiceError && (
          <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <h3 className="font-medium text-white mb-1">
                    Generation Status
                  </h3>
                  <p className="text-gray-300">{generationStatus}</p>
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
    </div>
  );
};

export default AIVoicePage;
