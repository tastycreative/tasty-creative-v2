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

const AIVoicePage = () => {
  // API Key Profile state
  const [selectedApiKeyProfile, setSelectedApiKeyProfile] =
    useState("account_1");
  const [apiKeyBalance, setApiKeyBalance] = useState<ApiKeyBalance | null>(
    null
  );
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);
  const characterLimit = 1000;

  const [generationStatus, setGenerationStatus] = useState("");

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
        setVoiceError("There was an issue connecting to the API.");
      } finally {
      }
    };

    fetchApiData();
  }, [selectedApiKeyProfile]);

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

        {/* API Profile & Balance Card */}
        <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <Label className="text-gray-300 text-sm font-medium">
                  API Profile
                </Label>
                <Select
                  value={selectedApiKeyProfile}
                  onValueChange={setSelectedApiKeyProfile}
                >
                  <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg mt-2 w-full md:w-80">
                    <SelectValue placeholder="Select API profile" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 text-white">
                    {Object.entries(API_KEY_PROFILES).map(([key, profile]) => (
                      <SelectItem key={key} value={key}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {apiKeyBalance && (
                <div className="flex flex-col items-end space-y-2">
                  <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-green-900/30 text-green-300 border border-green-500/30">
                    <Check size={14} className="mr-2" />
                    API Connected
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      Characters remaining
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {apiKeyBalance?.character?.remaining !== undefined
                        ? apiKeyBalance.character.remaining.toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
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
