"use client";

import {
  Check,
  Loader2,
  RefreshCw,
  ImageIcon,
  X,
  Download,
  Camera,
  Clock,
  Star,
  WifiOff,
  Settings,
  Palette,
  Zap,
  Sparkles,
  Copy,
  Eye,
  Play,
  Upload,
  Brush,
  Eraser,
  RotateCcw,
  EyeOff,
  Move,
} from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
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
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";
// Custom tab system - no external dependency needed

// TypeScript interfaces
interface GeneratedImage {
  id: string;
  imageUrl: string;
  filename: string;
  prompt: string;
  negativePrompt?: string;
  settings: ImageGenerationSettings;
  timestamp: Date;
  isBookmarked?: boolean;
  isInVault?: boolean;
  blobUrl?: string;
  fileSize?: number;
  status: "generating" | "completed" | "failed";
  progress?: number;
}

interface ImageGenerationSettings {
  model: string;
  sampler: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  seed?: number;
  loraModel?: string;
  loraStrength?: number;
  reduxStrength?: number;
  downsamplingFactor?: number;
  mode?: "text2image" | "image2image";
}

// Helper function to save images to gallery
const saveToGallery = (newImages: GeneratedImage[]) => {
  try {
    // Get existing gallery images
    const existingImages = localStorage.getItem("ai-gallery-images");
    let galleryImages: GeneratedImage[] = [];

    if (existingImages) {
      galleryImages = JSON.parse(existingImages);
    }

    // Add new images to the beginning of the gallery
    const updatedGallery = [...newImages, ...galleryImages];

    // Save back to localStorage
    localStorage.setItem("ai-gallery-images", JSON.stringify(updatedGallery));

    console.log(`✅ Saved ${newImages.length} image(s) to gallery`);
  } catch (error) {
    console.error("Failed to save images to gallery:", error);
  }
};

// ComfyUI Integration Hook
const useComfyUIGeneration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [availableLoraModels, setAvailableLoraModels] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentNode, setCurrentNode] = useState("");

  useEffect(() => {
    const testConnection = async () => {
      console.log("🔍 Testing ComfyUI connection for image generation...");

      try {
        console.log("📡 Testing /api/comfyui/object-info...");
        const response = await fetch("/api/comfyui/object-info", {
          method: "GET",
        });

        console.log("📊 API Response status:", response.status);

        if (response.ok) {
          const objectInfo = await response.json();
          console.log("✅ ComfyUI connection successful!");
          console.log("📊 Available nodes:", Object.keys(objectInfo).length);

          setIsConnected(true);

          // Extract LoRA models from the response
          const loraLoader = objectInfo.LoraLoaderModelOnly;
          if (
            loraLoader &&
            loraLoader.input &&
            loraLoader.input.required &&
            loraLoader.input.required.lora_name
          ) {
            setAvailableLoraModels(
              loraLoader.input.required.lora_name[0] || []
            );
            console.log(
              "🎨 LoRA models found:",
              loraLoader.input.required.lora_name[0].length
            );
          } else {
            console.log("⚠️ No LoRA models found, using defaults");
            setAvailableLoraModels([
              "2\\OF_BRI_V2.safetensors",
              "anime_style.safetensors",
              "realistic_portrait.safetensors",
            ]);
          }
        } else {
          const errorText = await response.text();
          console.error("❌ API Response error:", response.status, errorText);
          setIsConnected(false);

          console.log("💡 ComfyUI Connection Troubleshooting:");
          console.log("1. Is ComfyUI running? Check http://localhost:8188");
          console.log("2. Are API routes set up? Check /api/comfyui/ folder");
        }
      } catch (error) {
        console.error("❌ Connection test failed:", error);
        setIsConnected(false);

        // Set mock models for development
        setAvailableLoraModels([
          "2\\OF_BRI_V2.safetensors",
          "anime_style.safetensors",
          "realistic_portrait.safetensors",
        ]);
      }
    };

    testConnection();
  }, []);

  // Text-to-Image generation function
  const handleTextToImageGenerate = async (
    params: any
  ): Promise<GeneratedImage[]> => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentNode("Initializing text-to-image generation...");

    try {
      // Build the text-to-image workflow
      const workflow = {
        "1": {
          class_type: "EmptyLatentImage",
          inputs: {
            width: params.width,
            height: params.height,
            batch_size: params.batchSize,
          },
        },
        "2": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["5", 0],
            text: params.prompt,
          },
        },
        "3": {
          class_type: "VAEDecode",
          inputs: {
            samples: ["12", 0],
            vae: ["4", 0],
          },
        },
        "4": {
          class_type: "VAELoader",
          inputs: {
            vae_name: "runpod send 2\\ae.safetensors",
          },
        },
        "5": {
          class_type: "DualCLIPLoader",
          inputs: {
            clip_name1: "runpod send 2\\t5xxl_fp16.safetensors",
            clip_name2: "runpod send 2\\clip_l.safetensors",
            type: "flux",
          },
        },
        "6": {
          class_type: "UNETLoader",
          inputs: {
            unet_name: "flux_base_model\\flux1-dev.safetensors",
            weight_dtype: "fp8_e4m3fn",
          },
        },
        "7": {
          class_type: "FluxGuidance",
          inputs: {
            conditioning: ["2", 0],
            guidance: params.cfgScale,
          },
        },
        "9": {
          class_type: "ModelSamplingFlux",
          inputs: {
            model: ["14", 0],
            max_shift: 1.15,
            base_shift: 0.5,
            width: params.width,
            height: params.height,
          },
        },
        "10": {
          class_type: "ConditioningZeroOut",
          inputs: {
            conditioning: ["2", 0],
          },
        },
        "12": {
          class_type: "KSampler",
          inputs: {
            seed: params.seed || Math.floor(Math.random() * 1000000000),
            steps: params.steps,
            cfg: 1.0,
            sampler_name: "euler",
            scheduler: "simple",
            denoise: 1.0,
            model: ["9", 0],
            positive: ["7", 0],
            negative: ["10", 0],
            latent_image: ["1", 0],
          },
        },
        "13": {
          class_type: "SaveImage",
          inputs: {
            filename_prefix: "ComfyUI_TextToImage",
            images: ["3", 0],
          },
        },
        "14": {
          class_type: "LoraLoaderModelOnly",
          inputs: {
            model: ["6", 0],
            lora_name: params.selectedLoraModel,
            strength_model: params.loraStrength,
            strength_clip: params.loraStrength,
          },
        },
      };

      return await executeWorkflow(workflow, params, "text-to-image");
    } catch (error) {
      console.error("Text-to-image generation error:", error);
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentNode("");
    }
  };

  // Image-to-Image generation function
  const handleImageToImageGenerate = async (
    params: any
  ): Promise<GeneratedImage[]> => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentNode("Initializing image-to-image generation...");

    try {
      // Upload image and mask first
      const imageBase64 = params.imageBase64;
      const maskBase64 = params.maskBase64;

      if (!imageBase64) {
        throw new Error("Failed to process reference image");
      }

      setCurrentNode("Uploading image...");
      setGenerationProgress(10);

      // Upload the main image
      const imageFile = base64ToFile(imageBase64, "input_image.png");
      const imageFormData = new FormData();
      imageFormData.append("image", imageFile);
      imageFormData.append("subfolder", "");
      imageFormData.append("type", "input");

      const imageUploadResponse = await fetch("/api/comfyui/upload", {
        method: "POST",
        body: imageFormData,
      });

      if (!imageUploadResponse.ok) {
        const errorData = await imageUploadResponse.json();
        throw new Error(
          `Failed to upload image: ${errorData.error || imageUploadResponse.statusText}`
        );
      }

      const imageUploadResult = await imageUploadResponse.json();
      const uploadedImageName = imageUploadResult.name;

      // Upload mask if it exists
      let uploadedMaskName = "";
      if (maskBase64) {
        setCurrentNode("Uploading mask...");
        setGenerationProgress(15);

        const maskFile = base64ToFile(
          maskBase64,
          `clipspace-mask-${Date.now()}.png`
        );
        const maskFormData = new FormData();
        maskFormData.append("image", maskFile);
        maskFormData.append("subfolder", "");
        maskFormData.append("type", "input");

        const maskUploadResponse = await fetch("/api/comfyui/upload", {
          method: "POST",
          body: maskFormData,
        });

        if (maskUploadResponse.ok) {
          const maskUploadResult = await maskUploadResponse.json();
          uploadedMaskName = maskUploadResult.name;
        }
      }

      setCurrentNode("Building image-to-image workflow...");
      setGenerationProgress(20);

      // Build the image-to-image workflow
      const workflow: Record<string, any> = {
        "6": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["51", 1],
            text: params.prompt,
          },
        },
        "8": {
          class_type: "VAEDecode",
          inputs: {
            samples: ["31", 0],
            vae: ["50", 0],
          },
        },
        "27": {
          class_type: "EmptySD3LatentImage",
          inputs: {
            width: params.width,
            height: params.height,
            batch_size: params.batchSize,
          },
        },
        "31": {
          class_type: "KSampler",
          inputs: {
            model: ["51", 0],
            positive: ["41", 0],
            negative: ["33", 0],
            latent_image: ["27", 0],
            seed: Math.floor(Math.random() * 1000000000),
            steps: params.steps,
            cfg: params.cfgScale,
            sampler_name: "euler",
            scheduler: "beta",
            denoise: 1.0,
          },
        },
        "33": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["51", 1],
            text: params.negativePrompt || "",
          },
        },
        "37": {
          class_type: "UNETLoader",
          inputs: {
            unet_name: "flux_base_model\\flux1-dev.safetensors",
            weight_dtype: "fp8_e4m3fn",
          },
        },
        "38": {
          class_type: "DualCLIPLoader",
          inputs: {
            clip_name1: "runpod send 2\\t5xxl_fp16.safetensors",
            clip_name2:
              "runpod send\\ViT-L-14-TEXT-detail-improved-hiT-GmP-HF.safetensors",
            type: "flux",
            type2: "default",
          },
        },
        "41": {
          class_type: "FluxGuidance",
          inputs: {
            conditioning: ["44", 0],
            guidance: params.guidance,
          },
        },
        "42": {
          class_type: "StyleModelLoader",
          inputs: {
            style_model_name: "runpod send\\flux1-redux-dev.safetensors",
          },
        },
        "43": {
          class_type: "CLIPVisionLoader",
          inputs: {
            clip_name: "runpod send\\model.safetensors",
          },
        },
        "44": {
          class_type: "ReduxAdvanced",
          inputs: {
            conditioning: ["6", 0],
            style_model: ["42", 0],
            clip_vision: ["43", 0],
            image: ["155", 0],
            weight: 1,
            downsampling_function: "area",
            mode: "center crop (square)",
            strength: params.reduxStrength,
            start_percent: 0.1,
            downsampling_factor: params.downsamplingFactor,
          },
        },
        "50": {
          class_type: "VAELoader",
          inputs: {
            vae_name: "runpod send 2\\ae.safetensors",
          },
        },
        "51": {
          class_type: "LoraLoader",
          inputs: {
            model: ["37", 0],
            clip: ["38", 0],
            lora_name: params.selectedLoraModel,
            strength_model: params.loraStrength,
            strength_clip: 1.0,
          },
        },
        "155": {
          class_type: "LoadImage",
          inputs: {
            image: uploadedImageName,
          },
        },
        "154": {
          class_type: "SaveImage",
          inputs: {
            images: ["8", 0],
            filename_prefix: "ComfyUI_Image2Image",
          },
        },
      };

      // Add mask handling if we have a mask
      if (uploadedMaskName) {
        workflow["156"] = {
          class_type: "LoadImage",
          inputs: {
            image: uploadedMaskName,
          },
        };

        workflow["157"] = {
          class_type: "ImageToMask",
          inputs: {
            image: ["156", 0],
            channel: "red",
          },
        };

        workflow["44"].inputs.mask = ["157", 0];
      }

      return await executeWorkflow(workflow, params, "image-to-image");
    } catch (error) {
      console.error("Image-to-image generation error:", error);
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentNode("");
    }
  };

  // Common workflow execution function
  const executeWorkflow = async (
    workflow: any,
    params: any,
    mode: string
  ): Promise<GeneratedImage[]> => {
    // Queue the prompt
    const clientId =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    setCurrentNode("Queuing generation...");
    setGenerationProgress(25);

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
      const errorText = await queueResponse.text();
      throw new Error(
        `Failed to queue prompt: ${queueResponse.statusText} - ${errorText}`
      );
    }

    const queueResult = await queueResponse.json();
    const promptId = queueResult.prompt_id;

    // Poll for completion
    let attempts = 0;
    const timeoutMinutes = 10;
    const maxAttempts = timeoutMinutes * 60;

    while (attempts < maxAttempts) {
      setCurrentNode(
        `Processing... (${Math.floor(attempts / 60)}:${(attempts % 60)
          .toString()
          .padStart(2, "0")} / ${timeoutMinutes}:00)`
      );
      setGenerationProgress(25 + Math.min((attempts / maxAttempts) * 70, 70));

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
              setCurrentNode("Retrieving images...");
              setGenerationProgress(95);

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

              setGenerationProgress(100);

              const generatedImages = imageUrls.map((url, index) => ({
                id: `${promptId}_${index}`,
                imageUrl: url,
                filename: `${mode}_${promptId}_${index}.png`,
                prompt: params.prompt,
                negativePrompt: params.negativePrompt,
                settings: {
                  model: "flux-dev",
                  sampler: "euler",
                  steps: params.steps,
                  cfgScale: params.cfgScale,
                  width: params.width,
                  height: params.height,
                  seed: params.seed,
                  loraModel: params.selectedLoraModel,
                  loraStrength: params.loraStrength,
                  reduxStrength: params.reduxStrength,
                  downsamplingFactor: params.downsamplingFactor,
                  mode: mode as "text2image" | "image2image",
                },
                timestamp: new Date(),
                status: "completed" as const,
              }));

              return generatedImages;
            }

            if (execution.status && execution.status.status_str === "error") {
              throw new Error("Generation failed with error");
            }
          }
        }
      } catch (error) {
        console.warn("Status check failed:", error);
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Generation timed out");
  };

  return {
    handleTextToImageGenerate,
    handleImageToImageGenerate,
    availableLoraModels,
    isConnected,
    isGenerating,
    generationProgress,
    currentNode,
  };
};

// Helper function for base64 conversion
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Enhanced Image Display Component
const EnhancedImageDisplay: React.FC<{
  image: GeneratedImage;
  className?: string;
  onLoadedData?: () => void;
}> = ({ image, className = "", onLoadedData }) => {
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [actualSrc, setActualSrc] = useState(image.blobUrl || image.imageUrl);

  useEffect(() => {
    setLoadState("loading");
    setErrorDetails("");
    setActualSrc(image.blobUrl || image.imageUrl);
  }, [image.blobUrl, image.imageUrl]);

  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully: ${image.filename}`);
    setLoadState("loaded");
    onLoadedData?.();
  };

  const handleImageError = async () => {
    console.log(`❌ Image failed to load: ${actualSrc}`);

    if (!image.blobUrl && loadState === "loading") {
      try {
        console.log(`🔄 Trying to fetch as blob: ${image.imageUrl}`);
        const response = await fetch(image.imageUrl, {
          method: "GET",
          mode: "cors",
        });

        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setActualSrc(blobUrl);
          setLoadState("loading");
          return;
        }
      } catch (error) {
        console.error("Blob conversion failed:", error);
      }
    }

    setErrorDetails("Failed to load image");
    setLoadState("error");
  };

  const handleManualRetry = () => {
    setLoadState("loading");
    setErrorDetails("");
    setActualSrc(image.imageUrl);
  };

  if (loadState === "error") {
    return (
      <div
        className={`${className} bg-gray-800/50 flex flex-col items-center justify-center text-gray-400 p-4`}
      >
        <div className="text-center">
          <X className="w-8 h-8 mb-2 text-red-400 mx-auto" />
          <p className="text-xs font-medium mb-1">Image Load Failed</p>
          <p className="text-xs opacity-60 mb-3 max-w-xs">{errorDetails}</p>

          <div className="space-y-2">
            <button
              onClick={handleManualRetry}
              className="block text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-1 rounded transition-colors w-full"
            >
              🔄 Retry Loading
            </button>

            <button
              onClick={() =>
                window.open(image.imageUrl, "_blank", "noopener,noreferrer")
              }
              className="block text-xs bg-green-600/20 hover:bg-green-600/30 text-green-300 px-3 py-1 rounded transition-colors w-full"
            >
              🌐 Open in New Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loadState === "loading" && (
        <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-green-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Loading image...</p>
          </div>
        </div>
      )}

      <img
        src={actualSrc}
        alt={`Generated: ${image.prompt}`}
        className="w-full h-full object-contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const AIImagePage = () => {
  // Image generation hook
  const {
    handleTextToImageGenerate,
    handleImageToImageGenerate,
    availableLoraModels,
    isConnected,
    isGenerating,
    generationProgress,
    currentNode,
  } = useComfyUIGeneration();

  // Tab state
  const [activeTab, setActiveTab] = useState("text2image");

  // Shared generation states
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedLoraModel, setSelectedLoraModel] = useState("");
  const [loraStrength, setLoraStrength] = useState(0.95);
  const [steps, setSteps] = useState(40);
  const [cfgScale, setCfgScale] = useState(3.5);
  const [width, setWidth] = useState(832);
  const [height, setHeight] = useState(1216);
  const [batchSize, setBatchSize] = useState(1);

  // Image-to-Image specific states
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [maskData, setMaskData] = useState<ImageData | null>(null);
  const [activeTool, setActiveTool] = useState<"brush" | "eraser" | "move">(
    "brush"
  );
  const [brushSize, setBrushSize] = useState(40);
  const [showMask, setShowMask] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseOnCanvas, setIsMouseOnCanvas] = useState(false);
  const [lastDrawPoint, setLastDrawPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [reduxStrength, setReduxStrength] = useState(0.8);
  const [downsamplingFactor, setDownsamplingFactor] = useState(3);
  const [guidance, setGuidance] = useState(3.5);

  // Canvas refs for image-to-image
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generated images state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );

  // UI states
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");

  // Set default LoRA model when available models load
  useEffect(() => {
    if (availableLoraModels.length > 0 && !selectedLoraModel) {
      setSelectedLoraModel(availableLoraModels[0]);
    }
  }, [availableLoraModels, selectedLoraModel]);

  // Image generation presets
  const presetSizes = [
    { name: "Portrait", width: 832, height: 1216 },
    { name: "Landscape", width: 1216, height: 832 },
    { name: "Square", width: 1024, height: 1024 },
    { name: "Wide", width: 1344, height: 768 },
  ];

  // Helper functions
  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 50): string => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Main generation function for text-to-image
  const handleTextToImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!selectedLoraModel) {
      setError("Please select a LoRA model");
      return;
    }

    if (!isConnected) {
      setError("Not connected to ComfyUI. Please check your connection.");
      return;
    }

    setError("");
    setGenerationStatus("Starting text-to-image generation...");

    try {
      const generationParams = {
        prompt,
        negativePrompt,
        selectedLoraModel,
        loraStrength,
        steps,
        cfgScale,
        width,
        height,
        batchSize,
        seed: Math.floor(Math.random() * 1000000000),
      };

      const newImages = await handleTextToImageGenerate(generationParams);

      // Process images to create blob URLs for better display
      const processedImages = await Promise.all(
        newImages.map(async (img) => {
          try {
            const response = await fetch(img.imageUrl, {
              method: "GET",
              mode: "cors",
            });
            if (response.ok) {
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              return { ...img, blobUrl };
            }
          } catch (error) {
            console.error(`Failed to process image ${img.id}:`, error);
          }
          return img;
        })
      );

      // Update local state
      setGeneratedImages((prev) => [...processedImages, ...prev]);

      // 🆕 Save to gallery
      saveToGallery(processedImages);

      setGenerationStatus("Images generated successfully!");
      setTimeout(() => setGenerationStatus(""), 3000);
    } catch (error) {
      console.error("Text-to-image generation failed:", error);
      setError(
        `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setGenerationStatus("");
    }
  };

  // ===== IMAGE-TO-IMAGE CANVAS FUNCTIONS =====

  // Canvas setup and image loading
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas || !uploadedImage) return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!ctx || !overlayCtx) return;

    // Set canvas size to match image
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    overlayCanvas.width = uploadedImage.width;
    overlayCanvas.height = uploadedImage.height;

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(uploadedImage, 0, 0);

    // Initialize mask data if not exists
    if (!maskData) {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      // Initialize as transparent
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 0; // R
        imageData.data[i + 1] = 0; // G
        imageData.data[i + 2] = 0; // B
        imageData.data[i + 3] = 0; // A (transparent)
      }
      setMaskData(imageData);
    }
  }, [uploadedImage, maskData]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  // File upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setUploadedImage(img);
      setMaskData(null); // Reset mask when new image is uploaded
    };
    img.src = URL.createObjectURL(file);
  };

  // Canvas drawing functions
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  // Mouse tracking for brush indicator
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    setMousePos(coords);

    if (isDrawing && activeTool !== "move") {
      drawSmooth(coords);
    }

    updateBrushIndicator(coords);
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseOnCanvas(true);
    const coords = getCanvasCoordinates(event);
    updateBrushIndicator(coords);
  };

  const handleMouseLeave = () => {
    setIsMouseOnCanvas(false);
    setIsDrawing(false);
    setLastDrawPoint(null);
    clearBrushIndicator();
  };

  // Smooth drawing function
  const drawSmooth = (currentPoint: { x: number; y: number }) => {
    if (!maskData || activeTool === "move") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Update mask data
    const newMaskData = ctx.createImageData(maskData.width, maskData.height);
    newMaskData.data.set(maskData.data);

    if (lastDrawPoint) {
      // Draw line between last point and current point for smooth strokes
      const distance = Math.sqrt(
        Math.pow(currentPoint.x - lastDrawPoint.x, 2) +
          Math.pow(currentPoint.y - lastDrawPoint.y, 2)
      );

      const steps = Math.max(1, Math.floor(distance / 2));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lastDrawPoint.x + (currentPoint.x - lastDrawPoint.x) * t;
        const y = lastDrawPoint.y + (currentPoint.y - lastDrawPoint.y) * t;

        drawCircle(newMaskData, x, y, brushSize, activeTool === "brush");
      }
    } else {
      // First point
      drawCircle(
        newMaskData,
        currentPoint.x,
        currentPoint.y,
        brushSize,
        activeTool === "brush"
      );
    }

    setLastDrawPoint(currentPoint);
    setMaskData(newMaskData);
    redrawCanvas(newMaskData);
  };

  // Helper function to draw a circle on the mask
  const drawCircle = (
    imageData: ImageData,
    centerX: number,
    centerY: number,
    radius: number,
    isPaint: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (
          distance <= radius &&
          x >= 0 &&
          y >= 0 &&
          x < canvas.width &&
          y < canvas.height
        ) {
          const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          if (isPaint) {
            imageData.data[index] = 255; // R
            imageData.data[index + 1] = 255; // G
            imageData.data[index + 2] = 255; // B
            imageData.data[index + 3] = 128; // A (semi-transparent)
          } else {
            imageData.data[index] = 0; // R
            imageData.data[index + 1] = 0; // G
            imageData.data[index + 2] = 0; // B
            imageData.data[index + 3] = 0; // A (transparent)
          }
        }
      }
    }
  };

  // Brush indicator functions
  const updateBrushIndicator = (coords: { x: number; y: number }) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas || !isMouseOnCanvas) return;

    const overlayCtx = overlayCanvas.getContext("2d");
    if (!overlayCtx) return;

    // Clear overlay
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw brush indicator
    const radius = brushSize;

    overlayCtx.strokeStyle = activeTool === "brush" ? "#3b82f6" : "#ef4444";
    overlayCtx.lineWidth = 3;
    overlayCtx.setLineDash([8, 4]);
    overlayCtx.beginPath();
    overlayCtx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
    overlayCtx.stroke();

    overlayCtx.fillStyle = activeTool === "brush" ? "#3b82f6" : "#ef4444";
    overlayCtx.setLineDash([]);
    overlayCtx.beginPath();
    overlayCtx.arc(coords.x, coords.y, 2, 0, 2 * Math.PI);
    overlayCtx.fill();

    overlayCtx.fillStyle =
      activeTool === "brush"
        ? "rgba(59, 130, 246, 0.1)"
        : "rgba(239, 68, 68, 0.1)";
    overlayCtx.beginPath();
    overlayCtx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
    overlayCtx.fill();
  };

  const clearBrushIndicator = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const overlayCtx = overlayCanvas.getContext("2d");
    if (!overlayCtx) return;

    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "move") return;
    setIsDrawing(true);
    const coords = getCanvasCoordinates(event);
    setLastDrawPoint(coords);
    drawSmooth(coords);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastDrawPoint(null);
  };

  const redrawCanvas = (currentMaskData?: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(uploadedImage, 0, 0);

    // Draw mask overlay if enabled
    if (showMask && (currentMaskData || maskData)) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(currentMaskData || maskData!, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [showMask, uploadedImage, maskData]);

  // Clear mask
  const clearMask = () => {
    if (!uploadedImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 0;
      imageData.data[i + 1] = 0;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 0;
    }
    setMaskData(imageData);
    redrawCanvas(imageData);
  };

  // Convert to base64 helper functions
  const getClipspaceImageWithMask = (): string | null => {
    if (!uploadedImage) return null;

    const canvas = document.createElement("canvas");
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(uploadedImage, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const getClipspaceMask = (): string | null => {
    if (!maskData || !uploadedImage) return null;

    const canvas = document.createElement("canvas");
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bwMaskData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < maskData.data.length; i += 4) {
      const alpha = maskData.data[i + 3];
      const value = alpha > 0 ? 0 : 255; // Inverted for clipspace style
      bwMaskData.data[i] = value; // R
      bwMaskData.data[i + 1] = value; // G
      bwMaskData.data[i + 2] = value; // B
      bwMaskData.data[i + 3] = 255; // A
    }

    ctx.putImageData(bwMaskData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  // Main generation function for image-to-image
  const handleImageToImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!uploadedImage) {
      setError("Please upload a reference image");
      return;
    }

    if (!selectedLoraModel) {
      setError("Please select a LoRA model");
      return;
    }

    if (!isConnected) {
      setError("Not connected to ComfyUI");
      return;
    }

    setError("");
    setGenerationStatus("Starting image-to-image generation...");

    try {
      const imageBase64 = getClipspaceImageWithMask();
      const maskBase64 = getClipspaceMask();

      const generationParams = {
        prompt,
        negativePrompt,
        selectedLoraModel,
        loraStrength,
        steps,
        cfgScale,
        guidance,
        reduxStrength,
        downsamplingFactor,
        width,
        height,
        batchSize,
        imageBase64,
        maskBase64,
      };

      const newImages = await handleImageToImageGenerate(generationParams);

      // Process images to create blob URLs for better display
      const processedImages = await Promise.all(
        newImages.map(async (img) => {
          try {
            const response = await fetch(img.imageUrl, {
              method: "GET",
              mode: "cors",
            });
            if (response.ok) {
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              return { ...img, blobUrl };
            }
          } catch (error) {
            console.error(`Failed to process image ${img.id}:`, error);
          }
          return img;
        })
      );

      // Update local state
      setGeneratedImages((prev) => [...processedImages, ...prev]);

      // 🆕 Save to gallery
      saveToGallery(processedImages);

      setGenerationStatus("Image transformation completed successfully!");
      setTimeout(() => setGenerationStatus(""), 3000);
    } catch (error) {
      console.error("Image-to-image generation failed:", error);
      setError(
        `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setGenerationStatus("");
    }
  };

  // Image utility functions
  const downloadImage = async (image: GeneratedImage) => {
    try {
      let downloadUrl = image.blobUrl;

      if (!downloadUrl) {
        const response = await fetch(image.imageUrl, {
          method: "GET",
          mode: "cors",
        });
        if (!response.ok)
          throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = image.filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (!image.blobUrl && downloadUrl) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    } catch (error) {
      console.error("Download failed:", error);
      window.open(image.imageUrl, "_blank");
    }
  };

  const toggleBookmark = (imageId: string) => {
    setGeneratedImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, isBookmarked: !img.isBookmarked } : img
      )
    );
  };

  const handleViewImage = (image: GeneratedImage) => {
    setSelectedImage(image);
  };

  const handleUseImagePrompt = (image: GeneratedImage) => {
    setPrompt(image.prompt);
    if (image.negativePrompt) {
      setNegativePrompt(image.negativePrompt);
    }
    setGenerationStatus("Prompt restored from history");
    setTimeout(() => setGenerationStatus(""), 3000);
  };

  return (
    <div>
      {/* Custom Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 rounded-2xl bg-black/20 border border-white/10">
          <button
            onClick={() => setActiveTab("text2image")}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex-1 ${
              activeTab === "text2image"
                ? "text-white bg-gradient-to-r from-green-500 to-teal-500"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Text to Image</span>
          </button>
          <button
            onClick={() => setActiveTab("image2image")}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex-1 ${
              activeTab === "image2image"
                ? "text-white bg-gradient-to-r from-purple-500 to-blue-500"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Image to Image</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "text2image" && (
        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-white">
                    Text to Image Generation
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Create stunning AI-generated images from text descriptions
                  </CardDescription>
                </div>

                {/* Connection Status */}
                <div className="min-w-48">
                  <div className="flex items-center justify-between text-xs">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isConnected
                          ? "bg-green-900/30 text-green-300 border border-green-500/30"
                          : "bg-red-900/30 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Check size={10} className="mr-1" />
                          Connected
                        </>
                      ) : (
                        <>
                          <WifiOff size={10} className="mr-1" />
                          Disconnected
                        </>
                      )}
                    </div>
                    <span className="text-gray-300">
                      {availableLoraModels.length} styles available
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Prompt Section */}
                <div>
                  <Label
                    htmlFor="text-prompt"
                    className="text-gray-300 mb-1 block"
                  >
                    Describe what you want to create
                  </Label>
                  <Textarea
                    id="text-prompt"
                    placeholder="A beautiful landscape with mountains and a lake at sunset, detailed, high quality..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-black/60 border-white/10 text-white rounded-lg min-h-24"
                    rows={4}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Describe your desired image in detail for best results
                  </p>
                </div>

                {/* LoRA Model Selection */}
                <div>
                  <Label className="text-gray-300 mb-1 block">
                    Art Style ({availableLoraModels.length} available)
                  </Label>
                  <Select
                    value={selectedLoraModel}
                    onValueChange={setSelectedLoraModel}
                    disabled={!isConnected || availableLoraModels.length === 0}
                  >
                    <SelectTrigger className="bg-black/60 border-white/10 text-white rounded-lg">
                      <SelectValue
                        placeholder={
                          isConnected
                            ? availableLoraModels.length === 0
                              ? "No art styles available"
                              : "Select an art style"
                            : "Not connected to AI service"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white max-h-72">
                      {availableLoraModels.map((model) => (
                        <SelectItem
                          key={model}
                          value={model}
                          className="flex items-center justify-between py-2"
                        >
                          {model
                            .replace(/\.(safetensors|pt|ckpt)$/, "")
                            .replace(/\\/g, " / ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size Presets */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Image Size</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {presetSizes.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        className={`bg-black/60 border-white/10 text-white hover:bg-white/10 ${
                          width === preset.width && height === preset.height
                            ? "bg-green-600/30 border-green-400"
                            : ""
                        }`}
                        onClick={() => {
                          setWidth(preset.width);
                          setHeight(preset.height);
                        }}
                      >
                        <div className="text-center">
                          <div className="text-xs">{preset.name}</div>
                          <div className="text-xs opacity-60">
                            {preset.width}×{preset.height}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Generation Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300 mb-2 block">
                      Number of Images: {batchSize}
                    </Label>
                    <Slider
                      value={[batchSize]}
                      min={1}
                      max={4}
                      step={1}
                      onValueChange={(value) => setBatchSize(value[0])}
                      className="py-2"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">
                      Style Strength: {loraStrength.toFixed(2)}
                    </Label>
                    <Slider
                      value={[loraStrength]}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      onValueChange={(value) => setLoraStrength(value[0])}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      How strongly to apply the selected art style
                    </p>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-1 block">
                      Generation Steps: {steps}
                    </Label>
                    <Slider
                      value={[steps]}
                      min={20}
                      max={50}
                      step={5}
                      onValueChange={(value) => setSteps(value[0])}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      More steps = higher quality but slower generation
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-1 block">
                      Guidance Scale: {cfgScale.toFixed(1)}
                    </Label>
                    <Slider
                      value={[cfgScale]}
                      min={1}
                      max={10}
                      step={0.5}
                      onValueChange={(value) => setCfgScale(value[0])}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      How closely to follow the prompt (higher = more adherence)
                    </p>
                  </div>
                </div>

                {/* Negative Prompt */}
                <div>
                  <Label
                    htmlFor="negative-prompt"
                    className="text-gray-300 mb-1 block"
                  >
                    Negative Prompt (Optional)
                  </Label>
                  <Textarea
                    id="negative-prompt"
                    placeholder="blurry, low quality, distorted, ugly..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="bg-black/60 border-white/10 text-white rounded-lg min-h-16"
                    rows={2}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Describe what you don't want in the image
                  </p>
                </div>

                {/* Connection Status Alert */}
                {!isConnected && (
                  <Alert className="bg-red-900/20 border-red-500/30 text-red-200">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>ComfyUI Connection Issue</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>Cannot connect to ComfyUI service. Please check:</p>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>
                          ComfyUI is running:{" "}
                          <code className="bg-black/50 px-1 rounded">
                            python main.py
                          </code>
                        </li>
                        <li>
                          ComfyUI web interface accessible:{" "}
                          <a
                            href="http://localhost:8188"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:underline"
                          >
                            http://localhost:8188
                          </a>
                        </li>
                        <li>
                          Next.js API routes are set up in{" "}
                          <code className="bg-black/50 px-1 rounded">
                            /api/comfyui/
                          </code>
                        </li>
                        <li>
                          Check browser console for detailed error messages
                        </li>
                      </ul>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
                          onClick={() => window.location.reload()}
                        >
                          <RefreshCw size={14} className="mr-1" />
                          Retry Connection
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Display */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-900/20 border-red-500/30 text-red-200"
                  >
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg py-3 text-lg font-medium"
                  onClick={handleTextToImage}
                  disabled={
                    isGenerating ||
                    !prompt.trim() ||
                    !selectedLoraModel ||
                    !isConnected
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Images... {generationProgress}%
                      {currentNode && (
                        <span className="ml-1 text-sm">({currentNode})</span>
                      )}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Generate {batchSize > 1 ? `${batchSize} Images` : "Image"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Preview Panel */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white flex justify-between items-center">
                  <span>Image Preview</span>
                  <div className="flex space-x-2">
                    {generatedImages.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-black/60 border-white/10 text-white hover:bg-black/80 flex items-center h-7 px-2"
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        <Clock size={12} className="mr-1" />
                        {showHistory ? "Hide History" : "Show History"}
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Preview and manage generated images
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col h-96">
                {/* Active preview section */}
                {isGenerating ? (
                  <div className="w-full text-center mb-4">
                    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center mb-3">
                        <Loader2
                          size={32}
                          className="text-white animate-spin"
                        />
                      </div>
                      <p className="text-white mb-1 font-medium">
                        Generating Image
                      </p>
                      <p className="text-sm text-gray-400">
                        {generationProgress}%
                      </p>
                      {currentNode && (
                        <p className="text-xs text-gray-500 mt-1">
                          {currentNode}
                        </p>
                      )}
                      <div className="mt-3 bg-gray-700 rounded-full h-2 w-full">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : selectedImage ? (
                  <div className="w-full text-center mb-4">
                    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                      <EnhancedImageDisplay
                        image={selectedImage}
                        className="w-full max-h-48 object-contain rounded-lg"
                        onLoadedData={() =>
                          console.log(
                            `Preview image loaded: ${selectedImage.imageUrl}`
                          )
                        }
                      />
                      <p className="text-white mb-1 font-medium mt-2">
                        {selectedImage.filename}
                      </p>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {selectedImage.prompt}
                      </p>
                    </div>

                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 hover:bg-white/10"
                        onClick={() => downloadImage(selectedImage)}
                      >
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 hover:bg-white/10"
                        onClick={() => toggleBookmark(selectedImage.id)}
                      >
                        <Star
                          size={14}
                          className={`mr-1 ${
                            selectedImage.isBookmarked
                              ? "fill-yellow-400 text-yellow-400"
                              : ""
                          }`}
                        />
                        Favorite
                      </Button>
                    </div>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="w-full text-center mb-4">
                    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center mb-3">
                        <ImageIcon size={32} className="text-white" />
                      </div>
                      <p className="text-white mb-1 font-medium">
                        Latest Image
                      </p>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {generatedImages[0].prompt}
                      </p>
                      <div className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-800/50 border border-green-400/30">
                        {generatedImages[0].settings.width}×
                        {generatedImages[0].settings.height}
                      </div>
                    </div>

                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 hover:bg-white/10"
                        onClick={() => handleViewImage(generatedImages[0])}
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 hover:bg-white/10"
                        onClick={() => downloadImage(generatedImages[0])}
                      >
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 p-8">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Generated images will appear here</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {isConnected
                        ? "Create your first image above"
                        : "Connect to AI service to start"}
                    </p>
                  </div>
                )}

                {/* Image History Section */}
                {showHistory && generatedImages.length > 0 && (
                  <div className="flex-1 mt-4">
                    <div className="flex items-center mb-2">
                      <Clock size={14} className="mr-2 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-300">
                        History ({generatedImages.length})
                      </h3>
                    </div>

                    <div className="overflow-y-auto max-h-56 border border-white/10 rounded-lg bg-black/40 p-2">
                      {generatedImages.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {generatedImages.map((image) => (
                            <AccordionItem
                              key={image.id}
                              value={image.id}
                              className="border-white/10"
                            >
                              <AccordionTrigger className="text-sm hover:no-underline py-2">
                                <div className="flex items-center text-left w-full">
                                  <span className="truncate max-w-[150px] text-xs text-gray-300">
                                    {truncateText(image.prompt, 30)}
                                  </span>
                                  <span className="ml-auto text-xs text-gray-500">
                                    {image.settings.width}×
                                    {image.settings.height}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="bg-black/20 p-2 rounded-md space-y-2 text-xs">
                                  <p className="text-gray-300">
                                    {image.prompt}
                                  </p>
                                  <p className="text-gray-400">
                                    Generated: {formatDate(image.timestamp)}
                                  </p>
                                  <p className="text-gray-400">
                                    Style:{" "}
                                    {image.settings.loraModel?.replace(
                                      /\.(safetensors|pt|ckpt)$/,
                                      ""
                                    ) || "Default"}
                                  </p>

                                  <div className="flex flex-wrap gap-1 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                      onClick={() => handleViewImage(image)}
                                    >
                                      <Eye size={10} className="mr-1" /> View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                      onClick={() =>
                                        handleUseImagePrompt(image)
                                      }
                                    >
                                      <RefreshCw size={10} className="mr-1" />{" "}
                                      Use
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                      onClick={() => downloadImage(image)}
                                    >
                                      <Download size={10} className="mr-1" /> DL
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7 px-2"
                                      onClick={() => toggleBookmark(image.id)}
                                    >
                                      <Star
                                        size={10}
                                        className={`mr-1 ${image.isBookmarked ? "fill-yellow-400 text-yellow-400" : ""}`}
                                      />
                                      {image.isBookmarked ? "★" : "☆"}
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-6 text-gray-400">
                          <p>No images generated yet.</p>
                          <p className="text-xs mt-2">
                            Create your first image to see it here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Image to Image Tab */}
      {activeTab === "image2image" && (
        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Image Upload and Masking */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white">
                  Reference Image & Masking
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload an image and draw a mask to guide the AI generation
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Image Upload */}
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300 mb-2">
                      Upload a reference image
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Choose Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Canvas and Tools */}
                    <div className="border border-white/10 rounded-lg overflow-hidden relative">
                      <div className="relative">
                        <canvas
                          ref={canvasRef}
                          className="w-full h-auto max-h-96 object-contain bg-black block"
                        />
                        <canvas
                          ref={overlayCanvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={handleMouseMove}
                          onMouseUp={stopDrawing}
                          onMouseLeave={handleMouseLeave}
                          onMouseEnter={handleMouseEnter}
                          className="absolute inset-0 w-full h-auto max-h-96 object-contain pointer-events-auto"
                          style={{
                            cursor: "none",
                          }}
                        />
                      </div>
                    </div>

                    {/* Masking Tools */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Tools</Label>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant={
                              activeTool === "brush" ? "default" : "outline"
                            }
                            onClick={() => setActiveTool("brush")}
                            className="flex-1"
                          >
                            <Brush size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              activeTool === "eraser" ? "default" : "outline"
                            }
                            onClick={() => setActiveTool("eraser")}
                            className="flex-1"
                          >
                            <Eraser size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearMask}
                            className="flex-1"
                          >
                            <RotateCcw size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">View</Label>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant={showMask ? "default" : "outline"}
                            onClick={() => setShowMask(!showMask)}
                            className="flex-1"
                          >
                            {showMask ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1"
                          >
                            <Upload size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Brush Size */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">
                        Brush Size: {brushSize}px
                      </Label>
                      <Slider
                        value={[brushSize]}
                        onValueChange={(value) => setBrushSize(value[0])}
                        min={10}
                        max={100}
                        step={2}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Middle Panel - Generation Controls */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white">
                  Generation Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure AI generation parameters for image transformation
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Prompt */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Prompt</Label>
                  <Textarea
                    placeholder="Describe the changes you want to make..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-black/60 border-white/10 text-white"
                    rows={3}
                  />
                </div>

                {/* LoRA Model */}
                <div>
                  <Label className="text-gray-300 mb-2 block">LoRA Model</Label>
                  <Select
                    value={selectedLoraModel}
                    onValueChange={setSelectedLoraModel}
                  >
                    <SelectTrigger className="bg-black/60 border-white/10 text-white">
                      <SelectValue placeholder="Select LoRA" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      {availableLoraModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model.replace(/\.(safetensors|pt|ckpt)$/, "")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Label className="text-gray-300 text-xs">
                      Strength: {loraStrength.toFixed(2)}
                    </Label>
                    <Slider
                      value={[loraStrength]}
                      onValueChange={(value) => setLoraStrength(value[0])}
                      min={0}
                      max={2}
                      step={0.05}
                      className="w-full mt-1"
                    />
                  </div>
                </div>

                {/* Batch Size */}
                <div>
                  <Label className="text-gray-300 text-xs">
                    Batch Size: {batchSize}
                  </Label>
                  <Slider
                    value={[batchSize]}
                    onValueChange={(value) => setBatchSize(value[0])}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full mt-1"
                  />
                </div>

                {/* Redux Strength */}
                <div>
                  <Label className="text-gray-300 text-xs">
                    Redux Strength: {reduxStrength.toFixed(2)}
                  </Label>
                  <Slider
                    value={[reduxStrength]}
                    onValueChange={(value) => setReduxStrength(value[0])}
                    min={0}
                    max={2}
                    step={0.05}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    How much the reference image influences the generation
                  </p>
                </div>

                {/* Downsampling Factor */}
                <div>
                  <Label className="text-gray-300 text-xs">
                    Downsampling Factor: {downsamplingFactor}
                  </Label>
                  <Slider
                    value={[downsamplingFactor]}
                    onValueChange={(value) => setDownsamplingFactor(value[0])}
                    min={1}
                    max={8}
                    step={1}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Controls image processing resolution (higher = faster but
                    less detail)
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-900/20 border-red-500/30 text-red-200"
                  >
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  onClick={handleImageToImage}
                  disabled={
                    isGenerating ||
                    !prompt.trim() ||
                    !uploadedImage ||
                    !isConnected ||
                    !selectedLoraModel
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Transforming... {generationProgress}%
                      {currentNode && (
                        <span className="ml-1 text-sm">({currentNode})</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Palette className="w-5 h-5 mr-2" />
                      Transform Image
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Right Panel - Latest Creation */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white">Latest Creation</CardTitle>
                <CardDescription className="text-gray-400">
                  Preview your most recent transformation result
                </CardDescription>
              </CardHeader>

              <CardContent>
                {isGenerating ? (
                  <div className="aspect-square bg-black/50 rounded-lg border border-white/10 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
                      <p className="text-gray-300">
                        Transforming your image...
                      </p>
                      <p className="text-sm text-gray-400">
                        {generationProgress}%
                      </p>
                      {currentNode && (
                        <p className="text-xs text-gray-500 mt-1">
                          {currentNode}
                        </p>
                      )}
                    </div>
                  </div>
                ) : selectedImage &&
                  selectedImage.settings.mode === "image2image" ? (
                  <div className="space-y-4">
                    <div className="aspect-square bg-black/50 rounded-lg border border-white/10 overflow-hidden">
                      <EnhancedImageDisplay
                        image={selectedImage}
                        className="aspect-square"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {selectedImage.prompt}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/5 border-white/10 hover:bg-white/10"
                          onClick={() => downloadImage(selectedImage)}
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/5 border-white/10 hover:bg-white/10"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedImage.prompt);
                          }}
                        >
                          <Copy size={14} className="mr-1" />
                          Copy Prompt
                        </Button>
                      </div>

                      <div className="text-xs text-gray-400 space-y-1">
                        <p>
                          Redux Strength: {selectedImage.settings.reduxStrength}
                        </p>
                        <p>
                          Downsampling:{" "}
                          {selectedImage.settings.downsamplingFactor}
                        </p>
                        <p>
                          LoRA:{" "}
                          {selectedImage.settings.loraModel
                            ?.split("\\")
                            .pop()
                            ?.replace(/\.(safetensors|pt|ckpt)$/, "") || "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-black/50 rounded-lg border border-white/10 flex items-center justify-center">
                    <div className="text-center">
                      <Palette className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
                      <p className="text-gray-300">No transformations yet</p>
                      <p className="text-sm text-gray-400">
                        {isConnected
                          ? "Upload an image and create your first transformation"
                          : "Connect to ComfyUI to start transforming"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Generation Status */}
      {generationStatus && !error && (
        <div className="mt-4 p-4 bg-black/40 backdrop-blur-md rounded-md border border-white/10">
          <h3 className="font-medium mb-2">Generation Status</h3>
          <p>{generationStatus}</p>
        </div>
      )}
    </div>
  );
};

export default AIImagePage;
