import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  Loader2,
  Image as ImageIcon,
  X,
  Copy,
  RefreshCw,
  Sparkles,
  Brain,
  Target,
  Activity,
  Trash2,
  FileDown,
  Plus,
  Wand2,
  CheckCircle,
  AlertCircle,
  Eye,
  Clock,
  Settings,
  Zap,
  Stars,
  Search,
  Layers,
  Palette,
  Camera,
  Download,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  imageUrl: string;
  filename: string;
  prompt: string;
  negativePrompt?: string;
  settings: any;
  timestamp: Date;
  isBookmarked?: boolean;
  isInVault?: boolean;
  blobUrl?: string;
}

interface PromptAnalysisResult {
  id: string;
  imageId: string;
  originalPrompt?: string;
  generatedPrompt: string;
  confidence: number;
  tags: string[];
  style: string;
  mood: string;
  timestamp: Date;
  processingTime: number;
  requestId?: string;
}

interface PendingRequest {
  requestId: string;
  filename: string;
  startTime: Date;
  timeout?: NodeJS.Timeout;
}

interface PromptGeneratorProps {
  receivedImages?: GeneratedImage[];
  onClearReceivedImages?: () => void;
}

const AIPromptPage: React.FC<PromptGeneratorProps> = ({
  receivedImages = [],
  onClearReceivedImages = () => {},
}) => {
  // State management
  const [webhookUrl, setWebhookUrl] = useState(
    "https://n8n.tastycreative.xyz/webhook/80fb6fdb-95b6-400d-b3a6-ea6d87a30a5e"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingImage, setCurrentProcessingImage] =
    useState<string>("");
  const [results, setResults] = useState<PromptAnalysisResult[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  // Refs for polling management
  const lastCheckTimestamp = useRef(0);
  const activeIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load saved data on mount
  useEffect(() => {
    const savedResults = localStorage.getItem("prompt_analysis_results");
    const savedWebhookUrl = localStorage.getItem("n8n_webhook_url");

    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        const resultsWithDates = parsedResults.map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp),
        }));
        setResults(resultsWithDates);
      } catch (error) {
        console.error("Error loading saved results:", error);
      }
    }

    if (savedWebhookUrl) {
      setWebhookUrl(savedWebhookUrl);
    }

    return () => {
      stopAllChecking();
    };
  }, []);

  // Save results to localStorage
  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem("prompt_analysis_results", JSON.stringify(results));
    }
  }, [results]);

  // Save webhook URL
  useEffect(() => {
    localStorage.setItem("n8n_webhook_url", webhookUrl);
  }, [webhookUrl]);

  // Remove pending request
  const removePendingRequest = (requestId: string) => {
    console.log("🗑️ Removing pending request:", requestId);
    setPendingRequests((prev) =>
      prev.filter((req) => req.requestId !== requestId)
    );

    const interval = activeIntervals.current.get(requestId);
    if (interval) {
      clearInterval(interval);
      activeIntervals.current.delete(requestId);
    }

    const timeout = pendingTimeouts.current.get(requestId);
    if (timeout) {
      clearTimeout(timeout);
      pendingTimeouts.current.delete(requestId);
    }
  };

  // Polling functions
  const fetchWebhookData = async (requestId: string) => {
    console.log("🔍 Fetching webhook data for requestId:", requestId);
    try {
      const response = await fetch(`/api/webhook?requestId=${requestId}`);
      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        console.error("❌ Webhook data request failed:", response.statusText);
        return null;
      }

      const result = await response.json();
      console.log("📦 Raw result:", result);

      if (!result || !result.data) {
        console.warn(
          "⚠️ No data found for requestId:",
          requestId,
          "Result:",
          result
        );
        return null;
      }

      console.log(
        "🔍 Checking timestamp:",
        result.timestamp,
        "vs lastCheck:",
        lastCheckTimestamp.current
      );

      if (result.timestamp > lastCheckTimestamp.current) {
        console.log("✅ New data found! Returning:", result.data);
        lastCheckTimestamp.current = result.timestamp;
        return { data: result.data, requestId };
      }

      console.log("⏳ No new data (timestamp not newer)");
      return null;
    } catch (error) {
      console.error("💥 Error fetching webhook data:", error);
      return null;
    }
  };

  const startChecking = (requestId: string, filename: string) => {
    console.log("🔄 Starting polling for requestId:", requestId);

    const interval = setInterval(async () => {
      console.log("🔄 Polling for requestId:", requestId);
      const result = await fetchWebhookData(requestId);

      if (result && result.data) {
        console.log(
          "🎯 Got data for requestId:",
          requestId,
          "Data:",
          result.data
        );
        removePendingRequest(requestId);
        handleWebhookResponse(requestId, result.data, filename);
      }
    }, 2000);

    activeIntervals.current.set(requestId, interval);

    const timeout = setTimeout(() => {
      console.log("⏰ Request timed out:", requestId);
      removePendingRequest(requestId);
      handleRequestTimeout(requestId, filename);
    }, 120000);

    pendingTimeouts.current.set(requestId, timeout);
  };

  const stopAllChecking = () => {
    console.log("🛑 Stopping all checking");
    activeIntervals.current.forEach((interval) => clearInterval(interval));
    activeIntervals.current.clear();
    pendingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    pendingTimeouts.current.clear();
    setPendingRequests([]);
  };

  const handleWebhookResponse = (
    requestId: string,
    webhookResponse: any,
    filename: string
  ) => {
    console.log(
      "🎯 Handling webhook response for requestId:",
      requestId,
      "Response:",
      webhookResponse
    );

    const result: PromptAnalysisResult = {
      id: `analysis_${Date.now()}_${requestId}`,
      imageId: requestId,
      generatedPrompt: webhookResponse.prompt || "No prompt generated",
      confidence: webhookResponse.confidence || 0,
      tags: webhookResponse.tags || [],
      style: webhookResponse.style || "Unknown",
      mood: webhookResponse.mood || "Unknown",
      timestamp: new Date(),
      processingTime: webhookResponse.processingTime || 0,
      requestId: requestId,
    };

    console.log("💾 Adding result to state:", result);
    setResults((prev) => [result, ...prev]);
    setSuccess(`Successfully processed: ${filename}`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleRequestTimeout = (requestId: string, filename: string) => {
    console.log("⏰ Handling timeout for requestId:", requestId);
    setError(`Request timed out for: ${filename}`);
    setTimeout(() => setError(""), 5000);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      setError("Only image files are allowed");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);
    setError("");
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Convert image to base64
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Convert image URL to base64
  const urlToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting URL to base64:", error);
      throw error;
    }
  };

  // Send image to n8n webhook with UUID
  const sendToWebhook = async (
    imageData: string,
    filename: string,
    originalPrompt?: string
  ): Promise<string> => {
    const requestId = uuidv4();
    console.log(
      "📤 Sending to webhook with requestId:",
      requestId,
      "filename:",
      filename
    );

    const payload = {
      requestId: requestId,
      image: imageData,
      filename: filename,
      originalPrompt: originalPrompt || "",
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📡 Webhook response:", response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    const pendingRequest: PendingRequest = {
      requestId,
      filename,
      startTime: new Date(),
    };

    console.log("⏳ Adding to pending requests:", pendingRequest);
    setPendingRequests((prev) => [...prev, pendingRequest]);
    startChecking(requestId, filename);
    return requestId;
  };

  // Process uploaded files
  const processUploadedFiles = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select files to upload");
      return;
    }

    if (!webhookUrl.trim()) {
      setError("Please enter a valid webhook URL");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");
    setProcessingProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentProcessingImage(file.name);
        setProcessingProgress(((i + 1) / selectedFiles.length) * 100);

        try {
          const base64Data = await imageToBase64(file);
          await sendToWebhook(base64Data, file.name);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setError(
            `Failed to process ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      setSuccess(
        `Submitted ${selectedFiles.length} images for processing. Check results below.`
      );
      setSelectedFiles([]);
    } catch (error) {
      console.error("Processing error:", error);
      setError(
        `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
      setCurrentProcessingImage("");
      setProcessingProgress(0);
    }
  };

  // Process received images from gallery
  const processReceivedImages = async () => {
    if (receivedImages.length === 0) {
      setError("No images received from gallery");
      return;
    }

    if (!webhookUrl.trim()) {
      setError("Please enter a valid webhook URL");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");
    setProcessingProgress(0);

    try {
      for (let i = 0; i < receivedImages.length; i++) {
        const image = receivedImages[i];
        setCurrentProcessingImage(image.filename);
        setProcessingProgress(((i + 1) / receivedImages.length) * 100);

        try {
          const imageUrl = image.blobUrl || image.imageUrl;
          const base64Data = await urlToBase64(imageUrl);
          await sendToWebhook(base64Data, image.filename, image.prompt);
        } catch (error) {
          console.error(`Error processing ${image.filename}:`, error);
          setError(
            `Failed to process ${image.filename}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      setSuccess(
        `Submitted ${receivedImages.length} images for processing. Check results below.`
      );
      onClearReceivedImages();
    } catch (error) {
      console.error("Processing error:", error);
      setError(
        `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
      setCurrentProcessingImage("");
      setProcessingProgress(0);
    }
  };

  // Copy prompt to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess("Prompt copied to clipboard!");
      setTimeout(() => setSuccess(""), 2000);
    });
  };

  // Clear all results
  const clearAllResults = () => {
    setResults([]);
    localStorage.removeItem("prompt_analysis_results");
    setSuccess("All results cleared");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Export results
  const exportResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `prompt_analysis_results_${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white mb-2">
          AI Prompt Generator
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Analyze images and generate detailed prompts using advanced AI vision
          models
        </p>
      </div>

      {/* Stats Bar */}
      <Card className="bg-white/80 backdrop-blur-md border-pink-200 rounded-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-pink-600">
                {results.length}
              </p>
              <p className="text-sm text-gray-600">Prompts Generated</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-400">
                {pendingRequests.length}
              </p>
              <p className="text-sm text-gray-600">Processing</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-pink-600">
                {receivedImages.length}
              </p>
              <p className="text-sm text-gray-600">Gallery Images</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-pink-600">
                {selectedFiles.length}
              </p>
              <p className="text-sm text-gray-600">Uploaded Files</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card className="bg-white/80 backdrop-blur-md border-pink-200 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center">
            <Settings className="w-6 h-6 mr-3 text-indigo-400" />
            AI Configuration
          </CardTitle>
          <CardDescription className="text-gray-600">
            Configure your AI processing endpoint for image analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label
              htmlFor="webhook-url"
              className="text-gray-700 text-sm font-medium mb-3 block"
            >
              Webhook Endpoint URL
            </Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Enter your N8N webhook URL for AI processing"
              className="bg-white border-pink-200 text-gray-700 rounded-xl h-12 text-base focus:border-pink-500/50 focus:ring-pink-500/20 transition-all"
            />
            <p className="text-xs text-gray-600 mt-2">
              This endpoint will receive image data and return AI-generated
              prompts and analysis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {pendingRequests.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-md border-amber-500/30 rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-amber-300">
                    AI Processing Queue ({pendingRequests.length})
                  </CardTitle>
                  <CardDescription className="text-amber-200/70">
                    AI models are analyzing your images...
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={stopAllChecking}
                className="bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-900/50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.requestId}
                  className="flex items-center justify-between bg-pink-50/60 p-4 rounded-xl border border-pink-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div>
                      <p className="text-amber-200 font-medium">
                        {req.filename}
                      </p>
                      <p className="text-amber-300/70 text-sm">
                        {Math.round(
                          (Date.now() - req.startTime.getTime()) / 1000
                        )}
                        s elapsed
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingRequest(req.requestId)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Gallery Images Panel */}
        <Card className="bg-white/80 backdrop-blur-md border-pink-200 rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Gallery Images</CardTitle>
                  <CardDescription className="text-gray-600">
                    Images sent from your generation gallery
                  </CardDescription>
                </div>
              </div>
              {receivedImages.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="bg-pink-500/30 text-pink-700 px-3 py-2 rounded-full text-sm font-medium">
                    {receivedImages.length} images ready
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {receivedImages.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-auto bg-pink-50/40 rounded-xl p-4 border border-pink-200">
                  {receivedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-pink-200 bg-pink-50/40">
                        <img
                          src={image.blobUrl || image.imageUrl}
                          alt={image.filename}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-pink-500/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs truncate font-medium">
                              {image.filename}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={processReceivedImages}
                    disabled={isProcessing || !webhookUrl.trim()}
                    className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-base font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analyze All Images
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClearReceivedImages}
                    className="bg-white border-pink-200 text-gray-700 hover:bg-pink-50 h-12 px-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center mb-6">
                  <ImageIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Gallery Images
                </h3>
                <p className="text-gray-600 mb-4">
                  Select images in the gallery and send them here for AI
                  analysis
                </p>
                <p className="text-gray-600 text-sm">
                  Generated images will appear here for prompt analysis
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload Panel */}
        <Card className="bg-white/80 backdrop-blur-md border-pink-200 rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Upload Images</CardTitle>
                <CardDescription className="text-gray-600">
                  Upload local images for AI prompt generation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="group block w-full p-12 border-2 border-dashed border-pink-200 rounded-xl text-center cursor-pointer hover:border-pink-400/50 hover:bg-pink-500/5 transition-all duration-200"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Drop images here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse your files
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <span>Supports: JPG, PNG, WebP</span>
                  <span>•</span>
                  <span>Multiple files allowed</span>
                </div>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 bg-pink-50/40 rounded-xl p-4 border border-pink-200">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/80 p-3 rounded-lg border border-pink-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-pink-600" />
                        </div>
                        <span className="text-gray-700 text-sm truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-600">
                          {Math.round(file.size / 1024)}KB
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={processUploadedFiles}
                  disabled={isProcessing || !webhookUrl.trim()}
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-base font-semibold"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Generate Prompts ({selectedFiles.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="bg-gradient-to-r from-pink-100/60 to-rose-100/60 backdrop-blur-md border-pink-300 rounded-xl">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Processing Images
                    </h3>
                    <p className="text-indigo-200">
                      Submitting images to AI for analysis...
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-400">
                    {Math.round(processingProgress)}%
                  </p>
                  <p className="text-xs text-indigo-300">Complete</p>
                </div>
              </div>

              <div className="w-full bg-pink-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>

              {currentProcessingImage && (
                <div className="text-center">
                  <p className="text-indigo-300 text-sm">
                    Currently processing:{" "}
                    <span className="font-medium text-white">
                      {currentProcessingImage}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      <div className="space-y-4">
        {error && (
          <Alert className="bg-red-900/20 border-red-500/30 text-red-200 rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-pink-100/60 border-pink-300/50 text-pink-700 rounded-xl">
            <CheckCircle className="h-5 w-5" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Results Section */}
      <Card className="bg-white/80 backdrop-blur-md border-pink-200 rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                <Stars className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  AI Analysis Results
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Generated prompts and insights from your images
                </CardDescription>
              </div>
            </div>

            {results.length > 0 && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportResults}
                  className="bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllResults}
                  className="bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-900/50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-gradient-to-r from-pink-50/40 to-pink-100/60 rounded-xl p-6 border border-pink-200 hover:border-pink-400/50 transition-all duration-200"
                >
                  {/* Result Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-700 text-sm font-medium">
                          {result.timestamp.toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="bg-pink-500/30 text-pink-700 px-3 py-1 rounded-full text-xs font-medium">
                            {result.confidence}% confidence
                          </span>
                          <span className="bg-pink-500/30 text-pink-700 px-3 py-1 rounded-full text-xs font-medium">
                            {result.style}
                          </span>
                          <span className="bg-pink-500/30 text-pink-700 px-3 py-1 rounded-full text-xs font-medium">
                            {result.mood}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Original Prompt */}
                  {result.originalPrompt && (
                    <div className="mb-6">
                      <Label className="text-gray-600 text-xs uppercase tracking-wider font-medium mb-3 block">
                        Original Prompt
                      </Label>
                      <div className="bg-white/80 border border-pink-200 rounded-xl p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {result.originalPrompt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Generated Prompt */}
                  <div className="mb-6">
                    <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3 block">
                      AI Generated Prompt
                    </Label>
                    <div className="bg-gradient-to-r from-pink-100/60 to-rose-100/60 border border-pink-300 rounded-xl p-6">
                      <p className="text-white whitespace-pre-wrap leading-relaxed text-base">
                        {result.generatedPrompt}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="mb-6">
                      <Label className="text-gray-600 text-xs uppercase tracking-wider font-medium mb-3 block">
                        Detected Elements
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {result.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-white/80 text-gray-700 px-3 py-2 rounded-lg text-sm border border-pink-200 hover:border-pink-300 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => copyToClipboard(result.generatedPrompt)}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl px-6"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Prompt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Analysis Results Yet
              </h3>
              <p className="text-gray-400 mb-4">
                Upload images or send them from the gallery to start generating
                prompts
              </p>
              <p className="text-gray-500 text-sm">
                AI will analyze your images and generate detailed prompts for
                you
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPromptPage;
