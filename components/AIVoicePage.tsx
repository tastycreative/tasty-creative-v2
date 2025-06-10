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
import React, { useRef, useState } from "react";
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
  const [showHistory, setShowHistory] = useState(false); // Toggle state for history
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

      // Fetch history from ElevenLabs API without pagination (large page size)
      const result = await fetchHistoryFromElevenLabs(
        selectedApiKeyProfile,
        selectedVoice,
        100, // Get all history items at once (or the maximum allowed)
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
    // Wait for 1 second to give the ElevenLabs API time to update
    setTimeout(() => {
      loadHistory(true); // Force refresh from API
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
      // Get the selected voice
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

      // Refresh balance after generation
      const balance = await checkApiKeyBalance(selectedApiKeyProfile);
      setApiKeyBalance(balance);

      // Refresh history
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
      setHistoryError('');

      // Get audio for this history item
      const audio = await getHistoryAudio(
        selectedApiKeyProfile,
        historyItem.history_item_id
      );
      setHistoryAudio(audio);

      // Play it
      setTimeout(() => {
        if (historyAudioRef.current) {
          historyAudioRef.current.play();
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
    loadHistory(true); // Force refresh of history
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
        `${historyItem.voice_name || "voice"}-${historyItem.history_item_id
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
    if (audioRef.current && generatedAudio?.audioUrl) {
      audioRef.current.play();
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

   const handleUseHistoryText = (historyItem: HistoryItem) => {
    // Still set the text
    setVoiceText(historyItem.text);

    // Try to get stored parameters for this history item
    const storedParams = getVoiceParameters(historyItem.history_item_id);

    if (storedParams) {
      // Apply the stored parameters
      if (storedParams.stability !== undefined)
        setStability(storedParams.stability);
      if (storedParams.clarity !== undefined) setClarity(storedParams.clarity);
      if (storedParams.speed !== undefined) setSpeed(storedParams.speed);
      if (storedParams.styleExaggeration !== undefined) setStyleExaggeration(storedParams.styleExaggeration);
      if (storedParams.speakerBoost !== undefined) setSpeakerBoost(storedParams.speakerBoost);
      if (storedParams.modelId !== undefined) setSelectedModelId(storedParams.modelId);

      // Show a success notification
      setGenerationStatus(`Voice parameters restored from history`);
      setTimeout(() => setGenerationStatus(""), 3000);
    } else {
      // If no parameters found, let the user know
      setGenerationStatus(`No saved parameters found for this history item`);
      setTimeout(() => setGenerationStatus(""), 3000);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white">
                Professional AI Voice Generation
              </CardTitle>
              <CardDescription className="text-gray-400">
                Convert text to high-quality professional voices using
                ElevenLabs
              </CardDescription>
            </div>

            {/* API Profile Selection with status indicator */}
            <div className="min-w-48">
              <Select
                value={selectedApiKeyProfile}
                onValueChange={setSelectedApiKeyProfile}
              >
                <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg w-full">
                  <SelectValue placeholder="Select API profile" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  {Object.entries(API_KEY_PROFILES).map(([key, profile]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="flex items-center"
                    >
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {apiKeyBalance && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-900/30 text-green-300 border border-green-500/30">
                    <Check size={10} className="mr-1" />
                    Active
                  </div>
                  <span className="text-gray-300">
                    {apiKeyBalance?.character?.remaining !== undefined
                      ? apiKeyBalance.character.remaining.toLocaleString()
                      : "N/A"}{" "}
                    characters left
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Voice selection with available voices from the current profile */}
            <div>
              <Label
                htmlFor="voice-selection"
                className="text-gray-300 mb-1 block"
              >
                Select Voice ({availableVoices.length} available)
              </Label>
              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
                disabled={availableVoices.length === 0}
              >
                <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white max-h-72">
                  {availableVoices.map((voice) => (
                    <SelectItem
                      key={voice.voiceId}
                      value={voice.voiceId}
                      className="flex items-center justify-between py-2"
                    >
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model selection */}
            <div>
              <Label
                htmlFor="model-selection"
                className="text-gray-300 mb-1 block"
              >
                Select AI Model
              </Label>
              <Select
                value={selectedModelId}
                onValueChange={setSelectedModelId}
              >
                <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg">
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
              <p className="text-xs text-gray-400 mt-1">
                {ELEVEN_LABS_MODELS.find((m) => m.id === selectedModelId)
                  ?.description || ""}
              </p>
            </div>

            {/* Text input */}
            <div>
              <Label htmlFor="voice-text" className="text-gray-300 mb-1 block">
                Voice Text
              </Label>
              <Textarea
                id="voice-text"
                placeholder="Enter text to convert to speech"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                maxLength={characterLimit}
                className="bg-black/60 border-white/10 text-white rounded-lg min-h-24"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {voiceText.length}/{characterLimit} characters
              </div>
            </div>

            <div className="flex gap-2 -mt-5">
              <Label className="text-gray-300">Audio No:</Label>
              <Input
                value={audioNo}
                onChange={(e) => {
                  setAudioNo(Number(e.target.value));
                }}
                type="number"
                min={1}
                className="w-[70px] bg-black/60 border-white/10 text-white rounded-l"
              />
            </div>

            {/* Voice parameters */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-gray-300">
                    Stability: {stability.toFixed(2)}
                  </Label>
                </div>
                <Slider
                  value={[stability]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setStability(value[0])}
                  className="py-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Higher values make the voice more consistent between
                  generations
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-gray-300">
                    Similarity: {clarity.toFixed(2)}
                  </Label>
                </div>
                <Slider
                  value={[clarity]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setClarity(value[0])}
                  className="py-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Higher values make the voice more similar to the original
                  voice
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-gray-300">
                    Speed: {speed.toFixed(2)}x
                  </Label>
                </div>
                <Slider
                  value={[speed]}
                  min={0.7}
                  max={1.2}
                  step={0.01}
                  onValueChange={(value) => setSpeed(value[0])}
                  className="py-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Adjust speaking speed (0.7x slower to 1.2x faster)
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-gray-300">
                    Style Exaggeration: {styleExaggeration.toFixed(2)}
                  </Label>
                </div>
                <Slider
                  value={[styleExaggeration]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setStyleExaggeration(value[0])}
                  className="py-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Higher values emphasize the voice style more strongly
                </p>
              </div>
            </div>

            {voiceError && (
              <Alert
                variant="destructive"
                className="bg-red-900/20 border-red-500/30 text-red-200"
              >
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{voiceError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              onClick={handleGenerateVoice}
              disabled={
                isGeneratingVoice ||
                !selectedApiKeyProfile ||
                !selectedVoice ||
                !voiceText.trim()
              }
            >
              {isGeneratingVoice
                ? "Generating..."
                : "Generate Professional Voice"}
            </Button>
          </CardFooter>
        </Card>

        {/* Preview card with history moved here */}
        <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex justify-between items-center">
              <span>Voice Preview</span>
              <div className="flex space-x-2">
                {selectedVoice && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-black/60 border-white/10 text-white hover:bg-black/80 flex items-center h-7 px-2"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <Clock size={12} className="mr-1" />
                      {showHistory ? "Hide History" : "Show History"}
                    </Button>

                    {showHistory && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-black/60 border-white/10 text-white hover:bg-black/80 flex items-center h-7 px-2"
                        onClick={handleRefreshHistory}
                        disabled={isLoadingHistory}
                      >
                        {isLoadingHistory ? (
                          <Loader2 size={12} className="mr-1 animate-spin" />
                        ) : (
                          <RefreshCw size={12} className="mr-1" />
                        )}
                        Refresh
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Listen to and download generated voice
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col h-96">
            {" "}
            {/* Fixed height container with room for history toggle */}
            {/* Active preview section */}
            {generatedAudio ? (
              <div className="w-full text-center mb-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-3">
                    <Volume2 size={32} className="text-white" />
                  </div>
                  <p className="text-white mb-1 font-medium">
                    {generatedAudio.voiceName}
                  </p>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {voiceText.length > 60
                      ? voiceText.substring(0, 60) + "..."
                      : voiceText}
                  </p>
                  {generatedAudio.profile && (
                    <div className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-800/50 border border-purple-400/30">
                      {generatedAudio.profile}
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={handlePlayAudio}
                  >
                    <Play size={14} className="mr-1" /> Play
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={handleStopAudio}
                  >
                    <X size={14} className="mr-1" /> Stop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={handleDownloadAudio}
                  >
                    <Download size={14} className="mr-1" /> Download
                  </Button>
                </div>
              </div>
            ) : selectedHistoryItem && historyAudio ? (
              <div className="w-full text-center mb-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-3">
                    <Volume2 size={32} className="text-white" />
                  </div>
                  <p className="text-white mb-1 font-medium">
                    {selectedHistoryItem.voice_name || "Voice"}
                  </p>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {selectedHistoryItem.text &&
                    selectedHistoryItem.text.length > 60
                      ? selectedHistoryItem.text.substring(0, 60) + "..."
                      : selectedHistoryItem.text || ""}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-800/50 border border-purple-400/30">
                    History Item
                  </div>
                </div>

                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={() =>
                      historyAudioRef.current && historyAudioRef.current.play()
                    }
                  >
                    <Play size={14} className="mr-1" /> Play
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={handleStopHistoryAudio}
                  >
                    <X size={14} className="mr-1" /> Stop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={() =>
                      handleDownloadHistoryAudio(selectedHistoryItem)
                    }
                  >
                    <Download size={14} className="mr-1" /> Download
                  </Button>
                </div>
              </div>
            ) : !selectedVoice ? (
              <div className="text-center text-gray-400 p-8">
                <Mic size={48} className="mx-auto mb-3 opacity-50" />
                <p>Generated voice will appear here</p>
                <p className="text-xs text-gray-500 mt-2">
                  Select a voice first
                </p>
              </div>
            ) : null}
            {/* Voice History Section - now toggleable and scrollable */}
            {selectedVoice && showHistory && (
              <div className="flex-1 mt-4">
                <div className="flex items-center mb-2">
                  <Clock size={14} className="mr-2 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-300">History</h3>

                  {isLoadingHistory && (
                    <div className="flex items-center text-xs text-purple-300 ml-2">
                      <Loader2 size={12} className="mr-1 animate-spin" />
                      Loading...
                    </div>
                  )}
                </div>

                {historyError && (
                  <Alert
                    variant="destructive"
                    className="mb-3 bg-red-900/20 border-red-500/30 text-red-200"
                  >
                    <AlertDescription>{historyError}</AlertDescription>
                  </Alert>
                )}

                {/* Scrollable history list */}
                <div className="overflow-y-auto max-h-56 border border-white/10 rounded-lg bg-black/40 p-2">
                  {isLoadingHistory && historyEntries.length === 0 ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2
                        size={24}
                        className="animate-spin text-purple-400"
                      />
                    </div>
                  ) : historyEntries.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {historyEntries.map((item) => (
                        <AccordionItem
                          key={item.history_item_id}
                          value={item.history_item_id}
                          className="border-white/10"
                        >
                          <AccordionTrigger className="text-sm hover:no-underline py-2">
                            <div className="flex items-center text-left w-full">
                              <span className="truncate max-w-[150px] text-xs text-gray-300">
                                {truncateText(item.text)}
                              </span>
                              <span className="ml-auto text-xs text-gray-500">
                                {formatDate(item.date_unix * 1000)}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-black/20 p-2 rounded-md space-y-2 text-xs">
                              <p className="text-gray-300">{item.text}</p>
                              <p className="text-gray-400">
                                Generated: {formatDate(item.date_unix * 1000)}
                              </p>

                              {/* Add indicator for available parameters */}
                              {getVoiceParameters(item.history_item_id) && (
                                <div className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-800/50 border border-green-400/30">
                                  <Check size={8} className="mr-1" /> Parameters
                                  Available
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                  onClick={() => handlePlayHistoryAudio(item)}
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
                                        size={10}
                                        className="mr-1 animate-spin"
                                      />{" "}
                                      Load
                                    </>
                                  ) : (
                                    <>
                                      <Play size={10} className="mr-1" /> Play
                                    </>
                                  )}
                                </Button>
                                {/* Pass entire item instead of just text */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                  onClick={() => handleUseHistoryText(item)}
                                >
                                  <RefreshCw size={10} className="mr-1" /> Use
                                </Button>
                                {selectedHistoryItem?.history_item_id ===
                                  item.history_item_id &&
                                  historyAudio && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                        onClick={handleStopHistoryAudio}
                                      >
                                        <X size={10} className="mr-1" /> Stop
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                        onClick={() =>
                                          handleDownloadHistoryAudio(item)
                                        }
                                      >
                                        <Download size={10} className="mr-1" />{" "}
                                        DL
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
                    <div className="text-center py-6 text-gray-400">
                      <p>No history found for this voice.</p>
                      <p className="text-xs mt-2">
                        Generate some audio to see it in your history.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <VoiceNoteCard
              voiceText={voiceText}
              model={
                availableVoices.find((m) => m.voiceId === selectedVoice)
                  ?.name || ""
              }
              audioNo={audioNo}
            />
          </CardContent>
        </Card>
      </div>

      {generationStatus && !voiceError && (
        <div className="mt-4 p-4 bg-black/40 backdrop-blur-md rounded-md border border-white/10">
          <h3 className="font-medium mb-2">ElevenLabs Generation Status</h3>
          <p>{generationStatus}</p>
        </div>
      )}
    </div>
  );
};

export default AIVoicePage;
