import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Play, Pause, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoClip, TimelineClip } from "@/utils/gifMakerUtils";

type VideoTimelineProps = {
  videoClips: VideoClip[];
  onVideoClipsChange: (clips: VideoClip[]) => void;
  currentTime?: number;
  isPlaying?: boolean;
  onCurrentTimeChange?: (time: number) => void;
  onPlayPause?: () => void;
  targetWidth?: number;
  setMaxDuration: (duration: number) => void;
  maxDuration: number;
  setIsGifSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeVideoIndex?: number | null;
  setActiveVideoIndex?: (index: number | null) => void;
  // New props for timeline sequence support
  timelineClips?: TimelineClip[];
  onTimelineClipsChange?: (clips: TimelineClip[]) => void;
  mode?: "grid" | "sequence"; // grid for multi-video layouts, sequence for merged timeline
};

export const GifMakerVideoTimeline = ({
  videoClips,
  onVideoClipsChange,
  currentTime = 0,
  isPlaying = true,
  onCurrentTimeChange,
  onPlayPause,
  targetWidth = 120,
  maxDuration,
  setIsGifSettingsOpen,
  activeVideoIndex = null,
  setActiveVideoIndex,
  timelineClips = [],
  mode = "grid",
}: VideoTimelineProps) => {
  const [frames, setFrames] = useState<
    { time: number; src: string; videoIndex: number; clipIndex?: number }[]
  >([]);
  const [isDragging, setIsDragging] = useState<
    "start" | "end" | "current" | null
  >(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const extractionAbortRef = useRef<AbortController | null>(null);

  // For sequence mode, use timeline clips; for grid mode, use active video clip
  const isSequenceMode = mode === "sequence";
  const totalDuration = isSequenceMode
    ? timelineClips.length > 0
      ? Math.max(...timelineClips.map((clip) => clip.timelineEndTime))
      : 0
    : 0;

  // Get active video clip for grid mode
  const activeClip =
    !isSequenceMode && activeVideoIndex !== null
      ? videoClips[activeVideoIndex]
      : null;
  const duration = isSequenceMode ? totalDuration : activeClip?.duration || 0;
  const startTime = isSequenceMode ? 0 : activeClip?.startTime || 0;
  const actualEndTime = isSequenceMode
    ? totalDuration
    : activeClip?.endTime || duration;
  const videoFile = isSequenceMode ? null : activeClip?.file || null;

  // Handler functions for video clip changes
  const onStartTimeChange = useCallback(
    (time: number) => {
      if (activeVideoIndex !== null && onVideoClipsChange) {
        const newClips = [...videoClips];
        newClips[activeVideoIndex] = {
          ...newClips[activeVideoIndex],
          startTime: time,
        };
        onVideoClipsChange(newClips);
      }
    },
    [activeVideoIndex, onVideoClipsChange, videoClips]
  );

  const onEndTimeChange = useCallback(
    (time: number) => {
      if (activeVideoIndex !== null && onVideoClipsChange) {
        const newClips = [...videoClips];
        newClips[activeVideoIndex] = {
          ...newClips[activeVideoIndex],
          endTime: time,
        };
        onVideoClipsChange(newClips);
      }
    },
    [activeVideoIndex, onVideoClipsChange, videoClips]
  );

  const frameCount = 8; // Reduced for faster initial load

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Optimized frame extraction with parallel processing
  const extractFrames = useCallback(async () => {
    if (isSequenceMode) {
      // Extract frames from timeline clips
      if (timelineClips.length === 0 || totalDuration === 0) {
        setFrames([]);
        return;
      }
    } else {
      // Extract frames from single video (grid mode)
      if (!videoFile || !duration || duration === 0) {
        console.log("Missing videoFile or invalid duration");
        return;
      }
    }

    // Cancel any ongoing extraction
    if (extractionAbortRef.current) {
      extractionAbortRef.current.abort();
    }
    extractionAbortRef.current = new AbortController();
    const abortSignal = extractionAbortRef.current.signal;

    setIsProcessing(true);
    setFrames([]);

    try {
      const extractedFrames: {
        time: number;
        src: string;
        videoIndex: number;
        clipIndex?: number;
      }[] = [];

      if (isSequenceMode) {
        // Extract frames from all timeline clips
        for (let clipIndex = 0; clipIndex < timelineClips.length; clipIndex++) {
          if (abortSignal.aborted) break;

          const clip = timelineClips[clipIndex];
          const videoUrl = URL.createObjectURL(clip.file);

          try {
            const video = document.createElement("video");
            video.src = videoUrl;
            video.crossOrigin = "anonymous";
            video.muted = true;
            video.playsInline = true;
            video.preload = "metadata";

            await new Promise<void>((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error("Video metadata loading timeout"));
              }, 5000);

              video.addEventListener(
                "loadedmetadata",
                () => {
                  clearTimeout(timeoutId);
                  resolve();
                },
                { once: true }
              );

              video.addEventListener(
                "error",
                () => {
                  clearTimeout(timeoutId);
                  reject(new Error("Video loading error"));
                },
                { once: true }
              );

              video.load();
            });

            if (abortSignal.aborted) break;

            // Calculate dimensions
            const aspectRatio = video.videoWidth / video.videoHeight;
            const targetHeight = Math.round(targetWidth / aspectRatio);

            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d", {
              willReadFrequently: false,
              alpha: false,
              desynchronized: true,
            });

            if (!ctx) continue;

            // Extract 3-4 frames per clip
            const clipDuration = clip.endTime - clip.startTime;
            const framesPerClip = Math.min(
              4,
              Math.max(2, Math.ceil(clipDuration))
            );

            for (let i = 0; i < framesPerClip; i++) {
              if (abortSignal.aborted) break;

              const timeInClip =
                clip.startTime + (clipDuration / (framesPerClip - 1)) * i;
              const timelineTime =
                clip.timelineStartTime +
                (clipDuration / (framesPerClip - 1)) * i;

              await new Promise<void>((resolve) => {
                const seekHandler = () => {
                  try {
                    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
                    extractedFrames.push({
                      time: timelineTime,
                      src: dataUrl,
                      videoIndex: activeVideoIndex || 0,
                      clipIndex,
                    });
                  } catch (error) {
                    console.error(
                      `Error extracting frame at ${timeInClip}s:`,
                      error
                    );
                  }
                  resolve();
                };

                video.addEventListener("seeked", seekHandler, { once: true });
                video.currentTime = timeInClip;
              });
            }

            // Clean up
            video.src = "";
            video.load();
          } finally {
            URL.revokeObjectURL(videoUrl);
          }
        }

        // Sort frames by timeline time
        extractedFrames.sort((a, b) => a.time - b.time);
      } else {
        // Original single video extraction logic
        console.log(`Extracting frames from: ${videoFile!.name}`);
        const videoUrl = URL.createObjectURL(videoFile!);

        try {
          // Create multiple video elements for parallel processing
          const videoPool = Array(3)
            .fill(null)
            .map(() => {
              const video = document.createElement("video");
              video.src = videoUrl;
              video.crossOrigin = "anonymous";
              video.muted = true;
              video.playsInline = true;
              video.preload = "metadata";
              return video;
            });

          // Wait for all videos to load metadata
          await Promise.all(
            videoPool.map(
              (video) =>
                new Promise<void>((resolve, reject) => {
                  const timeoutId = setTimeout(() => {
                    reject(new Error("Video metadata loading timeout"));
                  }, 5000);

                  video.addEventListener(
                    "loadedmetadata",
                    () => {
                      clearTimeout(timeoutId);
                      resolve();
                    },
                    { once: true }
                  );

                  video.addEventListener(
                    "error",
                    () => {
                      clearTimeout(timeoutId);
                      reject(new Error("Video loading error"));
                    },
                    { once: true }
                  );

                  video.load();
                })
            )
          );

          if (abortSignal.aborted) throw new Error("Extraction aborted");

          // Calculate dimensions
          const aspectRatio =
            videoPool[0].videoWidth / videoPool[0].videoHeight;
          const targetHeight = Math.round(targetWidth / aspectRatio);

          // Create canvas pool for parallel rendering
          const canvasPool = Array(3)
            .fill(null)
            .map(() => {
              const canvas = document.createElement("canvas");
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              return {
                canvas,
                ctx: canvas.getContext("2d", {
                  willReadFrequently: false,
                  alpha: false,
                  desynchronized: true,
                }),
              };
            });

          // Function to extract a single frame
          const extractFrame = async (
            video: HTMLVideoElement,
            canvas: HTMLCanvasElement,
            ctx: CanvasRenderingContext2D | null,
            time: number
          ): Promise<{
            time: number;
            src: string;
            videoIndex: number;
          } | null> => {
            if (!ctx || abortSignal.aborted) return null;

            return new Promise((resolve) => {
              const timeout = setTimeout(() => {
                console.warn(`Frame extraction timeout at ${time.toFixed(2)}s`);
                resolve(null);
              }, 2000);

              const seekHandler = () => {
                clearTimeout(timeout);

                try {
                  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
                  resolve({
                    time,
                    src: dataUrl,
                    videoIndex: activeVideoIndex || 0,
                  });
                } catch (error) {
                  console.error(`Error extracting frame at ${time}s:`, error);
                  resolve(null);
                }
              };

              video.addEventListener("seeked", seekHandler, { once: true });
              video.currentTime = time;
            });
          };

          // Extract frames in batches for better performance
          const frameTimes = Array.from(
            { length: frameCount },
            (_, i) => (duration / (frameCount - 1)) * i
          );

          const batchSize = 3;

          for (let i = 0; i < frameTimes.length; i += batchSize) {
            if (abortSignal.aborted) break;

            const batch = frameTimes.slice(i, i + batchSize);
            const batchPromises = batch.map((time, index) => {
              const videoIndex = index % videoPool.length;
              const canvasData = canvasPool[videoIndex];
              return extractFrame(
                videoPool[videoIndex],
                canvasData.canvas,
                canvasData.ctx,
                time
              );
            });

            const batchResults = await Promise.all(batchPromises);
            const validFrames = batchResults.filter(
              (f): f is { time: number; src: string; videoIndex: number } =>
                f !== null
            );

            extractedFrames.push(...validFrames);

            // Update UI progressively
            if (!abortSignal.aborted) {
              setFrames([...extractedFrames]);
            }
          }

          console.log(
            `Extracted ${extractedFrames.length} frames successfully`
          );

          // Clean up video elements
          videoPool.forEach((video) => {
            video.src = "";
            video.load();
          });
        } catch (err) {
          if (!abortSignal.aborted) {
            console.error("Frame extraction failed:", err);
            setFrames([]);
          }
        } finally {
          URL.revokeObjectURL(videoUrl);
        }
      }

      // Update frames if not aborted
      if (!abortSignal.aborted) {
        setFrames(extractedFrames);
      }
    } catch (err) {
      if (!abortSignal.aborted) {
        console.error("Frame extraction failed:", err);
        setFrames([]);
      }
    } finally {
      if (!abortSignal.aborted) {
        setIsProcessing(false);
      }
    }
  }, [
    videoFile,
    duration,
    frameCount,
    targetWidth,
    activeVideoIndex,
    isSequenceMode,
    timelineClips,
    totalDuration,
  ]);

  // Extract frames when video changes
  useEffect(() => {
    if (isSequenceMode) {
      // For sequence mode, extract frames when timeline clips change
      if (timelineClips.length > 0 && totalDuration > 0) {
        extractFrames();
      }
    } else {
      // For grid mode, extract frames when single video changes
      if (videoFile && duration > 0) {
        extractFrames();
      }
    }

    return () => {
      // Cleanup on unmount or video change
      if (extractionAbortRef.current) {
        extractionAbortRef.current.abort();
      }
    };
  }, [
    videoFile,
    duration,
    extractFrames,
    isSequenceMode,
    timelineClips.length,
    totalDuration,
  ]);

  // Handle mouse events for dragging
  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    type: "start" | "end" | "current"
  ) => {
    setIsDragging(type);
    setDragStartX(e.clientX);
    setDragStartValue(
      type === "start"
        ? startTime
        : type === "end"
          ? actualEndTime
          : currentTime
    );
    e.preventDefault();
  };
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = (deltaX / rect.width) * duration;
      const newValue = Math.max(
        0,
        Math.min(duration, dragStartValue + deltaTime)
      );

      if (isDragging === "start") {
        // Simply pass the new value - let the parent handle the sliding window logic
        onStartTimeChange?.(newValue);
      } else if (isDragging === "end") {
        // Simply pass the new value - the parent component will handle the logic
        // of dragging the start time if needed
        onEndTimeChange?.(newValue);
      } else if (isDragging === "current") {
        const clampedTime = Math.max(
          startTime,
          Math.min(actualEndTime, newValue)
        );
        onCurrentTimeChange?.(clampedTime);
      }
    },
    [
      isDragging,
      dragStartX,
      dragStartValue,
      duration,
      startTime,
      actualEndTime,
      onStartTimeChange,
      onEndTimeChange,
      onCurrentTimeChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle timeline click
  const handleTimelineClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!timelineRef.current || isDragging) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    let clickTime = (clickX / rect.width) * duration;

    // Clamp the clickTime within the valid range considering max duration
    const validStart = Math.max(0, actualEndTime - maxDuration);
    const validEnd = Math.min(duration, startTime + maxDuration);

    clickTime = Math.max(
      Math.max(startTime, validStart),
      Math.min(Math.min(actualEndTime, validEnd), clickTime)
    );

    onCurrentTimeChange?.(clickTime);
  };

  // Calculate positions as percentages
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (actualEndTime / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // useEffect(() => {
  //   if (!isDragging && maxDuration > 0) {
  //     // Ensure endTime is valid and within bounds
  //     const validEndTime = Math.min(
  //       Math.max(startTime + 0.1, maxDuration + startTime),
  //       duration
  //     );
  //     onEndTimeChange?.(validEndTime);
  //   }
  // }, [maxDuration, startTime, duration, isDragging, onEndTimeChange]);

  // useEffect(() => {
  //   if (!isDragging) {
  //     onEndTimeChange?.(Math.max(maxDuration, startTime + 0.1));
  //   }
  // }, [maxDuration]);

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-gray-300 font-medium">GIF Timeline Editor</h3>

          {/* Video Selector */}
          {videoClips.filter((clip) => clip.file).length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Video:</span>
              <select
                value={activeVideoIndex || 0}
                onChange={(e) =>
                  setActiveVideoIndex?.(parseInt(e.target.value))
                }
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                {videoClips.map((clip, index) =>
                  clip.file ? (
                    <option key={index} value={index}>
                      Video {index + 1} ({clip.file.name.slice(0, 20)})
                    </option>
                  ) : null
                )}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Loading timeline...
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsGifSettingsOpen((prev: boolean) => !prev)}
            className={cn(
              "bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors active:bg-gray-500"
            )}
            aria-label="Toggle GIF Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={onPlayPause}
            disabled={
              isProcessing ||
              (!videoFile && !isSequenceMode) ||
              (isSequenceMode && timelineClips.length === 0)
            }
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700  disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Time Info */}
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>Total: {formatTime(duration)}</span>
        <span>Current: {formatTime(currentTime)}</span>
        <span>Duration: {formatTime(actualEndTime - startTime)}</span>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Frame Thumbnails with Interactive Timeline */}
        <div
          ref={timelineRef}
          className="relative flex rounded-md overflow-hidden bg-gray-800 border border-gray-600 cursor-pointer min-h-[80px]"
          onClick={handleTimelineClick}
        >
          {(!videoFile && !isSequenceMode) ||
          (isSequenceMode && timelineClips.length === 0) ||
          duration === 0 ? (
            <div className="w-full h-20 flex items-center justify-center text-gray-500 text-sm">
              {isSequenceMode
                ? "Add videos to timeline sequence"
                : "Load a video to start"}
            </div>
          ) : frames.length === 0 ? (
            <div className="w-full h-20 flex items-center justify-center text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Loading timeline...
              </div>
            </div>
          ) : (
            <>
              {/* Render placeholder frames while loading */}
              {Array.from({ length: frameCount }).map((_, index) => {
                const frame = frames[index];
                const frameTime = (duration / (frameCount - 1)) * index;

                return (
                  <div key={index} className="flex-1 relative">
                    {frame ? (
                      <Image
                        src={frame.src}
                        alt={`Frame ${index}`}
                        className="w-full h-20 object-cover"
                        width={200}
                        height={80}
                        draggable={false}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-20 bg-gray-700 animate-pulse" />
                    )}
                    {/* Frame overlay for non-selected areas */}
                    <div
                      className="absolute inset-0 bg-black transition-opacity duration-200"
                      style={{
                        opacity:
                          frameTime < startTime || frameTime > actualEndTime
                            ? 0.7
                            : 0,
                      }}
                    />
                    {/* Frame time label */}
                    {frame && (
                      <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-70 px-1 rounded">
                        {formatTime(frame.time)}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {((videoFile && duration > 0) ||
            (isSequenceMode &&
              timelineClips.length > 0 &&
              totalDuration > 0)) && (
            <>
              {/* Selected Range Overlay */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-r-2 border-blue-400 bg-blue-500 opacity-20 pointer-events-none"
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`,
                }}
              />

              {/* End overlay (grayed out area after selection) */}
              <div
                className="absolute top-0 bottom-0 bg-black opacity-50 pointer-events-none"
                style={{
                  left: `${endPercent}%`,
                  right: "0%",
                }}
              />

              {/* Start Time Handle - Drawer Style */}
              <div
                className="absolute top-0 bottom-0 cursor-col-resize z-30 group"
                style={{ left: `${startPercent}%` }}
                onMouseDown={(e) => handleMouseDown(e, "start")}
              >
                {/* Handle Body */}
                <div className="absolute  -left-2 w-4 h-full bg-blue-500 rounded-sm border border-blue-400 shadow-lg group-hover:bg-blue-400 transition-colors">
                  {/* Center Line (drawer handle) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-white rounded-full opacity-80"></div>
                </div>
                {/* Time Label */}
                <div className="absolute -bottom-8 -left-8 text-xs text-gray-300 bg-gray-900 px-2 py-1 rounded whitespace-nowrap border border-blue-400">
                  {formatTime(startTime)}
                </div>
              </div>

              {/* End Time Handle - Drawer Style */}
              <div
                className="absolute top-0 bottom-0 cursor-col-resize z-30 group"
                style={{ left: `${endPercent}%` }}
                onMouseDown={(e) => handleMouseDown(e, "end")}
              >
                {/* Handle Body */}
                <div className="absolute  -left-2 w-4 h-full bg-blue-500 rounded-sm border border-blue-400 shadow-lg group-hover:bg-blue-400 transition-colors">
                  {/* Center Line (drawer handle) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-white rounded-full opacity-80"></div>
                </div>
                {/* Time Label */}
                <div className="absolute -bottom-8 -left-6 text-xs text-gray-300 bg-gray-900 px-2 py-1 rounded whitespace-nowrap border border-blue-400">
                  {formatTime(actualEndTime)}
                </div>
              </div>

              {/* Playhead (smooth transitioning current time) */}
              <div
                className="absolute w-1 h-full cursor-col-resize z-40 transition-all bg-white rounded-sm shadow-lg"
                style={{
                  left: `calc(${currentPercent}% - 2px)`,
                  transition:
                    isDragging === "current" ? "none" : "left 0.15s ease-out",
                }}
                onMouseDown={(e) => handleMouseDown(e, "current")}
              />
            </>
          )}
        </div>

        {/* Time Markers */}
        {duration > 0 && (
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
            <span>0:00</span>
            <span>{formatTime(duration / 4)}</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime((3 * duration) / 4)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
