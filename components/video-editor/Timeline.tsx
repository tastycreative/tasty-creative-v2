"use client";

import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { VideoSequenceItem, SelectiveBlurRegion } from "@/types/video";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
  Film,
  Grid3x3,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { BlurTimelineOverlay } from "./BlurTimelineOverlay";

interface VideoFrame {
  time: number;
  thumbnail: string;
  videoId: string;
}

interface TimelineProps {
  videos: VideoSequenceItem[];
  currentTime: number;
  totalDuration: number;
  selectedVideoId: string | null;
  isPlaying: boolean;
  frameRate?: number; // frames per second, default 30
  onSeek: (time: number) => void;
  onVideoSelect: (id: string) => void;
  onVideoReorder: (dragIndex: number, hoverIndex: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onBlurRegionClick?: (videoId: string, regionId: string) => void;
  editingBlur?: { videoId: string; regionId: string } | null;
  layout?: "single" | "side-by-side";
  onAddSequence?: (gridId?: string) => void;
}

// Smart progressive frame extraction utility with throttling and progress tracking

// Progressive: extract low-res/low-quality frames first, then high-res/high-quality
const extractVideoFramesProgressively = (
  videoFile: File,
  onFrameExtracted: (frame: VideoFrame) => void,
  onComplete: () => void,
  onProgressUpdate: (current: number, total: number) => void,
  priority: number = 0,
  shouldPause: () => boolean = () => false
) => {
  const videoUrl = URL.createObjectURL(videoFile);
  const PIXELS_PER_SECOND = 60;
  const MAX_FRAME_CONTAINER_WIDTH = 320;
  const MIN_FRAME_CONTAINER_WIDTH = 48;
  const videoPoolSize = 3;
  const canvasPoolSize = 3;

  // Two passes: first low-res, then high-res
  const passes = [
    { width: 64, height: 36, quality: 0.3, pass: "low" }, // fast blurry
    { width: 320, height: 180, quality: 0.8, pass: "high" }, // final
  ];

  // Create video pool
  const videoPool = Array(videoPoolSize)
    .fill(null)
    .map(() => {
      const vid = document.createElement("video");
      vid.src = videoUrl;
      vid.crossOrigin = "anonymous";
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = "metadata";
      return vid;
    });

  Promise.all(
    videoPool.map(
      (vid) =>
        new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Video metadata loading timeout"));
          }, 5000);
          vid.addEventListener(
            "loadedmetadata",
            () => {
              clearTimeout(timeoutId);
              resolve();
            },
            { once: true }
          );
          vid.addEventListener(
            "error",
            () => {
              clearTimeout(timeoutId);
              reject(new Error("Video loading error"));
            },
            { once: true }
          );
          vid.load();
        })
    )
  ).then(() => {
    const duration = videoPool[0].duration;
    const segmentWidthPx = Math.max(MIN_FRAME_CONTAINER_WIDTH, duration * PIXELS_PER_SECOND);
    const optimalFrames = Math.max(8, Math.min(120, Math.round(segmentWidthPx / 10)));
    const interval = duration / optimalFrames;
    const maxFrames = optimalFrames;
    const frameTimes: number[] = [];
    for (let i = 0; i < maxFrames; i++) {
      frameTimes.push(i * interval);
    }
    onProgressUpdate(0, maxFrames);

    // Helper to extract a single frame at a given quality
    const extractFrame = async (
      vid: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D | null,
      time: number,
      width: number,
      height: number,
      quality: number
    ): Promise<VideoFrame | null> => {
      if (!ctx) return null;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 2000);
        const seekHandler = () => {
          clearTimeout(timeout);
          try {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(vid, 0, 0, width, height);
            const thumbnail = canvas.toDataURL("image/jpeg", quality);
            resolve({ time, thumbnail, videoId: "" });
          } catch {
            resolve(null);
          }
        };
        vid.addEventListener("seeked", seekHandler, { once: true });
        vid.currentTime = Math.min(time, duration - 0.1);
      });
    };

    // Two passes: low-res then high-res
    let extractedCount = 0;
    const frameResults: (VideoFrame | null)[] = Array(maxFrames).fill(null);
    const processPass = async (passIdx: number) => {
      const { width, height, quality, pass } = passes[passIdx];
      // Create canvas pool for this pass
      const canvasPool = Array(canvasPoolSize)
        .fill(null)
        .map(() => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          return {
            canvas,
            ctx: canvas.getContext("2d", {
              willReadFrequently: false,
              alpha: false,
              desynchronized: true,
            }),
          };
        });
      const batchSize = videoPoolSize;
      for (let i = 0; i < frameTimes.length; i += batchSize) {
        if (shouldPause()) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          i -= batchSize;
          continue;
        }
        const batch = frameTimes.slice(i, i + batchSize);
        const batchPromises = batch.map((time, index) => {
          const videoIndex = index % videoPool.length;
          const canvasData = canvasPool[videoIndex];
          return extractFrame(
            videoPool[videoIndex],
            canvasData.canvas,
            canvasData.ctx,
            time,
            width,
            height,
            quality
          );
        });
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((frame, j) => {
          const frameIdx = i + j;
          if (frame) {
            if (pass === "low") {
              // Show low-res frame immediately
              onFrameExtracted({ ...frame });
              frameResults[frameIdx] = frame;
              extractedCount++;
              onProgressUpdate(extractedCount, maxFrames);
            } else if (pass === "high") {
              // Replace with high-res frame
              onFrameExtracted({ ...frame });
              frameResults[frameIdx] = frame;
            }
          }
        });
      }
    };
    // Pass 0: low-res
    processPass(0).then(() => {
      // Pass 1: high-res
      processPass(1).then(() => {
        URL.revokeObjectURL(videoUrl);
        onComplete();
      });
    });
  });
};

export const Timeline: React.FC<TimelineProps> = ({
  videos,
  currentTime,
  totalDuration,
  selectedVideoId,
  isPlaying,
  frameRate = 30,
  onSeek,
  onVideoSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVideoReorder,
  onPlay,
  onPause,
  onBlurRegionClick,
  editingBlur,
  layout = "single",
  onAddSequence,
}) => {
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clickPosition, setClickPosition] = useState<{
    x: number;
    time: number;
  } | null>(null);
  const [videoFrames, setVideoFrames] = useState<Map<string, VideoFrame[]>>(
    new Map()
  );
  const [showFrameView, setShowFrameView] = useState(true);
  const frameExtractionRef = useRef<Map<string, boolean>>(new Map());
  const [extractionProgress, setExtractionProgress] = useState<
    Map<string, { current: number; total: number }>
  >(new Map());
  
  // Timeline constants
  const BASELINE_DURATION = 25; // 25 seconds at 100% zoom
  const PIXELS_PER_SECOND = 60; // Consistent pixel scale for all calculations
  
  // Zoom state management - 100% zoom = 25 seconds visible
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100% (25s visible), 2 = 200% (12.5s visible), etc.
  const [viewportStart, setViewportStart] = useState(0); // Start time of visible viewport
  const [viewportEnd, setViewportEnd] = useState(0); // End time of visible viewport
  
  // Scrollbar state
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);

  // Calculate dynamic blur area height based on total number of blur regions across all videos
  const totalBlurRegions = useMemo(() => {
    return videos.reduce(
      (total, video) =>
        total +
        (video.effects.selectiveBlur ? video.effects.selectiveBlur.length : 0),
      0
    );
  }, [videos]);

  // Dynamic blur area height - minimum 28px, grows with more regions
  const blurAreaHeight = useMemo(() => {
    if (totalBlurRegions === 0) return 28;

    // Calculate required height for all regions
    const overlayHeight = 10;
    const overlaySpacing = 1;
    const topPadding = 4;
    const bottomPadding = 4;
    const requiredHeight =
      topPadding +
      bottomPadding +
      totalBlurRegions * overlayHeight +
      (totalBlurRegions - 1) * overlaySpacing;

    // Use calculated height with a reasonable maximum, but ensure we can fit all regions
    const maxHeight = 160; // Increased cap to allow more regions
    const calculatedHeight = Math.min(Math.max(28, requiredHeight), maxHeight);

    // If we hit the max height, ensure we can still fit all regions (they'll just be smaller)
    if (requiredHeight > maxHeight && totalBlurRegions > 0) {
      // Calculate minimum height needed with smaller overlays
      const minOverlayHeight = 8; // Minimum 8px height
      const minRequiredHeight =
        topPadding +
        bottomPadding +
        totalBlurRegions * minOverlayHeight +
        (totalBlurRegions - 1) * overlaySpacing;
      return Math.min(maxHeight, Math.max(calculatedHeight, minRequiredHeight));
    }

    return calculatedHeight;
  }, [totalBlurRegions]);

  // Timeline track top position - starts after blur area
  const timelineTrackTop = blurAreaHeight + 4;
  
  // Zoom control functions
  const zoomIn = useCallback(() => {
    const newZoomLevel = Math.min(zoomLevel * 1.5, 10); // Max 10x zoom
    setZoomLevel(newZoomLevel);
  }, [zoomLevel]);
  
  const zoomOut = useCallback(() => {
    // Calculate minimum zoom level needed to show entire video
    const minZoomForFullVideo = totalDuration > 0 ? BASELINE_DURATION / totalDuration : 0.25;
    const absoluteMinZoom = Math.min(0.25, Math.max(0.05, minZoomForFullVideo)); // At least 5% zoom, but adapt to video length
    
    const newZoomLevel = Math.max(zoomLevel / 1.5, absoluteMinZoom);
    setZoomLevel(newZoomLevel);
  }, [zoomLevel, totalDuration]);
  
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setViewportStart(0);
    setViewportEnd(Math.min(BASELINE_DURATION, totalDuration));
  }, [totalDuration]);

  const fitToTimeline = useCallback(() => {
    if (totalDuration > 0) {
      const zoomToFit = BASELINE_DURATION / totalDuration;
      setZoomLevel(Math.max(0.05, zoomToFit)); // Minimum 5% zoom
      setViewportStart(0);
      setViewportEnd(totalDuration);
    }
  }, [totalDuration]);

  // Scrollbar handlers
  const handleScrollbarMouseDown = useCallback((e: React.MouseEvent) => {
    if (totalDuration <= BASELINE_DURATION / zoomLevel) return; // No need to scroll
    
    setIsDraggingScrollbar(true);
    const scrollbarRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - scrollbarRect.left;
    const clickPercentage = clickX / scrollbarRect.width;
    
    const visibleDuration = BASELINE_DURATION / zoomLevel;
    const newStart = Math.max(0, Math.min(totalDuration - visibleDuration, clickPercentage * totalDuration - visibleDuration / 2));
    const newEnd = newStart + visibleDuration;
    
    setViewportStart(newStart);
    setViewportEnd(newEnd);
    e.preventDefault();
  }, [totalDuration, zoomLevel, viewportStart, viewportEnd]);

  const handleScrollbarThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingScrollbar(true);
    e.preventDefault();
  }, []);
  
  // Update viewport when zoom level or total duration changes
  useEffect(() => {
    if (totalDuration > 0) {
      // Calculate visible duration based on 25-second baseline
      const visibleDuration = BASELINE_DURATION / zoomLevel;
      
      // Keep current time in center of viewport when zooming, or start at 0 if first time
      const currentCenter = viewportEnd === 0 ? 0 : (viewportStart + viewportEnd) / 2;
      const newStart = Math.max(0, currentCenter - visibleDuration / 2);
      const newEnd = Math.min(totalDuration, newStart + visibleDuration);
      
      setViewportStart(newStart);
      setViewportEnd(newEnd);
    }
  }, [zoomLevel, totalDuration]);

  // Initialize viewport when totalDuration first becomes available
  useEffect(() => {
    if (totalDuration > 0 && viewportEnd === 0) {
      setViewportEnd(Math.min(BASELINE_DURATION, totalDuration));
    }
  }, [totalDuration, viewportEnd]);

  // Extract frames progressively with queue management
  useEffect(() => {
    const extractFramesForVideos = () => {
      // Process videos one at a time to prevent UI blocking
      const videosToProcess = videos.filter(
        (video) => !frameExtractionRef.current.get(video.id) && video.file
      );

      if (videosToProcess.length === 0) return;

      // Process videos sequentially with priority (first video gets priority 0)
      videosToProcess.forEach((video, index) => {
        // Delay each video's processing to prevent simultaneous extraction
        setTimeout(() => {
          if (!frameExtractionRef.current.get(video.id)) {
            frameExtractionRef.current.set(video.id, true);

            // Initialize empty array for this video
            setVideoFrames((prev) => new Map(prev.set(video.id, [])));

            try {
              extractVideoFramesProgressively(
                video.file,
                (frame) => {
                  // Add video ID and immediately update state
                  const frameWithVideoId = { ...frame, videoId: video.id };
                  setVideoFrames((prev) => {
                    const currentFrames = prev.get(video.id) || [];
                    return new Map(
                      prev.set(video.id, [...currentFrames, frameWithVideoId])
                    );
                  });
                },
                () => {
                  console.log(
                    `Frame extraction completed for video ${video.id}`
                  );
                  // Clear progress when complete
                  setExtractionProgress((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(video.id);
                    return newMap;
                  });
                },
                (current, total) => {
                  // Update progress
                  setExtractionProgress(
                    (prev) => new Map(prev.set(video.id, { current, total }))
                  );
                },
                index, // Priority based on video order
                () => isPlaying // Pause extraction when video is playing
              );
            } catch (error) {
              console.error(
                `Failed to extract frames for video ${video.id}:`,
                error
              );
              frameExtractionRef.current.set(video.id, false);
            }
          }
        }, index * 200); // Stagger video processing by 200ms each
      });
    };

    // Always extract frames automatically
    extractFramesForVideos();
  }, [videos, isPlaying]);

  // Frame navigation functions
  const getCurrentFrameIndex = useCallback(() => {
    return Math.round(currentTime * frameRate);
  }, [currentTime, frameRate]);

  const getTotalFrames = useCallback(() => {
    return Math.floor(totalDuration * frameRate);
  }, [totalDuration, frameRate]);

  const seekToFrame = useCallback(
    (frameIndex: number) => {
      const time = frameIndex / frameRate;
      const clampedTime = Math.max(0, Math.min(time, totalDuration));
      console.log("seekToFrame:", {
        frameIndex,
        calculatedTime: time,
        clampedTime,
        frameRate,
        totalDuration,
      });
      onSeek(clampedTime);
    },
    [frameRate, onSeek, totalDuration]
  );

  const goToPreviousFrame = useCallback(() => {
    const currentFrame = getCurrentFrameIndex();
    if (currentFrame > 0) {
      seekToFrame(currentFrame - 1);
    }
  }, [getCurrentFrameIndex, seekToFrame]);

  const goToNextFrame = useCallback(() => {
    const currentFrame = getCurrentFrameIndex();
    const totalFrames = getTotalFrames();
    if (currentFrame < totalFrames - 1) {
      seekToFrame(currentFrame + 1);
    }
  }, [getCurrentFrameIndex, getTotalFrames, seekToFrame]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);


  const getVideoPosition = useCallback(
    (video: VideoSequenceItem) => {
      if (totalDuration === 0) return { leftPixels: 0, widthPixels: 0 };

      // Calculate cumulative start time and effective duration
      let cumulativeTime = 0;

      if (layout === "side-by-side" && video.gridId) {
        // For side-by-side layout, only consider videos in the same grid for cumulative time
        const sameGridVideos = videos.filter((v) => v.gridId === video.gridId);
        for (const v of sameGridVideos) {
          if (v.id === video.id) {
            break;
          }
          const speedMultiplier = v.effects.speed || 1;
          const trimStart = v.trimStart || 0;
          const trimEnd = v.trimEnd || v.duration;
          const trimmedDuration = trimEnd - trimStart;
          const effectiveDuration = trimmedDuration / speedMultiplier;
          cumulativeTime += effectiveDuration;
        }
      } else {
        // For single layout, consider all videos sequentially
        for (const v of videos) {
          if (v.id === video.id) {
            break;
          }
          const speedMultiplier = v.effects.speed || 1;
          const trimStart = v.trimStart || 0;
          const trimEnd = v.trimEnd || v.duration;
          const trimmedDuration = trimEnd - trimStart;
          const effectiveDuration = trimmedDuration / speedMultiplier;
          cumulativeTime += effectiveDuration;
        }
      }

      const speedMultiplier = video.effects.speed || 1;
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = trimEnd - trimStart;
      const effectiveDuration = trimmedDuration / speedMultiplier;

      // Calculate position in pixels based on total timeline width
      // Use a fixed pixel-per-second ratio for consistent positioning
      const leftPixels = cumulativeTime * PIXELS_PER_SECOND;
      const widthPixels = Math.max(30, effectiveDuration * PIXELS_PER_SECOND); // Minimum 30px width

      return { leftPixels, widthPixels };
    },
    [totalDuration, videos, layout]
  );

  const getCurrentPosition = useMemo(() => {
    if (totalDuration === 0 || viewportEnd === viewportStart) return "0%";
    
    // Use the same calculation method as the timeline ruler for consistency
    const visibleDuration = viewportEnd - viewportStart;
    
    // Calculate percentage position within the visible viewport
    if (currentTime < viewportStart || currentTime > viewportEnd) {
      // Current time is outside viewport, position it accordingly
      const timePixels = currentTime * PIXELS_PER_SECOND;
      const viewportStartPixels = viewportStart * PIXELS_PER_SECOND;
      const visiblePixels = visibleDuration * PIXELS_PER_SECOND;
      const position = ((timePixels - viewportStartPixels) / visiblePixels) * 100;
      return `${position}%`;
    }
    
    // Current time is within viewport
    const timePixels = currentTime * PIXELS_PER_SECOND;
    const viewportStartPixels = viewportStart * PIXELS_PER_SECOND;
    const visiblePixels = visibleDuration * PIXELS_PER_SECOND;
    const position = ((timePixels - viewportStartPixels) / visiblePixels) * 100;
    
    return `${Math.max(0, Math.min(100, position))}%`;
  }, [currentTime, totalDuration, viewportStart, viewportEnd, PIXELS_PER_SECOND]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only trigger if clicking the timeline background (not a video segment or add button)
      const target = e.target as HTMLElement;
      if (target.closest(".video-segment")) return;
      if (target.closest(".add-sequence-btn")) return;
      if (target.closest(".blur-overlay")) return;
      
      // When thumbnails are enabled, only allow seeking in empty timeline areas
      // (between video segments or outside all segments)

      // Use the container rect directly like OldTimeline for accurate positioning
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;

      // Calculate percentage based on full container width
      const percentage = Math.max(0, Math.min(1, clickX / containerRect.width));
      const visibleDuration = viewportEnd - viewportStart;
      const clickTime = viewportStart + (percentage * visibleDuration); // Calculate time within viewport

      console.log("Timeline click:", {
        clickX,
        containerWidth: containerRect.width,
        percentage: percentage * 100,
        clickTime,
        totalDuration,
        currentTimeBeforeSeek: currentTime,
      });

      setHoverPosition(null);
      setIsDragging(false);
      
      // Direct seek without frame calculations
      onSeek(clickTime);

      let videosInGrid = videos;
      if (layout === "side-by-side") {
        // Determine which grid was clicked based on Y position
        const totalTrackArea = (88 + (blurAreaHeight - 28)) * 2;
        const singleTrackHeight = (totalTrackArea - 8) / 2;
        // Grid 1 is top, Grid 2 is bottom
        if (clickY < singleTrackHeight + 8 / 2) {
          videosInGrid = videos.filter((v) => v.gridId === "grid-1");
        } else {
          videosInGrid = videos.filter((v) => v.gridId === "grid-2");
        }
      }

      // Find the video whose startTime is closest but not after clickTime, in the correct grid
      let selected = null;
      let minDiff = Infinity;
      for (const video of videosInGrid) {
        const start = video.startTime || 0;
        if (start <= clickTime && clickTime - start < minDiff) {
          minDiff = clickTime - start;
          selected = video;
        }
      }
      if (selected && typeof onVideoSelect === "function") {
        onVideoSelect(selected.id);
      }
      e.preventDefault();
    },
    [videos, totalDuration, onSeek, onVideoSelect, layout, blurAreaHeight, currentTime, viewportStart, viewportEnd]
  );

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // Don't interfere with blur overlays, video segments or add buttons
      if (target.closest(".blur-overlay") || target.closest(".video-segment") || target.closest(".add-sequence-btn")) {
        return;
      }

      // Use container rect and pixel-based calculation for accuracy
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;

      // Calculate time using the same pixel-based method as the ruler
      const percentage = Math.max(0, Math.min(1, clickX / containerRect.width));
      const visibleDuration = viewportEnd - viewportStart;
      
      // Use pixel-based calculation to match ruler positioning exactly
      const visiblePixels = visibleDuration * PIXELS_PER_SECOND;
      const clickPixelOffset = percentage * visiblePixels;
      const clickTimeFromPixels = (clickPixelOffset / PIXELS_PER_SECOND) + viewportStart;
      
      const clickTime = clickTimeFromPixels;

      console.log("Timeline mousedown:", {
        clickX,
        containerWidth: containerRect.width,
        percentage: percentage * 100,
        clickTime,
        totalDuration,
        currentTimeBeforeSeek: currentTime,
        viewportStart,
        viewportEnd,
        visibleDuration,
        PIXELS_PER_SECOND,
      });

      setHoverPosition(null);
      setClickPosition({ x: clickX, time: clickTime });
      setIsDragging(true);

      // Direct seek without frame calculations
      onSeek(clickTime);

      e.preventDefault();
    },
    [totalDuration, onSeek, currentTime, viewportStart, viewportEnd]
  );

  const handleTimelineMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Check if we're hovering over a blur overlay or its controls
      const target = e.target as HTMLElement;
      const isBlurOverlay =
        target.closest(".blur-overlay") ||
        target.closest("[data-blur-controls]");

      // Use container rect like OldTimeline
      const containerRect = e.currentTarget.getBoundingClientRect();
      const moveX = e.clientX - containerRect.left;
      const percentage = Math.max(0, Math.min(1, moveX / containerRect.width));

      if (isDragging && clickPosition) {
        // Only start dragging if mouse has moved significantly from click position
        const dragThreshold = 3; // pixels
        const hasDraggedEnough =
          Math.abs(moveX - clickPosition.x) > dragThreshold;

        if (hasDraggedEnough) {
          // Use pixel-based calculation to match ruler positioning exactly
          const visibleDuration = viewportEnd - viewportStart;
          const visiblePixels = visibleDuration * PIXELS_PER_SECOND;
          const movePixelOffset = percentage * visiblePixels;
          const newTime = (movePixelOffset / PIXELS_PER_SECOND) + viewportStart;
          console.log("Dragging seek:", {
            moveX,
            percentage: percentage * 100,
            newTime,
            totalDuration,
            dragDistance: Math.abs(moveX - clickPosition.x),
          });
          onSeek(newTime);
        }
      } else if (!isBlurOverlay) {
        // Only show hover indicator when not hovering over blur overlays or controls
        const hoverPercentage = percentage * 100;
        setHoverPosition(hoverPercentage);
      } else {
        // Clear hover position when over blur elements
        setHoverPosition(null);
      }
    },
    [isDragging, totalDuration, onSeek, clickPosition, viewportStart, viewportEnd]
  );

  const handleTimelineMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  // Handle horizontal scrolling when zoomed
  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (zoomLevel > 1 || totalDuration > BASELINE_DURATION) {
      e.preventDefault();
      const visibleDuration = BASELINE_DURATION / zoomLevel;
      const scrollAmount = (e.deltaX || e.deltaY) * 0.001 * visibleDuration;
      
      const newStart = Math.max(0, Math.min(totalDuration - visibleDuration, viewportStart + scrollAmount));
      const newEnd = newStart + visibleDuration;
      
      setViewportStart(newStart);
      setViewportEnd(newEnd);
    }
  }, [zoomLevel, viewportStart, viewportEnd, totalDuration]);

  // Keyboard shortcuts for zoom and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      switch (e.key) {
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
        case 'ArrowLeft':
          if (zoomLevel > 1 || totalDuration > BASELINE_DURATION) {
            e.preventDefault();
            const visibleDuration = BASELINE_DURATION / zoomLevel;
            const scrollAmount = visibleDuration * 0.1;
            const newStart = Math.max(0, viewportStart - scrollAmount);
            const newEnd = newStart + visibleDuration;
            setViewportStart(newStart);
            setViewportEnd(newEnd);
          }
          break;
        case 'ArrowRight':
          if (zoomLevel > 1 || totalDuration > BASELINE_DURATION) {
            e.preventDefault();
            const visibleDuration = BASELINE_DURATION / zoomLevel;
            const scrollAmount = visibleDuration * 0.1;
            const newStart = Math.min(totalDuration - visibleDuration, viewportStart + scrollAmount);
            const newEnd = newStart + visibleDuration;
            setViewportStart(newStart);
            setViewportEnd(newEnd);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel, zoomIn, zoomOut, resetZoom, viewportStart, viewportEnd, totalDuration]);

  // Global mouse handlers for scrollbar dragging
  useEffect(() => {
    if (isDraggingScrollbar) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const scrollbarElement = document.querySelector('.timeline-scrollbar');
        if (scrollbarElement) {
          const scrollbarRect = scrollbarElement.getBoundingClientRect();
          const moveX = e.clientX - scrollbarRect.left;
          const movePercentage = Math.max(0, Math.min(1, moveX / scrollbarRect.width));
          
          const visibleDuration = BASELINE_DURATION / zoomLevel;
          const newStart = Math.max(0, Math.min(totalDuration - visibleDuration, movePercentage * (totalDuration - visibleDuration)));
          const newEnd = newStart + visibleDuration;
          
          setViewportStart(newStart);
          setViewportEnd(newEnd);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDraggingScrollbar(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDraggingScrollbar, totalDuration, zoomLevel]);

  // Add global mouse up listener when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setClickPosition(null);
      };
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const timelineContainer = document.querySelector(
          ".timeline-track-container"
        );
        if (timelineContainer && clickPosition) {
          const rect = timelineContainer.getBoundingClientRect();
          const moveX = e.clientX - rect.left;
          const dragThreshold = 3; // pixels
          const hasDraggedEnough =
            Math.abs(moveX - clickPosition.x) > dragThreshold;

          if (hasDraggedEnough) {
            const percentage = Math.max(0, Math.min(1, moveX / rect.width));
            const visibleDuration = viewportEnd - viewportStart;
            const newTime = viewportStart + (percentage * visibleDuration);
            console.log("Global drag seek:", {
              moveX,
              percentage: percentage * 100,
              newTime,
              totalDuration,
              dragDistance: Math.abs(moveX - clickPosition.x),
            });
            onSeek(newTime);
          }
        }
      };

      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("mousemove", handleGlobalMouseMove);

      return () => {
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [isDragging, totalDuration, onSeek, clickPosition, viewportStart, viewportEnd]);

  const handleVideoClick = useCallback(
    (video: VideoSequenceItem, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // Always select the video in the editor, even if already selected
      if (typeof onVideoSelect === "function") {
        onVideoSelect(video.id);
      }

      // Use the same accurate calculation as the main timeline
      // Get the timeline container (not just the video segment)
      const timelineContainer = document.querySelector('.timeline-track-container');
      if (!timelineContainer) return;
      
      const containerRect = timelineContainer.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      
      // Use the same pixel-based calculation as handleTimelineMouseDown
      const percentage = Math.max(0, Math.min(1, clickX / containerRect.width));
      const visibleDuration = viewportEnd - viewportStart;
      const visiblePixels = visibleDuration * PIXELS_PER_SECOND;
      const clickPixelOffset = percentage * visiblePixels;
      const absoluteTime = (clickPixelOffset / PIXELS_PER_SECOND) + viewportStart;

      console.log("Video segment click:", {
        clickX,
        containerWidth: containerRect.width,
        percentage,
        absoluteTime,
        viewportStart,
        viewportEnd,
        visibleDuration,
        PIXELS_PER_SECOND,
        currentTimeBeforeSeek: currentTime,
      });

      // Seek to that position
      onSeek(absoluteTime);
    },
    [onVideoSelect, onSeek, currentTime, viewportStart, viewportEnd, PIXELS_PER_SECOND]
  );

  const jumpToStart = useCallback(() => {
    onSeek(0);
  }, [onSeek]);

  const jumpToEnd = useCallback(() => {
    onSeek(totalDuration);
  }, [onSeek, totalDuration]);

  const renderVideoSegment = useCallback(
    (
      video: VideoSequenceItem,
      index: number,
      leftPercent: number,
      widthPercent: number,
      isSelected: boolean,
      frames: VideoFrame[],
      colorClass: string,
      topOffset: number,
      bottomOffset: number
    ) => {
      // Always fill the segment width with a background, even after frames load
      const MIN_FRAME_CONTAINER_WIDTH = 48;
      const MAX_FRAME_CONTAINER_WIDTH = 320;
      const speedMultiplier = video.effects.speed || 1;
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = trimEnd - trimStart;
      const effectiveDuration = trimmedDuration / speedMultiplier;
      // The segment width in pixels (proportional to duration, never less than min)
      const segmentWidthPx = Math.max(MIN_FRAME_CONTAINER_WIDTH, effectiveDuration * PIXELS_PER_SECOND);

      // Frame width for loaded frames (do not stretch to fill, just show as many as loaded)
      const loadedFrameCount = frames.length;
      // Each frame gets a min/max width, but never stretches to fill
      const frameNaturalWidth = loadedFrameCount > 0
        ? Math.max(
            MIN_FRAME_CONTAINER_WIDTH,
            Math.min(MAX_FRAME_CONTAINER_WIDTH, segmentWidthPx / loadedFrameCount)
          )
        : MIN_FRAME_CONTAINER_WIDTH;

      return (
        <div
          key={video.id}
          className={`
            video-segment cursor-pointer transition-all duration-200 overflow-hidden h-full
            ${isSelected ? "ring-2 ring-pink-500 shadow-xl z-30" : "hover:shadow-lg z-20"}
          `}
          style={{
            left: `${leftPercent}%`,
            width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
            top: 0,
            bottom: 0,
            marginLeft: index > 0 ? "1px" : "0",
          }}
          onClick={(e) => handleVideoClick(video, e)}
          title={`${video.file.name} (${formatTime(video.trimEnd || video.duration)} ${video.trimStart || video.trimEnd ? "trimmed" : "full"})`}
        >
          {/* Always show a background color filling the segment width */}
          <div
            className={
              `absolute inset-0 bg-gray-200 ${loadedFrameCount === 0 ? 'animate-pulse' : ''}`
            }
            style={{ width: '100%', height: '100%', zIndex: 0 }}
            aria-hidden="true"
          />
          {/* Frame Thumbnails or Loading State */}
          <div
            className="flex h-full overflow-x-auto overflow-y-hidden w-full relative"
            style={{
              minWidth: `${MIN_FRAME_CONTAINER_WIDTH}px`,
              width: `${segmentWidthPx}px`,
              zIndex: 1,
            }}
          >
            {/* Show loaded frames at their natural width, do not stretch */}
            {frames.map((frame, frameIndex) => {
              const frameWidth = `${frameNaturalWidth}px`;
              const frameTimespan = effectiveDuration / loadedFrameCount;
              const frameStartTime = frameIndex * frameTimespan;
              const frameEndTime = frameStartTime + frameTimespan;
              const frameStartAbsolute = video.startTime + frameStartTime;
              const frameEndAbsolute = video.startTime + frameEndTime;
              return (
                <div
                  key={frameIndex}
                  className="relative cursor-pointer transition-all duration-200 border-r border-gray-800/20 last:border-r-0 hover:brightness-110"
                  style={{
                    width: frameWidth,
                    height: "100%",
                    minWidth: 48,
                    maxWidth: 120,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Use the same accurate calculation as the main timeline
                    const timelineContainer = document.querySelector('.timeline-track-container');
                    if (!timelineContainer) return;
                    const containerRect = timelineContainer.getBoundingClientRect();
                    const clickX = e.clientX - containerRect.left;
                    // Use the same pixel-based calculation as handleTimelineMouseDown
                    const percentage = Math.max(0, Math.min(1, clickX / containerRect.width));
                    const visibleDuration = viewportEnd - viewportStart;
                    const visiblePixels = visibleDuration * PIXELS_PER_SECOND;
                    const clickPixelOffset = percentage * visiblePixels;
                    const absoluteTime = (clickPixelOffset / PIXELS_PER_SECOND) + viewportStart;
                    onSeek(absoluteTime);
                    onVideoSelect(video.id);
                  }}
                  title={`${video.file.name} - Frame ${frameIndex + 1} (${formatTime(frameStartAbsolute)} - ${formatTime(frameEndAbsolute)})`}
                >
                  <img
                    src={frame.thumbnail}
                    alt={`Frame at ${frame.time}s`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              );
            })}
            {/* If still loading, fill the rest of the container with a spinner */}
            {loadedFrameCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-pink-400 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      );
    },
    [
      showFrameView,
      extractionProgress,
      formatTime,
      currentTime,
      handleVideoClick,
      onSeek,
      onVideoSelect,
    ]
  );

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* Play/Pause Button */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 bg-pink-600 hover:bg-pink-700 rounded-lg transition-all duration-200 group"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          {/* Skip Controls */}
          <button
            onClick={jumpToStart}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200"
            title="Jump to start"
          >
            <SkipBack className="w-4 h-4 text-gray-300" />
          </button>

          <button
            onClick={jumpToEnd}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200"
            title="Jump to end"
          >
            <SkipForward className="w-4 h-4 text-gray-300" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* Frame Controls */}
          <button
            onClick={goToPreviousFrame}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200"
            title="Previous frame"
            disabled={getCurrentFrameIndex() <= 0}
          >
            <ChevronLeft className="w-4 h-4 text-gray-300" />
          </button>

          <button
            onClick={goToNextFrame}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200"
            title="Next frame"
            disabled={getCurrentFrameIndex() >= getTotalFrames() - 1}
          >
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>

          {/* Frame Counter */}
          <div className="text-xs text-gray-400 font-mono bg-gray-800 px-3 py-1.5 rounded">
            F: {getCurrentFrameIndex() + 1}/{getTotalFrames()}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* Frame View Toggle */}
          <button
            onClick={() => setShowFrameView(!showFrameView)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showFrameView
                ? "bg-pink-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            title="Toggle thumbnails"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* Layout Toggle */}
          {layout === "side-by-side" && (
            <button
              className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-300"
              title="Layout"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-300"
            title="Zoom out"
            disabled={(() => {
              const minZoomForFullVideo = totalDuration > 0 ? BASELINE_DURATION / totalDuration : 0.25;
              const absoluteMinZoom = Math.min(0.25, Math.max(0.05, minZoomForFullVideo));
              return zoomLevel <= absoluteMinZoom;
            })()}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1">
            <div 
              className="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded cursor-pointer hover:bg-gray-700 transition-all duration-200"
              onClick={resetZoom}
              title="Reset to 100% zoom (25s visible)"
            >
              {Math.round(zoomLevel * 100)}%
            </div>
            <button
              onClick={fitToTimeline}
              className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded cursor-pointer hover:bg-gray-700 transition-all duration-200"
              title="Fit entire video to timeline"
            >
              Fit
            </button>
          </div>

          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-300"
            title="Zoom in"
            disabled={zoomLevel >= 10}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-pink-500" />
            <span className="font-mono text-gray-300">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          {videos.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Layers className="w-3.5 h-3.5" />
              <span>{videos.length} clips</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Track */}
      <div
        className="timeline-track-container relative cursor-pointer select-none bg-gray-800 rounded-lg"
        style={{
          height:
            layout === "side-by-side"
              ? (88 + (blurAreaHeight - 28)) * 2 + 4 // Double height with smaller gap for side-by-side
              : 88 + (blurAreaHeight - 28),
        }}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseLeave={handleTimelineMouseLeave}
        onWheel={handleScroll}
      >
        {/* Add Sequence Buttons for Grid 1 and Grid 2 (side-by-side only) */}
        {layout === "side-by-side" && (
          <>
            {/* Grid 1 Add Button */}
            {(() => {
              // Always show at the far right of the grid track, not after last video
              const totalTrackArea = (88 + (blurAreaHeight - 28)) * 2;
              const singleTrackHeight = (totalTrackArea - 8) / 2;
              const topOffset = 4;
              return (
                <button
                  key="grid-1-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSequence?.("grid-1");
                  }}
                  className="add-sequence-btn absolute cursor-pointer transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white rounded-lg opacity-60 hover:opacity-100 focus:outline-none"
                  style={{
                    right: "8px",
                    top: topOffset + singleTrackHeight / 2 - 16,
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "auto",
                    zIndex: 1000,
                  }}
                  title="Add sequence to Grid 1"
                >
                  <Plus className="w-5 h-5" />
                </button>
              );
            })()}

            {/* Grid 2 Add Button */}
            {(() => {
              // Always show at the far right of the grid track, not after last video
              const totalTrackArea = (88 + (blurAreaHeight - 28)) * 2;
              const singleTrackHeight = (totalTrackArea - 8) / 2;
              const topOffset = singleTrackHeight + 8;
              return (
                <button
                  key="grid-2-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSequence?.("grid-2");
                  }}
                  className="add-sequence-btn absolute cursor-pointer transition-all duration-200 bg-green-600 hover:bg-green-700 text-white rounded-lg opacity-60 hover:opacity-100 focus:outline-none"
                  style={{
                    right: "8px",
                    top: topOffset + singleTrackHeight / 2 - 16,
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "auto",
                    zIndex: 1000,
                  }}
                  title="Add sequence to Grid 2"
                >
                  <Plus className="w-5 h-5" />
                </button>
              );
            })()}
          </>
        )}

        {/* Blur overlay area */}
        <div
          className="absolute top-0 left-0 right-0 bg-gray-850 border-b border-gray-700"
          style={{ height: blurAreaHeight }}
        />

        {/* Blur Overlays in the dedicated blur overlay area */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: blurAreaHeight, left: 4, right: 4 }}
        >
          {(() => {
            // Collect all blur regions from all videos with their video context
            const allBlurRegions: Array<{
              region: SelectiveBlurRegion;
              videoId: string;
              videoLeft: number;
              videoWidth: number;
            }> = [];

            videos.forEach((video) => {
              if (
                video.effects.selectiveBlur &&
                video.effects.selectiveBlur.length > 0
              ) {
                const { leftPercent, widthPercent } = getVideoPosition(video);
                video.effects.selectiveBlur.forEach((region) => {
                  allBlurRegions.push({
                    region,
                    videoId: video.id,
                    videoLeft: leftPercent,
                    videoWidth: widthPercent,
                  });
                });
              }
            });

            // Sort regions for consistent ordering (by video order, then by region creation order)
            allBlurRegions.sort((a, b) => {
              // First sort by video position in timeline
              if (a.videoLeft !== b.videoLeft) {
                return a.videoLeft - b.videoLeft;
              }
              // Then sort by region ID for consistent ordering within same video
              return a.region.id.localeCompare(b.region.id);
            });

            if (allBlurRegions.length === 0) return null;

            return (
              <BlurTimelineOverlay
                key={`all-blur-regions-${allBlurRegions.length}`}
                allRegions={allBlurRegions}
                onClick={(regionId, videoId) =>
                  onBlurRegionClick?.(videoId, regionId)
                }
                activeRegionId={editingBlur?.regionId}
                activeVideoId={editingBlur?.videoId}
                blurAreaHeight={blurAreaHeight}
              />
            );
          })()}
        </div>

        <div
          className="timeline-track absolute bg-gray-850/30 border border-gray-700/30 overflow-hidden"
          style={{
            top: timelineTrackTop,
            bottom: totalDuration > BASELINE_DURATION / zoomLevel ? 33 : 30, // Extra space for scrollbar when needed
            left: 4,
            right: 4,
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => {
              const position = (i / totalDuration) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-gray-700/30"
                  style={{ left: `${position}%` }}
                />
              );
            })}
          </div>

          {/* Video Segments with Integrated Frame Thumbnails */}
          {layout === "single" ? (
            // Single layout - scrollable track container
            <div 
              className="relative h-full overflow-hidden"
              style={{
                transform: `translateX(-${viewportStart * PIXELS_PER_SECOND}px)`,
                width: `${totalDuration * PIXELS_PER_SECOND}px`,
                minWidth: '100%'
              }}
            >
              {videos.map((video, index) => {
                const { leftPixels, widthPixels } = getVideoPosition(video);
                const isSelected = video.id === selectedVideoId;
                const frames = videoFrames.get(video.id) || [];

                const colors = [
                  "bg-pink-600",
                  "bg-rose-600",
                  "bg-pink-700",
                  "bg-rose-700",
                  "bg-pink-500",
                  "bg-rose-500",
                ];
                const colorClass = colors[index % colors.length];

                return (
                  <div
                    key={video.id}
                    className="absolute inset-y-0"
                    style={{
                      left: `${leftPixels}px`,
                      width: `${widthPixels}px`
                    }}
                  >
                    {renderVideoSegment(
                      video,
                      index,
                      0, // leftPercent now handled by absolute positioning
                      100, // widthPercent is 100% of the container
                      isSelected,
                      frames,
                      colorClass,
                      0,
                      0
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Side-by-side layout - separate track containers using flexbox
            <div className="flex flex-col h-full">
              {/* Grid 1 Track Container */}
              <div
                className="relative flex"
                style={{ 
                  height: "calc(50% - 2px)",
                  marginBottom: "2px" 
                }}
              >
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    transform: `translateX(-${viewportStart * PIXELS_PER_SECOND}px)`,
                    width: `${totalDuration * PIXELS_PER_SECOND}px`,
                    minWidth: '100%'
                  }}
                >
                  {videos
                    .filter((v) => v.gridId === "grid-1")
                    .map((video, index) => {
                      const { leftPixels, widthPixels } = getVideoPosition(video);
                      const isSelected = video.id === selectedVideoId;
                      const frames = videoFrames.get(video.id) || [];
                      const colorClass = "bg-blue-600";

                      return (
                        <div
                          key={video.id}
                          className="absolute inset-y-0"
                          style={{
                            left: `${leftPixels}px`,
                            width: `${widthPixels}px`
                          }}
                        >
                          {renderVideoSegment(
                            video,
                            index,
                            0,
                            100,
                            isSelected,
                            frames,
                            colorClass,
                            0,
                            0
                          )}
                        </div>
                      );
                    })}
                </div>
                {/* Track 1 Label */}
                <div className="absolute left-2 top-1 text-xs font-medium text-gray-500 bg-gray-800/80 px-2 py-1 rounded z-40">
                  Track 1
                </div>
              </div>

              {/* Track Separator */}
              <div className="h-1 border-t border-gray-600 mx-2" />

              {/* Grid 2 Track Container */}
              <div
                className="relative flex"
                style={{ 
                  height: "calc(50% - 2px)",
                  marginTop: "2px" 
                }}
              >
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    transform: `translateX(-${viewportStart * PIXELS_PER_SECOND}px)`,
                    width: `${totalDuration * PIXELS_PER_SECOND}px`,
                    minWidth: '100%'
                  }}
                >
                  {videos
                    .filter((v) => v.gridId === "grid-2")
                    .map((video, index) => {
                      const { leftPixels, widthPixels } = getVideoPosition(video);
                      const isSelected = video.id === selectedVideoId;
                      const frames = videoFrames.get(video.id) || [];
                      const colorClass = "bg-green-600";

                      return (
                        <div
                          key={video.id}
                          className="absolute inset-y-0"
                          style={{
                            left: `${leftPixels}px`,
                            width: `${widthPixels}px`
                          }}
                        >
                          {renderVideoSegment(
                            video,
                            index,
                            0,
                            100,
                            isSelected,
                            frames,
                            colorClass,
                            0,
                            0
                          )}
                        </div>
                      );
                    })}
                </div>
                {/* Track 2 Label */}
                <div className="absolute left-2 top-1 text-xs font-medium text-gray-500 bg-gray-800/80 px-2 py-1 rounded z-40">
                  Track 2
                </div>
              </div>
            </div>
          )}

          {totalDuration > 0 && (
            <div
              className="timeline-scrubber absolute w-0.5 bg-pink-500 z-50 pointer-events-none"
              style={{
                left: getCurrentPosition,
                top: 0,
                bottom: 0,
              }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-pink-500" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-mono">
                {formatTime(currentTime)}
                {showFrameView && (
                  <div className="text-pink-200 text-[10px] mt-0.5">
                    F{getCurrentFrameIndex() + 1}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hover Position Indicator */}
          {hoverPosition !== null && totalDuration > 0 && !isDragging && (
            <div
              className="absolute w-px bg-gray-500 z-40 pointer-events-none opacity-50"
              style={{
                left: `${hoverPosition}%`,
                top: 0,
                bottom: 0,
              }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded whitespace-nowrap font-mono">
                {formatTime(viewportStart + ((hoverPosition / 100) * (viewportEnd - viewportStart)))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Ruler */}
        <div className={`absolute left-0 right-0 h-6 bg-gray-850 border-t border-gray-700 z-50 ${
          totalDuration > BASELINE_DURATION / zoomLevel ? 'bottom-3' : 'bottom-0'
        }`}>
          {(() => {
            const visibleDuration = viewportEnd - viewportStart;
            
            // Fixed 10-second intervals for timeline ruler
            const interval = 10; // Always 10 seconds
            const startIndex = Math.floor(viewportStart / interval);
            const endIndex = Math.ceil(viewportEnd / interval);
            
            return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => {
              const index = startIndex + i;
              const time = index * interval;
              
              // Skip times outside viewport
              if (time < viewportStart || time > viewportEnd) return null;
              
              // Calculate position in pixels, then convert to percentage of visible area
              const timePixels = time * PIXELS_PER_SECOND;
              const viewportStartPixels = viewportStart * PIXELS_PER_SECOND;
              const visiblePixels = visibleDuration * PIXELS_PER_SECOND;
              const position = ((timePixels - viewportStartPixels) / visiblePixels) * 100;
              
              const isFirst = i === 0;
              const isLast = i === endIndex - startIndex;

              return (
                <div
                  key={index}
                  className="absolute z-50"
                  style={{ left: `${position}%`, top: 0, height: '100%' }}
                >
                  <div className="absolute top-0 w-px h-3 bg-gray-600 z-50" />
                  <div className={`absolute top-3 text-[11px] text-gray-300 font-mono bg-gray-850 px-1 border border-gray-700 rounded z-50 ${
                    isFirst ? 'left-0' : isLast ? 'right-0 -translate-x-full' : '-translate-x-1/2'
                  }`}>
                    {formatTime(time)}
                  </div>
                </div>
              );
            }).filter(Boolean);
          })()}
        </div>

        {/* Horizontal Scrollbar */}
        {totalDuration > BASELINE_DURATION / zoomLevel && (
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-900 border-t border-gray-600 z-60">
            <div 
              className="timeline-scrollbar relative w-full h-full cursor-pointer"
              onMouseDown={handleScrollbarMouseDown}
            >
              {/* Scrollbar Track */}
              <div className="absolute inset-0 bg-gray-800 hover:bg-gray-750 transition-colors duration-200" />
              
              {/* Scrollbar Thumb */}
              <div
                className="absolute top-0 h-full bg-pink-600 hover:bg-pink-500 transition-colors duration-200 cursor-grab active:cursor-grabbing rounded-sm"
                style={{
                  left: `${(viewportStart / totalDuration) * 100}%`,
                  width: `${((viewportEnd - viewportStart) / totalDuration) * 100}%`,
                }}
                onMouseDown={handleScrollbarThumbMouseDown}
              >
                {/* Thumb grip lines */}
                <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 flex items-center">
                  <div className="flex space-x-0.5">
                    <div className="w-px h-2 bg-white/40"></div>
                    <div className="w-px h-2 bg-white/40"></div>
                    <div className="w-px h-2 bg-white/40"></div>
                  </div>
                </div>
              
                {/* Current time indicator on scrollbar */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-yellow-400 pointer-events-none z-10"
                  style={{
                    left: `${(currentTime / totalDuration) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Video Info */}
      {selectedVideoId && videos.find((v) => v.id === selectedVideoId) && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-gray-200 text-sm">
                  {videos.find((v) => v.id === selectedVideoId)?.file.name}
                </h4>
                <p className="text-xs text-gray-400">
                  Duration:{" "}
                  {formatTime(
                    videos.find((v) => v.id === selectedVideoId)?.duration || 0
                  )}{" "}
                  • Start:{" "}
                  {formatTime(
                    videos.find((v) => v.id === selectedVideoId)?.startTime || 0
                  )}
                </p>
              </div>
            </div>
            <div className="text-xs text-pink-400 bg-pink-600/20 px-2 py-1 rounded">
              Selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
