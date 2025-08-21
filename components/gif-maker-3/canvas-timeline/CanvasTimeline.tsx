"use client";

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { useTheme } from "next-themes";

interface CanvasTimelineProps {
  clips: Clip[];
  textOverlays: TextOverlay[];
  blurOverlays: BlurOverlay[];
  totalDuration: number;
  timelineZoom?: number; // zoom factor (1 = normal)
  currentFrame: number;
  selectedClipId: string | null;
  selectedBlurOverlayId?: string | null;
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void;
  onTextOverlayUpdate: (
    overlayId: string,
    updates: Partial<TextOverlay>
  ) => void;
  onBlurOverlayUpdate: (
    overlayId: string,
    updates: Partial<BlurOverlay>
  ) => void;
  onSelectionChange: (itemId: string | null) => void;
  onTimelineClick: (time: number) => void;
  onSplitClip?: (
    clipId: string,
    splitTime: number,
    trimSide?: "left" | "right"
  ) => void;
}

interface TimelineItem {
  id: string;
  start: number;
  duration: number;
  type: "video" | "image" | "text" | "blur";
  row: number;
  color: string;
  label: string;
  src?: string; // Add src for thumbnail generation
}

interface DragState {
  isDragging: boolean;
  itemId: string | null;
  dragType: "move" | "trim-start" | "trim-end" | "playhead" | null;
  startX: number;
  startY: number; // Add Y coordinate for vertical movement
  startTime: number;
  startRow: number; // Add original row tracking
  originalDuration: number;
}

interface ThumbnailCache {
  [clipId: string]: {
    dataUrl: string;
    timestamp: number;
    width: number;
    height: number;
  };
}

const TRACK_HEIGHT = 60;
const TRACK_MARGIN = 2;
const RULER_HEIGHT = 32;
const TRACK_LABEL_WIDTH = 100;
const PIXEL_RATIO =
  typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
const THUMBNAIL_CACHE_EXPIRY = 30000; // Cache for 30 seconds to reduce regeneration
// Debug flags to silence excessive logging in production
const DEBUG_THUMBS = false;
const DEBUG_VIDEO_EVENTS = false;

// Minimum interval between regenerations while scrubbing (ms)
const MIN_REGEN_INTERVAL_MS = 3000;
// Whether to periodically follow the playhead and update thumbnails.
// Disabled to avoid unexpected drift after a few seconds.
const FOLLOW_PLAYHEAD_THUMBS = false;
// Live scrub thumbnail throttle (ms)
const LIVE_SCRUB_THROTTLE_MS = 200;

const CanvasTimelineComponent: React.FC<CanvasTimelineProps> = ({
  clips,
  textOverlays,
  blurOverlays,
  totalDuration,
  timelineZoom = 1,
  currentFrame,
  selectedClipId,
  selectedBlurOverlayId,
  onClipUpdate,
  onTextOverlayUpdate,
  onBlurOverlayUpdate,
  onSelectionChange,
  onTimelineClick,
  onSplitClip,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Theme-aware color system
  const getThemeColors = () => ({
    background: {
      primary: isDarkMode ? "#1E293B" : "#F8FAFC",
      secondary: isDarkMode ? "#0F172A" : "#F1F5F9",
    },
    track: {
      background: isDarkMode ? "#1A202C" : "#FFFFFF",
      alternateBackground: isDarkMode ? "#171923" : "#F9FAFB",
      separator: isDarkMode ? "#374151" : "#E5E7EB",
      highlight: isDarkMode ? "#1F2937" : "#F3F4F6",
    },
    labels: {
      background: isDarkMode ? "#374151" : "#E5E7EB",
      backgroundGradient: isDarkMode ? "#475569" : "#D1D5DB",
      text: isDarkMode ? "#F1F5F9" : "#374151",
      border: isDarkMode ? "#6B7280" : "#9CA3AF",
    },
    ruler: {
      background: isDarkMode ? "#475569" : "#E5E7EB",
      backgroundGradient: isDarkMode ? "#374151" : "#D1D5DB",
      majorTick: isDarkMode ? "#E2E8F0" : "#6B7280",
      minorTick: isDarkMode ? "#CBD5E1" : "#9CA3AF",
      text: isDarkMode ? "#F1F5F9" : "#374151",
      border: isDarkMode ? "#6B7280" : "#9CA3AF",
    },
    items: {
      border: isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)",
      selection: isDarkMode
        ? "rgba(255,255,255,0.95)"
        : "rgba(59, 130, 246, 0.8)",
      selectionGlow: isDarkMode
        ? "rgba(255,255,255,0.6)"
        : "rgba(59, 130, 246, 0.4)",
      text: isDarkMode ? "#FFFFFF" : "#374151",
    },
    filmstrip: {
      background: isDarkMode ? "#1f2937" : "#E5E7EB",
      cellEven: isDarkMode ? "#0b1220" : "#F3F4F6",
      cellOdd: isDarkMode ? "#111827" : "#FFFFFF",
    },
  });

  const colors = getThemeColors();
  // Layered canvases: base for tracks/items, overlay for playhead/interaction
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 200 });
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({});
  const [loadedThumbnails, setLoadedThumbnails] = useState<{
    [key: string]: HTMLImageElement;
  }>({});
  // Track previous clips to detect trims and invalidate thumbnails
  const prevClipsRef = useRef<Clip[] | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    itemId: null,
    dragType: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    startRow: 0,
    originalDuration: 0,
  });
  // Mouse hover state for professional trim handle feedback (using ref to avoid re-renders)
  const hoverStateRef = useRef<{
    itemId: string | null;
    dragType: "move" | "trim-start" | "trim-end" | null;
  }>({
    itemId: null,
    dragType: null,
  });
  
  // Selection state refs to avoid re-renders
  const selectedClipIdRef = useRef<string | null>(null);
  const selectedBlurOverlayIdRef = useRef<string | null>(null);
  
  // Update refs when props change
  useEffect(() => {
    selectedClipIdRef.current = selectedClipId;
    selectedBlurOverlayIdRef.current = selectedBlurOverlayId || null;
    // Redraw overlay when selection changes
    requestAnimationFrame(() => drawOverlay());
  }, [selectedClipId, selectedBlurOverlayId]);

  // Visual feedback state for drag operations (optimized to prevent re-renders)
  const dragPreviewRef = useRef<{
    visible: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    newRow: number;
    currentDraggedItem: TimelineItem | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    newRow: 0,
    currentDraggedItem: null,
  });

  // Minimal state for drag preview to trigger re-renders only when necessary
  const [dragPreviewVisible, setDragPreviewVisible] = useState(false);

  // Flag to prevent multiple simultaneous thumbnail generations
  const isGeneratingThumbnail = useRef(false);
  // Track in-flight thumbnail generations per clip to avoid duplicates
  const inFlightClipIdsRef = useRef<Set<string>>(new Set());
  const lastLiveScrubUpdateMsRef = useRef<number>(0);

  // Throttle overlay redraws during drag for better performance
  const overlayRedrawTimeoutRef = useRef<number | null>(null);

  // Helper function to determine if an item is selected (using refs)
  const isItemSelected = (item: TimelineItem): boolean => {
    // Blur overlays use selectedBlurOverlayId
    if (item.type === "blur") {
      return selectedBlurOverlayIdRef.current === item.id;
    }
    // Text overlays, image clips, and video clips all use selectedClipId
    return selectedClipIdRef.current === item.id;
  };

  // Convert clips and text overlays to timeline items
  const timelineItems: TimelineItem[] = [
    ...clips.map((clip) => {
      // Use fileName if available, otherwise extract from src or use fallback
      let displayName = "Untitled";

      if (clip.fileName) {
        // Use stored filename, remove extension for cleaner display
        displayName = clip.fileName.replace(/\.[^/.]+$/, "");
      } else if (clip.src) {
        try {
          // Handle both blob URLs and regular URLs
          const url = new URL(clip.src);
          if (url.protocol === "blob:") {
            // For blob URLs, use generic names based on type and ID
            displayName = clip.id.includes("uploaded")
              ? clip.type === "image"
                ? "Uploaded Image"
                : "Uploaded Video"
              : clip.id.includes("vault")
                ? "Vault Media"
                : clip.type === "image"
                  ? "Image"
                  : "Video";
          } else {
            // For regular URLs, extract filename from pathname
            const pathname = url.pathname;
            const filename = pathname.split("/").pop();
            if (filename) {
              displayName = filename.replace(/\.[^/.]+$/, "");
            }
          }
        } catch (e) {
          // If URL parsing fails, use a fallback
          displayName = clip.src;
        }
      }

      return {
        id: clip.id,
        start: clip.start,
        duration: clip.duration,
        type: clip.type, // Use the actual clip type instead of guessing
        row: clip.row, // Use the clip's assigned row
        color: clip.type === "image" ? "#F59E0B" : "#3B82F6", // amber for images, blue for videos
        label: displayName,
        src: clip.src, // Include src for thumbnail generation
      };
    }),
    ...textOverlays.map((overlay) => ({
      id: overlay.id,
      start: overlay.start,
      duration: overlay.duration,
      type: "text" as const,
      row: overlay.row,
      color: "#10B981", // emerald-500
      label:
        overlay.text.substring(0, 20) + (overlay.text.length > 20 ? "…" : ""),
    })),
    ...blurOverlays.map((overlay) => {
      // Always display a readable name and a blur-like color in the timeline
      return {
        id: overlay.id,
        start: overlay.start,
        duration: overlay.duration,
        type: "blur" as const,
        row: overlay.row,
        color: "#38BDF8", // sky-400 like 'blur' tone
        label: "Blur",
      };
    }),
  ];

  // Calculate the maximum row number for dynamic canvas height
  const maxRow =
    timelineItems.length > 0
      ? Math.max(...timelineItems.map((item) => item.row))
      : 1;
  const numRows = Math.max(2, maxRow + 1); // Ensure at least 2 rows for compatibility

  // Generate thumbnail using enhanced video element approach with Remotion metadata
  const generateThumbnail = useCallback(
    async (clip: Clip, currentTime?: number): Promise<string | null> => {
      if (!clip.src) return null;

      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";

        const generateFilmstrip = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(null);
              return;
            }

            // Filmstrip dimensions - wider to accommodate multiple frames
            const filmstripWidth = 400;
            const filmstripHeight = 80;
            canvas.width = filmstripWidth;
            canvas.height = filmstripHeight;

            // Enable high-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Determine number of frames using ~0.5s cadence across the clip segment
            const FPS = 30;
            const speed = Math.max(
              0.25,
              Math.min(4, Number((clip as any).speed || 1))
            );
            const sourceStartSec = (clip.startFrom || 0) / FPS;
            // When sped up (>1), we traverse source faster; when slowed (<1), slower
            const clipDurationSec = Math.max(
              0.001,
              ((clip.duration || 0) / FPS) * (speed || 1)
            );
            const segmentStart = Math.max(
              0,
              Math.min(sourceStartSec, Math.max(0.001, video.duration - 0.1))
            );
            const segmentEnd = Math.min(
              segmentStart + clipDurationSec,
              Math.max(0.001, video.duration - 0.1)
            );
            const segmentSpan = Math.max(0.001, segmentEnd - segmentStart);
            const PREFERRED_STEP = 0.5; // seconds per frame
            const MAX_FRAMES = 40;
            let preferredCount = Math.floor(segmentSpan / PREFERRED_STEP) + 1;
            if (preferredCount < 2) preferredCount = 2;
            const numFrames = Math.min(MAX_FRAMES, preferredCount);
            const stepSec = segmentSpan / Math.max(1, numFrames - 1);
            const frameWidth = filmstripWidth / numFrames;

            // Calculate video aspect ratio for each frame
            const videoAspectRatio = video.videoWidth / video.videoHeight;
            const frameAspectRatio = frameWidth / filmstripHeight;

            let drawWidth = frameWidth;
            let drawHeight = filmstripHeight;
            let offsetX = 0;
            let offsetY = 0;

            // Maintain aspect ratio within each frame
            if (videoAspectRatio > frameAspectRatio) {
              drawHeight = frameWidth / videoAspectRatio;
              offsetY = (filmstripHeight - drawHeight) / 2;
            } else {
              drawWidth = filmstripHeight * videoAspectRatio;
              offsetX = (frameWidth - drawWidth) / 2;
            }

            // Clean background per frame cell to avoid smearing
            ctx.fillStyle = "#1a1a1a";
            ctx.fillRect(0, 0, filmstripWidth, filmstripHeight);

            let currentFrameIndex = 0;
            let capturedFrames = 0;

            const captureFrame = async (frameIndex: number) => {
              return new Promise<void>((frameResolve) => {
                // Calculate time for this frame
                // Sample evenly from segmentStart using the computed step (independent of playhead)
                let seekTime = segmentStart + stepSec * frameIndex;
                seekTime = Math.max(
                  0,
                  Math.min(seekTime, Math.max(0.001, video.duration - 0.1))
                );

                const onFrameSeeked = () => {
                  try {
                    // Wait for frame to stabilize
                    setTimeout(() => {
                      const frameX = frameIndex * frameWidth;

                      // Clear cell then draw this frame in its position
                      ctx.fillStyle = "#1a1a1a";
                      ctx.fillRect(frameX, 0, frameWidth, filmstripHeight);
                      ctx.drawImage(
                        video,
                        frameX + offsetX,
                        offsetY,
                        drawWidth,
                        drawHeight
                      );
                      if (DEBUG_THUMBS) {
                        console.log(
                          `Captured frame ${frameIndex + 1}/${numFrames} at time ${seekTime.toFixed(2)}s`
                        );
                      }

                      capturedFrames++;
                      frameResolve();
                    }, 150); // Longer wait for better frame stability
                  } catch (error) {
                    console.error(
                      `Error capturing frame ${frameIndex}:`,
                      error
                    );
                    frameResolve();
                  }
                };

                video.addEventListener("seeked", onFrameSeeked, { once: true });
                video.currentTime = Math.min(seekTime, video.duration - 0.1);
              });
            };

            const captureAllFrames = async () => {
              try {
                // Capture frames sequentially
                for (let i = 0; i < numFrames; i++) {
                  await captureFrame(i);
                  // Small delay between frames for better reliability
                  await new Promise((resolve) => setTimeout(resolve, 50));
                }

                if (DEBUG_THUMBS) {
                  console.log(
                    `Filmstrip complete: ${capturedFrames}/${numFrames} frames captured`
                  );
                }

                // Add filmstrip border effect
                ctx.strokeStyle = "#333";
                ctx.lineWidth = 1;
                for (let i = 0; i <= numFrames; i++) {
                  const x = i * frameWidth;
                  ctx.beginPath();
                  ctx.moveTo(x, 0);
                  ctx.lineTo(x, filmstripHeight);
                  ctx.stroke();
                }

                const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

                // Clean up
                video.remove();
                canvas.remove();

                resolve(dataUrl);
              } catch (error) {
                console.error("Error in filmstrip generation:", error);
                resolve(null);
              }
            };

            // Start capturing frames
            captureAllFrames();
          } catch (error) {
            console.error("Error setting up filmstrip generation:", error);
            resolve(null);
          }
        };

        video.onloadedmetadata = () => {
          if (DEBUG_VIDEO_EVENTS) {
            console.log(
              `Video metadata loaded: ${video.videoWidth}x${video.videoHeight}, duration: ${video.duration.toFixed(2)}s`
            );
          }

          if (video.videoWidth && video.videoHeight && video.duration > 0) {
            // Wait a bit more for video to be fully ready
            setTimeout(() => {
              generateFilmstrip();
            }, 100);
          } else {
            if (DEBUG_VIDEO_EVENTS) {
              console.error("Invalid video metadata", {
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration,
              });
            }
            resolve(null);
          }
        };

        video.onloadeddata = () => {
          if (DEBUG_VIDEO_EVENTS) {
            console.log("Video data loaded and ready");
          }
        };

        video.onerror = (e) => {
          if (DEBUG_VIDEO_EVENTS) {
            console.error("Video loading error:", e);
          }
          video.remove();
          resolve(null);
        };

        video.oncanplay = () => {
          if (DEBUG_VIDEO_EVENTS) {
            console.log("Video can start playing");
          }
        };

        // Set source and load
        if (DEBUG_VIDEO_EVENTS || DEBUG_THUMBS) {
          console.log(
            "Loading video source:",
            clip.src.substring(0, 50) + "..."
          );
        }
        video.src = clip.src;
        video.load();
      });
    },
    []
  );

  // Fallback thumbnail generation using video element
  const generateBasicThumbnail = useCallback(
    async (clip: Clip, currentTime?: number): Promise<string | null> => {
      if (!clip.src) return null;

      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(null);
              return;
            }

            // Basic thumbnail generation
            const thumbWidth = 320;
            const thumbHeight = 80;
            canvas.width = thumbWidth;
            canvas.height = thumbHeight;

            // Draw video frame
            const seekTime = currentTime || video.duration * 0.25;
            video.currentTime = Math.min(seekTime, video.duration - 0.1);

            video.onseeked = () => {
              try {
                // Maintain aspect ratio and letterbox to avoid stretching
                const vRatio = video.videoWidth / video.videoHeight;
                const cRatio = thumbWidth / thumbHeight;
                let dw = thumbWidth;
                let dh = thumbHeight;
                let dx = 0;
                let dy = 0;
                if (vRatio > cRatio) {
                  // video is wider: fit width, pillarbox
                  dh = Math.round(thumbWidth / vRatio);
                  dy = Math.round((thumbHeight - dh) / 2);
                } else {
                  // video is taller: fit height, letterbox
                  dw = Math.round(thumbHeight * vRatio);
                  dx = Math.round((thumbWidth - dw) / 2);
                }
                ctx.fillStyle = "#1a1a1a";
                ctx.fillRect(0, 0, thumbWidth, thumbHeight);
                ctx.drawImage(video, dx, dy, dw, dh);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

                // Clean up
                video.remove();
                canvas.remove();

                resolve(dataUrl);
              } catch (error) {
                console.error("Error in fallback thumbnail:", error);
                resolve(null);
              }
            };
          } catch (error) {
            console.error("Error setting up fallback thumbnail:", error);
            resolve(null);
          }
        };

        video.onerror = () => {
          video.remove();
          resolve(null);
        };

        video.src = clip.src;
        video.load();
      });
    },
    []
  );

  // Compute the source video time (in seconds) for a given clip at the global currentFrame
  const computeClipSourceTimeSec = useCallback(
    (clip: Clip, frame: number): number => {
      const fps = 30;
      const localFrame = Math.max(0, frame - clip.start);
      const sourceOffsetFrames = clip.startFrom || 0; // frames trimmed from start
      const sourceFrame = sourceOffsetFrames + localFrame;
      return sourceFrame / fps;
    },
    []
  );

  // Generate thumbnails for all media clips (video + image)
  const generateAllThumbnails = useCallback(async () => {
    const mediaClips = clips.filter(
      (clip) => clip.type === "video" || clip.type === "image"
    );

    for (const clip of mediaClips) {
      const existing = thumbnailCache[clip.id];

      // Skip if we have a fresh thumbnail
      if (
        existing &&
        Date.now() - existing.timestamp < THUMBNAIL_CACHE_EXPIRY
      ) {
        continue;
      }

      // Avoid duplicate generation for the same clip
      if (inFlightClipIdsRef.current.has(clip.id)) {
        continue;
      }

      inFlightClipIdsRef.current.add(clip.id);

      if (DEBUG_THUMBS) {
        console.log(
          "Generating thumbnail for clip:",
          clip.id,
          "at time:",
          currentFrame / 30
        );
      }

      // For initial generation, sample across the clip's visible duration (no playhead bias)
      const thumbnail = await generateThumbnail(clip);
      if (thumbnail) {
        if (DEBUG_THUMBS) {
          console.log("Thumbnail generated successfully for clip:", clip.id);
        }
        setThumbnailCache((prev) => ({
          ...prev,
          [clip.id]: {
            dataUrl: thumbnail,
            timestamp: Date.now(),
            width: 400,
            height: 80,
          },
        }));

        // Preload image if not already loaded
        if (!loadedThumbnails[clip.id]) {
          const img = new Image();
          img.onload = () => {
            setLoadedThumbnails((prev) => ({
              ...prev,
              [clip.id]: img,
            }));
          };
          img.src = thumbnail;
        }
      } else if (DEBUG_THUMBS) {
        console.log("Failed to generate thumbnail for clip:", clip.id);
      }

      inFlightClipIdsRef.current.delete(clip.id);
    }
  }, [clips]); // Only when clip list changes

  // Regenerate thumbnails when playhead moves significantly
  const regenerateThumbnailsForPlayhead = useCallback(async () => {
    if (!FOLLOW_PLAYHEAD_THUMBS) return; // keep initial filmstrip stable
    // Skip regeneration while dragging (especially playhead) for responsiveness
    if (dragState.isDragging) {
      return;
    }
    // Prevent multiple simultaneous thumbnail generations
    if (isGeneratingThumbnail.current) {
      console.log("Skipping thumbnail regeneration - already in progress");
      return;
    }

    isGeneratingThumbnail.current = true;

    try {
      const videoClips = clips.filter((clip) => clip.type === "video");
      const currentTimeSec = currentFrame / 30; // Convert frames to seconds

      for (const clip of videoClips) {
        // Only regenerate if the clip is currently visible
        const clipStart = clip.start / 30;
        const clipEnd = (clip.start + clip.duration) / 30;

        if (currentTimeSec >= clipStart && currentTimeSec <= clipEnd) {
          // Check if we already have a recent thumbnail for this clip
          const existingThumbnail = thumbnailCache[clip.id];
          if (existingThumbnail) {
            // Use time since last generation instead of comparing seconds to ms
            const msSinceLast = Date.now() - existingThumbnail.timestamp;
            if (
              msSinceLast < MIN_REGEN_INTERVAL_MS &&
              existingThumbnail.dataUrl
            ) {
              if (DEBUG_THUMBS) {
                console.log(
                  `Skipping thumbnail regeneration for ${clip.id} - generated ${msSinceLast}ms ago`
                );
              }
              continue;
            }
          }

          // Avoid duplicate generation per clip
          if (inFlightClipIdsRef.current.has(clip.id)) {
            continue;
          }
          inFlightClipIdsRef.current.add(clip.id);

          if (DEBUG_THUMBS) {
            console.log(
              `Regenerating thumbnail for ${clip.id} at time ${currentTimeSec}`
            );
          }
          // During playhead-based regeneration, keep filmstrip centered around current playhead time
          const thumbnail = await generateThumbnail(clip, currentTimeSec);
          if (thumbnail) {
            setThumbnailCache((prev) => ({
              ...prev,
              [clip.id]: {
                dataUrl: thumbnail,
                // Store a high timestamp to mark as fresh in ms to avoid quick overwrite
                timestamp: Date.now(),
                width: 400,
                height: 80,
              },
            }));

            // Preload the new thumbnail
            const img = new Image();
            img.onload = () => {
              setLoadedThumbnails((prev) => ({
                ...prev,
                [clip.id]: img,
              }));
            };
            img.src = thumbnail;
          }

          inFlightClipIdsRef.current.delete(clip.id);
        }
      }
    } finally {
      isGeneratingThumbnail.current = false;
    }
  }, [
    clips,
    currentFrame,
    generateThumbnail,
    thumbnailCache,
    dragState.isDragging,
  ]);

  // Generate thumbnails when clips change
  useEffect(() => {
    // Invalidate thumbnails for clips whose timing or startFrom changed
    if (prevClipsRef.current) {
      const prevMap = new Map(prevClipsRef.current.map((c) => [c.id, c]));
      const changedIds: string[] = [];
      for (const c of clips) {
        const prev = prevMap.get(c.id);
        if (!prev) continue;
        if (
          prev.start !== c.start ||
          prev.duration !== c.duration ||
          (prev.startFrom || 0) !== (c.startFrom || 0)
        ) {
          changedIds.push(c.id);
        }
      }
      if (changedIds.length) {
        setThumbnailCache((prev) => {
          const next = { ...prev };
          changedIds.forEach((id) => {
            delete next[id];
          });
          return next;
        });
        setLoadedThumbnails((prev) => {
          const next = { ...prev };
          changedIds.forEach((id) => {
            delete next[id];
          });
          return next;
        });
      }
    }
    prevClipsRef.current = clips;
    generateAllThumbnails();
  }, [clips]); // Only depend on clips, not the function itself

  // Regenerate thumbnails when playhead moves (debounced with longer delay)
  useEffect(() => {
    if (!FOLLOW_PLAYHEAD_THUMBS) return; // disabled: prevent drift
    if (dragState.isDragging) return; // don't schedule while dragging
    const timeoutId = setTimeout(() => {
      regenerateThumbnailsForPlayhead();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [currentFrame, dragState.isDragging, regenerateThumbnailsForPlayhead]);

  // Live thumbnail update while scrubbing intentionally disabled to keep thumbnails independent of playhead
  // (Re-enable by restoring the effect if desired.)

  // Helper function to draw filmstrip fallback
  const drawFilmstripFallback = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Fallback to filmstrip if thumbnail not available
    ctx.fillStyle = colors.filmstrip.background;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();

    // Draw subtle filmstrip overlay
    const stripH = height - 8;
    const stripY = y + 4;
    const cells = Math.max(8, Math.floor(width / 16));
    const cellW = (width - 8) / cells;
    for (let i = 0; i < cells; i++) {
      const cx = x + 4 + i * cellW;
      ctx.fillStyle =
        i % 2 === 0 ? colors.filmstrip.cellEven : colors.filmstrip.cellOdd;
      ctx.fillRect(cx, stripY, cellW - 2, stripH);
    }
    // top and bottom shine
    const grad = ctx.createLinearGradient(0, stripY, 0, stripY + stripH);
    const shineIntensity = isDarkMode ? 0.06 : 0.15;
    const shineFade = isDarkMode ? 0.02 : 0.05;
    grad.addColorStop(
      0,
      `rgba(${isDarkMode ? "255,255,255" : "0,0,0"},${shineIntensity})`
    );
    grad.addColorStop(
      1,
      `rgba(${isDarkMode ? "255,255,255" : "0,0,0"},${shineFade})`
    );
    ctx.fillStyle = grad;
    ctx.fillRect(x + 4, stripY, width - 8, stripH);
  };

  // Resize canvases when container size changes
  useEffect(() => {
    const resizeCanvas = () => {
      if (
        !containerRef.current ||
        !baseCanvasRef.current ||
        !overlayCanvasRef.current
      )
        return;

      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const dynamicNumRows = getExpandedNumRows();
      const height = RULER_HEIGHT + dynamicNumRows * (TRACK_HEIGHT + TRACK_MARGIN);

      setCanvasSize({ width, height });

      const setup = (canvas: HTMLCanvasElement) => {
        canvas.width = width * PIXEL_RATIO;
        canvas.height = height * PIXEL_RATIO;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
      };

      setup(baseCanvasRef.current);
      setup(overlayCanvasRef.current);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [numRows]); // Only recalculate when number of rows changes

  // Time to pixel conversion
  const timeToPixel = (time: number): number => {
    const timelineWidth = canvasSize.width - TRACK_LABEL_WIDTH;
    const effectiveTotal = Math.max(
      1,
      totalDuration / Math.max(0.1, timelineZoom)
    );
    return TRACK_LABEL_WIDTH + (time / effectiveTotal) * timelineWidth;
  };

  // Pixel to time conversion
  const pixelToTime = (pixel: number): number => {
    const timelineWidth = canvasSize.width - TRACK_LABEL_WIDTH;
    const relativePixel = pixel - TRACK_LABEL_WIDTH;
    const effectiveTotal = Math.max(
      1,
      totalDuration / Math.max(0.1, timelineZoom)
    );
    return Math.max(0, (relativePixel / timelineWidth) * effectiveTotal);
  };

  // Get track Y position
  const getTrackY = (row: number): number => {
    return RULER_HEIGHT + row * (TRACK_HEIGHT + TRACK_MARGIN);
  };

  // Get row from Y position (with dynamic layer creation support)
  const getRowFromY = (y: number): number => {
    const adjustedY = y - RULER_HEIGHT;
    const row = Math.floor(adjustedY / (TRACK_HEIGHT + TRACK_MARGIN));
    // Allow negative rows (new layer above) and rows beyond current range (new layer below)
    return Math.max(-1, row); // Allow -1 for creating layer above, unlimited for layers below
  };

  // Calculate expanded row count including potential new layers during drag
  const getExpandedNumRows = (): number => {
    let maxDisplayRow = maxRow;
    
    // If dragging, check if we need to show additional rows
    if (dragState.isDragging && dragPreviewRef.current.visible) {
      maxDisplayRow = Math.max(maxDisplayRow, dragPreviewRef.current.newRow);
    }
    
    // Show minimal empty layers - only 1 empty layer at bottom normally
    // Add extra drop zones only during drag operations
    if (dragState.isDragging) {
      // During drag: show current max + 3 extra rows for drop zones
      return Math.max(3, maxDisplayRow + 4);
    } else {
      // Normal state: show only 1 empty layer at bottom
      // Minimum 3 rows for usability, but only 1 empty layer beyond actual content
      return Math.max(3, maxDisplayRow + 2);
    }
  };

  // Helper function to sort timeline items by layering order (lower rows = higher z-index)
  const sortItemsByLayer = (items: TimelineItem[]): TimelineItem[] => {
    return [...items].sort((a, b) => {
      // Lower row numbers should render last (on top)
      if (a.row !== b.row) {
        return b.row - a.row; // Reverse order: higher rows first, lower rows last
      }
      // If same row, maintain original order by start time
      return a.start - b.start;
    });
  };

  // Draw the timeline (base layer)
  const drawBase = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    bgGradient.addColorStop(0, colors.background.primary);
    bgGradient.addColorStop(1, colors.background.secondary);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw track labels with modern styling
    const labelGradient = ctx.createLinearGradient(0, 0, TRACK_LABEL_WIDTH, 0);
    labelGradient.addColorStop(0, colors.labels.background);
    labelGradient.addColorStop(1, colors.labels.backgroundGradient);
    ctx.fillStyle = labelGradient;
    ctx.fillRect(0, 0, TRACK_LABEL_WIDTH, canvasSize.height);

    // Add subtle border to track labels
    ctx.strokeStyle = colors.labels.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TRACK_LABEL_WIDTH - 0.5, 0);
    ctx.lineTo(TRACK_LABEL_WIDTH - 0.5, canvasSize.height);
    ctx.stroke();

    // Draw track label text with better typography
    ctx.fillStyle = colors.labels.text;
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";

    // Use static numRows instead of dynamic expansion to prevent scale changes during drag
    const dynamicNumRows = numRows;
    for (let row = 0; row < dynamicNumRows; row++) {
      const itemsInRow = timelineItems.filter((item) => item.row === row);
      let label = `Track ${row + 1}`;

      if (itemsInRow.length > 0) {
        // Use the most common item type in this row
        const types = itemsInRow.map((item) => item.type);
        const typeCounts = types.reduce(
          (acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const mostCommonType = Object.entries(typeCounts).reduce((a, b) =>
          typeCounts[a[0]] > typeCounts[b[0]] ? a : b
        )[0];

        switch (mostCommonType) {
          case "video":
            label = "VIDEO";
            break;
          case "image":
            label = "IMAGE";
            break;
          case "text":
            label = "TEXT";
            break;
          case "blur":
            label = "BLUR";
            break;
          default:
            label = `Track ${row + 1}`;
        }
      }

      ctx.fillText(
        label,
        TRACK_LABEL_WIDTH / 2,
        getTrackY(row) + TRACK_HEIGHT / 2 + 4
      );
    }

    // Draw track separators with enhanced styling
    for (let i = 0; i <= dynamicNumRows; i++) {
      const y = getTrackY(i) - TRACK_MARGIN / 2;

      // Create gradient line for separator
      const separatorGradient = ctx.createLinearGradient(
        0,
        y,
        canvasSize.width,
        y
      );
      separatorGradient.addColorStop(0, colors.track.highlight);
      separatorGradient.addColorStop(0.2, colors.track.separator);
      separatorGradient.addColorStop(0.8, colors.track.separator);
      separatorGradient.addColorStop(1, colors.track.highlight);

      ctx.strokeStyle = separatorGradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();

      // Add subtle highlight line above separator
      if (i > 0) {
        const highlightOpacity = isDarkMode ? 0.1 : 0.2;
        ctx.strokeStyle = `rgba(${isDarkMode ? "148, 163, 184" : "107, 114, 128"}, ${highlightOpacity})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y - 1);
        ctx.lineTo(canvasSize.width, y - 1);
        ctx.stroke();
      }
    }

    // Draw ruler with gradient background
    const timelineWidth = canvasSize.width - TRACK_LABEL_WIDTH;
    const effectiveTotal = Math.max(
      1,
      totalDuration / Math.max(0.1, timelineZoom)
    );
    const secondWidth = timelineWidth / (effectiveTotal / 30); // 30 fps

    const rulerGradient = ctx.createLinearGradient(0, 0, 0, RULER_HEIGHT);
    rulerGradient.addColorStop(0, colors.ruler.background);
    rulerGradient.addColorStop(1, colors.ruler.backgroundGradient);
    ctx.fillStyle = rulerGradient;
    ctx.fillRect(TRACK_LABEL_WIDTH, 0, timelineWidth, RULER_HEIGHT);

    // Add subtle border to ruler
    ctx.strokeStyle = colors.ruler.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TRACK_LABEL_WIDTH, RULER_HEIGHT - 0.5);
    ctx.lineTo(canvasSize.width, RULER_HEIGHT - 0.5);
    ctx.stroke();

    // Draw track background areas with subtle patterns
    for (let track = 0; track < dynamicNumRows; track++) {
      const trackY = getTrackY(track);
      const trackBgGradient = ctx.createLinearGradient(
        TRACK_LABEL_WIDTH,
        trackY,
        TRACK_LABEL_WIDTH,
        trackY + TRACK_HEIGHT
      );

      // Alternate between slightly different tones for visual distinction
      if (track % 2 === 0) {
        // Even tracks
        trackBgGradient.addColorStop(0, colors.track.background);
        trackBgGradient.addColorStop(0.5, colors.track.highlight);
        trackBgGradient.addColorStop(1, colors.track.alternateBackground);
      } else {
        // Odd tracks
        trackBgGradient.addColorStop(0, colors.track.alternateBackground);
        trackBgGradient.addColorStop(0.5, colors.track.highlight);
        trackBgGradient.addColorStop(1, colors.track.background);
      }

      ctx.fillStyle = trackBgGradient;
      ctx.fillRect(TRACK_LABEL_WIDTH, trackY, timelineWidth, TRACK_HEIGHT);

      // Add subtle inner shadow effect
      const shadowGradient = ctx.createLinearGradient(
        TRACK_LABEL_WIDTH,
        trackY,
        TRACK_LABEL_WIDTH,
        trackY + 8
      );
      shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
      shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shadowGradient;
      ctx.fillRect(TRACK_LABEL_WIDTH, trackY, timelineWidth, 8);
    }

    // Draw time markers with enhanced styling
    ctx.font = "bold 10px system-ui, -apple-system, monospace";
    ctx.textAlign = "left";

    for (
      let second = 0;
      second <= Math.ceil(totalDuration / Math.max(0.1, timelineZoom) / 30);
      second++
    ) {
      const x = timeToPixel(second * 30);
      if (x > TRACK_LABEL_WIDTH) {
        const isMajor = second % 5 === 0 || second === 0;

        // Create gradient for tick marks
        const tickGradient = ctx.createLinearGradient(x, 0, x, RULER_HEIGHT);
        if (isMajor) {
          tickGradient.addColorStop(0, colors.ruler.majorTick);
          tickGradient.addColorStop(1, colors.ruler.minorTick);
          ctx.strokeStyle = tickGradient;
          ctx.lineWidth = 2;
        } else {
          tickGradient.addColorStop(0, colors.ruler.minorTick);
          tickGradient.addColorStop(1, colors.ruler.majorTick);
          ctx.strokeStyle = tickGradient;
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, isMajor ? RULER_HEIGHT - 6 : RULER_HEIGHT - 12);
        ctx.stroke();

        // Time labels with text shadow for better readability
        if (isMajor) {
          // Shadow
          const shadowColor = isDarkMode
            ? "rgba(0, 0, 0, 0.5)"
            : "rgba(255, 255, 255, 0.8)";
          ctx.fillStyle = shadowColor;
          ctx.fillText(`${second}s`, x + 5, RULER_HEIGHT - 7);
          // Main text
          ctx.fillStyle = colors.ruler.text;
          ctx.fillText(`${second}s`, x + 4, RULER_HEIGHT - 8);
        }
      }
    }

    // Draw timeline items with modern styling - sorted for proper layering
    const sortedItems = sortItemsByLayer(timelineItems);
    sortedItems.forEach((item) => {
      const x = timeToPixel(item.start);
      // Use effectiveTotal to keep widths in sync with playhead scale
      const width = Math.max(
        4,
        (item.duration / effectiveTotal) * timelineWidth
      );
      const y = getTrackY(item.row) + TRACK_MARGIN;
      const height = TRACK_HEIGHT - TRACK_MARGIN * 2;

      // Clean item drawing
      ctx.save(); // Save context state

      // Draw main item rectangle with thumbnail for videos
      if (item.type === "video") {
        const preloadedImg = loadedThumbnails[item.id];
        // Removed console.log for performance

        if (preloadedImg) {
          // Draw preloaded thumbnail synchronously
          try {
            ctx.drawImage(preloadedImg, x, y, width, height);
            // Removed console.log for performance
          } catch (error) {
            console.error("Error drawing preloaded thumbnail:", error);
            drawFilmstripFallback(ctx, x, y, width, height);
          }
        } else {
          // Fallback to filmstrip if thumbnail not loaded yet
          // Removed console.log for performance
          drawFilmstripFallback(ctx, x, y, width, height);
        }
      } else if (item.type === "image") {
        // Draw thumbnail for images as well (single-frame capture)
        const preloadedImg = loadedThumbnails[item.id];
        if (preloadedImg) {
          try {
            ctx.drawImage(preloadedImg, x, y, width, height);
          } catch {
            drawFilmstripFallback(ctx, x, y, width, height);
          }
        } else {
          drawFilmstripFallback(ctx, x, y, width, height);
        }
      } else {
        // text / blur blocks
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 6);
        ctx.fill();
      }

      // Draw border
      ctx.strokeStyle = colors.items.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.stroke();

      // Selection visuals moved to drawOverlay for better performance

      // Draw label
      ctx.fillStyle = colors.items.text;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      const text =
        item.label.length > 12 ? item.label.substring(0, 12) + "…" : item.label;
      ctx.fillText(text, x + 8, y + height / 2 + 3);

      ctx.restore(); // Restore context state
    });
  }, [
    canvasSize,
    timelineItems,
    totalDuration,
    timelineZoom,
    thumbnailCache,
    loadedThumbnails,
    theme,
    colors,
  ]);

  // Draw only the playhead on overlay layer
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const playheadX = timeToPixel(currentFrame);
    if (playheadX >= TRACK_LABEL_WIDTH) {
      const lineGradient = ctx.createLinearGradient(
        playheadX,
        0,
        playheadX,
        canvasSize.height
      );
      lineGradient.addColorStop(0, "#EF4444");
      lineGradient.addColorStop(0.3, "#F87171");
      lineGradient.addColorStop(0.7, "#EF4444");
      lineGradient.addColorStop(1, "#DC2626");

      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvasSize.height);
      ctx.stroke();

      const handleWidth = 12;
      const handleHeight = 18;
      const handleGradient = ctx.createLinearGradient(
        playheadX - handleWidth / 2,
        0,
        playheadX + handleWidth / 2,
        handleHeight
      );
      handleGradient.addColorStop(0, "#F87171");
      handleGradient.addColorStop(0.5, "#EF4444");
      handleGradient.addColorStop(1, "#DC2626");

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.roundRect(
        playheadX - handleWidth / 2 + 1,
        1,
        handleWidth,
        handleHeight,
        6
      );
      ctx.fill();

      ctx.fillStyle = handleGradient;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.roundRect(
        playheadX - handleWidth / 2,
        0,
        handleWidth,
        handleHeight,
        6
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(playheadX - 3, 6);
      ctx.lineTo(playheadX + 3, 9);
      ctx.lineTo(playheadX - 3, 12);
      ctx.closePath();
      ctx.fill();

      if (dragState.dragType === "playhead") {
        const timelineWidth = canvasSize.width - TRACK_LABEL_WIDTH;
        const dragGradient = ctx.createLinearGradient(
          TRACK_LABEL_WIDTH,
          0,
          canvasSize.width,
          0
        );
        dragGradient.addColorStop(0, "rgba(239, 68, 68, 0)");
        dragGradient.addColorStop(0.5, "rgba(239, 68, 68, 0.05)");
        dragGradient.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = dragGradient;
        ctx.fillRect(TRACK_LABEL_WIDTH, 0, timelineWidth, canvasSize.height);
      }
    }

    // Draw drag preview using ref for better performance
    const dragPreview = dragPreviewRef.current;
    if (dragPreview.visible && dragState.isDragging) {
      // Draw row highlight if moving to a different row
      if (dragPreview.newRow !== dragState.startRow) {
        const rowY = getTrackY(dragPreview.newRow);
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)"; // Light blue highlight
        ctx.fillRect(TRACK_LABEL_WIDTH, rowY, canvasSize.width - TRACK_LABEL_WIDTH, TRACK_HEIGHT);
        
        // Row border highlight
        ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(TRACK_LABEL_WIDTH, rowY);
        ctx.lineTo(canvasSize.width, rowY);
        ctx.moveTo(TRACK_LABEL_WIDTH, rowY + TRACK_HEIGHT);
        ctx.lineTo(canvasSize.width, rowY + TRACK_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        
        // Add row number indicator
        ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.textAlign = "center";
        
        // Check if this is a new layer creation
        const isNewLayer = dragPreview.newRow > maxRow || 
          (dragPreview.newRow === 0 && dragState.startRow > 0 && 
           !timelineItems.some(item => item.id !== dragState.itemId && item.row === 0));
        
        const labelText = isNewLayer ? `NEW Layer ${dragPreview.newRow + 1}` : `Layer ${dragPreview.newRow + 1}`;
        ctx.fillText(labelText, TRACK_LABEL_WIDTH / 2, rowY + TRACK_HEIGHT / 2 + 4);
        
        // Add "NEW" indicator for new layers
        if (isNewLayer) {
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)"; // Green for new layers
          ctx.font = "bold 10px system-ui, sans-serif";
          ctx.fillText("NEW", TRACK_LABEL_WIDTH / 2, rowY + TRACK_HEIGHT / 2 - 8);
        }
      }
      
      // Draw item preview outline
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(dragPreview.x, dragPreview.y, dragPreview.width, dragPreview.height, 6);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    }

    // Draw selection visuals and trim handles
    const sortedItems = sortItemsByLayer(timelineItems);
    sortedItems.forEach((item) => {
      if (!isItemSelected(item)) return;

      const x = timeToPixel(item.start);
      const effectiveTotal = Math.max(
        1,
        totalDuration / Math.max(0.1, timelineZoom)
      );
      const timelineWidth = canvasSize.width - TRACK_LABEL_WIDTH;
      const width = Math.max(
        4,
        (item.duration / effectiveTotal) * timelineWidth
      );
      const y = getTrackY(item.row) + TRACK_MARGIN;
      const height = TRACK_HEIGHT - TRACK_MARGIN * 2;

      // Main selection border with glow effect
      ctx.strokeStyle = colors.items.selection;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 6);
      ctx.stroke();

      // Add subtle glow effect
      const glowColor = isDarkMode
        ? "rgba(255,255,255,0.3)"
        : "rgba(59, 130, 246, 0.3)";
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 4;
      ctx.strokeStyle = colors.items.selectionGlow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - 1, y - 1, width + 2, height + 2, 7);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Professional trim handles - only show if item is wide enough
      if (width > 16) {
        const isHovering = hoverStateRef.current.itemId === item.id;
        const hoverType = hoverStateRef.current.dragType;
        
        // Left trim handle with professional positioning
        const leftHandleX = x - 2;
        const leftHandleY = y + height / 2 - 10;
        const handleWidth = 14;
        const handleHeight = 20;

        // Left handle background with gradient
        const leftGradient = ctx.createLinearGradient(
          leftHandleX,
          leftHandleY,
          leftHandleX + handleWidth,
          leftHandleY + handleHeight
        );
        if (isHovering && hoverType === "trim-start") {
          leftGradient.addColorStop(0, "rgba(59, 130, 246, 1)");
          leftGradient.addColorStop(1, "rgba(37, 99, 235, 1)");
        } else {
          leftGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)");
          leftGradient.addColorStop(1, "rgba(37, 99, 235, 0.8)");
        }

        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = leftGradient;
        ctx.beginPath();
        ctx.roundRect(leftHandleX, leftHandleY, handleWidth, handleHeight, 5);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle =
          isHovering && hoverType === "trim-start"
            ? "rgba(255,255,255,1)"
            : "rgba(255,255,255,0.7)";
        ctx.lineWidth = isHovering && hoverType === "trim-start" ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(leftHandleX, leftHandleY, handleWidth, handleHeight, 5);
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 8px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(
          "◄",
          leftHandleX + handleWidth / 2,
          leftHandleY + handleHeight / 2 + 2
        );

        // Right trim handle with professional positioning
        const rightHandleX = x + width - handleWidth + 2;
        const rightHandleY = y + height / 2 - 10;

        const rightGradient = ctx.createLinearGradient(
          rightHandleX,
          rightHandleY,
          rightHandleX + handleWidth,
          rightHandleY + handleHeight
        );
        if (isHovering && hoverType === "trim-end") {
          rightGradient.addColorStop(0, "rgba(16, 185, 129, 1)");
          rightGradient.addColorStop(1, "rgba(5, 150, 105, 1)");
        } else {
          rightGradient.addColorStop(0, "rgba(16, 185, 129, 0.8)");
          rightGradient.addColorStop(1, "rgba(5, 150, 105, 0.8)");
        }

        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = rightGradient;
        ctx.beginPath();
        ctx.roundRect(
          rightHandleX,
          rightHandleY,
          handleWidth,
          handleHeight,
          5
        );
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle =
          isHovering && hoverType === "trim-end"
            ? "rgba(255,255,255,1)"
            : "rgba(255,255,255,0.7)";
        ctx.lineWidth = isHovering && hoverType === "trim-end" ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(
          rightHandleX,
          rightHandleY,
          handleWidth,
          handleHeight,
          5
        );
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 8px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(
          "►",
          rightHandleX + handleWidth / 2,
          rightHandleY + handleHeight / 2 + 2
        );

        // Enhanced edge highlight zones with hover feedback
        if (isHovering && hoverType === "trim-start") {
          ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
          ctx.fillRect(x, y, 12, height);
        } else if (isItemSelected(item)) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
          ctx.fillRect(x, y, 12, height);
        }

        if (isHovering && hoverType === "trim-end") {
          ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
          ctx.fillRect(x + width - 12, y, 12, height);
        } else if (isItemSelected(item)) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
          ctx.fillRect(x + width - 12, y, 12, height);
        }

        // Add subtle move zone highlight
        if (isHovering && hoverType === "move") {
          ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
          ctx.fillRect(x + 12, y, width - 24, height);
        }
      }
    });
  }, [canvasSize, currentFrame, dragState, dragPreviewVisible, timelineItems, totalDuration, timelineZoom, colors, isDarkMode]);

  // Redraw when dependencies change
  useEffect(() => {
    drawBase();
  }, [drawBase]);

  // Redraw overlay when frame/drag changes
  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // Listener to redraw base on custom event (used by live scrub update)
  useEffect(() => {
    const onRedraw = () => drawBase();
    window.addEventListener("timeline-base-redraw", onRedraw);
    return () => window.removeEventListener("timeline-base-redraw", onRedraw);
  }, [drawBase]);

  // Handle mouse move for hover effects (separate from drag)
  const handleMouseHover = (e: React.MouseEvent) => {
    // Don't update hover state while dragging
    if (dragState.isDragging) return;

    const rect = baseCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if hovering over an item
    const hoverResult = getItemAtPosition(x, y);

    if (hoverResult && isItemSelected(hoverResult.item)) {
      // Update hover state for visual feedback
      hoverStateRef.current = {
        itemId: hoverResult.item.id,
        dragType: hoverResult.dragType,
      };
      // Redraw overlay to show hover effect
      requestAnimationFrame(() => drawOverlay());

      // Set cursor based on drag type
      const canvas = baseCanvasRef.current;
      if (canvas) {
        switch (hoverResult.dragType) {
          case "trim-start":
          case "trim-end":
            canvas.style.cursor = "col-resize";
            break;
          case "move":
            canvas.style.cursor = dragState.isDragging ? "grabbing" : "grab";
            break;
        }
      }
    } else {
      // Clear hover state
      hoverStateRef.current = { itemId: null, dragType: null };
      // Redraw overlay to clear hover effect
      requestAnimationFrame(() => drawOverlay());
      const canvas = baseCanvasRef.current;
      if (canvas) {
        canvas.style.cursor = "default";
      }
    }
  };

  // Get item at position
  const getItemAtPosition = (
    x: number,
    y: number
  ): {
    item: TimelineItem;
    dragType: "move" | "trim-start" | "trim-end";
  } | null => {
    const effectiveTotal = Math.max(
      1,
      totalDuration / Math.max(0.1, timelineZoom)
    );
    const timelineWidth = canvasSize.width - TRACK_LABEL_WIDTH;
    for (const item of timelineItems) {
      const itemX = timeToPixel(item.start);
      const itemWidth = Math.max(
        4,
        (item.duration / effectiveTotal) * timelineWidth
      );
      const itemY = getTrackY(item.row) + TRACK_MARGIN;
      const itemHeight = TRACK_HEIGHT - TRACK_MARGIN * 2;

      if (
        x >= itemX &&
        x <= itemX + itemWidth &&
        y >= itemY &&
        y <= itemY + itemHeight
      ) {
        // Determine drag type based on position
        if (isItemSelected(item) && itemWidth > 16) {
          // Further reduced minimum width to support shorter items
          // Minimum width for trim handles
          // Precise edge detection zones - 4px from each edge for accurate trimming
          const leftEdgeZone = x <= itemX + 4;
          const rightEdgeZone = x >= itemX + itemWidth - 4;

          if (leftEdgeZone) return { item, dragType: "trim-start" };
          if (rightEdgeZone) return { item, dragType: "trim-end" };
        }
        return { item, dragType: "move" };
      }
    }
    return null;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = baseCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Canvas click registered

    // Check if clicking on playhead handle
    const playheadX = timeToPixel(currentFrame);
    const handleWidth = 12;
    const handleHeight = 18;

    if (
      x >= playheadX - handleWidth / 2 &&
      x <= playheadX + handleWidth / 2 &&
      y >= 0 &&
      y <= handleHeight
    ) {
      // Start dragging playhead
      setDragState({
        isDragging: true,
        itemId: "playhead",
        dragType: "playhead",
        startX: x,
        startY: y,
        startTime: currentFrame,
        startRow: 0,
        originalDuration: 0,
      });
      return;
    }

    const hitTest = getItemAtPosition(x, y);
    // Removed debug log for performance

    if (hitTest) {
      const { item, dragType } = hitTest;
      // Removed debug log for performance

      // Normal selection and dragging
      onSelectionChange(item.id);

      setDragState({
        isDragging: true,
        itemId: item.id,
        dragType,
        startX: x,
        startY: y,
        startTime: item.start,
        startRow: item.row,
        originalDuration: item.duration,
      });
    } else {
      // Click on empty space
      if (x > TRACK_LABEL_WIDTH) {
        const clickTime = pixelToTime(x);
        // Normal seek behavior
        onTimelineClick(clickTime);
      }
      onSelectionChange(null);
    }
  };

  // rAF-throttled dragging updates to reduce state churn
  const dragRafRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{
    x: number;
    updates: any | null;
    itemId: string | null;
    forPlayhead: boolean;
    newTime?: number;
  }>({ x: 0, updates: null, itemId: null, forPlayhead: false });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.itemId) return;

    const rect = baseCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const deltaX = x - dragState.startX;
    const deltaY = y - dragState.startY;
    const effectiveTotal = Math.max(
      1,
      totalDuration / Math.max(0.1, timelineZoom)
    );
    const deltaTime =
      (deltaX / (canvasSize.width - TRACK_LABEL_WIDTH)) * effectiveTotal;
    
    // Calculate new row based on Y position for move operations
    let newRow = dragState.dragType === "move" ? getRowFromY(y) : dragState.startRow;
    
    // Handle dynamic layer creation
    let rowShiftNeeded = 0;
    if (dragState.dragType === "move" && newRow !== dragState.startRow) {
      // If targeting row -1 (above existing), we'll create a new layer at top
      if (newRow === -1) {
        newRow = 0; // Place at new top layer
        rowShiftNeeded = 1; // All existing layers shift down by 1
      }
    }

    if (dragState.dragType === "playhead") {
      const newTime = Math.max(
        0,
        Math.min(totalDuration, dragState.startTime + deltaTime)
      );
      pendingDragRef.current = {
        x,
        updates: null,
        itemId: null,
        forPlayhead: true,
        newTime,
      };
    } else {
      const item = timelineItems.find((i) => i.id === dragState.itemId);
      if (!item) return;

      let updates: any = {};
      switch (dragState.dragType) {
        case "move":
          updates.start = Math.max(
            0,
            Math.min(
              totalDuration - item.duration,
              dragState.startTime + deltaTime
            )
          );
          // Add row updates for vertical movement
          if (newRow !== item.row) {
            updates.row = newRow;
          }

          // Update drag preview for visual feedback using ref (no re-render)
          const newStartTime = Math.max(
            0,
            Math.min(
              totalDuration - item.duration,
              dragState.startTime + deltaTime
            )
          );
          const previewX = timeToPixel(newStartTime);
          const previewY = getTrackY(newRow) + TRACK_MARGIN;
          const effectiveTotal = Math.max(
            1,
            totalDuration / Math.max(0.1, timelineZoom)
          );
          const timelineWidth = canvasSize.width - TRACK_LABEL_WIDTH;
          const previewWidth = Math.max(
            4,
            (item.duration / effectiveTotal) * timelineWidth
          );
          const previewHeight = TRACK_HEIGHT - TRACK_MARGIN * 2;

          // Update ref directly to avoid re-renders
          dragPreviewRef.current = {
            visible: true,
            x: previewX,
            y: previewY,
            width: previewWidth,
            height: previewHeight,
            newRow: newRow,
            currentDraggedItem: item,
          };

          // Only trigger re-render if preview visibility changed
          if (!dragPreviewVisible) {
            setDragPreviewVisible(true);
          }

          // Throttled overlay redraw for smooth drag feedback
          if (overlayRedrawTimeoutRef.current) {
            clearTimeout(overlayRedrawTimeoutRef.current);
          }
          overlayRedrawTimeoutRef.current = window.setTimeout(() => {
            drawOverlay();
          }, 16); // ~60fps
          break;
        case "trim-start":
          const newStart = Math.max(0, dragState.startTime + deltaTime);
          const endTime = dragState.startTime + dragState.originalDuration;
          updates.start = newStart;
          updates.duration = Math.max(10, endTime - newStart);
          
          // Hide drag preview for trim operations
          dragPreviewRef.current.visible = false;
          if (dragPreviewVisible) {
            setDragPreviewVisible(false);
          }
          break;
        case "trim-end":
          updates.duration = Math.max(
            10,
            dragState.originalDuration + deltaTime
          );
          
          // Hide drag preview for trim operations
          dragPreviewRef.current.visible = false;
          if (dragPreviewVisible) {
            setDragPreviewVisible(false);
          }
          break;
      }

      pendingDragRef.current = {
        x,
        updates,
        itemId: item.id,
        forPlayhead: false,
      };
    }

    if (dragRafRef.current == null) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        const pending = pendingDragRef.current;
        if (pending.forPlayhead && typeof pending.newTime === "number") {
          onTimelineClick(pending.newTime);
          // overlay only redraw
          const overlay = overlayCanvasRef.current;
          if (overlay) {
            drawOverlay();
          }
          return;
        }
        if (pending.itemId && pending.updates) {
          const item = timelineItems.find((i) => i.id === pending.itemId);
          if (item) {
            if (item.type === "text") {
              onTextOverlayUpdate(item.id, pending.updates);
            } else if (item.type === "blur") {
              onBlurOverlayUpdate(item.id, pending.updates);
            } else {
              onClipUpdate(item.id, pending.updates);
            }
          }
        }
      });
    }
  };

  const handleMouseUp = () => {
    // Handle dynamic layer creation/shifting if needed
    if (dragState.isDragging && dragState.itemId && dragState.dragType === "move") {
      const currentItem = timelineItems.find((i) => i.id === dragState.itemId);
      
      if (currentItem && dragPreviewRef.current.visible) {
        const targetRow = dragPreviewRef.current.newRow;
        const originalRow = dragState.startRow;
        
        // Check if we're creating a new top layer (moving to row 0 when there are existing items)
        if (targetRow === 0 && originalRow > 0) {
          const hasItemsAtRowZero = timelineItems.some(item => 
            item.id !== currentItem.id && item.row === 0
          );
          
          // If there are items at row 0 and we're moving from a higher row, shift everything down
          if (hasItemsAtRowZero) {
            timelineItems.forEach(item => {
              if (item.id !== currentItem.id) {
                const itemType = item.type;
                if (itemType === "text") {
                  onTextOverlayUpdate(item.id, { row: item.row + 1 });
                } else if (itemType === "blur") {
                  onBlurOverlayUpdate(item.id, { row: item.row + 1 });
                } else {
                  onClipUpdate(item.id, { row: item.row + 1 });
                }
              }
            });
          }
        }
        
        // For bottom layer creation, no shifting is needed - items can be placed at any row > maxRow
      }
    }

    // If we trimmed the start or end of a selected item, finalize trim semantics
    if (dragState.isDragging && dragState.itemId) {
      const item = timelineItems.find((i) => i.id === dragState.itemId);

      if (item) {
        // Handle trim operations for all item types
        if (dragState.dragType === "trim-start") {
          const originalStart = dragState.startTime; // start at mouse down
          const newStart = item.start; // start after drag
          const trimmedFrames = Math.max(
            0,
            Math.round(newStart - originalStart)
          );

          // Only update startFrom for video/image clips, not for text/blur overlays
          if (item.type === "video" || item.type === "image") {
            const clip = clips.find((c) => c.id === item.id);
            if (clip) {
              const currentStartFrom = clip.startFrom || 0;
              const updatedStartFrom = currentStartFrom + trimmedFrames;
              onClipUpdate(item.id, { startFrom: updatedStartFrom });
            }
          }
          // For text and blur overlays, no additional startFrom update needed
          // Their start and duration are already updated in handleMouseMove

          // Optionally notify via onSplitClip for external observers
          if (onSplitClip) {
            onSplitClip(item.id, newStart, "left");
          }
        } else if (dragState.dragType === "trim-end") {
          // No additional source trim needed for any type; duration was updated during drag
          if (onSplitClip) {
            onSplitClip(item.id, item.start + item.duration, "right");
          }
        }
      }
    }

    setDragState({
      isDragging: false,
      itemId: null,
      dragType: null,
      startX: 0,
      startY: 0,
      startTime: 0,
      startRow: 0,
      originalDuration: 0,
    });

    // Clear drag preview
    dragPreviewRef.current.visible = false;
    setDragPreviewVisible(false);
  };

  const handleMouseLeave = () => {
    if (dragState.isDragging) {
      handleMouseUp();
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (overlayRedrawTimeoutRef.current) {
        clearTimeout(overlayRedrawTimeoutRef.current);
      }
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-50 dark:bg-slate-900 relative"
    >
      <canvas
        ref={baseCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleMouseHover(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={(e) => {
          // Clear hover state when mouse leaves canvas
          hoverStateRef.current = { itemId: null, dragType: null };
          requestAnimationFrame(() => drawOverlay());
          const canvas = baseCanvasRef.current;
          if (canvas) canvas.style.cursor = "default";
          // Also handle drag state cleanup
          handleMouseLeave();
        }}
        className="cursor-pointer"
        style={{ display: "block" }}
        title="Timeline: Drag inside clip to move, drag left/right clip edge to trim, drag playhead to seek"
      />
      <canvas
        ref={overlayCanvasRef}
        className="pointer-events-none absolute inset-0"
        style={{ display: "block" }}
      />
    </div>
  );
};

// Export with React.memo for performance optimization
export const CanvasTimeline = memo(CanvasTimelineComponent);
export default CanvasTimeline;
