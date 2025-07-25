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
const extractVideoFramesProgressively = (
  videoFile: File,
  onFrameExtracted: (frame: VideoFrame) => void,
  onComplete: () => void,
  onProgressUpdate: (current: number, total: number) => void,
  priority: number = 0, // Higher priority videos extract first
  shouldPause: () => boolean = () => false // Function to check if extraction should be paused
) => {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  video.preload = "metadata";
  video.src = URL.createObjectURL(videoFile);

  video.addEventListener("loadedmetadata", () => {
    canvas.width = 80; // Smaller thumbnail for better performance
    canvas.height = 45; // Maintain 16:9 aspect ratio

    const duration = video.duration;

    // Smart frame calculation - limit total frames for clean timeline
    const calculateOptimalFrames = (duration: number) => {
      if (duration <= 12) return Math.ceil(duration); // 1 frame per second for very short videos
      if (duration <= 60) return 10; // 10 frames for videos up to 1 minute
      return 12; // 12 frames for all longer videos
    };

    const maxFrames = Math.min(calculateOptimalFrames(duration), 12); // Cap at 12 frames max
    const interval = duration / maxFrames;

    let currentFrameIndex = 0;
    const frameTimes: number[] = [];

    // Pre-calculate all frame times
    for (let i = 0; i < maxFrames; i++) {
      frameTimes.push(i * interval);
    }

    // Initialize progress
    onProgressUpdate(0, maxFrames);

    const extractFrame = () => {
      if (currentFrameIndex >= frameTimes.length) {
        URL.revokeObjectURL(video.src);
        onComplete();
        return;
      }

      // Check if we should pause extraction (e.g., when video is playing)
      if (shouldPause()) {
        setTimeout(extractFrame, 500);
        return;
      }

      const time = frameTimes[currentFrameIndex];

      // Clear any existing timeout
      if (seekTimeout) {
        clearTimeout(seekTimeout);
      }

      // Set fallback timeout in case seeked event doesn't fire
      seekTimeout = setTimeout(() => {
        console.warn(
          `Seeked event didn't fire for time ${time}, continuing anyway`
        );
        currentFrameIndex++;
        setTimeout(extractFrame, 50);
      }, 1000);

      video.currentTime = Math.min(time, duration - 0.1);
    };

    const handleSeeked = () => {
      // Clear the fallback timeout since seeked fired
      if (seekTimeout) {
        clearTimeout(seekTimeout);
      }

      if (ctx && video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL("image/jpeg", 0.8);

          const frame: VideoFrame = {
            time: video.currentTime,
            thumbnail,
            videoId: "",
          };

          onFrameExtracted(frame);
          onProgressUpdate(currentFrameIndex + 1, maxFrames);
        } catch (error) {
          console.warn(
            "Failed to extract frame at time",
            video.currentTime,
            error
          );
        }
      }

      currentFrameIndex++;
      // Continue with next frame after a short delay
      setTimeout(extractFrame, 50);
    };

    video.addEventListener("seeked", handleSeeked);

    // Fallback: if seeked doesn't fire within 1 second, continue anyway
    let seekTimeout: NodeJS.Timeout;

    video.addEventListener("error", () => {
      console.error("Error loading video for frame extraction");
      URL.revokeObjectURL(video.src);
      onComplete();
    });

    // Start extraction with a small delay to let the UI settle
    setTimeout(extractFrame, priority * 50);
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
      if (totalDuration === 0) return { leftPercent: 0, widthPercent: 0 };

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

      // For positioning, always use totalDuration so videos align properly across grids
      // and represent actual time progression
      const leftPercent = Math.max(0.5, (cumulativeTime / totalDuration) * 100);
      const widthPercent = Math.max(
        0.5,
        (effectiveDuration / totalDuration) * 100
      );

      // Ensure the video segment doesn't overflow the container with small margin
      const maxWidth = 99.5 - leftPercent; // Leave 0.5% margin on right
      const constrainedWidthPercent = Math.min(widthPercent, maxWidth);

      return { leftPercent, widthPercent: constrainedWidthPercent };
    },
    [totalDuration, videos, layout]
  );

  const getCurrentPosition = useMemo(() => {
    if (totalDuration === 0) return "0%";
    const percentage = (currentTime / totalDuration) * 100;
    return `${percentage}%`;
  }, [currentTime, totalDuration]);

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
      const clickTime = percentage * totalDuration; // Direct time calculation, no frame conversion

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
    [videos, totalDuration, onSeek, onVideoSelect, layout, blurAreaHeight, currentTime]
  );

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // Don't interfere with blur overlays, video segments or add buttons
      if (target.closest(".blur-overlay") || target.closest(".video-segment") || target.closest(".add-sequence-btn")) {
        return;
      }

      // Use container rect directly like OldTimeline
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;

      // Calculate percentage based on full container width
      const percentage = Math.max(0, Math.min(1, clickX / containerRect.width));
      const clickTime = percentage * totalDuration; // Direct time calculation

      console.log("Timeline mousedown:", {
        clickX,
        containerWidth: containerRect.width,
        percentage: percentage * 100,
        clickTime,
        totalDuration,
        currentTimeBeforeSeek: currentTime,
      });

      setHoverPosition(null);
      setClickPosition({ x: clickX, time: clickTime });
      setIsDragging(true);

      // Direct seek without frame calculations
      onSeek(clickTime);

      e.preventDefault();
    },
    [totalDuration, onSeek, currentTime]
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
          // Direct time calculation without frame conversion
          const newTime = percentage * totalDuration;
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
    [isDragging, totalDuration, onSeek, clickPosition]
  );

  const handleTimelineMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

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
            const newTime = percentage * totalDuration;
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
  }, [isDragging, totalDuration, onSeek, clickPosition]);

  const handleVideoClick = useCallback(
    (video: VideoSequenceItem, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // Always select the video in the editor, even if already selected
      if (typeof onVideoSelect === "function") {
        onVideoSelect(video.id);
      }

      // Calculate position within the video segment itself
      const videoElement = e.currentTarget;
      const videoRect = videoElement.getBoundingClientRect();
      const clickX = e.clientX - videoRect.left;
      const videoWidth = videoRect.width;

      // Calculate percentage within this video segment
      const percentage = Math.max(0, Math.min(1, clickX / videoWidth));

      // Calculate the time within this video's duration (accounting for trim)
      const speedMultiplier = video.effects.speed || 1;
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = trimEnd - trimStart;
      const effectiveDuration = trimmedDuration / speedMultiplier;
      const timeWithinVideo = percentage * effectiveDuration;

      // Calculate absolute time in the timeline
      const absoluteTime = video.startTime + timeWithinVideo;

      console.log("Video segment click:", {
        clickX,
        videoWidth,
        percentage,
        timeWithinVideo,
        absoluteTime,
        videoStart: video.startTime,
        effectiveDuration,
        currentTimeBeforeSeek: currentTime,
      });

      // Seek to that position
      onSeek(absoluteTime);
    },
    [onVideoSelect, onSeek, currentTime]
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
      return (
        <div
          key={video.id}
          className={`
          video-segment cursor-pointer transition-all duration-200 overflow-hidden h-full
          ${
            isSelected
              ? "ring-2 ring-pink-500 shadow-xl z-30"
              : "hover:shadow-lg z-20"
          }
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
          {/* Frame Thumbnails or Loading State */}
          {showFrameView && frames.length > 0 ? (
            /* Show frame thumbnails as navigation */
            <div className="flex h-full w-full overflow-hidden">
              {frames.map((frame, frameIndex) => {
                const frameWidth = 100 / frames.length;
                // Calculate if this frame contains the current time position
                const speedMultiplier = video.effects.speed || 1;
                const trimStart = video.trimStart || 0;
                const trimEnd = video.trimEnd || video.duration;
                const trimmedDuration = trimEnd - trimStart;
                const effectiveDuration = trimmedDuration / speedMultiplier;
                
                // Calculate the time range this frame covers
                const frameTimespan = effectiveDuration / frames.length;
                const frameStartTime = frameIndex * frameTimespan;
                const frameEndTime = frameStartTime + frameTimespan;
                const frameStartAbsolute = video.startTime + frameStartTime;
                const frameEndAbsolute = video.startTime + frameEndTime;
                
                return (
                  <div
                    key={frameIndex}
                    className="relative cursor-pointer transition-all duration-200 border-r border-gray-800/20 last:border-r-0 hover:brightness-110"
                    style={{
                      width: `${frameWidth}%`,
                      height: "100%",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(
                        "Frame clicked, selecting video:",
                        video.id,
                        video.file.name
                      );
                      
                      // Use the same logic as handleVideoClick but for this specific frame
                      const frameElement = e.currentTarget;
                      const frameRect = frameElement.getBoundingClientRect();
                      const clickX = e.clientX - frameRect.left;
                      const frameWidth = frameRect.width;
                      
                      // Calculate percentage within this specific frame
                      const clickPercentageInFrame = Math.max(0, Math.min(1, clickX / frameWidth));
                      
                      // Calculate the time range this frame represents
                      const speedMultiplier = video.effects.speed || 1;
                      const trimStart = video.trimStart || 0;
                      const trimEnd = video.trimEnd || video.duration;
                      const trimmedDuration = trimEnd - trimStart;
                      const effectiveDuration = trimmedDuration / speedMultiplier;
                      
                      // Each frame represents a portion of the effective duration
                      const frameTimespan = effectiveDuration / frames.length;
                      const frameStartTime = frameIndex * frameTimespan;
                      const timeWithinFrame = clickPercentageInFrame * frameTimespan;
                      const timeWithinVideo = frameStartTime + timeWithinFrame;
                      
                      // Calculate absolute timeline position
                      const absoluteTime = video.startTime + timeWithinVideo;
                      
                      console.log("Frame click calculation:", {
                        clickX,
                        frameWidth,
                        clickPercentageInFrame,
                        frameIndex,
                        frameTimespan,
                        frameStartTime,
                        timeWithinFrame,
                        timeWithinVideo,
                        videoStartTime: video.startTime,
                        finalTimelinePosition: absoluteTime
                      });
                      
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
            </div>
          ) : showFrameView && frames.length === 0 ? (
            /* Loading state with progress */
            <div
              className={`absolute inset-0 flex items-center justify-center ${colorClass}`}
            >
              <div className="text-center text-white">
                {(() => {
                  const progress = extractionProgress.get(video.id);
                  return progress ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                      <div className="text-xs">
                        {progress.current}/{progress.total}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                      <div className="text-xs">Loading...</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* Fallback: Traditional colored segments */
            <>
              <div className={`absolute inset-0 ${colorClass}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>
              {/* Video text content - adaptive based on segment width */}
              {widthPercent > 15 ? (
                <>
                  <div
                    className={`absolute left-2 right-2 top-1 text-xs text-white font-medium truncate z-10`}
                  >
                    {video.file.name}
                  </div>
                  <div
                    className={`absolute left-2 right-2 bottom-1 text-xs text-white/80 font-normal z-10`}
                  >
                    {formatTime(
                      (video.trimEnd || video.duration) - (video.trimStart || 0)
                    )}
                  </div>
                </>
              ) : (
                <div className="absolute inset-1 flex items-center justify-center z-10">
                  <div className="text-xs text-white font-medium bg-black/40 px-1.5 py-0.5 rounded">
                    {formatTime(
                      (video.trimEnd || video.duration) - (video.trimStart || 0)
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Video Number Badge - Modern Style */}
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center z-50 shadow-lg border border-gray-700">
            <span className="text-[10px] font-bold text-white">
              {index + 1}
            </span>
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
            bottom: 30, // Leave space for the 6-height ruler plus padding
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
            // Single layout - single track container
            <div className="relative w-full h-full flex">
              {videos.map((video, index) => {
                const { leftPercent, widthPercent } = getVideoPosition(video);
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

                return renderVideoSegment(
                  video,
                  index,
                  leftPercent,
                  widthPercent,
                  isSelected,
                  frames,
                  colorClass,
                  0,
                  0
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
                {videos
                  .filter((v) => v.gridId === "grid-1")
                  .map((video, index) => {
                    const { leftPercent, widthPercent } =
                      getVideoPosition(video);
                    const isSelected = video.id === selectedVideoId;
                    const frames = videoFrames.get(video.id) || [];
                    const colorClass = "bg-blue-600";

                    return renderVideoSegment(
                      video,
                      index,
                      leftPercent,
                      widthPercent,
                      isSelected,
                      frames,
                      colorClass,
                      0,
                      0
                    );
                  })}
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
                {videos
                  .filter((v) => v.gridId === "grid-2")
                  .map((video, index) => {
                    const { leftPercent, widthPercent } =
                      getVideoPosition(video);
                    const isSelected = video.id === selectedVideoId;
                    const frames = videoFrames.get(video.id) || [];
                    const colorClass = "bg-green-600";

                    return renderVideoSegment(
                      video,
                      index,
                      leftPercent,
                      widthPercent,
                      isSelected,
                      frames,
                      colorClass,
                      0,
                      0
                    );
                  })}
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
                {formatTime((hoverPosition / 100) * totalDuration)}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Ruler */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gray-850 border-t border-gray-700 z-50">
          {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }, (_, i) => {
            const time = i * 5;
            const position = (time / totalDuration) * 100;

            return (
              <div
                key={i}
                className="absolute z-50"
                style={{ left: `${position}%`, top: 0, height: '100%' }}
              >
                <div className="absolute top-0 w-px h-3 bg-gray-600 z-50" />
                <div className="absolute top-3 -translate-x-1/2 text-[11px] text-gray-300 font-mono bg-gray-850 px-1 border border-gray-700 rounded z-50">
                  {formatTime(time)}
                </div>
              </div>
            );
          })}
        </div>
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
