"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  RefreshCw,
  Upload,
  RotateCcw,
  Download,
  Loader2,
  Palette,
  Copy,
  ImageIcon,
  Settings,
  Wand2,
  Image as ImageLucide,
  ZapOff,
  Instagram,
  Sparkles,
} from "lucide-react";

// Types
interface GeneratedImage {
  id: string;
  imageUrl: string;
  filename: string;
  prompt: string;
  negativePrompt?: string;
  settings: GenerationSettings;
  timestamp: Date;
  blobUrl?: string;
  isBookmarked?: boolean;
  isInVault?: boolean;
  type: "image";
}

interface GenerationSettings {
  model: string;
  sampler: string;
  steps: number;
  cfgScale: number;
  guidance: number;
  lora: string;
  loraStrength: number;
  width: number;
  height: number;
  denoise: number;
  batchSize: number;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentNode: string;
  error: string;
}

interface AppState {
  isConnected: boolean;
  availableLoraModels: string[];
  generatedImages: GeneratedImage[];
  latestGeneratedImage: GeneratedImage | null;
  instagramData: any;
  status: string;
}

// Constants
const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low quality, distorted, watermark, signature, text, logo, bad anatomy, deformed, ugly";
const DEFAULT_DIMENSIONS = { width: 832, height: 1216 };
const DEFAULT_GENERATION_PARAMS = {
  steps: 40,
  cfgScale: 1.0,
  guidance: 3.5,
  denoise: 0.7,
  batchSize: 15,
  loraStrength: 0.95,
};

const AIImg2ImgPage = () => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [uploadedImageName, setUploadedImageName] = useState<string>("");

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentNode: "",
    error: "",
  });

  const [appState, setAppState] = useState<AppState>({
    isConnected: false,
    availableLoraModels: [],
    generatedImages: [],
    latestGeneratedImage: null,
    instagramData: null,
    status: "",
  });

  // Generation parameters
  const [generationParams, setGenerationParams] = useState({
    prompt: "",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    selectedLora: "",
    ...DEFAULT_GENERATION_PARAMS,
    ...DEFAULT_DIMENSIONS,
  });

  // Helper functions
  const updateGenerationState = useCallback(
    (updates: Partial<GenerationState>) => {
      setGenerationState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateGenerationParams = useCallback(
    (updates: Partial<typeof generationParams>) => {
      setGenerationParams((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Validation
  const canGenerate = useMemo(
    () =>
      generationParams.prompt.trim() &&
      uploadedImage &&
      uploadedImageName &&
      appState.isConnected &&
      generationParams.selectedLora &&
      !generationState.isGenerating,
    [
      generationParams.prompt,
      uploadedImage,
      uploadedImageName,
      appState.isConnected,
      generationParams.selectedLora,
      generationState.isGenerating,
    ]
  );

  // Image compression function
  const compressImage = useCallback(
    (
      file: File,
      maxWidth: number = 1024,
      quality: number = 0.8
    ): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        };

        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  // Image processing functions
  const processImageUpload = useCallback(
    async (file: File) => {
      const img = new Image();

      return new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          setUploadedImage(img);

          // Upload image to ComfyUI
          try {
            updateAppState({ status: "📤 Uploading image..." });

            let fileToUpload = file;
            if (file.size > 2 * 1024 * 1024) {
              console.log(`Compressing large file: ${file.size} bytes`);
              fileToUpload = await compressImage(file);
            }

            const formData = new FormData();
            formData.append("image", fileToUpload);
            formData.append("subfolder", "");
            formData.append("type", "input");

            const uploadResponse = await fetch("/api/comfyui/upload", {
              method: "POST",
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            const uploadResult = await uploadResponse.json();
            setUploadedImageName(uploadResult.name);
            updateAppState({
              status: `✅ Image uploaded: ${uploadResult.name}`,
            });
          } catch (error) {
            console.error("Image upload failed:", error);
            updateGenerationState({
              error: "Failed to upload image to ComfyUI",
            });
          }

          updateAppState({ instagramData: null });
          resolve();
        };

        img.onerror = () => {
          updateGenerationState({ error: "Failed to load image" });
          reject(new Error("Failed to load image"));
        };

        img.src = URL.createObjectURL(file);
      });
    },
    [compressImage, updateAppState, updateGenerationState]
  );

  // Event handlers
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        await processImageUpload(file);
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    },
    [processImageUpload]
  );

  // Save generated images to localStorage
  const saveImageToStorage = useCallback((newImage: GeneratedImage) => {
    setAppState((prev) => {
      const updated = [newImage, ...prev.generatedImages];
      try {
        localStorage.setItem("ai_generated_images", JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving generated images:", error);
      }
      return { ...prev, generatedImages: updated };
    });
  }, []);

  const handleApiError = useCallback(
    async (response: Response): Promise<string> => {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          const cleanText = errorText.replace(/<[^>]*>/g, "").trim();
          if (cleanText && cleanText.length < 200) {
            errorMessage = cleanText;
          }
        }
      } catch (parseError) {
        console.error("Error parsing API response:", parseError);
      }

      return errorMessage;
    },
    []
  );

  // Main generation function based on your workflow
  const handleGenerate = useCallback(async () => {
    if (!generationParams.prompt.trim()) {
      updateGenerationState({ error: "Please enter a prompt" });
      return;
    }

    if (!uploadedImage || !uploadedImageName) {
      updateGenerationState({ error: "Please upload a reference image" });
      return;
    }

    if (!generationParams.selectedLora) {
      updateGenerationState({ error: "Please select a LoRA model" });
      return;
    }

    if (!appState.isConnected) {
      updateGenerationState({ error: "Not connected to ComfyUI" });
      return;
    }

    updateGenerationState({
      error: "",
      isGenerating: true,
      progress: 0,
    });

    try {
      updateGenerationState({
        currentNode: "Building workflow...",
        progress: 20,
      });

      // Build workflow based on your JSON structure
      const workflow: Record<string, any> = {
        "6": {
          class_type: "UNETLoader",
          inputs: {
            unet_name: "flux_base_model\\flux1-dev.safetensors",
            weight_dtype: "fp8_e4m3fn",
          },
        },
        "5": {
          class_type: "DualCLIPLoader",
          inputs: {
            clip_name1: "runpod send 2\\t5xxl_fp16.safetensors",
            clip_name2: "runpod send 2\\clip_l.safetensors",
            type: "flux",
            type2: "default",
          },
        },
        "4": {
          class_type: "VAELoader",
          inputs: {
            vae_name: "runpod send 2\\ae.safetensors",
          },
        },
        "14": {
          class_type: "LoraLoaderModelOnly",
          inputs: {
            model: ["6", 0],
            lora_name: generationParams.selectedLora,
            strength_model: generationParams.loraStrength,
          },
        },
        "9": {
          class_type: "ModelSamplingFlux",
          inputs: {
            model: ["14", 0],
            max_shift: 1.15,
            base_shift: 0.5,
            width: generationParams.width,
            height: generationParams.height,
          },
        },
        "2": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["5", 0],
            text: generationParams.prompt,
          },
        },
        "10": {
          class_type: "ConditioningZeroOut",
          inputs: {
            conditioning: ["2", 0],
          },
        },
        "7": {
          class_type: "FluxGuidance",
          inputs: {
            conditioning: ["2", 0],
            guidance: generationParams.guidance,
          },
        },
        "16": {
          class_type: "LoadImage",
          inputs: {
            image: uploadedImageName,
          },
        },
        "17": {
          class_type: "VAEEncode",
          inputs: {
            pixels: ["16", 0],
            vae: ["4", 0],
          },
        },
        "18": {
          class_type: "RepeatLatentBatch",
          inputs: {
            samples: ["17", 0],
            amount: generationParams.batchSize,
          },
        },
        "12": {
          class_type: "KSampler",
          inputs: {
            model: ["9", 0],
            positive: ["7", 0],
            negative: ["10", 0],
            latent_image: ["18", 0],
            seed: Math.floor(Math.random() * 1000000000),
            steps: generationParams.steps,
            cfg: generationParams.cfgScale,
            sampler_name: "euler",
            scheduler: "beta",
            denoise: generationParams.denoise,
          },
        },
        "3": {
          class_type: "VAEDecode",
          inputs: {
            samples: ["12", 0],
            vae: ["4", 0],
          },
        },
        "13": {
          class_type: "SaveImage",
          inputs: {
            images: ["3", 0],
            filename_prefix: "ComfyUI_Img2Img",
          },
        },
      };

      const clientId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      updateGenerationState({
        currentNode: "Queuing generation...",
        progress: 25,
      });

      const queueResponse = await fetch("/api/comfyui/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: workflow,
          client_id: clientId,
        }),
      });

      if (!queueResponse.ok) {
        const errorMessage = await handleApiError(queueResponse);
        throw new Error(`Failed to queue prompt: ${errorMessage}`);
      }

      const queueResult = await queueResponse.json();
      const promptId = queueResult.prompt_id;

      let attempts = 0;
      const baseTimeoutMinutes = 5;
      const additionalTimeoutPerImage = 2;
      const timeoutMinutes =
        baseTimeoutMinutes +
        (generationParams.batchSize - 1) * additionalTimeoutPerImage;
      const maxAttempts = timeoutMinutes * 60;

      while (attempts < maxAttempts) {
        updateGenerationState({
          currentNode: `Processing... (${Math.floor(attempts / 60)}:${(
            attempts % 60
          )
            .toString()
            .padStart(2, "0")} / ${timeoutMinutes}:00)`,
          progress: 25 + Math.min((attempts / maxAttempts) * 70, 70),
        });

        try {
          const historyResponse = await fetch(
            `/api/comfyui/history/${promptId}`,
            {
              method: "GET",
            }
          );

          if (historyResponse.ok) {
            const history = await historyResponse.json();

            if (history[promptId]) {
              const execution = history[promptId];

              if (execution.status && execution.status.completed) {
                updateGenerationState({
                  currentNode: "Retrieving images...",
                  progress: 95,
                });

                const imageUrls: string[] = [];

                if (execution.outputs) {
                  for (const nodeId in execution.outputs) {
                    const nodeOutput = execution.outputs[nodeId];
                    if (nodeOutput.images) {
                      for (const image of nodeOutput.images) {
                        const imageUrl = `/api/comfyui/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                        imageUrls.push(imageUrl);
                      }
                    }
                  }
                }

                updateGenerationState({ progress: 100 });

                const generatedImages = imageUrls.map((url, index) => ({
                  id: `${promptId}_${index}`,
                  imageUrl: url,
                  filename: `img2img_${promptId}_${index}.png`,
                  prompt: generationParams.prompt,
                  negativePrompt: generationParams.negativePrompt,
                  settings: {
                    model: "flux-dev",
                    sampler: "euler",
                    steps: generationParams.steps,
                    cfgScale: generationParams.cfgScale,
                    guidance: generationParams.guidance,
                    lora: generationParams.selectedLora,
                    loraStrength: generationParams.loraStrength,
                    width: generationParams.width,
                    height: generationParams.height,
                    denoise: generationParams.denoise,
                    batchSize: generationParams.batchSize,
                  },
                  timestamp: new Date(),
                  type: "image" as const,
                }));

                if (generatedImages.length > 0) {
                  updateAppState({ latestGeneratedImage: generatedImages[0] });
                  generatedImages.forEach(saveImageToStorage);
                }

                return;
              }

              if (execution.status && execution.status.status_str === "error") {
                let errorMessage = "Generation failed with error";
                if (execution.status.messages) {
                  const errorMessages = execution.status.messages
                    .filter((msg: any) => msg[0] === "execution_error")
                    .map((msg: any) => msg[1])
                    .join(", ");
                  if (errorMessages) {
                    errorMessage += `: ${errorMessages}`;
                  }
                }

                console.error("ComfyUI execution error:", execution);
                throw new Error(errorMessage);
              }
            }
          } else {
            console.warn("History check failed:", historyResponse.statusText);
          }
        } catch (error) {
          console.warn("Status check failed:", error);
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      throw new Error("Generation timed out");
    } catch (error) {
      console.error("Generation error:", error);
      updateGenerationState({
        error: `Generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      updateGenerationState({
        isGenerating: false,
        progress: 0,
        currentNode: "",
      });
    }
  }, [
    generationParams,
    uploadedImage,
    uploadedImageName,
    appState.isConnected,
    handleApiError,
    saveImageToStorage,
    updateGenerationState,
    updateAppState,
  ]);

  // Download function
  const downloadLatestImage = useCallback(async () => {
    if (!appState.latestGeneratedImage) return;

    try {
      const response = await fetch(appState.latestGeneratedImage.imageUrl, {
        method: "GET",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = appState.latestGeneratedImage.filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(appState.latestGeneratedImage.imageUrl, "_blank");
    }
  }, [appState.latestGeneratedImage]);

  // Connection status check
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch("/api/comfyui/object-info", {
          method: "GET",
        });

        if (response.ok) {
          updateAppState({ isConnected: true });
          const objectInfo = await response.json();

          const loraLoader = objectInfo.LoraLoaderModelOnly;
          const models = loraLoader?.input?.required?.lora_name?.[0] || [
            "2\\OF_BRI_V2.safetensors",
            "anime_style.safetensors",
            "realistic_portrait.safetensors",
          ];
          updateAppState({ availableLoraModels: models });
        } else {
          updateAppState({ isConnected: false });
        }
      } catch (error) {
        console.error("Connection test failed:", error);
        updateAppState({
          isConnected: false,
          availableLoraModels: [
            "2\\OF_BRI_V2.safetensors",
            "anime_style.safetensors",
            "realistic_portrait.safetensors",
          ],
        });
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 30000);
    return () => clearInterval(interval);
  }, [updateAppState]);

  // Load images from localStorage
  useEffect(() => {
    const loadGeneratedImages = () => {
      try {
        const savedImages = localStorage.getItem("ai_generated_images");
        if (savedImages) {
          const parsedImages = JSON.parse(savedImages).map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
            type: "image" as const,
          }));
          updateAppState({ generatedImages: parsedImages });
        }
      } catch (error) {
        console.error("Error loading generated images:", error);
      }
    };

    loadGeneratedImages();
  }, [updateAppState]);

  // Instagram data loading
  useEffect(() => {
    const checkForInstagramData = async () => {
      try {
        const transferData = localStorage.getItem("instagram_to_img2img");
        if (transferData) {
          const data = JSON.parse(transferData);
          updateAppState({ instagramData: data });

          if (data.imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = async () => {
              setUploadedImage(img);

              // Convert data URL to file and upload
              try {
                const response = await fetch(data.imageUrl);
                const blob = await response.blob();
                const file = new File(
                  [blob],
                  data.filename || "instagram_image.jpg",
                  {
                    type: blob.type || "image/jpeg",
                  }
                );

                await processImageUpload(file);
                updateAppState({
                  status: `✅ Loaded image from Instagram: ${data.filename}`,
                });
              } catch (error) {
                console.error("Error processing Instagram image:", error);
                updateGenerationState({
                  error: "Failed to process image from Instagram scraper",
                });
              }
            };
            img.onerror = () => {
              updateGenerationState({
                error: "Failed to load image from Instagram scraper",
              });
            };
            img.src = data.imageUrl;
          }

          if (data.prompt) {
            updateGenerationParams({ prompt: data.prompt });
          }

          localStorage.removeItem("instagram_to_img2img");
        }
      } catch (error) {
        console.error("Error loading Instagram data:", error);
      }
    };

    checkForInstagramData();
  }, [
    processImageUpload,
    updateAppState,
    updateGenerationParams,
    updateGenerationState,
  ]);

  // Render
  return (
    <div className="min-h-screen bg-white/60 backdrop-blur-sm p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-700 mb-2">
            AI Image-to-Image Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform existing images with AI using your reference image as
            guidance
          </p>
        </div>

        {/* Status message */}
        {appState.status && (
          <div className="bg-pink-100/60 border border-pink-300/50 rounded-lg p-3 text-center">
            <span className="text-pink-600">{appState.status}</span>
          </div>
        )}

        {/* Instagram Data Indicator */}
        {appState.instagramData && (
          <div className="bg-gradient-to-r from-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Instagram className="w-5 h-5 text-pink-500" />
              <div className="flex-1">
                <h3 className="text-gray-700 font-medium">
                  Loaded from Instagram
                </h3>
                <p className="text-gray-600 text-sm">
                  {appState.instagramData.originalPost ? (
                    <>
                      From @{appState.instagramData.originalPost.username} •{" "}
                      {appState.instagramData.originalPost.likes.toLocaleString()}{" "}
                      likes
                    </>
                  ) : (
                    <>Image: {appState.instagramData.filename}</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                {appState.isConnected ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
                      <span className="text-pink-600 font-medium">
                        ComfyUI Connected
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      {appState.availableLoraModels.length} models available
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-red-600 font-medium">
                        ComfyUI Offline
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      Check connection
                    </div>
                  </>
                )}
              </div>

              {generationState.isGenerating && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-pink-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">
                      {generationState.progress.toFixed(2)}%
                    </span>
                  </div>
                  {generationState.currentNode && (
                    <span className="text-xs text-gray-600">
                      {generationState.currentNode}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Image Upload Panel */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <Upload className="w-5 h-5 mr-3" />
                  Reference Image
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Upload an image to use as reference for transformation
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-pink-200 rounded-xl p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="w-16 h-16 mx-auto mb-4 text-pink-500" />
                    <h3 className="text-gray-700 font-medium mb-2">
                      Upload Image
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      Choose an image to use as reference for AI transformation
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg px-6"
                    >
                      Choose Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border border-pink-200 rounded-xl overflow-hidden relative">
                      <div className="relative bg-pink-50/40">
                        <img
                          src={uploadedImage.src}
                          alt="Reference"
                          className="w-full h-auto max-h-96 object-contain bg-pink-50/20 block"
                        />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                      {uploadedImageName && (
                        <p className="text-xs text-gray-600">
                          Uploaded: {uploadedImageName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Prompt Input */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <Wand2 className="w-5 h-5 mr-3" />
                  Transformation Prompt
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Describe how you want to transform the reference image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Describe how you want to transform the reference image..."
                    value={generationParams.prompt}
                    onChange={(e) =>
                      updateGenerationParams({ prompt: e.target.value })
                    }
                    className="bg-white border-pink-200 text-gray-700 rounded-xl min-h-[120px] resize-none focus:border-pink-500/50"
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style & Generation Settings */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <Settings className="w-5 h-5 mr-3" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[400px] overflow-y-auto">
                {/* LoRA Model Selection */}
                <div>
                  <Label className="text-gray-600 text-sm font-medium mb-3 block">
                    LoRA Model
                  </Label>
                  <Select
                    value={generationParams.selectedLora}
                    onValueChange={(value) =>
                      updateGenerationParams({ selectedLora: value })
                    }
                  >
                    <SelectTrigger className="bg-white border-pink-200 text-gray-700 rounded-xl h-12 focus:border-pink-500/50">
                      <SelectValue placeholder="Select LoRA model" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-pink-200 text-gray-700">
                      {appState.availableLoraModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                            <span>
                              {model.replace(/\.(safetensors|pt|ckpt)$/, "")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Size */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 text-sm font-medium">
                      Batch Size
                    </Label>
                    <span className="text-pink-600 text-sm font-mono">
                      {generationParams.batchSize}
                    </span>
                  </div>
                  <Slider
                    value={[generationParams.batchSize]}
                    onValueChange={(value) =>
                      updateGenerationParams({ batchSize: value[0] })
                    }
                    min={1}
                    max={15}
                    step={1}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Number of variations to generate
                  </p>
                </div>

                {/* Denoise Strength */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 text-sm font-medium">
                      Denoise Strength
                    </Label>
                    <span className="text-pink-600 text-sm font-mono">
                      {generationParams.denoise.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[generationParams.denoise]}
                    onValueChange={(value) =>
                      updateGenerationParams({ denoise: value[0] })
                    }
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    How much to change the reference image (higher = more
                    change)
                  </p>
                </div>

                {/* Steps */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 text-sm font-medium">
                      Generation Steps
                    </Label>
                    <span className="text-pink-600 text-sm font-mono">
                      {generationParams.steps}
                    </span>
                  </div>
                  <Slider
                    value={[generationParams.steps]}
                    onValueChange={(value) =>
                      updateGenerationParams({ steps: value[0] })
                    }
                    min={10}
                    max={50}
                    step={1}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    More steps = higher quality, slower generation
                  </p>
                </div>

                {/* Guidance */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 text-sm font-medium">
                      Guidance Scale
                    </Label>
                    <span className="text-pink-600 text-sm font-mono">
                      {generationParams.guidance.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[generationParams.guidance]}
                    onValueChange={(value) =>
                      updateGenerationParams({ guidance: value[0] })
                    }
                    min={1.0}
                    max={10.0}
                    step={0.5}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    How closely to follow the prompt
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-lg font-semibold"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {generationState.isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Generating... {generationState.progress.toFixed(2)}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Transform Image
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Error Messages */}
            {generationState.error && (
              <Alert className="bg-red-900/20 border-red-500/30 text-red-200">
                <ZapOff className="h-4 w-4" />
                <AlertTitle>Generation Error</AlertTitle>
                <AlertDescription>{generationState.error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <ImageLucide className="w-5 h-5 mr-3" />
                  Latest Creation
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="h-[500px] flex items-center justify-center">
                  {generationState.isGenerating ? (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          Transforming Image
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {generationState.progress.toFixed(2)}% complete
                        </p>
                        {generationState.currentNode && (
                          <p className="text-gray-500 text-sm">
                            {generationState.currentNode}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : appState.latestGeneratedImage ? (
                    <div className="w-full space-y-6">
                      <div className="aspect-square rounded-xl overflow-hidden border border-pink-200">
                        <img
                          src={appState.latestGeneratedImage.imageUrl}
                          alt="Latest transformation"
                          className="w-full h-full object-contain bg-pink-50/40"
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Latest Transformation
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {appState.latestGeneratedImage.prompt}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            className="bg-pink-500 hover:bg-pink-600 text-white flex-1"
                            onClick={downloadLatestImage}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>

                          <Button
                            variant="outline"
                            className="bg-white border-pink-200 text-gray-700 hover:bg-pink-50 flex-1"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                appState.latestGeneratedImage!.prompt
                              );
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Prompt
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center">
                        <Palette className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No Transformations Yet
                        </h3>
                        <p className="text-gray-600">
                          {appState.isConnected && uploadedImage
                            ? "Add a prompt and transform your image"
                            : !appState.isConnected
                              ? "Connect to ComfyUI to start transforming"
                              : "Upload an image to begin transformation"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImg2ImgPage;
