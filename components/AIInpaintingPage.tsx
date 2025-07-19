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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
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
  PaintBucket,
  Brush,
  Eraser,
  RotateCcw,
  Eye,
  EyeOff,
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
  width: number;
  height: number;
  brushSize: number;
}

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

interface AppState {
  isConnected: boolean;
  generatedImages: GeneratedImage[];
  latestGeneratedImage: GeneratedImage | null;
  instagramData: any;
  status: string;
}

// Constants
const DEFAULT_NEGATIVE_PROMPT = "";
const DEFAULT_DIMENSIONS = { width: 832, height: 1216 };
const DEFAULT_GENERATION_PARAMS = {
  steps: 40,
  cfgScale: 1.0,
  guidance: 50,
  brushSize: 40,
};

// Template for imperfect handwritten text
const HANDWRITTEN_TEMPLATE = `the word "{TEXT}" is written in simple BLOCK LETTERS (print style) using ultra‑thin, gray‑black ballpoint pen lines—precise, consistent width, no bleed, like real pen on skin. The handwriting uses only block/print letters, never cursive or script. Each letter is separate and clearly formed in basic print style. The writing is delicate and slightly imperfect, with tiny pen‑lift marks and subtle ink pooling at line ends. IMPORTANT: seamlessly blend the text with the existing skin tone, texture, and lighting. Match the exact skin color, pores, and surface details. Keep all original skin characteristics intact - only add the thin pen marks on top. The surrounding skin texture should be perfectly preserved and indistinguishable from the original. Ensure the pen text looks exactly like someone wrote it by hand moments ago, with a crisp, hairline‑thin stroke throughout, naturally integrated into the existing skin surface.`;

const AIInpaintingPage = () => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
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

  const [appState, setAppState] = useState<AppState>({
    isConnected: false,
    generatedImages: [],
    latestGeneratedImage: null,
    instagramData: null,
    status: "",
  });

  // Generation parameters
  const [generationParams, setGenerationParams] = useState({
    textToWrite: "",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    ...DEFAULT_GENERATION_PARAMS,
    ...DEFAULT_DIMENSIONS,
  });

  // UI state
  const [uiState, setUIState] = useState({
    activeTool: "brush" as DrawingTool,
    showMask: true,
    showTemplate: false,
    customTemplate: HANDWRITTEN_TEMPLATE,
  });

  // Memoized values
  const generateFullPrompt = useCallback(() => {
    return uiState.customTemplate.replace(
      "{TEXT}",
      generationParams.textToWrite
    );
  }, [uiState.customTemplate, generationParams.textToWrite]);

  const canGenerate = useMemo(
    () =>
      generationParams.textToWrite.trim() &&
      canvasState.uploadedImage &&
      appState.isConnected &&
      !generationState.isGenerating &&
      canvasState.maskData,
    [
      generationParams.textToWrite,
      canvasState.uploadedImage,
      appState.isConnected,
      generationState.isGenerating,
      canvasState.maskData,
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
      const color = uiState.activeTool === "brush" ? "#f59e0b" : "#ef4444";

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
          ? "rgba(245, 158, 11, 0.1)"
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

  // Image processing functions
  const processImageUpload = useCallback(
    async (file: File) => {
      const img = new Image();

      return new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          updateCanvasState({ uploadedImage: img });
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
    [updateCanvasState, updateAppState, updateGenerationState]
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

  // Create clipspace-style image with alpha mask for ComfyUI
  const createClipspaceImageForComfyUI =
    useCallback(async (): Promise<string> => {
      if (!canvasRef.current || !canvasState.maskData)
        throw new Error("No canvas or mask available");

      return new Promise((resolve, reject) => {
        const originalCanvas = canvasRef.current!;

        // Create composite canvas with alpha channel
        const compositeCanvas = document.createElement("canvas");
        const compositeCtx = compositeCanvas.getContext("2d");

        if (!compositeCtx) {
          reject(new Error("Failed to create composite canvas"));
          return;
        }

        // Set same dimensions as original
        compositeCanvas.width = originalCanvas.width;
        compositeCanvas.height = originalCanvas.height;

        // Draw the original image
        compositeCtx.drawImage(originalCanvas, 0, 0);

        // Get the image data to modify alpha channel
        const imageData = compositeCtx.getImageData(
          0,
          0,
          compositeCanvas.width,
          compositeCanvas.height
        );

        // Apply mask to alpha channel - white mask areas become transparent (for inpainting)
        for (let i = 0; i < canvasState.maskData!.data.length; i += 4) {
          const maskAlpha = canvasState.maskData!.data[i + 3]; // Alpha of mask
          const imageIndex = i;

          // If mask has content (alpha > 0), make the corresponding image pixel transparent
          if (maskAlpha > 0) {
            imageData.data[imageIndex + 3] = 0; // Make transparent (this tells ComfyUI to inpaint here)
          }
        }

        // Put the modified image data back
        compositeCtx.putImageData(imageData, 0, 0);

        // Convert to blob and upload
        compositeCanvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error("Failed to create composite blob"));
            return;
          }

          try {
            const formData = new FormData();
            formData.append("image", blob, "clipspace_inpaint.png");
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
            resolve(uploadResult.name);
          } catch (error) {
            reject(error);
          }
        }, "image/png");
      });
    }, [canvasState.maskData]);

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

  // Main generation function based on FLUX Fill workflow
  const handleGenerate = useCallback(async () => {
    if (!generationParams.textToWrite.trim()) {
      updateGenerationState({ error: "Please enter the text/name to write" });
      return;
    }

    if (!canvasState.uploadedImage) {
      updateGenerationState({ error: "Please upload an image" });
      return;
    }

    if (!appState.isConnected) {
      updateGenerationState({ error: "Not connected to ComfyUI" });
      return;
    }

    // Check if user has painted any mask areas
    if (!canvasState.maskData) {
      updateGenerationState({
        error: "Please create a mask where you want to write the text",
      });
      return;
    }

    const hasWhitePixels = Array.from(canvasState.maskData.data).some(
      (value, index) => index % 4 === 3 && value > 0 // Check alpha channel for any mask pixels
    );

    if (!hasWhitePixels) {
      updateGenerationState({
        error: "Please paint the area where you want to write the text",
      });
      return;
    }

    updateGenerationState({
      error: "",
      isGenerating: true,
      progress: 0,
    });

    try {
      updateGenerationState({
        currentNode: "Creating clipspace image...",
        progress: 15,
      });

      // Create the clipspace-style image with alpha mask
      const compositeFileName = await createClipspaceImageForComfyUI();

      updateGenerationState({
        currentNode: "Building workflow...",
        progress: 25,
      });

      // Use the exact workflow structure and model names from your JSON
      const workflow: Record<string, any> = {
        "7": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["34", 0],
            text: generationParams.negativePrompt,
          },
        },
        "39": {
          class_type: "DifferentialDiffusion",
          inputs: {
            model: ["31", 0],
          },
        },
        "8": {
          class_type: "VAEDecode",
          inputs: {
            samples: ["3", 0],
            vae: ["32", 0],
          },
        },
        "38": {
          class_type: "InpaintModelConditioning",
          inputs: {
            positive: ["26", 0],
            negative: ["7", 0],
            vae: ["32", 0],
            pixels: ["17", 0],
            mask: ["17", 1],
            noise_mask: false,
          },
        },
        "9": {
          class_type: "SaveImage",
          inputs: {
            images: ["8", 0],
            filename_prefix: "ComfyUI",
          },
        },
        "34": {
          class_type: "DualCLIPLoader",
          inputs: {
            clip_name1: "clip_l.safetensors",
            clip_name2: "t5xxl_fp16.safetensors",
            type: "flux",
            device: "default",
          },
        },
        "31": {
          class_type: "UNETLoader",
          inputs: {
            unet_name: "model_1085456_fp8.safetensors",
            weight_dtype: "default",
          },
        },
        "32": {
          class_type: "VAELoader",
          inputs: {
            vae_name: "ae.safetensors",
          },
        },
        "17": {
          class_type: "LoadImage",
          inputs: {
            image: compositeFileName,
          },
        },
        "26": {
          class_type: "FluxGuidance",
          inputs: {
            conditioning: ["23", 0],
            guidance: generationParams.guidance,
          },
        },
        "3": {
          class_type: "KSampler",
          inputs: {
            model: ["39", 0],
            positive: ["38", 0],
            negative: ["38", 1],
            latent_image: ["38", 2],
            seed: Math.floor(Math.random() * 1000000000),
            steps: generationParams.steps,
            cfg: generationParams.cfgScale,
            sampler_name: "euler",
            scheduler: "normal",
            denoise: 1.0,
          },
        },
        "23": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["34", 0],
            text: generateFullPrompt(),
          },
        },
      };

      const clientId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      updateGenerationState({
        currentNode: "Queuing generation...",
        progress: 30,
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
      const maxAttempts = 300; // 5 minutes timeout

      while (attempts < maxAttempts) {
        updateGenerationState({
          currentNode: `Processing... (${Math.floor(attempts / 60)}:${(
            attempts % 60
          )
            .toString()
            .padStart(2, "0")} / 5:00)`,
          progress: 30 + Math.min((attempts / maxAttempts) * 65, 65),
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
                  filename: `inpaint_${promptId}_${index}.png`,
                  prompt: generateFullPrompt(),
                  negativePrompt: generationParams.negativePrompt,
                  settings: {
                    model: "flux-fill-dev",
                    sampler: "euler",
                    steps: generationParams.steps,
                    cfgScale: generationParams.cfgScale,
                    guidance: generationParams.guidance,
                    width: generationParams.width,
                    height: generationParams.height,
                    brushSize: generationParams.brushSize,
                  },
                  timestamp: new Date(),
                  type: "image" as const,
                  textToWrite: generationParams.textToWrite, // Store the original text too
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
    generationParams.textToWrite,
    generateFullPrompt,
    canvasState.uploadedImage,
    canvasState.maskData,
    appState.isConnected,
    createClipspaceImageForComfyUI,
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
        } else {
          updateAppState({ isConnected: false });
        }
      } catch (error) {
        console.error("Connection test failed:", error);
        updateAppState({ isConnected: false });
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
        const transferData = localStorage.getItem("instagram_to_inpainting");
        if (transferData) {
          const data = JSON.parse(transferData);
          updateAppState({ instagramData: data });

          if (data.imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = async () => {
              updateCanvasState({ uploadedImage: img });
              updateAppState({
                status: `✅ Loaded image from Instagram: ${data.filename}`,
              });
            };
            img.onerror = () => {
              updateGenerationState({
                error: "Failed to load image from Instagram scraper",
              });
            };
            img.src = data.imageUrl;
          }

          if (data.prompt) {
            updateGenerationParams({ textToWrite: data.prompt });
          }

          localStorage.removeItem("instagram_to_inpainting");
        }
      } catch (error) {
        console.error("Error loading Instagram data:", error);
      }
    };

    checkForInstagramData();
  }, [
    updateAppState,
    updateCanvasState,
    updateGenerationParams,
    updateGenerationState,
  ]);

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Handwriting Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Generate realistic imperfect handwritten text on images with
            AI-powered inpainting
          </p>
        </div>

        {/* Status message */}
        {appState.status && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
            <span className="text-green-400">{appState.status}</span>
          </div>
        )}

        {/* Instagram Data Indicator */}
        {appState.instagramData && (
          <div className="bg-gradient-to-r from-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Instagram className="w-5 h-5 text-pink-500" />
              <div className="flex-1">
                <h3 className="text-white font-medium">
                  Loaded from Instagram
                </h3>
                <p className="text-gray-300 text-sm">
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
        <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                {appState.isConnected ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-green-400 font-medium">
                        ComfyUI Connected
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">FLUX Fill Ready</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <span className="text-red-400 font-medium">
                        ComfyUI Offline
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Check connection
                    </div>
                  </>
                )}
              </div>

              {generationState.isGenerating && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">
                      {generationState.progress.toFixed(2)}%
                    </span>
                  </div>
                  {generationState.currentNode && (
                    <span className="text-xs text-gray-400">
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
          {/* Image Upload & Mask Editing Panel */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Upload className="w-5 h-5 mr-3" />
                  Image & Mask Editor
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload an image and paint the areas you want to inpaint
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
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-white font-medium mb-2">
                      Upload Image
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm">
                      Choose an image to edit with AI inpainting
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg px-6"
                    >
                      Choose Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Canvas Container */}
                    <div className="border border-white/10 rounded-xl overflow-hidden relative">
                      <div className="relative bg-black/20">
                        <canvas
                          ref={canvasRef}
                          className="w-full h-auto max-h-96 object-contain bg-black block"
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
                          style={{ cursor: "none" }}
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-black/40 border-white/20 text-white hover:bg-white/10"
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
              <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center">
                    <Brush className="w-5 h-5 mr-3" />
                    Masking Tools
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Paint the areas you want to inpaint with white mask
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-gray-300 text-sm font-medium mb-3 block">
                      Drawing Tools
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={
                          uiState.activeTool === "brush" ? "default" : "outline"
                        }
                        onClick={() => updateUIState({ activeTool: "brush" })}
                        className={`h-12 flex-col ${
                          uiState.activeTool === "brush"
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-black/40 border-white/20 text-white hover:bg-white/10"
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
                        onClick={() => updateUIState({ activeTool: "eraser" })}
                        className={`h-12 flex-col ${
                          uiState.activeTool === "eraser"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-black/40 border-white/20 text-white hover:bg-white/10"
                        }`}
                      >
                        <Eraser className="w-4 h-4 mb-1" />
                        <span className="text-xs">Erase</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearMask}
                        className="bg-black/40 border-white/20 text-white hover:bg-white/10 h-12 flex-col"
                      >
                        <RotateCcw className="w-4 h-4 mb-1" />
                        <span className="text-xs">Clear</span>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 text-sm font-medium">
                        Brush Size
                      </Label>
                      <span className="text-amber-400 text-sm font-mono">
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

                  <div>
                    <Label className="text-gray-300 text-sm font-medium mb-3 block">
                      View Options
                    </Label>
                    <Button
                      variant={uiState.showMask ? "default" : "outline"}
                      onClick={() =>
                        updateUIState({ showMask: !uiState.showMask })
                      }
                      className={`w-full h-12 ${
                        uiState.showMask
                          ? "bg-violet-600 hover:bg-violet-700 text-white"
                          : "bg-black/40 border-white/20 text-white hover:bg-white/10"
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

                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-amber-200 text-xs">
                      💡 Paint where you want the text to appear. These areas
                      will be filled with handwritten text.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Settings Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Text Input */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Wand2 className="w-5 h-5 mr-3" />
                  Text to Write
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the name or text you want to handwrite in the masked
                  area
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter name or text to write..."
                    value={generationParams.textToWrite}
                    onChange={(e) =>
                      updateGenerationParams({ textToWrite: e.target.value })
                    }
                    className="w-full bg-black/40 border-white/20 text-white rounded-xl px-4 py-3 text-lg font-medium placeholder-gray-500 focus:border-amber-400/50 focus:outline-none"
                  />
                </div>

                {/* Template Preview/Edit */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateUIState({ showTemplate: !uiState.showTemplate })
                    }
                    className="bg-black/20 border-white/10 text-gray-300 hover:bg-white/10"
                  >
                    {uiState.showTemplate ? "Hide" : "Show"} Handwriting
                    Template
                  </Button>

                  {uiState.showTemplate && (
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm">
                        Template (automatically applied):
                      </Label>
                      <Textarea
                        value={uiState.customTemplate}
                        onChange={(e) =>
                          updateUIState({ customTemplate: e.target.value })
                        }
                        className="bg-black/40 border-white/20 text-white rounded-xl min-h-[120px] resize-none text-sm"
                        rows={6}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateUIState({
                            customTemplate: HANDWRITTEN_TEMPLATE,
                          })
                        }
                        className="bg-black/20 border-white/10 text-gray-300 hover:bg-white/10"
                      >
                        Reset to Default
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-3" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Steps */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-300 text-sm font-medium">
                      Generation Steps
                    </Label>
                    <span className="text-amber-400 text-sm font-mono">
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
                  <p className="text-xs text-gray-400 mt-2">
                    More steps = higher quality, slower generation
                  </p>
                </div>

                {/* Guidance */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-300 text-sm font-medium">
                      Guidance Scale
                    </Label>
                    <span className="text-amber-400 text-sm font-mono">
                      {generationParams.guidance.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[generationParams.guidance]}
                    onValueChange={(value) =>
                      updateGenerationParams({ guidance: value[0] })
                    }
                    min={1.0}
                    max={100.0}
                    step={0.5}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    How closely to follow the prompt
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-lg font-semibold"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {generationState.isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Writing Text... {generationState.progress.toFixed(2)}%
                    </>
                  ) : (
                    <>
                      <PaintBucket className="w-5 h-5 mr-3" />
                      Generate Handwriting
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Error Messages */}
            {generationState.error && (
              <Alert className="bg-red-900/20 border-red-500/30 text-red-200">
                <ZapOff className="h-4 w-4" />
                <AlertTitle>Inpainting Error</AlertTitle>
                <AlertDescription>{generationState.error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <ImageLucide className="w-5 h-5 mr-3" />
                  Latest Result
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="h-[500px] flex items-center justify-center">
                  {generationState.isGenerating ? (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Writing Text
                        </h3>
                        <p className="text-gray-400 mb-2">
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
                          alt="Latest inpainting result"
                          className="w-full h-full object-contain bg-black/20"
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Latest Handwriting: "{generationParams.textToWrite}"
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-3">
                            Generated with imperfect handwritten style
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                            onClick={downloadLatestImage}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>

                          <Button
                            variant="outline"
                            className="bg-black/40 border-white/20 text-white hover:bg-white/10 flex-1"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                generationParams.textToWrite
                              );
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Text
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                        <Palette className="w-10 h-10 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No Handwriting Yet
                        </h3>
                        <p className="text-gray-400">
                          {appState.isConnected && canvasState.uploadedImage
                            ? "Paint a mask and enter text to generate handwriting"
                            : !appState.isConnected
                              ? "Connect to ComfyUI to start generating text"
                              : "Upload an image to begin text generation"}
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

export default AIInpaintingPage;
