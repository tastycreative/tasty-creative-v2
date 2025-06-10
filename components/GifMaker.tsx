"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import {
  Grid2X2,
  Columns2,
  Columns3,
  Square,
  Rows3,
  Download,
  Loader2,
} from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";

// Lazy load components
const GifMakerVideoCropper = lazy(() => import("./GifMakerVideoCropper"));
const GifMakerEditorSelector = lazy(() => import("./GIfMakerEditorSelector"));
const ModelsDropdown = lazy(() => import("./ModelsDropdown"));
const GifMakerVideoTimeline = lazy(() => import("./GifMakerVideoTimeline").then(module => ({ default: module.GifMakerVideoTimeline })));
const GifMakerGifSettings = lazy(() => import("./GifMakerGifSettings"));
const ModelCaptionSelector = lazy(() => import("./ModelCaptionSelector"));

// Import utility functions
import {
  VideoClip,
  BlurSettings,
  GifSettings,
  Layout,
  fetchFile,
  createFilterComplex,
  createUseFilterComplex,
} from "@/utils/gifMakerUtils";


import {
  extractGifFrames,
  reconstructGif,
  OriginalGifData,
} from "@/utils/gifProcessing";

import {
  handleVideoFileChange,
  handleStartTimeChange,
  handleEndTimeChange,
} from "@/utils/videoHandlers";

import {
  getMousePos,
  drawMask,
  clearMask as clearMaskUtil,
  displayFrame,
  applyBlurToCurrentFramePreview,
} from "@/utils/drawingFunctions";
import { processAllFramesWithBlur, applyGaussianBlur, applyPixelatedBlur, applyMosaicBlur } from "@/utils/blurFunctions";

// Define TypeScript interfaces
interface ModelFormData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const BLUR_COOKIE_KEY = "blurSettings";
const GIF_COOKIE_KEY = "gifSettings";

const defaultBlurSettings: BlurSettings = {
  blurType: "gaussian",
  blurIntensity: 10,
  brushSize: 20,
};

const defaultGifSettings: GifSettings = {
  maxDuration: 5,
  fps: 15,
  quality: 10,
};

export const templates: Record<
  string,
  {
    name: string;
    icon: React.JSX.Element;
    cols: number;
    rows: number;
  }
> = {
  single: {
    name: "Single",
    icon: <Square className="w-5 h-5" />,
    cols: 1,
    rows: 1,
  },
  sideBySide: {
    name: "Side by Side",
    icon: <Columns2 className="w-5 h-5" />,
    cols: 2,
    rows: 1,
  },
  triptychHorizontal: {
    name: "Horizontal Triptych",
    icon: <Columns3 className="w-5 h-5" />,
    cols: 3,
    rows: 1,
  },
  triptychVertical: {
    name: "Vertical Triptych",
    icon: <Rows3 className="w-5 h-5" />,
    cols: 1,
    rows: 3,
  },
  grid2x2: {
    name: "2x2 Grid",
    icon: <Grid2X2 className="w-5 h-5" />,
    cols: 2,
    rows: 2,
  },
};

const GifMaker = () => {
  const [formData, setFormData] = useState<ModelFormData>({});
  const [gifUrlHistory, setGifUrlHistory] = useState<string[]>([]);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("single");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [webhookData, setWebhookData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isGifSettingsOpen, setIsGifSettingsOpen] = useState(false);
  const [originalFrames, setOriginalFrames] = useState<ImageData[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<string>("");
  const [vaultName, setVaultName] = useState<string>("");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [gifFrames, setGifFrames] = useState<ImageData[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isGifProcessing, setIsGifProcessing] = useState(false);
  const [isGifLoaded, setIsGifLoaded] = useState(false);
  const [originalGifData, setOriginalGifData] = useState<OriginalGifData | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Refs
  const canvasBlurRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<(HTMLVideoElement)[]>([]);
  const outputGridRef = useRef<HTMLDivElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const totalCells = templates[selectedTemplate].cols * templates[selectedTemplate].rows;

  // Load settings from cookies
  const [blurSettings, setBlurSettings] = useState<BlurSettings>(() => {
    if (typeof window === 'undefined') return defaultBlurSettings;
    const cookie = Cookies.get(BLUR_COOKIE_KEY);
    if (cookie) {
      try {
        return { ...defaultBlurSettings, ...JSON.parse(cookie) };
      } catch {
        console.warn("Invalid cookie format for blur settings");
      }
    }
    return defaultBlurSettings;
  });

  const [gifSettings, setGifSettings] = useState<GifSettings>(() => {
    if (typeof window === 'undefined') return defaultGifSettings;
    const cookie = Cookies.get(GIF_COOKIE_KEY);
    if (cookie) {
      try {
        return { ...defaultGifSettings, ...JSON.parse(cookie) };
      } catch {
        console.warn("Invalid cookie format for gif settings");
      }
    }
    return defaultGifSettings;
  });

  const [videoClips, setVideoClips] = useState<VideoClip[]>(
    Array.from({ length: totalCells }, () => ({
      file: null,
      startTime: 0,
      endTime: 5,
      duration: 0,
      positionX: 0,
      positionY: 0,
      scale: 1,
    }))
  );

  const videoUrls = useMemo(() => {
    return videoClips.map((clip) =>
      clip.file ? URL.createObjectURL(clip.file) : null
    );
  }, [videoClips.map((clip) => clip.file?.name).join(",")]);

  // Settings update functions
  const setBlurType = useCallback((type: BlurSettings["blurType"]) =>
    setBlurSettings((prev) => ({ ...prev, blurType: type })), []);

  const setBlurIntensity = useCallback((val: number) =>
    setBlurSettings((prev) => ({ ...prev, blurIntensity: val })), []);

  const setBrushSize = useCallback((val: number) =>
    setBlurSettings((prev) => ({ ...prev, brushSize: val })), []);

  const setMaxDuration = useCallback((val: number) =>
    setGifSettings((prev) => ({ ...prev, maxDuration: val })), []);

  const setFps = useCallback((val: number) =>
    setGifSettings((prev) => ({ ...prev, fps: val })), []);

  const setQuality = useCallback((val: number) =>
    setGifSettings((prev) => ({ ...prev, quality: val })), []);

  // Handler callbacks
  const handleCurrentTimeChange = useCallback(
    (time: number) => {
      setCurrentTime((prevTime) => {
        if (Math.abs(prevTime - time) > 0.05) {
          if (activeVideoIndex !== null && videoRefs.current) {
            const activeVideo = videoRefs.current[activeVideoIndex];
            if (activeVideo && activeVideo.readyState >= 2) {
              activeVideo.currentTime = time;
            }
          }
          return time;
        }
        return prevTime;
      });
    },
    [activeVideoIndex]
  );

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleVideoChange = useCallback(
    (index: number, file: File | null) => {
      handleVideoFileChange(
        index,
        file,
        videoUrls,
        gifSettings,
        setVideoClips,
        setActiveVideoIndex,
        objectUrlsRef
      );
    },
    [videoUrls, gifSettings]
  );

  const onStartTimeChange = useCallback(
    (time: number) => {
      handleStartTimeChange(time, activeVideoIndex, videoClips, gifSettings, setVideoClips);
    },
    [activeVideoIndex, videoClips, gifSettings]
  );

  const onEndTimeChange = useCallback(
    (time: number) => {
      handleEndTimeChange(time, activeVideoIndex, videoClips, gifSettings, setVideoClips);
    },
    [activeVideoIndex, videoClips, gifSettings]
  );

  // Drawing functions
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasBlurRef.current;
    if (!canvas) return;

    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        maskCtx.globalCompositeOperation = "source-over";
      }
    }

    setIsDrawing(true);
    drawMask(getMousePos(e, canvasBlurRef), maskCanvas, blurSettings.brushSize);

    if (isGifLoaded && originalFrames.length > 0) {
      applyBlurToCurrentFramePreview(
        originalFrames,
        currentFrameIndex,
        canvasBlurRef,
        maskCanvas,
        blurSettings
      );
    }
  }, [isGifLoaded, originalFrames, currentFrameIndex, blurSettings]);

  const stopDrawing = useCallback(async () => {
    if (isDrawing) {
      setIsDrawing(false);
      try {
        await processAllFrames();
      } catch (error) {
        console.error("Error in stopDrawing:", error);
      }
    }
  }, [isDrawing]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    drawMask(getMousePos(e, canvasBlurRef), maskCanvasRef.current, blurSettings.brushSize);
    if (isGifLoaded && originalFrames.length > 0) {
      applyBlurToCurrentFramePreview(
        originalFrames,
        currentFrameIndex,
        canvasBlurRef,
        maskCanvasRef.current,
        blurSettings
      );
    }
  }, [isDrawing, isGifLoaded, originalFrames, currentFrameIndex, blurSettings]);

  // Process all frames
  const processAllFrames = useCallback(async () => {
    if (!gifFrames.length || !maskCanvasRef.current) return;

    setIsGifProcessing(true);
    try {
      const processedFrames = await processAllFramesWithBlur(
        gifFrames,
        maskCanvasRef.current,
        blurSettings,
        { gaussian: applyGaussianBlur, pixelated: applyPixelatedBlur, mosaic: applyMosaicBlur }
      );
      setGifFrames(processedFrames);
      displayFrame(currentFrameIndex, processedFrames, canvasBlurRef, maskCanvasRef.current, setCurrentFrameIndex);
    } catch (error) {
      console.error("Error processing frames:", error);
      setError("Failed to process all frames");
    } finally {
      setIsGifProcessing(false);
    }
  }, [gifFrames, blurSettings, currentFrameIndex]);

  // Clear mask
  const clearMask = useCallback(async () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    clearMaskUtil(maskCanvas, maskCanvas.width, maskCanvas.height);

    if (isGifLoaded && originalFrames.length > 0) {
      setGifFrames(
        originalFrames.map(
          (frame) =>
            new ImageData(
              new Uint8ClampedArray(frame.data),
              frame.width,
              frame.height
            )
        )
      );
      displayFrame(currentFrameIndex, originalFrames, canvasBlurRef, maskCanvas, setCurrentFrameIndex);
      await reconstructGifWrapper();
    }
  }, [isGifLoaded, originalFrames, currentFrameIndex]);

  // Reconstruct GIF wrapper
  const reconstructGifWrapper = useCallback(async () => {
    if (!gifFrames.length || !originalGifData) {
      console.error("No frames or original data to reconstruct");
      return;
    }

    setIsGifProcessing(true);
    try {
      const blob = await reconstructGif(gifFrames, originalGifData, gifSettings);
      const url = URL.createObjectURL(blob);
      setGifUrl(url);
      setGifUrlHistory((prev) => [...prev, url]);
      clearMask();
    } catch (error) {
      console.error("Error reconstructing GIF:", error);
      setError(`Failed to reconstruct GIF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGifProcessing(false);
    }
  }, [gifFrames, originalGifData, gifSettings, clearMask]);

  // Create GIF function
  const createGif = useCallback(async () => {
    if (!ffmpeg || !ffmpeg.isLoaded()) {
      console.error("FFmpeg not loaded");
      return;
    }

    setGifUrl(null);
    setGifFrames([]);
    setCurrentFrameIndex(0);
    setIsGifLoaded(false);
    setOriginalGifData(null);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const validClips = videoClips.filter((clip) => clip.file);
      if (validClips.length === 0) throw new Error("No video clips with files");

      const clipCount = validClips.length;
      let layout: Layout = "Single";
      if (selectedTemplate && templates[selectedTemplate]) {
        layout = templates[selectedTemplate].name as Layout;
      }

      const clipsToUse = validClips.slice(0, layout === "2x2 Grid" ? 4 : clipCount);

      for (let i = 0; i < clipsToUse.length; i++) {
        const data = await fetchFile(clipsToUse[i].file!);
        ffmpeg.FS("writeFile", `input${i}.mp4`, data);
      }

      const durations = clipsToUse.map((c) =>
        Math.min(gifSettings.maxDuration, c.endTime - c.startTime)
      );
      const duration = Math.min(...durations);

      setProcessingProgress(20);

      const paletteInputs: string[] = [];
      for (let i = 0; i < clipsToUse.length; i++) {
        paletteInputs.push("-ss", String(clipsToUse[i].startTime));
        paletteInputs.push("-t", String(duration));
        paletteInputs.push("-i", `input${i}.mp4`);
      }

      await ffmpeg.run(
        ...paletteInputs,
        "-filter_complex",
        createFilterComplex(layout, clipsToUse, gifSettings.fps, dimensions),
        "-map",
        "[p]",
        "-y",
        "palette.png"
      );

      setProcessingProgress(60);

      const gifInputs: string[] = [];
      for (let i = 0; i < clipsToUse.length; i++) {
        gifInputs.push("-ss", String(clipsToUse[i].startTime));
        gifInputs.push("-t", String(duration));
        gifInputs.push("-i", `input${i}.mp4`);
      }
      gifInputs.push("-i", "palette.png");

      await ffmpeg.run(
        ...gifInputs,
        "-filter_complex",
        createUseFilterComplex(layout, clipsToUse, gifSettings.fps, dimensions),
        "-loop",
        "0",
        "-y",
        "output.gif"
      );

      setProcessingProgress(90);

      const data = ffmpeg.FS("readFile", "output.gif");
      const gifBlob = new Blob([new Uint8Array(data.buffer)], {
        type: "image/gif",
      });

      let width = dimensions.width;
      let height = dimensions.height;

      const shouldUseOriginalSize =
        layout === "Single" &&
        clipsToUse.length === 1 &&
        clipsToUse.every(
          (clip) =>
            clip.positionX === 0 && clip.positionY === 0 && clip.scale === 1
        );

      if (shouldUseOriginalSize) {
        const image = new Image();
        const gifUrl = URL.createObjectURL(gifBlob);
        await new Promise<void>((resolve, reject) => {
          image.onload = () => {
            width = image.width;
            height = image.height;
            URL.revokeObjectURL(gifUrl);
            resolve();
          };
          image.onerror = reject;
          image.src = gifUrl;
        });
      }

      if (width === 0 || height === 0) {
        throw new Error("GIF dimensions are not valid");
      }

      const canvas = canvasBlurRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }

      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext("2d");
        if (maskCtx) {
          maskCtx.clearRect(0, 0, width, height);
          maskCtx.fillStyle = "rgba(0,0,0,0)";
          maskCtx.fillRect(0, 0, width, height);
        }
      }

      const url = URL.createObjectURL(gifBlob);
      setGifUrl(url);
      setGifUrlHistory((prev) => [...prev, url]);

      const { extractedFrames, originalGifData: gifData } = await extractGifFrames(
        gifBlob,
        width,
        height
      );
      setGifFrames(extractedFrames);
      setOriginalFrames(extractedFrames.map(frame => 
        new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height)
      ));
      setOriginalGifData(gifData);
      setIsGifLoaded(true);
      displayFrame(0, extractedFrames, canvasBlurRef, maskCanvas, setCurrentFrameIndex);

      // Cleanup
      for (let i = 0; i < clipsToUse.length; i++) {
        ffmpeg.FS("unlink", `input${i}.mp4`);
      }
      ffmpeg.FS("unlink", "palette.png");
      ffmpeg.FS("unlink", "output.gif");

      setProcessingProgress(100);
      setError(null);
    } catch (err) {
      console.error("GIF creation error:", err);
      setError(
        `Failed to create GIF: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  }, [ffmpeg, videoClips, selectedTemplate, gifSettings, dimensions]);

  // Download GIF
  const downloadGif = useCallback(async () => {
    if (!gifUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(gifUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch the GIF");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `OnlyFans_${selectedTemplate}_${Date.now()}.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsDownloading(false);
    }
  }, [gifUrl, selectedTemplate]);

  // Effects
  useEffect(() => {
    if (formData.model && formData.model != "") {
      setVaultName(
        formData.model.toUpperCase() + "_" + (isPaid ? "PAID" : "FREE")
      );
    }
  }, [formData.model, isPaid]);

  useEffect(() => {
    if (webhookData) {
      setGifUrl(`/api/be/proxy?path=${btoa(webhookData.filePath)}`);
      setGifUrlHistory((prev) => [
        ...prev,
        `/api/be/proxy?path=${btoa(webhookData.filePath)}`,
      ]);
    }
  }, [webhookData]);

  // Update cookies
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Cookies.set(BLUR_COOKIE_KEY, JSON.stringify(blurSettings), {
        expires: 365,
      });
    }
  }, [blurSettings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Cookies.set(GIF_COOKIE_KEY, JSON.stringify(gifSettings), {
        expires: 365,
      });
    }
  }, [gifSettings]);

  // Load FFmpeg
  useEffect(() => {
    const loadFfmpeg = async () => {
      try {
        const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");
        window.fetchFile = fetchFile;

        const ffmpegInstance = createFFmpeg({
          log: true,
          corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
        });

        await ffmpegInstance.load();
        setFfmpeg(ffmpegInstance);
      } catch (error) {
        console.error("Error loading FFmpeg:", error);
        setError(
          "Failed to load video processing library. Please try again later."
        );
      }
    };

    loadFfmpeg();

    return () => {
      if (gifUrl) {
        URL.revokeObjectURL(gifUrl);
      }
    };
  }, []);

  // Video playback control
  useEffect(() => {
    if (activeVideoIndex === null || !videoRefs.current) return;

    const activeVideo = videoRefs.current[activeVideoIndex];
    const clip = videoClips[activeVideoIndex];

    if (!activeVideo || !clip?.file || !clip.duration) return;

    let rafId: number | undefined = undefined;
    let lastUpdateTime = 0;

    const updateTime = () => {
      if (!activeVideo.paused && !activeVideo.ended) {
        const currentClip = videoClips[activeVideoIndex];
        if (!currentClip) return;

        if (activeVideo.currentTime >= currentClip.endTime) {
          activeVideo.currentTime = currentClip.startTime;
        }

        const now = performance.now();
        if (now - lastUpdateTime > 100) {
          setCurrentTime(activeVideo.currentTime);
          lastUpdateTime = now;
        }

        rafId = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      const targetTime = Math.max(
        clip.startTime,
        Math.min(currentTime, clip.endTime)
      );
      if (Math.abs(activeVideo.currentTime - targetTime) > 0.1) {
        activeVideo.currentTime = targetTime;
      }

      activeVideo.play().catch((err) => {
        console.error("Play error:", err);
        setIsPlaying(false);
      });

      updateTime();
    } else {
      activeVideo.pause();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isPlaying, activeVideoIndex, videoClips, currentTime]);

  // Update video clips when max duration changes
  useEffect(() => {
    setVideoClips((prev) => {
      return prev.map((clip) => {
        if (!clip.file) return clip;

        const currentDuration = clip.endTime - clip.startTime;
        if (currentDuration <= gifSettings.maxDuration) {
          return clip;
        }

        return {
          ...clip,
          endTime: Math.min(
            clip.startTime + gifSettings.maxDuration,
            clip.duration
          ),
        };
      });
    });
  }, [gifSettings.maxDuration]);

  // Set current time when switching videos
  useEffect(() => {
    if (activeVideoIndex !== null && videoClips[activeVideoIndex]?.file) {
      const clip = videoClips[activeVideoIndex];
      setCurrentTime(clip.startTime);

      const activeVideo = videoRefs.current[activeVideoIndex];
      if (activeVideo && activeVideo.readyState >= 2) {
        activeVideo.currentTime = clip.startTime;
      }
    }
  }, [activeVideoIndex]);

  // Reset video refs when template changes
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, totalCells);
    while (videoRefs.current.length < totalCells) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videoRefs.current.push(null as any);
    }
    setGifUrl(null);
  }, [totalCells]);

  // Display first frame when GIF is loaded
  useEffect(() => {
    if (isGifLoaded && gifFrames.length > 0) {
      displayFrame(0, gifFrames, canvasBlurRef, maskCanvasRef.current, setCurrentFrameIndex);
    }
  }, [isGifLoaded]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  return (
    <div className="min-h-screen bg-black/20 text-white p-6 rounded-lg">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          OnlyFans GIF Maker
        </h1>
        <p className="text-gray-300 mt-2">
          Create stunning GIFs for OnlyFans content!
        </p>
      </header>

      {/* Model Selection */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-4 shadow-lg border border-gray-700/50 backdrop-blur-sm">
        <div className="col-span-2">
          <Suspense fallback={<div>Loading...</div>}>
            <ModelsDropdown formData={formData} setFormData={setFormData} />
          </Suspense>
        </div>
      </div>

      {/* Template Selection & Video Selector */}
      {formData.model && (
        <>
          <Suspense fallback={<div>Loading...</div>}>
            <ModelCaptionSelector
              model={formData.model}
              setSelectedCaption={setSelectedCaption}
              selectedCaption={selectedCaption}
              isPaid={isPaid}
              setIsPaid={setIsPaid}
            />
          </Suspense>
          
          <div className="bg-gray-800/50 rounded-xl flex flex-col p-6 mb-4 shadow-lg border border-gray-700/50 backdrop-blur-sm">
            <Suspense fallback={<div>Loading...</div>}>
              <GifMakerVideoCropper
                templates={templates}
                videoClips={videoClips}
                setSelectedTemplate={setSelectedTemplate}
                setVideoClips={setVideoClips}
                setActiveVideoIndex={setActiveVideoIndex}
                videoRefs={videoRefs}
                selectedTemplate={selectedTemplate}
                outputGridRef={outputGridRef}
                activeVideoIndex={activeVideoIndex}
                setIsPlaying={setIsPlaying}
                handleVideoChange={handleVideoChange}
                totalCells={totalCells}
                setDimensions={(width: number, height: number) =>
                  setDimensions({ width, height })
                }
                currentTime={currentTime}
                isPlaying={isPlaying}
                onCurrentTimeChange={handleCurrentTimeChange}
                videoUrls={videoUrls}
                vaultName={vaultName}
              />
            </Suspense>

            {/* Timeframe Editor */}
            {activeVideoIndex !== null &&
              videoClips[activeVideoIndex]?.file &&
              videoClips[activeVideoIndex]?.duration > 0 && (
                <Suspense fallback={<div>Loading...</div>}>
                  <GifMakerVideoTimeline
                    videoFile={videoClips[activeVideoIndex].file}
                    duration={videoClips[activeVideoIndex].duration}
                    startTime={videoClips[activeVideoIndex].startTime}
                    endTime={videoClips[activeVideoIndex].endTime}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onStartTimeChange={onStartTimeChange}
                    onEndTimeChange={onEndTimeChange}
                    onCurrentTimeChange={handleCurrentTimeChange}
                    onPlayPause={handlePlayPause}
                    setMaxDuration={setMaxDuration}
                    maxDuration={gifSettings.maxDuration}
                    setIsGifSettingsOpen={setIsGifSettingsOpen}
                  />
                </Suspense>
              )}

            {/* GIF Settings */}
            {isGifSettingsOpen && (
              <Suspense fallback={<div>Loading...</div>}>
                <GifMakerGifSettings
                  gifSettings={gifSettings}
                  setMaxDuration={setMaxDuration}
                  setFps={setFps}
                  setQuality={setQuality}
                />
              </Suspense>
            )}

            {/* Generated GIF Preview */}
            {gifUrl && (
              <div className="mb-6">
                <Suspense fallback={<div>Loading...</div>}>
                  <GifMakerEditorSelector
                    gifUrl={gifUrl}
                    canvasBlurRef={canvasBlurRef}
                    maskCanvasRef={maskCanvasRef}
                    startDrawing={startDrawing}
                    stopDrawing={stopDrawing}
                    draw={draw}
                    blurSettings={blurSettings}
                    setBlurIntensity={setBlurIntensity}
                    setBrushSize={setBrushSize}
                    setBlurType={setBlurType}
                    clearMask={clearMask}
                    isGifLoaded={isGifLoaded}
                    processAllFrames={processAllFrames}
                    reconstructGif={reconstructGifWrapper}
                    isGifProcessing={isGifProcessing}
                    formData={formData}
                    setWebhookData={setWebhookData}
                    gifUrlHistory={gifUrlHistory}
                    setGifUrlHistory={setGifUrlHistory}
                    setGifUrl={setGifUrl}
                    selectedCaption={selectedCaption}
                    setSelectedCaption={setSelectedCaption}
                  />
                </Suspense>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mt-2">
                  <h3 className="text-gray-300 mb-2 font-medium">
                    Generated GIF
                  </h3>
                  <div className="flex flex-col items-center">
                    <img
                      src={gifUrl}
                      alt="Generated GIF"
                      className="max-w-full rounded-lg mb-4"
                    />
                    <button
                      onClick={downloadGif}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />{" "}
                      {isDownloading ? "Downloading..." : "Download GIF"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && error.includes("Check if the path exists") && (
              <p className="text-red-500 text-sm">
                Make sure to scale your video to fit the outline!
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-5">
              <button
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                onClick={() => {
                  if (gifUrl) {
                    URL.revokeObjectURL(gifUrl);
                    setGifUrl(null);
                  }
                }}
              >
                Reset
              </button>
              <button
                className={`${
                  isProcessing
                    ? "bg-blue-800 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500"
                } text-white px-4 py-2 rounded-lg transition-colors flex items-center`}
                onClick={createGif}
                disabled={
                  isProcessing || videoClips.every((clip) => !clip.file)
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing ({processingProgress}%)
                  </>
                ) : (
                  <>Create GIF</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Hidden Canvas for capturing frames */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default GifMaker;

// Create a non-SSR version of the component
export const ClientSideFFmpeg = dynamic(() => Promise.resolve(GifMaker), {
  ssr: false,
});