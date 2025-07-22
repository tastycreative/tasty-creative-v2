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
  Brush,
  Eraser,
  RotateCcw,
  Download,
  Loader2,
  Palette,
  Eye,
  EyeOff,
  Copy,
  ImageIcon,
  Settings,
  Wand2,
  Image as ImageLucide,
  Info,
  ZapOff,
  Instagram,
  Users,
  Scan,
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
  reduxStrength: number;
  downsamplingFactor: number;
  width: number;
  height: number;
  autoMaskMode: AutoMaskMode;
  detectedPersons: number;
}

type AutoMaskMode = "manual" | "person" | "background";
type DrawingTool = "brush" | "eraser";

interface CanvasState {
  uploadedImage: HTMLImageElement | null;
  maskData: ImageData | null;
  isDrawing: boolean;
  lastDrawPoint: { x: number; y: number } | null;
  mousePos: { x: number; y: number };
  isMouseOnCanvas: boolean;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentNode: string;
  error: string;
}

interface AIDetectionState {
  model: any;
  isLoadingModel: boolean;
  isProcessingMask: boolean;
  detectedPersons: number;
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
  reduxStrength: 0.8,
  downsamplingFactor: 1,
  batchSize: 5,
  loraStrength: 0.95,
  brushSize: 40,
};

const MASK_MODES = [
  {
    value: "manual" as const,
    label: "Manual",
    desc: "Draw mask manually",
    icon: Brush,
  },
  {
    value: "person" as const,
    label: "Person Detection",
    desc: "AI detects and masks people",
    icon: Users,
    ai: true,
  },
  {
    value: "background" as const,
    label: "Background Only",
    desc: "AI masks everything except people",
    icon: Scan,
    ai: true,
  },
];

const AIImage2ImagePage = () => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management with better organization
  const [canvasState, setCanvasState] = useState<CanvasState>({
    uploadedImage: null,
    maskData: null,
    isDrawing: false,
    lastDrawPoint: null,
    mousePos: { x: 0, y: 0 },
    isMouseOnCanvas: false,
  });

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentNode: "",
    error: "",
  });

  const [aiDetectionState, setAIDetectionState] = useState<AIDetectionState>({
    model: null,
    isLoadingModel: false,
    isProcessingMask: false,
    detectedPersons: 0,
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

  // UI state
  const [uiState, setUIState] = useState({
    autoMaskMode: "person" as AutoMaskMode,
    activeTool: "brush" as DrawingTool,
    showMask: true,
  });

  // Memoized values
  const canHavePotentialMask = useMemo(
    () =>
      canvasState.uploadedImage &&
      (uiState.autoMaskMode !== "manual" || canvasState.maskData),
    [canvasState.uploadedImage, uiState.autoMaskMode, canvasState.maskData]
  );

  const canGenerate = useMemo(
    () =>
      generationParams.prompt.trim() &&
      canvasState.uploadedImage &&
      appState.isConnected &&
      generationParams.selectedLora &&
      !generationState.isGenerating,
    [
      generationParams.prompt,
      canvasState.uploadedImage,
      appState.isConnected,
      generationParams.selectedLora,
      generationState.isGenerating,
    ]
  );

  // Helper functions
  const updateGenerationState = useCallback(
    (updates: Partial<GenerationState>) => {
      setGenerationState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const updateCanvasState = useCallback((updates: Partial<CanvasState>) => {
    setCanvasState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateAIDetectionState = useCallback(
    (updates: Partial<AIDetectionState>) => {
      setAIDetectionState((prev) => ({ ...prev, ...updates }));
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

  const updateUIState = useCallback((updates: Partial<typeof uiState>) => {
    setUIState((prev) => ({ ...prev, ...updates }));
  }, []);

  // AI Model Loading
  const loadPersonDetectionModel = useCallback(async () => {
    if (aiDetectionState.model) return aiDetectionState.model;

    updateAIDetectionState({ isLoadingModel: true });
    try {
      const [tf, bodyPix] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/body-pix"),
      ]);

      const model = await bodyPix.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
      });

      updateAIDetectionState({ model });
      updateAppState({ status: "✅ Person detection model loaded" });
      return model;
    } catch (error) {
      console.error("Failed to load person detection model:", error);
      updateGenerationState({
        error: "Failed to load person detection model. Using fallback methods.",
      });
      return null;
    } finally {
      updateAIDetectionState({ isLoadingModel: false });
    }
  }, [
    aiDetectionState.model,
    updateAIDetectionState,
    updateAppState,
    updateGenerationState,
  ]);

  // Segmentation functions
  const performSegmentation = useCallback(
    async (
      img: HTMLImageElement,
      mode: "person" | "background"
    ): Promise<ImageData | null> => {
      try {
        const model = await loadPersonDetectionModel();
        if (!model) return null;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return null;

        tempCtx.drawImage(img, 0, 0);

        const segmentation = await model.segmentPerson(tempCanvas, {
          flipHorizontal: false,
          internalResolution: "medium",
          segmentationThreshold: 0.7,
          maxDetections: 5,
          scoreThreshold: 0.4,
          nmsRadius: 20,
        });

        const personsCount =
          segmentation.allPoses?.length ||
          (segmentation.data.some((pixel: number) => pixel === 1) ? 1 : 0);

        updateAIDetectionState({ detectedPersons: personsCount });

        const maskData = tempCtx.createImageData(img.width, img.height);
        const isPersonMode = mode === "person";

        for (let i = 0; i < segmentation.data.length; i++) {
          const pixelIndex = i * 4;
          const isPersonPixel = segmentation.data[i] === 1;
          const shouldMask = isPersonMode ? isPersonPixel : !isPersonPixel;

          if (shouldMask) {
            maskData.data[pixelIndex] = 255; // R
            maskData.data[pixelIndex + 1] = 255; // G
            maskData.data[pixelIndex + 2] = 255; // B
            maskData.data[pixelIndex + 3] = 128; // A
          } else {
            maskData.data[pixelIndex] = 0;
            maskData.data[pixelIndex + 1] = 0;
            maskData.data[pixelIndex + 2] = 0;
            maskData.data[pixelIndex + 3] = 0;
          }
        }

        return maskData;
      } catch (error) {
        console.error(`${mode} segmentation failed:`, error);
        return null;
      }
    },
    [loadPersonDetectionModel, updateAIDetectionState]
  );

  // Automatic mask generation
  const generateAutomaticMask = useCallback(
    async (
      img: HTMLImageElement,
      mode: AutoMaskMode
    ): Promise<ImageData | null> => {
      switch (mode) {
        case "person":
        case "background":
          return await performSegmentation(img, mode);
        default:
          return null;
      }
    },
    [performSegmentation]
  );

  // Canvas utility functions
  const getCanvasCoordinates = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const drawCircle = useCallback(
    (
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
              imageData.data[index] = 255;
              imageData.data[index + 1] = 255;
              imageData.data[index + 2] = 255;
              imageData.data[index + 3] = 128;
            } else {
              imageData.data[index] = 0;
              imageData.data[index + 1] = 0;
              imageData.data[index + 2] = 0;
              imageData.data[index + 3] = 0;
            }
          }
        }
      }
    },
    []
  );

  const redrawCanvas = useCallback(
    (currentMaskData?: ImageData) => {
      const canvas = canvasRef.current;
      if (!canvas || !canvasState.uploadedImage) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(canvasState.uploadedImage, 0, 0);

      if (uiState.showMask && (currentMaskData || canvasState.maskData)) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.putImageData(currentMaskData || canvasState.maskData!, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    },
    [canvasState.uploadedImage, canvasState.maskData, uiState.showMask]
  );

  // Drawing functions
  const drawSmooth = useCallback(
    (currentPoint: { x: number; y: number }) => {
      if (!canvasState.maskData) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newMaskData = ctx.createImageData(
        canvasState.maskData.width,
        canvasState.maskData.height
      );
      newMaskData.data.set(canvasState.maskData.data);

      if (canvasState.lastDrawPoint) {
        const distance = Math.sqrt(
          Math.pow(currentPoint.x - canvasState.lastDrawPoint.x, 2) +
            Math.pow(currentPoint.y - canvasState.lastDrawPoint.y, 2)
        );

        const steps = Math.max(1, Math.floor(distance / 2));

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x =
            canvasState.lastDrawPoint.x +
            (currentPoint.x - canvasState.lastDrawPoint.x) * t;
          const y =
            canvasState.lastDrawPoint.y +
            (currentPoint.y - canvasState.lastDrawPoint.y) * t;

          drawCircle(
            newMaskData,
            x,
            y,
            generationParams.brushSize,
            uiState.activeTool === "brush"
          );
        }
      } else {
        drawCircle(
          newMaskData,
          currentPoint.x,
          currentPoint.y,
          generationParams.brushSize,
          uiState.activeTool === "brush"
        );
      }

      updateCanvasState({
        lastDrawPoint: currentPoint,
        maskData: newMaskData,
      });
      redrawCanvas(newMaskData);
    },
    [
      canvasState.maskData,
      canvasState.lastDrawPoint,
      generationParams.brushSize,
      uiState.activeTool,
      drawCircle,
      updateCanvasState,
      redrawCanvas,
    ]
  );

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoordinates(event);
      updateCanvasState({ mousePos: coords });

      if (canvasState.isDrawing) {
        drawSmooth(coords);
      }

      // Update brush indicator
      const overlayCanvas = overlayCanvasRef.current;
      if (!overlayCanvas || !canvasState.isMouseOnCanvas) return;

      const overlayCtx = overlayCanvas.getContext("2d");
      if (!overlayCtx) return;

      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      const radius = generationParams.brushSize;
      const color = uiState.activeTool === "brush" ? "#3b82f6" : "#ef4444";

      overlayCtx.strokeStyle = color;
      overlayCtx.lineWidth = 3;
      overlayCtx.setLineDash([8, 4]);
      overlayCtx.beginPath();
      overlayCtx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
      overlayCtx.stroke();

      overlayCtx.fillStyle = color;
      overlayCtx.setLineDash([]);
      overlayCtx.beginPath();
      overlayCtx.arc(coords.x, coords.y, 2, 0, 2 * Math.PI);
      overlayCtx.fill();

      overlayCtx.fillStyle =
        uiState.activeTool === "brush"
          ? "rgba(59, 130, 246, 0.1)"
          : "rgba(239, 68, 68, 0.1)";
      overlayCtx.beginPath();
      overlayCtx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
      overlayCtx.fill();
    },
    [
      getCanvasCoordinates,
      canvasState.isDrawing,
      canvasState.isMouseOnCanvas,
      generationParams.brushSize,
      uiState.activeTool,
      updateCanvasState,
      drawSmooth,
    ]
  );

  const startDrawing = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoordinates(event);
      updateCanvasState({
        isDrawing: true,
        lastDrawPoint: coords,
      });
      drawSmooth(coords);
    },
    [getCanvasCoordinates, updateCanvasState, drawSmooth]
  );

  const stopDrawing = useCallback(() => {
    updateCanvasState({
      isDrawing: false,
      lastDrawPoint: null,
    });
  }, [updateCanvasState]);

  // Image processing functions
  const processImageUpload = useCallback(
    async (file: File) => {
      updateAIDetectionState({ isProcessingMask: true });

      const img = new Image();

      return new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          updateCanvasState({ uploadedImage: img });

          if (uiState.autoMaskMode !== "manual") {
            try {
              const autoMask = await generateAutomaticMask(
                img,
                uiState.autoMaskMode
              );
              if (autoMask) {
                updateCanvasState({ maskData: autoMask });
                const mode = uiState.autoMaskMode;
                const personText =
                  aiDetectionState.detectedPersons > 0
                    ? ` (${aiDetectionState.detectedPersons} person(s) detected)`
                    : "";
                updateAppState({
                  status: `✅ Automatically generated ${mode} mask${personText}`,
                });
              }
            } catch (error) {
              console.error("Error generating automatic mask:", error);
              updateGenerationState({
                error: "Failed to generate automatic mask",
              });
              updateCanvasState({ maskData: null });
            }
          } else {
            updateCanvasState({ maskData: null });
          }

          updateAppState({ instagramData: null });
          updateAIDetectionState({ isProcessingMask: false });
          resolve();
        };

        img.onerror = () => {
          updateGenerationState({ error: "Failed to load image" });
          updateAIDetectionState({ isProcessingMask: false });
          reject(new Error("Failed to load image"));
        };

        img.src = URL.createObjectURL(file);
      });
    },
    [
      uiState.autoMaskMode,
      generateAutomaticMask,
      aiDetectionState.detectedPersons,
      updateCanvasState,
      updateAIDetectionState,
      updateAppState,
      updateGenerationState,
    ]
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

  const clearMask = useCallback(() => {
    if (!canvasState.uploadedImage) return;

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
    updateCanvasState({ maskData: imageData });
    redrawCanvas(imageData);
  }, [canvasState.uploadedImage, updateCanvasState, redrawCanvas]);

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

  // Get clipspace image and mask
  const getClipspaceImageWithMask = useCallback((): string | null => {
    if (!canvasState.uploadedImage) return null;

    const canvas = document.createElement("canvas");
    canvas.width = canvasState.uploadedImage.width;
    canvas.height = canvasState.uploadedImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(canvasState.uploadedImage, 0, 0);
    return canvas.toDataURL("image/png");
  }, [canvasState.uploadedImage]);

  const getClipspaceMask = useCallback((): string | null => {
    if (!canvasState.maskData || !canvasState.uploadedImage) return null;

    const canvas = document.createElement("canvas");
    canvas.width = canvasState.uploadedImage.width;
    canvas.height = canvasState.uploadedImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bwMaskData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < canvasState.maskData.data.length; i += 4) {
      const alpha = canvasState.maskData.data[i + 3];
      const value = alpha > 0 ? 0 : 255;
      bwMaskData.data[i] = value;
      bwMaskData.data[i + 1] = value;
      bwMaskData.data[i + 2] = value;
      bwMaskData.data[i + 3] = 255;
    }

    ctx.putImageData(bwMaskData, 0, 0);
    return canvas.toDataURL("image/png");
  }, [canvasState.maskData, canvasState.uploadedImage]);

  const base64ToFile = useCallback(
    async (base64: string, filename: string): Promise<File> => {
      const arr = base64.split(",");
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const originalFile = new File([u8arr], filename, { type: mime });

      if (originalFile.size > 2 * 1024 * 1024) {
        console.log(`Compressing large file: ${originalFile.size} bytes`);
        return await compressImage(originalFile);
      }

      return originalFile;
    },
    [compressImage]
  );

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

  // Main generation function
  const handleGenerate = useCallback(async () => {
    if (!generationParams.prompt.trim()) {
      updateGenerationState({ error: "Please enter a prompt" });
      return;
    }

    if (!canvasState.uploadedImage) {
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
      const imageBase64 = getClipspaceImageWithMask();
      const maskBase64 = getClipspaceMask();

      if (!imageBase64) {
        throw new Error("Failed to process reference image");
      }

      updateGenerationState({
        currentNode: "Uploading image...",
        progress: 10,
      });

      const imageFile = await base64ToFile(imageBase64, "input_image.png");
      const imageFormData = new FormData();
      imageFormData.append("image", imageFile);
      imageFormData.append("subfolder", "");
      imageFormData.append("type", "input");

      const imageUploadResponse = await fetch("/api/comfyui/upload", {
        method: "POST",
        body: imageFormData,
      });

      if (!imageUploadResponse.ok) {
        const errorMessage = await handleApiError(imageUploadResponse);
        throw new Error(`Failed to upload image: ${errorMessage}`);
      }

      const imageUploadResult = await imageUploadResponse.json();
      const uploadedImageName = imageUploadResult.name;

      let uploadedMaskName = "";
      if (maskBase64) {
        updateGenerationState({
          currentNode: "Uploading mask...",
          progress: 15,
        });

        const maskFile = await base64ToFile(
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
        } else {
          try {
            const errorMessage = await handleApiError(maskUploadResponse);
            console.warn("Mask upload failed:", errorMessage);
          } catch (parseError) {
            console.warn("Mask upload failed:", maskUploadResponse.statusText);
          }
        }
      }

      updateGenerationState({
        currentNode: "Building workflow...",
        progress: 20,
      });

      const workflow: Record<string, any> = {
        "6": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["51", 1],
            text: generationParams.prompt,
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
            width: generationParams.width,
            height: generationParams.height,
            batch_size: generationParams.batchSize,
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
            steps: generationParams.steps,
            cfg: generationParams.cfgScale,
            sampler_name: "euler",
            scheduler: "beta",
            denoise: 1.0,
          },
        },
        "33": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["51", 1],
            text: generationParams.negativePrompt,
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
            guidance: generationParams.guidance,
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
            strength: generationParams.reduxStrength,
            start_percent: 0.1,
            downsampling_factor: generationParams.downsamplingFactor,
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
            lora_name: generationParams.selectedLora,
            strength_model: generationParams.loraStrength,
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
                  filename: `image2image_${promptId}_${index}.png`,
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
                    reduxStrength: generationParams.reduxStrength,
                    downsamplingFactor: generationParams.downsamplingFactor,
                    width: generationParams.width,
                    height: generationParams.height,
                    autoMaskMode: uiState.autoMaskMode,
                    detectedPersons: aiDetectionState.detectedPersons,
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
    canvasState.uploadedImage,
    appState.isConnected,
    uiState.autoMaskMode,
    aiDetectionState.detectedPersons,
    getClipspaceImageWithMask,
    getClipspaceMask,
    base64ToFile,
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
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas || !canvasState.uploadedImage) return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!ctx || !overlayCtx) return;

    canvas.width = canvasState.uploadedImage.width;
    canvas.height = canvasState.uploadedImage.height;
    overlayCanvas.width = canvasState.uploadedImage.width;
    overlayCanvas.height = canvasState.uploadedImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvasState.uploadedImage, 0, 0);

    if (!canvasState.maskData) {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 0;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = 0;
      }
      updateCanvasState({ maskData: imageData });
    }
  }, [canvasState.uploadedImage, canvasState.maskData, updateCanvasState]);

  // Function to regenerate mask when mode changes
  const regenerateAutomaticMask = useCallback(async () => {
    if (!canvasState.uploadedImage || uiState.autoMaskMode === "manual") return;

    updateAIDetectionState({ isProcessingMask: true });
    try {
      const autoMask = await generateAutomaticMask(
        canvasState.uploadedImage,
        uiState.autoMaskMode
      );
      if (autoMask) {
        updateCanvasState({ maskData: autoMask });
        if (
          uiState.autoMaskMode === "person" ||
          uiState.autoMaskMode === "background"
        ) {
          updateAppState({
            status: `✅ Detected ${aiDetectionState.detectedPersons} person(s) and generated ${uiState.autoMaskMode} mask`,
          });
        } else {
          updateAppState({
            status: `✅ Regenerated ${uiState.autoMaskMode} mask`,
          });
        }
      }
    } catch (error) {
      console.error("Error regenerating automatic mask:", error);
      updateGenerationState({ error: "Failed to regenerate automatic mask" });
    } finally {
      updateAIDetectionState({ isProcessingMask: false });
    }
  }, [
    canvasState.uploadedImage,
    uiState.autoMaskMode,
    generateAutomaticMask,
    aiDetectionState.detectedPersons,
    updateAIDetectionState,
    updateCanvasState,
    updateAppState,
    updateGenerationState,
  ]);

  // Effect to regenerate mask when mode changes
  useEffect(() => {
    if (canvasState.uploadedImage && uiState.autoMaskMode !== "manual") {
      regenerateAutomaticMask();
    } else if (uiState.autoMaskMode === "manual") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.createImageData(canvas.width, canvas.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 0;
            imageData.data[i + 1] = 0;
            imageData.data[i + 2] = 0;
            imageData.data[i + 3] = 0;
          }
          updateCanvasState({ maskData: imageData });
        }
      }
    }
  }, [
    uiState.autoMaskMode,
    regenerateAutomaticMask,
    canvasState.uploadedImage,
    updateCanvasState,
  ]);

  // Effects
  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

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

  // Instagram data loading with automatic masking
  useEffect(() => {
    const checkForInstagramData = async () => {
      try {
        const transferData = localStorage.getItem("instagram_to_image2image");
        if (transferData) {
          const data = JSON.parse(transferData);
          updateAppState({ instagramData: data });
          updateAIDetectionState({ isProcessingMask: true });

          if (data.imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = async () => {
              updateCanvasState({ uploadedImage: img });

              if (uiState.autoMaskMode !== "manual") {
                try {
                  const autoMask = await generateAutomaticMask(
                    img,
                    uiState.autoMaskMode
                  );
                  if (autoMask) {
                    updateCanvasState({ maskData: autoMask });
                    if (
                      uiState.autoMaskMode === "person" ||
                      uiState.autoMaskMode === "background"
                    ) {
                      updateAppState({
                        status: `✅ Loaded image from Instagram with ${uiState.autoMaskMode} mask (${aiDetectionState.detectedPersons} person(s) detected): ${data.filename}`,
                      });
                    } else {
                      updateAppState({
                        status: `✅ Loaded image from Instagram with ${uiState.autoMaskMode} mask: ${data.filename}`,
                      });
                    }
                  } else {
                    updateCanvasState({ maskData: null });
                    updateAppState({
                      status: `✅ Loaded image from Instagram: ${data.filename}`,
                    });
                  }
                } catch (error) {
                  console.error(
                    "Error generating automatic mask for Instagram image:",
                    error
                  );
                  updateCanvasState({ maskData: null });
                  updateAppState({
                    status: `✅ Loaded image from Instagram: ${data.filename}`,
                  });
                }
              } else {
                updateCanvasState({ maskData: null });
                updateAppState({
                  status: `✅ Loaded image from Instagram: ${data.filename}`,
                });
              }

              updateAIDetectionState({ isProcessingMask: false });
            };
            img.onerror = () => {
              updateGenerationState({
                error: "Failed to load image from Instagram scraper",
              });
              updateAIDetectionState({ isProcessingMask: false });
            };
            img.src = data.imageUrl;
          }

          if (data.prompt) {
            updateGenerationParams({ prompt: data.prompt });
          }

          localStorage.removeItem("instagram_to_image2image");
        }
      } catch (error) {
        console.error("Error loading Instagram data:", error);
        updateAIDetectionState({ isProcessingMask: false });
      }
    };

    checkForInstagramData();
  }, [
    uiState.autoMaskMode,
    generateAutomaticMask,
    aiDetectionState.detectedPersons,
    updateAppState,
    updateAIDetectionState,
    updateCanvasState,
    updateGenerationParams,
    updateGenerationState,
  ]);

  // Auto Mask Selector Component
  const AutoMaskSelector = useMemo(
    () => (
      <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-700 flex items-center">
            <Settings className="w-5 h-5 mr-3" />
            Auto Masking Mode
            {aiDetectionState.isLoadingModel && (
              <Loader2 className="w-4 h-4 ml-2 animate-spin text-pink-600" />
            )}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Choose between manual masking or AI-powered person detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {MASK_MODES.map(({ value, label, desc, icon: Icon, ai }) => (
              <Button
                key={value}
                variant={uiState.autoMaskMode === value ? "default" : "outline"}
                onClick={() => updateUIState({ autoMaskMode: value })}
                className={`h-16 justify-start text-left ${
                  uiState.autoMaskMode === value
                    ? ai
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                      : "bg-pink-500 hover:bg-pink-600 text-white"
                    : "bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                }`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{label}</span>
                    {ai && (
                      <span className="px-1.5 py-0.5 bg-pink-500/20 text-pink-600 text-xs rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70">{desc}</div>
                </div>
              </Button>
            ))}
          </div>

          {uiState.autoMaskMode === "background" &&
            aiDetectionState.detectedPersons > 0 && (
              <div className="bg-pink-100/60 border border-pink-300/50 rounded-lg p-3">
                <div className="flex items-center text-pink-600 text-sm">
                  <Scan className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>
                    Will mask background, preserving{" "}
                    {aiDetectionState.detectedPersons} person(s)
                  </span>
                </div>
              </div>
            )}

          {aiDetectionState.isProcessingMask && (
            <div className="flex items-center justify-center p-4 bg-pink-50/40 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-pink-600 mr-2" />
              <span className="text-pink-600 text-sm">
                Running AI person detection...
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    [
      uiState.autoMaskMode,
      aiDetectionState.isLoadingModel,
      aiDetectionState.detectedPersons,
      aiDetectionState.isProcessingMask,
      updateUIState,
    ]
  );

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
            Transform existing images with AI using automatic person detection
            and masking
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
                    {aiDetectionState.model && (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                        <span className="text-pink-600 font-medium text-sm">
                          AI Detection Ready
                        </span>
                      </div>
                    )}
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
          {/* Image Upload and Masking Panel */}
          <div className="xl:col-span-1 space-y-6">
            {AutoMaskSelector}

            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <Upload className="w-5 h-5 mr-3" />
                  Reference Image
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Upload an image to transform with AI
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!canvasState.uploadedImage ? (
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
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
                    <div className="border border-white/10 rounded-xl overflow-hidden relative">
                      <div className="relative bg-pink-50/40">
                        <canvas
                          ref={canvasRef}
                          className="w-full h-auto max-h-96 object-contain bg-pink-50/20 block"
                        />
                        <canvas
                          ref={overlayCanvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={handleMouseMove}
                          onMouseUp={stopDrawing}
                          onMouseLeave={() =>
                            updateCanvasState({
                              isMouseOnCanvas: false,
                              isDrawing: false,
                              lastDrawPoint: null,
                            })
                          }
                          onMouseEnter={() =>
                            updateCanvasState({ isMouseOnCanvas: true })
                          }
                          className="absolute inset-0 w-full h-auto max-h-96 object-contain pointer-events-auto"
                          style={{
                            cursor:
                              uiState.autoMaskMode === "manual"
                                ? "none"
                                : "default",
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border-pink-200 text-gray-700 hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Masking Tools */}
            {canvasState.uploadedImage && (
              <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-700 flex items-center">
                    <Brush className="w-5 h-5 mr-3" />
                    Masking Tools
                    {uiState.autoMaskMode !== "manual" && (
                      <span className="ml-2 px-2 py-1 text-white text-xs rounded-full bg-gradient-to-r from-pink-500 to-rose-500">
                        AI: {uiState.autoMaskMode}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {uiState.autoMaskMode === "manual" ? (
                    <>
                      <div>
                        <Label className="text-gray-600 text-sm font-medium mb-3 block">
                          Drawing Tools
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant={
                              uiState.activeTool === "brush"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              updateUIState({ activeTool: "brush" })
                            }
                            className={`h-12 ${
                              uiState.activeTool === "brush"
                                ? "bg-pink-500 hover:bg-pink-600 text-white"
                                : "bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                            }`}
                          >
                            <Brush className="w-4 h-4 mb-1" />
                            <span className="text-xs">Paint</span>
                          </Button>
                          <Button
                            variant={
                              uiState.activeTool === "eraser"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              updateUIState({ activeTool: "eraser" })
                            }
                            className={`h-12 ${
                              uiState.activeTool === "eraser"
                                ? "bg-pink-600 hover:bg-pink-700 text-white"
                                : "bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                            }`}
                          >
                            <Eraser className="w-4 h-4 mb-1" />
                            <span className="text-xs">Erase</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={clearMask}
                            className="bg-white border-pink-200 text-gray-700 hover:bg-white/10 h-12"
                          >
                            <RotateCcw className="w-4 h-4 mb-1" />
                            <span className="text-xs">Clear</span>
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-gray-600 text-sm font-medium">
                            Brush Size
                          </Label>
                          <span className="text-pink-600 text-sm font-mono">
                            {generationParams.brushSize}px
                          </span>
                        </div>
                        <Slider
                          value={[generationParams.brushSize]}
                          onValueChange={(value) =>
                            updateGenerationParams({ brushSize: value[0] })
                          }
                          min={10}
                          max={100}
                          step={2}
                          className="py-2"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="bg-gradient-to-br from-pink-100 to-rose-100 border-pink-200 border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-pink-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            AI Detection Active
                          </span>
                        </div>
                        {aiDetectionState.isProcessingMask && (
                          <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
                        )}
                      </div>
                      <p className="text-sm mb-3 text-pink-600">
                        Using AI to automatically detect and mask{" "}
                        {uiState.autoMaskMode === "person"
                          ? "people"
                          : "background"}{" "}
                        in the image.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateUIState({ autoMaskMode: "manual" })
                        }
                        className="w-full bg-white border-pink-200 text-gray-700 hover:bg-white/10"
                      >
                        <Brush className="w-3 h-3 mr-1" />
                        Switch to Manual Mode
                      </Button>
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-600 text-sm font-medium mb-3 block">
                      View Options
                    </Label>
                    <Button
                      variant={uiState.showMask ? "default" : "outline"}
                      onClick={() =>
                        updateUIState({ showMask: !uiState.showMask })
                      }
                      className={`w-full h-12 ${
                        uiState.showMask
                          ? "bg-pink-500 hover:bg-pink-600 text-white"
                          : "bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                      }`}
                    >
                      {uiState.showMask ? (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Hide Mask
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Show Mask
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  Describe how you want to transform the{" "}
                  {uiState.autoMaskMode === "manual"
                    ? "masked areas"
                    : uiState.autoMaskMode === "person"
                      ? "detected people"
                      : "background"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder={
                      uiState.autoMaskMode === "person"
                        ? "Describe how you want to transform the people in the image..."
                        : uiState.autoMaskMode === "background"
                          ? "Describe how you want to transform the background..."
                          : "Describe the changes you want to make to the masked areas..."
                    }
                    value={generationParams.prompt}
                    onChange={(e) =>
                      updateGenerationParams({ prompt: e.target.value })
                    }
                    className="bg-white border-pink-200 text-gray-700 rounded-xl min-h-[120px] resize-none"
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style & Generation Settings */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <Palette className="w-5 h-5 mr-3" />
                  Style & Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[300px] overflow-y-auto">
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

                {/* Redux Strength */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 text-sm font-medium">
                      Redux Strength
                    </Label>
                    <span className="text-pink-600 text-sm font-mono">
                      {generationParams.reduxStrength.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[generationParams.reduxStrength]}
                    onValueChange={(value) =>
                      updateGenerationParams({ reduxStrength: value[0] })
                    }
                    min={0}
                    max={2}
                    step={0.05}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    How much the reference image influences the generation
                  </p>
                </div>

                {/* Downsampling Factor */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-600 text-sm font-medium">
                      Downsampling Factor
                    </Label>
                    <span className="text-pink-600 text-sm font-mono">
                      {generationParams.downsamplingFactor}
                    </span>
                  </div>
                  <Slider
                    value={[generationParams.downsamplingFactor]}
                    onValueChange={(value) =>
                      updateGenerationParams({ downsamplingFactor: value[0] })
                    }
                    min={1}
                    max={8}
                    step={1}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Higher values = faster generation, lower detail
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
                      Transforming... {generationState.progress.toFixed(2)}%
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-3" />
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
                      <div className="aspect-square rounded-xl overflow-hidden border border-white/10">
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
                            className="bg-white border-pink-200 text-gray-700 hover:bg-white/10 flex-1"
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
                          {appState.isConnected && canvasState.uploadedImage
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

export default AIImage2ImagePage;
