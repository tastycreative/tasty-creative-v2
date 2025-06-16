"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Save,
  Trash,
  Check,
  X,
  ImageIcon,
  Settings,
  Sliders,
  Wand2,
  Image as ImageLucide,
  Info,
  ZapOff,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  imageUrl: string;
  filename: string;
  prompt: string;
  negativePrompt?: string;
  settings: any;
  timestamp: Date;
  blobUrl?: string;
  isBookmarked?: boolean;
  isInVault?: boolean;
  type: "image";
}

const AIImage2ImagePage = () => {
  // Canvas and masking states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [showMask, setShowMask] = useState(true);
  const [maskData, setMaskData] = useState<ImageData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseOnCanvas, setIsMouseOnCanvas] = useState(false);
  const [lastDrawPoint, setLastDrawPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Tool states
  const [activeTool, setActiveTool] = useState<"brush" | "eraser">("brush");

  // Generation parameters
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(
    "blurry, low quality, distorted, watermark, signature, text, logo, bad anatomy, deformed, ugly"
  );
  const [selectedLora, setSelectedLora] = useState("");
  const [loraStrength, setLoraStrength] = useState(0.95);
  const [steps, setSteps] = useState(40);
  const [cfgScale, setCfgScale] = useState(1.0);
  const [guidance, setGuidance] = useState(3.5);
  const [reduxStrength, setReduxStrength] = useState(0.8);
  const [downsamplingFactor, setDownsamplingFactor] = useState(3);
  const [batchSize, setBatchSize] = useState(15);
  const [width, setWidth] = useState(832);
  const [height, setHeight] = useState(1216);

  // UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState("");
  const [currentNode, setCurrentNode] = useState("");
  const [latestGeneratedImage, setLatestGeneratedImage] =
    useState<GeneratedImage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [availableLoraModels, setAvailableLoraModels] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Connection status check (using same method as AIText2ImagePage)
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing ComfyUI connection...");
        const response = await fetch("/api/comfyui/object-info", {
          method: "GET",
        });

        if (response.ok) {
          setIsConnected(true);
          console.log("ComfyUI connected successfully");
          const objectInfo = await response.json();

          // Extract LoRA models from the response
          const loraLoader = objectInfo.LoraLoaderModelOnly;
          if (
            loraLoader &&
            loraLoader.input &&
            loraLoader.input.required &&
            loraLoader.input.required.lora_name
          ) {
            const models = loraLoader.input.required.lora_name[0] || [];
            setAvailableLoraModels(models);
            console.log(`Found ${models.length} LoRA models`);
          } else {
            console.log("Using fallback LoRA models");
            setAvailableLoraModels([
              "2\\OF_BRI_V2.safetensors",
              "anime_style.safetensors",
              "realistic_portrait.safetensors",
            ]);
          }
        } else {
          setIsConnected(false);
          console.error("Connection test failed:", response.statusText);
        }
      } catch (error) {
        console.error("Connection test failed:", error);
        setIsConnected(false);
        // For development, use mock data
        setAvailableLoraModels([
          "2\\OF_BRI_V2.safetensors",
          "anime_style.safetensors",
          "realistic_portrait.safetensors",
        ]);
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load generated images from localStorage
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
          setGeneratedImages(parsedImages);
        }
      } catch (error) {
        console.error("Error loading generated images:", error);
      }
    };

    loadGeneratedImages();
  }, []);

  // Save generated images to localStorage
  const saveImageToStorage = useCallback((newImage: GeneratedImage) => {
    setGeneratedImages((prev) => {
      const updated = [newImage, ...prev];
      try {
        localStorage.setItem("ai_generated_images", JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving generated images:", error);
      }
      return updated;
    });
  }, []);

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

    if (isDrawing) {
      drawSmooth(coords);
    }

    // Update brush indicator immediately
    updateBrushIndicator(coords);
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseOnCanvas(true);
    // Immediately show brush indicator when mouse enters
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
    if (!maskData) return;

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
            // Paint mask
            imageData.data[index] = 255; // R
            imageData.data[index + 1] = 255; // G
            imageData.data[index + 2] = 255; // B
            imageData.data[index + 3] = 128; // A (semi-transparent)
          } else {
            // Erase mask
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

    // Draw larger, more visible brush indicator
    const radius = brushSize;

    // Outer circle (main indicator)
    overlayCtx.strokeStyle = activeTool === "brush" ? "#3b82f6" : "#ef4444";
    overlayCtx.lineWidth = 3;
    overlayCtx.setLineDash([8, 4]);
    overlayCtx.beginPath();
    overlayCtx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
    overlayCtx.stroke();

    // Inner dot for precise cursor position
    overlayCtx.fillStyle = activeTool === "brush" ? "#3b82f6" : "#ef4444";
    overlayCtx.setLineDash([]);
    overlayCtx.beginPath();
    overlayCtx.arc(coords.x, coords.y, 2, 0, 2 * Math.PI);
    overlayCtx.fill();

    // Semi-transparent fill to show affected area
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

  // Create clipspace-style image with separate mask channel
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

  // Create separate mask file for clipspace functionality
  const getClipspaceMask = (): string | null => {
    if (!maskData || !uploadedImage) return null;

    const canvas = document.createElement("canvas");
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Create white background (unmasked areas)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create black and white mask - black areas are where AI should focus
    const bwMaskData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < maskData.data.length; i += 4) {
      const alpha = maskData.data[i + 3];
      // Black = masked area (where AI works), White = unmasked area (preserve original)
      const value = alpha > 0 ? 0 : 255; // Inverted for clipspace style
      bwMaskData.data[i] = value; // R
      bwMaskData.data[i + 1] = value; // G
      bwMaskData.data[i + 2] = value; // B
      bwMaskData.data[i + 3] = 255; // A
    }

    ctx.putImageData(bwMaskData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  // Convert base64 to File for upload
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

  // Generation function
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!uploadedImage) {
      setError("Please upload a reference image");
      return;
    }

    if (!selectedLora) {
      setError("Please select a LoRA model");
      return;
    }

    if (!isConnected) {
      setError("Not connected to ComfyUI");
      return;
    }

    setError("");
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Step 1: Upload image and mask separately for clipspace functionality
      const imageBase64 = getClipspaceImageWithMask();
      const maskBase64 = getClipspaceMask();

      if (!imageBase64) {
        throw new Error("Failed to process reference image");
      }

      setCurrentNode("Uploading image...");
      setGenerationProgress(10);

      // Upload the main image (intact, no transparency)
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
          `Failed to upload image: ${
            errorData.error || imageUploadResponse.statusText
          }`
        );
      }

      const imageUploadResult = await imageUploadResponse.json();
      const uploadedImageName = imageUploadResult.name;

      // Upload mask separately if it exists
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

      setCurrentNode("Building workflow...");
      setGenerationProgress(20);

      // Step 2: Build workflow with separate image and mask handling
      const workflow: Record<string, any> = {
        "6": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["51", 1],
            text: prompt,
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
            width: width,
            height: height,
            batch_size: batchSize,
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
            steps: steps,
            cfg: cfgScale,
            sampler_name: "euler",
            scheduler: "beta",
            denoise: 1.0,
          },
        },
        "33": {
          class_type: "CLIPTextEncode",
          inputs: {
            clip: ["51", 1],
            text: negativePrompt,
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
            guidance: guidance,
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
            image: ["155", 0], // Main image from LoadImage
            weight: 1,
            downsampling_function: "area",
            mode: "center crop (square)",
            strength: reduxStrength,
            start_percent: 0.1,
            downsampling_factor: downsamplingFactor,
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
            lora_name: selectedLora,
            strength_model: loraStrength,
            strength_clip: 1.0,
          },
        },
        "155": {
          class_type: "LoadImage",
          inputs: {
            image: uploadedImageName, // Original intact image
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

      // Add mask handling if we have a mask (clipspace style)
      if (uploadedMaskName) {
        // Load the mask image
        workflow["156"] = {
          class_type: "LoadImage",
          inputs: {
            image: uploadedMaskName,
          },
        };

        // Convert image to mask format
        workflow["157"] = {
          class_type: "ImageToMask",
          inputs: {
            image: ["156", 0],
            channel: "red",
          },
        };

        // Add mask to ReduxAdvanced
        workflow["44"].inputs.mask = ["157", 0];
      }

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
      const baseTimeoutMinutes = 5;
      const additionalTimeoutPerImage = 2;
      const timeoutMinutes =
        baseTimeoutMinutes + (batchSize - 1) * additionalTimeoutPerImage;
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

                // Get the generated images
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

                // Convert to GeneratedImage objects
                const generatedImages = imageUrls.map((url, index) => ({
                  id: `${promptId}_${index}`,
                  imageUrl: url,
                  filename: `image2image_${promptId}_${index}.png`,
                  prompt: prompt,
                  negativePrompt: negativePrompt,
                  settings: {
                    model: "flux-dev",
                    sampler: "euler",
                    steps: steps,
                    cfgScale: cfgScale,
                    guidance: guidance,
                    lora: selectedLora,
                    loraStrength: loraStrength,
                    reduxStrength: reduxStrength,
                    downsamplingFactor: downsamplingFactor,
                    width: width,
                    height: height,
                  },
                  timestamp: new Date(),
                  type: "image" as const,
                }));

                // Set the latest generated image (first one from the batch)
                if (generatedImages.length > 0) {
                  setLatestGeneratedImage(generatedImages[0]);

                  // Save each image to storage
                  generatedImages.forEach(saveImageToStorage);
                }

                return;
              }

              if (execution.status && execution.status.status_str === "error") {
                // Get detailed error information
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
      setError(
        `Generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentNode("");
    }
  };

  // Download function for latest generated image
  const downloadLatestImage = async () => {
    if (!latestGeneratedImage) return;

    try {
      const response = await fetch(latestGeneratedImage.imageUrl, {
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
      link.download = latestGeneratedImage.filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(latestGeneratedImage.imageUrl, "_blank");
    }
  };

  // Custom Image Component for the latest creation
  const LatestCreationImage: React.FC<{
    image: GeneratedImage;
    className?: string;
    alt: string;
  }> = ({ image, className, alt }) => {
    const [imgSrc, setImgSrc] = useState<string>(image.imageUrl);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleImageError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    if (hasError) {
      return (
        <div
          className={`${className} bg-gray-800 flex items-center justify-center`}
        >
          <div className="text-center text-gray-400">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-full object-contain bg-black/20"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Image-to-Image Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform existing images with AI by uploading a reference image and
            drawing areas to modify
          </p>
        </div>

        {/* Status Bar */}
        <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-green-400 font-medium">
                        ComfyUI Connected
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {availableLoraModels.length} models available
                    </div>
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

              {isGenerating && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">
                      {generationProgress}%
                    </span>
                  </div>
                  {currentNode && (
                    <span className="text-xs text-gray-400">{currentNode}</span>
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
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Upload className="w-5 h-5 mr-3" />
                  Reference Image
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload an image to transform with AI
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Image Upload */}
                {!uploadedImage ? (
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
                      Choose an image to use as reference for AI transformation
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg px-6"
                    >
                      Choose Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Canvas and Tools */}
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
                          onMouseLeave={handleMouseLeave}
                          onMouseEnter={handleMouseEnter}
                          className="absolute inset-0 w-full h-auto max-h-96 object-contain pointer-events-auto"
                          style={{
                            cursor: "none", // Hide default cursor and use our custom indicator
                          }}
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
            {uploadedImage && (
              <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center">
                    <Brush className="w-5 h-5 mr-3" />
                    Masking Tools
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Draw areas you want the AI to modify
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Tools */}
                  <div>
                    <Label className="text-gray-300 text-sm font-medium mb-3 block">
                      Drawing Tools
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={activeTool === "brush" ? "default" : "outline"}
                        onClick={() => setActiveTool("brush")}
                        className={`h-12 ${
                          activeTool === "brush"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-black/40 border-white/20 text-white hover:bg-white/10"
                        }`}
                      >
                        <Brush className="w-4 h-4 mb-1" />
                        <span className="text-xs">Paint</span>
                      </Button>
                      <Button
                        variant={
                          activeTool === "eraser" ? "default" : "outline"
                        }
                        onClick={() => setActiveTool("eraser")}
                        className={`h-12 ${
                          activeTool === "eraser"
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
                        className="bg-black/40 border-white/20 text-white hover:bg-white/10 h-12"
                      >
                        <RotateCcw className="w-4 h-4 mb-1" />
                        <span className="text-xs">Clear</span>
                      </Button>
                    </div>
                  </div>

                  {/* View Options */}
                  <div>
                    <Label className="text-gray-300 text-sm font-medium mb-3 block">
                      View Options
                    </Label>
                    <Button
                      variant={showMask ? "default" : "outline"}
                      onClick={() => setShowMask(!showMask)}
                      className={`w-full h-12 ${
                        showMask
                          ? "bg-violet-600 hover:bg-violet-700 text-white"
                          : "bg-black/40 border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      {showMask ? (
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

                  {/* Brush Size */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 text-sm font-medium">
                        Brush Size
                      </Label>
                      <span className="text-cyan-400 text-sm font-mono">
                        {brushSize}px
                      </span>
                    </div>
                    <Slider
                      value={[brushSize]}
                      onValueChange={(value) => setBrushSize(value[0])}
                      min={10}
                      max={100}
                      step={2}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Adjust the size of your brush for precise masking
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Generation Settings Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Prompt Input */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Wand2 className="w-5 h-5 mr-3" />
                  Transformation Prompt
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Describe how you want to transform the masked areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Describe the changes you want to make to the masked areas..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-black/40 border-white/20 text-white rounded-xl min-h-[120px] resize-none focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all text-base leading-relaxed"
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Model Selection */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Palette className="w-5 h-5 mr-3" />
                  Style & Model
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose the artistic style for transformation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-300 text-sm font-medium mb-3 block">
                    LoRA Model
                  </Label>
                  <Select value={selectedLora} onValueChange={setSelectedLora}>
                    <SelectTrigger className="bg-black/40 border-white/20 text-white rounded-xl h-12 focus:border-cyan-400/50">
                      <SelectValue placeholder="Select LoRA model" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      {availableLoraModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                            <span>
                              {model.replace(/\.(safetensors|pt|ckpt)$/, "")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-gray-300 text-sm font-medium">
                      LoRA Strength
                    </Label>
                    <span className="text-cyan-400 text-sm font-mono">
                      {loraStrength.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[loraStrength]}
                    onValueChange={(value) => setLoraStrength(value[0])}
                    min={0}
                    max={2}
                    step={0.05}
                    className="py-2"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Controls the influence of the selected art style
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      Generation Settings
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Fine-tune transformation parameters
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black/60 border-white/10 text-white hover:bg-black/80"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {showAdvancedSettings ? "Hide" : "Show"} Advanced
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 text-sm font-medium">
                        Batch Size
                      </Label>
                      <span className="text-cyan-400 text-sm font-mono">
                        {batchSize}
                      </span>
                    </div>
                    <Slider
                      value={[batchSize]}
                      onValueChange={(value) => setBatchSize(value[0])}
                      min={1}
                      max={20}
                      step={1}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Number of variations to generate
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-300 text-sm font-medium">
                        Redux Strength
                      </Label>
                      <span className="text-cyan-400 text-sm font-mono">
                        {reduxStrength.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[reduxStrength]}
                      onValueChange={(value) => setReduxStrength(value[0])}
                      min={0}
                      max={2}
                      step={0.05}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      How much the reference image influences the generation
                    </p>
                  </div>
                </div>

                {showAdvancedSettings && (
                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <div>
                      <Label className="text-gray-300 text-sm font-medium mb-3 block">
                        Negative Prompt
                      </Label>
                      <Textarea
                        placeholder="What you don't want in the transformed areas..."
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="bg-black/40 border-white/20 text-white rounded-xl min-h-[80px]"
                        rows={3}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Describe what to avoid in the transformation
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-gray-300 text-sm font-medium">
                            Downsampling Factor
                          </Label>
                          <span className="text-cyan-400 text-sm font-mono">
                            {downsamplingFactor}
                          </span>
                        </div>
                        <Slider
                          value={[downsamplingFactor]}
                          onValueChange={(value) =>
                            setDownsamplingFactor(value[0])
                          }
                          min={1}
                          max={8}
                          step={1}
                          className="py-2"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Higher values = faster generation, lower detail
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-gray-300 text-sm font-medium">
                            Guidance Scale
                          </Label>
                          <span className="text-cyan-400 text-sm font-mono">
                            {guidance.toFixed(1)}
                          </span>
                        </div>
                        <Slider
                          value={[guidance]}
                          onValueChange={(value) => setGuidance(value[0])}
                          min={1}
                          max={10}
                          step={0.5}
                          className="py-2"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          How closely the result follows your prompt
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-lg font-semibold transition-all duration-200 disabled:opacity-50"
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    !prompt.trim() ||
                    !uploadedImage ||
                    !isConnected ||
                    !selectedLora
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Transforming... {generationProgress}%
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

            {/* Error & Warning Messages */}
            <div className="space-y-4">
              {error && (
                <Alert className="bg-red-900/20 border-red-500/30 text-red-200">
                  <ZapOff className="h-4 w-4" />
                  <AlertTitle>Generation Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isConnected && (
                <Alert className="bg-amber-900/20 border-amber-500/30 text-amber-200">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Connection Required</AlertTitle>
                  <AlertDescription>
                    Please ensure ComfyUI is running and accessible to transform
                    images.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <ImageLucide className="w-5 h-5 mr-3" />
                  Latest Creation
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Preview your most recent transformation
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="h-[500px] flex items-center justify-center">
                  {isGenerating ? (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Transforming Image
                        </h3>
                        <p className="text-gray-400 mb-2">
                          {generationProgress}% complete
                        </p>
                        {currentNode && (
                          <p className="text-gray-500 text-sm">{currentNode}</p>
                        )}
                      </div>
                    </div>
                  ) : latestGeneratedImage ? (
                    <div className="w-full space-y-6">
                      <div className="aspect-square rounded-xl overflow-hidden border border-white/10">
                        <LatestCreationImage
                          image={latestGeneratedImage}
                          alt="Latest transformation"
                          className="aspect-square"
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Latest Transformation
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                            {latestGeneratedImage.prompt}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
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
                                latestGeneratedImage.prompt
                              );
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Prompt
                          </Button>
                        </div>

                        <div className="text-xs text-gray-400 space-y-2 p-3 bg-black/20 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-500">Redux:</span>
                              <span className="text-white ml-1">
                                {latestGeneratedImage.settings.reduxStrength}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Downsampling:
                              </span>
                              <span className="text-white ml-1">
                                {
                                  latestGeneratedImage.settings
                                    .downsamplingFactor
                                }
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">LoRA:</span>
                            <span className="text-white ml-1">
                              {latestGeneratedImage.settings.lora
                                ?.split("\\")
                                .pop()
                                ?.replace(/\.(safetensors|pt|ckpt)$/, "") ||
                                "None"}
                            </span>
                          </div>
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
                          No Transformations Yet
                        </h3>
                        <p className="text-gray-400">
                          {isConnected && uploadedImage
                            ? "Add a prompt and transform your image"
                            : !isConnected
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
