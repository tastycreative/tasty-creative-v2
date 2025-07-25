"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Loader2,
  RefreshCw,
  Play,
  X,
  Download,
  Image,
  Clock,
  Star,
  Grid,
  List,
  Search,
  Filter,
  Bookmark,
  Share,
  Copy,
  Plus,
  Trash,
  Eye,
  Upload,
  FolderOpen,
  Database,
  ChevronRight,
  ChevronLeft,
  Menu,
  Folder,
  FolderPlus,
  Home,
  Wifi,
  WifiOff,
  Video,
  Wand2,
  Palette,
  Settings,
  Type,
  Maximize2,
  ZapOff,
  Info,
} from "lucide-react";
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

// TypeScript interfaces
interface GeneratedImage {
  id: string;
  imageUrl: string;
  filename: string;
  prompt: string;
  negativePrompt?: string;
  settings: GenerationSettings;
  timestamp: Date;
  isBookmarked?: boolean;
  isInVault?: boolean;
  blobUrl?: string;
}

interface GenerationSettings {
  model: string;
  sampler: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  seed?: number;
  loraModel?: string;
  loraStrength?: number;
}

interface DatasetItem {
  id: string;
  imageUrl: string;
  filename: string;
  tags: string[];
  category: string;
  description?: string;
  source: "generated" | "imported" | "drive";
  dateAdded: Date;
  driveFileId?: string;
  folderId?: string;
}

interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  description?: string;
  color?: string;
}

// ComfyUI Integration Hook
const useComfyUIGeneration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [availableLoraModels, setAvailableLoraModels] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentNode, setCurrentNode] = useState("");

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch("/api/comfyui/object-info", {
          method: "GET",
        });

        if (response.ok) {
          setIsConnected(true);
          const objectInfo = await response.json();

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
          } else {
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
        setAvailableLoraModels([
          "2\\OF_BRI_V2.safetensors",
          "anime_style.safetensors",
          "realistic_portrait.safetensors",
        ]);
      }
    };

    testConnection();
  }, []);

  const handleGenerate = async (params: any) => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
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
            filename_prefix: "ComfyUI",
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

      const clientId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      setCurrentNode("Queuing generation...");
      setGenerationProgress(20);

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

      let attempts = 0;
      const timeoutMinutes = 5 + (params.batchSize - 1) * 2;
      const maxAttempts = timeoutMinutes * 60;

      while (attempts < maxAttempts) {
        setCurrentNode(
          `Processing... (${Math.floor(attempts / 60)}:${(attempts % 60)
            .toString()
            .padStart(2, "0")} / ${timeoutMinutes}:00)`
        );
        setGenerationProgress(20 + Math.min((attempts / maxAttempts) * 70, 70));

        try {
          const historyResponse = await fetch(
            `/api/comfyui/history/${promptId}`,
            { method: "GET" }
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
                  filename: `generated_${promptId}_${index}.png`,
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
                  },
                  timestamp: new Date(),
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
    } catch (error) {
      console.error("Generation error:", error);
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentNode("");
    }
  };

  return {
    handleGenerate,
    availableLoraModels,
    isConnected,
    isGenerating,
    generationProgress,
    currentNode,
  };
};

const AIText2ImagePage = () => {
  // Portal mounting state
  const [isMounted, setIsMounted] = useState(false);

  // ComfyUI Integration
  const {
    handleGenerate: comfyUIGenerate,
    availableLoraModels,
    isConnected,
    isGenerating: comfyUIGenerating,
    generationProgress: comfyUIProgress,
    currentNode,
  } = useComfyUIGeneration();

  // Generation states
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedLoraModel, setSelectedLoraModel] = useState("");
  const [loraStrength, setLoraStrength] = useState(0.95);
  const [steps, setSteps] = useState(40);
  const [cfgScale, setCfgScale] = useState(3.5);
  const [width, setWidth] = useState(832);
  const [height, setHeight] = useState(1216);
  const [batchSize, setBatchSize] = useState(1);

  // UI states
  const [activeTab, setActiveTab] = useState("generate");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Data states
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");

  // Modal states
  const [selectedImageForModal, setSelectedImageForModal] =
    useState<GeneratedImage | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Folder states
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolderForAdd, setSelectedFolderForAdd] = useState<
    string | null
  >(null);
  const [pendingVaultImages, setPendingVaultImages] = useState<
    GeneratedImage[]
  >([]);
  const [newQuickFolderName, setNewQuickFolderName] = useState("");

  const characterLimit = 2000;

  // Set mounted state on component mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "15px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [showImageModal]);

  // Set default LoRA model when available models load
  useEffect(() => {
    if (availableLoraModels.length > 0 && !selectedLoraModel) {
      setSelectedLoraModel(availableLoraModels[0]);
    }
  }, [availableLoraModels, selectedLoraModel]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadDataFromStorage = () => {
      try {
        const savedImages = localStorage.getItem("ai_generated_images");
        if (savedImages) {
          const parsedImages = JSON.parse(savedImages);
          const imagesWithDates = parsedImages.map((img: any) => ({
            ...img,
            timestamp: new Date(img.timestamp),
            blobUrl: undefined,
          }));
          setGeneratedImages(imagesWithDates);
          processGeneratedImages(imagesWithDates).then((processedImages) => {
            setGeneratedImages(processedImages);
          });
        }

        const savedDataset = localStorage.getItem("ai_dataset_items");
        if (savedDataset) {
          const parsedDataset = JSON.parse(savedDataset);
          const datasetWithDates = parsedDataset.map((item: any) => ({
            ...item,
            dateAdded: new Date(item.dateAdded),
          }));
          setDatasetItems(datasetWithDates);
        }

        // Load generated videos from localStorage (for gallery compatibility)
        const savedVideos = localStorage.getItem("ai_generated_videos");
        if (savedVideos) {
          const parsedVideos = JSON.parse(savedVideos).map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
            type: "video" as const,
          }));
          // Note: Videos will be displayed in the gallery even though this component only generates images
        }
      } catch (error) {
        console.error("Error loading data from storage:", error);
      }
    };

    loadDataFromStorage();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (generatedImages.length > 0) {
      try {
        const imagesToSave = generatedImages.map(
          ({ blobUrl, ...image }) => image
        );
        localStorage.setItem(
          "ai_generated_images",
          JSON.stringify(imagesToSave)
        );
      } catch (error) {
        console.error("Error saving generated images to storage:", error);
      }
    }
  }, [generatedImages]);

  useEffect(() => {
    if (datasetItems.length > 0) {
      try {
        localStorage.setItem("ai_dataset_items", JSON.stringify(datasetItems));
      } catch (error) {
        console.error("Error saving dataset to storage:", error);
      }
    }
  }, [datasetItems]);

  useEffect(() => {
    if (folders.length > 0) {
      try {
        localStorage.setItem("ai_vault_folders", JSON.stringify(folders));
      } catch (error) {
        console.error("Error saving folders to storage:", error);
      }
    }
  }, [folders]);

  // Size presets for Flux
  const presetSizes = [
    { name: "Portrait", width: 832, height: 1216 },
    { name: "Landscape", width: 1216, height: 832 },
    { name: "Square", width: 1024, height: 1024 },
    { name: "Wide", width: 1344, height: 768 },
  ];

  const categories = [
    "all",
    "portraits",
    "landscapes",
    "objects",
    "anime",
    "realistic",
    "abstract",
    "concept-art",
  ];

  // Tab navigation items
  const tabItems = [
    {
      id: "generate",
      label: "Generate",
      icon: Type,
      description: "Create AI images from text",
      count: generatedImages.length,
    },
    {
      id: "gallery",
      label: "Gallery",
      icon: Grid,
      description: "View generated images",
      count: generatedImages.length,
    },
    {
      id: "dataset",
      label: "Dataset",
      icon: Database,
      description: "Browse saved images",
      count: datasetItems.length,
    },
    {
      id: "vault",
      label: "Vault",
      icon: FolderOpen,
      description: "Organize collections",
      count: folders.length,
    },
  ];

  // Function to fetch image as blob for CORS handling
  const fetchImageAsBlob = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl, {
        method: "GET",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching image as blob:", error);
      return imageUrl;
    }
  };

  // Function to process generated images and create blob URLs
  const processGeneratedImages = async (
    images: GeneratedImage[]
  ): Promise<GeneratedImage[]> => {
    const processedImages = await Promise.all(
      images.map(async (image) => {
        try {
          const blobUrl = await fetchImageAsBlob(image.imageUrl);
          return { ...image, blobUrl };
        } catch (error) {
          console.error(`Failed to process image ${image.id}:`, error);
          return image;
        }
      })
    );
    return processedImages;
  };

  // Updated generation function using ComfyUI
  const handleGenerate = async () => {
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
    setGenerationStatus("Starting generation...");

    try {
      const generationParams = {
        prompt,
        negativePrompt,
        batchSize,
        selectedLoraModel,
        loraStrength,
        steps,
        cfgScale,
        width,
        height,
        seed: Math.floor(Math.random() * 1000000000),
      };

      const newImages = await comfyUIGenerate(generationParams);

      console.log("Processing images for display...");
      const processedImages = await processGeneratedImages(newImages);

      setGeneratedImages((prev) => [...processedImages, ...prev]);
      setGenerationStatus("Images generated successfully!");
      setTimeout(() => setGenerationStatus(""), 3000);
    } catch (error) {
      console.error("Generation failed:", error);
      setError(
        `Generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setGenerationStatus("");
    }
  };

  // Utility functions
  const extractTagsFromPrompt = (prompt: string): string[] => {
    const commonTags = [
      "portrait",
      "landscape",
      "anime",
      "realistic",
      "abstract",
      "detailed",
      "colorful",
    ];
    return commonTags.filter((tag) =>
      prompt.toLowerCase().includes(tag.toLowerCase())
    );
  };

  const detectCategory = (prompt: string): string => {
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes("portrait") || promptLower.includes("face"))
      return "portraits";
    if (promptLower.includes("landscape") || promptLower.includes("scenery"))
      return "landscapes";
    if (promptLower.includes("anime") || promptLower.includes("manga"))
      return "anime";
    if (promptLower.includes("realistic") || promptLower.includes("photo"))
      return "realistic";
    return "objects";
  };

  const downloadImage = async (image: GeneratedImage) => {
    try {
      let downloadUrl = image.blobUrl;

      if (!downloadUrl) {
        const response = await fetch(image.imageUrl, {
          method: "GET",
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

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
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
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

  const addToVault = (images: GeneratedImage[]) => {
    const newDatasetItems: DatasetItem[] = images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      filename: img.filename,
      tags: extractTagsFromPrompt(img.prompt),
      category: detectCategory(img.prompt),
      description: img.prompt,
      source: "generated",
      dateAdded: new Date(),
    }));

    setDatasetItems((prev) => [...newDatasetItems, ...prev]);

    setGeneratedImages((prev) =>
      prev.map((img) =>
        images.find((i) => i.id === img.id) ? { ...img, isInVault: true } : img
      )
    );
  };

  const filteredImages = generatedImages.filter((img) => {
    const matchesSearch =
      img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      detectCategory(img.prompt) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Custom Image Component to handle CORS issues
  const ComfyUIImage: React.FC<{
    image: GeneratedImage;
    className?: string;
    alt: string;
  }> = ({ image, className, alt }) => {
    const [imgSrc, setImgSrc] = useState<string>(
      image.blobUrl || image.imageUrl
    );
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setImgSrc(image.blobUrl || image.imageUrl);
      setIsLoading(true);
      setHasError(false);
    }, [image.blobUrl, image.imageUrl]);

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleImageError = async () => {
      setIsLoading(false);

      if (!image.blobUrl && !hasError) {
        try {
          const blobUrl = await fetchImageAsBlob(image.imageUrl);
          setImgSrc(blobUrl);
          setHasError(false);
          return;
        } catch (error) {
          console.error("Failed to fetch image as blob:", error);
        }
      }

      setHasError(true);
    };

    if (hasError) {
      return (
        <div
          className={`${className} bg-pink-100/50 flex items-center justify-center rounded-lg border border-pink-200`}
        >
          <div className="text-center text-gray-600 p-4">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs mb-2">Failed to load</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                setImgSrc(image.imageUrl);
              }}
              className="text-pink-600 text-xs underline hover:text-pink-500 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className} rounded-lg overflow-hidden`}>
        {isLoading && (
          <div className="absolute inset-0 bg-pink-100/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
          </div>
        )}
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  const actuallyGenerating = comfyUIGenerating;
  const actualProgress = comfyUIProgress;

  return (
    <div className="min-h-screen bg-white/60 backdrop-blur-sm p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-700 mb-2">
            AI Text-to-Image Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create stunning AI images from text descriptions using ComfyUI
          </p>
        </div>

        {/* Status Bar */}
        <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
                      <span className="text-pink-600 font-medium">
                        ComfyUI Connected
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      {availableLoraModels.length} models available
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

              {actuallyGenerating && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-pink-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">
                      {actualProgress}%
                    </span>
                  </div>
                  {currentNode && (
                    <span className="text-xs text-gray-600">{currentNode}</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <div className="space-y-6">
            {/* Prompt Input */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <Wand2 className="w-5 h-5 mr-3" />
                  Describe Your Vision
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Enter a detailed description of the image you want to create
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="A majestic mountain landscape at sunset with vibrant colors, detailed clouds, photorealistic..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={characterLimit}
                    className="bg-white border-pink-200 text-gray-700 rounded-xl min-h-[140px] resize-none focus:border-pink-500/50 focus:ring-pink-500/20 transition-all text-base leading-relaxed"
                    rows={6}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-600">
                    {prompt.length}/{characterLimit}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model & Style Selection */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 flex items-center">
                  <Palette className="w-5 h-5 mr-3" />
                  Art Style & Model
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Choose the artistic style for your image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-600 text-sm font-medium mb-3 block">
                    LoRA Model
                  </Label>
                  <Select
                    value={selectedLoraModel}
                    onValueChange={setSelectedLoraModel}
                    disabled={!isConnected || availableLoraModels.length === 0}
                  >
                    <SelectTrigger className="bg-white border-pink-200 text-gray-700 rounded-xl h-12 focus:border-pink-500/50">
                      <SelectValue
                        placeholder={
                          isConnected
                            ? availableLoraModels.length === 0
                              ? "No styles available"
                              : "Choose art style"
                            : "Connection required"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-pink-200 text-gray-700">
                      {availableLoraModels.map((model) => (
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
              </CardContent>
            </Card>

            {/* Image Dimensions */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700">Image Dimensions</CardTitle>
                <CardDescription className="text-gray-600">
                  Select the size and aspect ratio for your image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {presetSizes.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className={`h-20 p-4 border-2 transition-all duration-200 ${
                        width === preset.width && height === preset.height
                          ? "bg-pink-500/30 border-pink-400 text-pink-700"
                          : "bg-white border-pink-200 text-gray-600 hover:bg-pink-50 hover:border-pink-300"
                      }`}
                      onClick={() => {
                        setWidth(preset.width);
                        setHeight(preset.height);
                      }}
                    >
                      <div className="text-center">
                        <div className="font-medium text-base mb-1">
                          {preset.name}
                        </div>
                        <div className="text-sm opacity-70">
                          {preset.width}×{preset.height}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-700">
                      Generation Settings
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Fine-tune your image generation parameters
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-pink-100/60 border-pink-200 text-gray-700 hover:bg-pink-200/60"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-600 text-sm font-medium mb-3 block">
                      Number of Images
                    </Label>
                    <Select
                      value={batchSize.toString()}
                      onValueChange={(value) => setBatchSize(parseInt(value))}
                    >
                      <SelectTrigger className="bg-white border-pink-200 text-gray-700 rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-pink-200 text-gray-700">
                        {Array.from({ length: 15 }, (_, i) => i + 1).map(
                          (size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} {size === 1 ? "image" : "images"}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-gray-600 text-sm font-medium">
                        LoRA Strength
                      </Label>
                      <span className="text-pink-600 text-sm font-mono">
                        {loraStrength.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[loraStrength]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={(value) => setLoraStrength(value[0])}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Controls the influence of the selected art style
                    </p>
                  </div>
                </div>

                {showAdvancedSettings && (
                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <div>
                      <Label className="text-gray-600 text-sm font-medium mb-3 block">
                        Negative Prompt
                      </Label>
                      <Textarea
                        placeholder="low quality, blurry, distorted, bad anatomy..."
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="bg-white border-pink-200 text-gray-700 rounded-xl min-h-[80px]"
                        rows={3}
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Describe what you don't want in the image
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-gray-600 text-sm font-medium">
                            Steps
                          </Label>
                          <span className="text-pink-600 text-sm font-mono">
                            {steps}
                          </span>
                        </div>
                        <Slider
                          value={[steps]}
                          min={20}
                          max={80}
                          step={5}
                          onValueChange={(value) => setSteps(value[0])}
                          className="py-2"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                          More steps = higher quality, longer generation time
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-gray-600 text-sm font-medium">
                            CFG Scale
                          </Label>
                          <span className="text-pink-600 text-sm font-mono">
                            {cfgScale.toFixed(1)}
                          </span>
                        </div>
                        <Slider
                          value={[cfgScale]}
                          min={1}
                          max={10}
                          step={0.5}
                          onValueChange={(value) => setCfgScale(value[0])}
                          className="py-2"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                          How closely the image follows your prompt
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
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
                    Please ensure ComfyUI is running and accessible to generate
                    images.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Generate Button */}
            <Button
              className="w-full h-16 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-lg font-semibold shadow-lg transition-all duration-200 disabled:opacity-50"
              onClick={handleGenerate}
              disabled={
                actuallyGenerating ||
                !prompt.trim() ||
                !isConnected ||
                !selectedLoraModel
              }
            >
              {actuallyGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Creating {batchSize > 1 ? "Images" : "Image"}...{" "}
                  {actualProgress}%
                </>
              ) : (
                <>
                  <Type className="w-5 h-5 mr-3" />
                  Generate {batchSize > 1 ? `${batchSize} Images` : "Image"}
                </>
              )}
            </Button>
          </div>

          {/* Preview & Gallery Panel */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-700 flex items-center">
                      <Grid className="w-5 h-5 mr-3" />
                      Gallery
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {generatedImages.length} images created
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-pink-200 text-gray-700 hover:bg-pink-50"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    ) : (
                      <>
                        <Grid className="w-4 h-4 mr-2" />
                        Gallery
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Latest Generation Preview */}
                {!showHistory && (
                  <div className="h-[600px] flex items-center justify-center">
                    {actuallyGenerating ? (
                      <div className="text-center space-y-6">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                          <Loader2 className="w-12 h-12 text-pink-600 animate-spin" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Creating Your Image
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {actualProgress}% complete
                          </p>
                          {currentNode && (
                            <p className="text-gray-500 text-sm">
                              {currentNode}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : generatedImages.length > 0 ? (
                      <div className="w-full max-w-md">
                        <div className="aspect-square mb-6 rounded-xl overflow-hidden border border-white/10">
                          <ComfyUIImage
                            image={generatedImages[0]}
                            alt="Latest creation"
                            className="aspect-square"
                          />
                        </div>

                        <div className="text-center space-y-4">
                          <h3 className="text-xl font-semibold text-gray-700">
                            Latest Creation
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                            {generatedImages[0].prompt}
                          </p>

                          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-pink-500/20 border border-pink-400/30 text-pink-600">
                            {generatedImages[0].settings.loraModel?.replace(
                              /\.(safetensors|pt|ckpt)$/,
                              ""
                            ) || "AI Generated"}
                          </div>

                          <div className="flex justify-center gap-3 pt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white border-pink-200 hover:bg-white/10 px-4"
                              onClick={() => downloadImage(generatedImages[0])}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white border-pink-200 hover:bg-white/10 px-4"
                              onClick={() =>
                                toggleBookmark(generatedImages[0].id)
                              }
                            >
                              <Star
                                className={`w-4 h-4 mr-2 ${
                                  generatedImages[0].isBookmarked
                                    ? "fill-yellow-400 text-yellow-400"
                                    : ""
                                }`}
                              />
                              Favorite
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-6">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center">
                          <Type className="w-12 h-12 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Images Yet
                          </h3>
                          <p className="text-gray-600">
                            {isConnected
                              ? "Create your first image to see it here"
                              : "Connect to ComfyUI to start generating"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Gallery View */}
                {showHistory && (
                  <div className="h-[600px] flex flex-col">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          placeholder="Search images..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white border-pink-200 text-gray-700 h-12 focus:border-pink-500/50"
                        />
                      </div>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-full sm:w-40 bg-white border-pink-200 text-gray-700 h-12 focus:border-pink-500/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-pink-200 text-gray-700">
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category === "all"
                                ? "All"
                                : category.charAt(0).toUpperCase() +
                                  category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Images Grid */}
                    <div className="flex-1 overflow-y-auto">
                      {filteredImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {filteredImages.slice(0, 20).map((image) => (
                            <div
                              key={image.id}
                              className="group relative aspect-square cursor-pointer transition-all duration-200 hover:scale-105"
                              onClick={() => {
                                setSelectedImageForModal(image);
                                setShowImageModal(true);
                              }}
                            >
                              <ComfyUIImage
                                image={image}
                                alt={image.prompt}
                                className="aspect-square border border-white/10"
                              />

                              {/* Overlay */}
                              <div className="absolute inset-0 bg-pink-500/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center rounded-lg">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/90 border-pink-200 text-gray-700 hover:bg-white w-10 h-10 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadImage(image);
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/90 border-pink-200 text-gray-700 hover:bg-white w-10 h-10 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBookmark(image.id);
                                    }}
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        image.isBookmarked
                                          ? "fill-yellow-400 text-yellow-400"
                                          : ""
                                      }`}
                                    />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/90 border-pink-200 text-gray-700 hover:bg-white w-10 h-10 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImageForModal(image);
                                      setShowImageModal(true);
                                    }}
                                  >
                                    <Maximize2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Status Indicators */}
                              <div className="absolute top-2 right-2 flex gap-1">
                                {image.isBookmarked && (
                                  <div className="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  </div>
                                )}
                                {image.isInVault && (
                                  <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-400/50 flex items-center justify-center">
                                    <FolderOpen className="w-3 h-3 text-pink-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-center">
                          <div className="space-y-4">
                            <Grid className="w-16 h-16 mx-auto text-pink-500" />
                            <div>
                              <p className="text-gray-600 mb-2">
                                No images found
                              </p>
                              <p className="text-gray-500 text-sm">
                                {searchQuery || selectedCategory !== "all"
                                  ? "Try adjusting your search or filter"
                                  : "Generate some images to see them here"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Success Status */}
        {generationStatus && !error && (
          <Card className="bg-white/80 backdrop-blur-sm border-pink-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">
                    Generation Status
                  </h3>
                  <p className="text-gray-600">{generationStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Detail Modal with Portal */}
      {showImageModal &&
        selectedImageForModal &&
        isMounted &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div
              className="bg-white/95 backdrop-blur-md border border-pink-200 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-pink-600" />
                  </div>
                  <h3 className="text-gray-700 text-xl font-semibold">
                    Image Details
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
                  onClick={() => setShowImageModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                {/* Image */}
                <div className="aspect-square rounded-xl overflow-hidden border border-white/10">
                  <ComfyUIImage
                    image={selectedImageForModal}
                    alt={selectedImageForModal.prompt}
                    className="aspect-square"
                  />
                </div>

                {/* Details */}
                <div className="space-y-6">
                  {/* Prompt */}
                  <div>
                    <Label className="text-gray-600 text-sm font-medium mb-2 block">
                      Prompt
                    </Label>
                    <div className="bg-pink-50/60 border border-pink-200 rounded-lg p-4">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {selectedImageForModal.prompt}
                      </p>
                    </div>
                  </div>

                  {/* Negative Prompt */}
                  {selectedImageForModal.negativePrompt && (
                    <div>
                      <Label className="text-gray-600 text-sm font-medium mb-2 block">
                        Negative Prompt
                      </Label>
                      <div className="bg-pink-50/60 border border-pink-200 rounded-lg p-4">
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {selectedImageForModal.negativePrompt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  <div>
                    <Label className="text-gray-600 text-sm font-medium mb-2 block">
                      Generation Settings
                    </Label>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Model:</span>
                          <span className="text-gray-700 ml-2">
                            {selectedImageForModal.settings.model}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Size:</span>
                          <span className="text-gray-700 ml-2">
                            {selectedImageForModal.settings.width}×
                            {selectedImageForModal.settings.height}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Steps:</span>
                          <span className="text-gray-700 ml-2">
                            {selectedImageForModal.settings.steps}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">CFG:</span>
                          <span className="text-gray-700 ml-2">
                            {selectedImageForModal.settings.cfgScale}
                          </span>
                        </div>
                      </div>

                      {selectedImageForModal.settings.loraModel && (
                        <div className="pt-2 border-t border-white/10">
                          <span className="text-gray-600 text-sm">
                            LoRA Model:
                          </span>
                          <span className="text-gray-700 ml-2 text-sm">
                            {selectedImageForModal.settings.loraModel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-pink-500 hover:bg-pink-600 text-white flex-1 sm:flex-none"
                      onClick={() => downloadImage(selectedImageForModal)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white border-pink-200 text-gray-700 hover:bg-pink-50 flex-1 sm:flex-none"
                      onClick={() => toggleBookmark(selectedImageForModal.id)}
                    >
                      <Star
                        className={`w-4 h-4 mr-2 ${
                          selectedImageForModal.isBookmarked
                            ? "fill-yellow-400 text-yellow-400"
                            : ""
                        }`}
                      />
                      {selectedImageForModal.isBookmarked
                        ? "Unfavorite"
                        : "Favorite"}
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white border-pink-200 text-gray-700 hover:bg-pink-50 w-full sm:w-auto"
                      onClick={() => {
                        setPrompt(selectedImageForModal.prompt);
                        if (selectedImageForModal.negativePrompt) {
                          setNegativePrompt(
                            selectedImageForModal.negativePrompt
                          );
                        }
                        if (selectedImageForModal.settings.loraModel) {
                          setSelectedLoraModel(
                            selectedImageForModal.settings.loraModel
                          );
                        }
                        setWidth(selectedImageForModal.settings.width);
                        setHeight(selectedImageForModal.settings.height);
                        setSteps(selectedImageForModal.settings.steps);
                        setCfgScale(selectedImageForModal.settings.cfgScale);
                        if (selectedImageForModal.settings.loraStrength) {
                          setLoraStrength(
                            selectedImageForModal.settings.loraStrength
                          );
                        }
                        setShowImageModal(false);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Use These Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AIText2ImagePage;
