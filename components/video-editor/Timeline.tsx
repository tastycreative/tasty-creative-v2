"use client";

import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { VideoSequenceItem, SelectiveBlurRegion } from "@/types/video";
import { Play, Pause, SkipBack, SkipForward, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  video.preload = 'metadata';
  video.src = URL.createObjectURL(videoFile);
  
  video.addEventListener('loadedmetadata', () => {
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
        // Retry after a longer delay when paused
        setTimeout(extractFrame, 500);
        return;
      }
      
      const time = frameTimes[currentFrameIndex];
      video.currentTime = Math.min(time, duration - 0.1); // Ensure we don't go past the end
    };
    
    video.addEventListener('seeked', () => {
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.6); // Lower quality for speed
          
          const frame: VideoFrame = {
            time: video.currentTime,
            thumbnail,
            videoId: '', // Will be set by the calling component
          };
          
          // Immediately call the callback with the new frame
          onFrameExtracted(frame);
          
          // Update progress
          onProgressUpdate(currentFrameIndex + 1, maxFrames);
        } catch (error) {
          console.warn('Failed to extract frame at time', video.currentTime, error);
        }
      }
      
      currentFrameIndex++;
      // Use requestIdleCallback to avoid blocking main thread during video playback
      const delay = priority === 0 ? 150 : 100; // First video gets faster extraction
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setTimeout(extractFrame, delay);
        }, { timeout: delay + 100 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(extractFrame, delay * 1.5);
      }
    });
    
    video.addEventListener('error', () => {
      console.error('Error loading video for frame extraction');
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
}) => {
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoFrames, setVideoFrames] = useState<Map<string, VideoFrame[]>>(new Map());
  const [showFrameView, setShowFrameView] = useState(true);
  const frameExtractionRef = useRef<Map<string, boolean>>(new Map());
  const [extractionProgress, setExtractionProgress] = useState<Map<string, { current: number; total: number }>>(new Map());

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
      const videosToProcess = videos.filter(video => 
        !frameExtractionRef.current.get(video.id) && video.file
      );
      
      if (videosToProcess.length === 0) return;
      
      // Process videos sequentially with priority (first video gets priority 0)
      videosToProcess.forEach((video, index) => {
        // Delay each video's processing to prevent simultaneous extraction
        setTimeout(() => {
          if (!frameExtractionRef.current.get(video.id)) {
            frameExtractionRef.current.set(video.id, true);
            
            // Initialize empty array for this video
            setVideoFrames(prev => new Map(prev.set(video.id, [])));
            
            try {
              extractVideoFramesProgressively(
                video.file,
                (frame) => {
                  // Add video ID and immediately update state
                  const frameWithVideoId = { ...frame, videoId: video.id };
                  setVideoFrames(prev => {
                    const currentFrames = prev.get(video.id) || [];
                    return new Map(prev.set(video.id, [...currentFrames, frameWithVideoId]));
                  });
                },
                () => {
                  console.log(`Frame extraction completed for video ${video.id}`);
                  // Clear progress when complete
                  setExtractionProgress(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(video.id);
                    return newMap;
                  });
                },
                (current, total) => {
                  // Update progress
                  setExtractionProgress(prev => new Map(prev.set(video.id, { current, total })));
                },
                index, // Priority based on video order
                () => isPlaying // Pause extraction when video is playing
              );
            } catch (error) {
              console.error(`Failed to extract frames for video ${video.id}:`, error);
              frameExtractionRef.current.set(video.id, false);
            }
          }
        }, index * 200); // Stagger video processing by 200ms each
      });
    };

    // Always extract frames automatically
    extractFramesForVideos();
  }, [videos]);

  // Frame navigation functions
  const getCurrentFrameIndex = useCallback(() => {
    return Math.round(currentTime * frameRate);
  }, [currentTime, frameRate]);

  const getTotalFrames = useCallback(() => {
    return Math.floor(totalDuration * frameRate);
  }, [totalDuration, frameRate]);

  const seekToFrame = useCallback((frameIndex: number) => {
    const time = frameIndex / frameRate;
    onSeek(Math.max(0, Math.min(time, totalDuration)));
  }, [frameRate, onSeek, totalDuration]);

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
      for (const v of videos) {
        if (v.id === video.id) {
          break;
        }
        const speedMultiplier = v.effects.speed || 1;
        // Account for trimming in cumulative time calculation
        const trimStart = v.trimStart || 0;
        const trimEnd = v.trimEnd || v.duration;
        const trimmedDuration = trimEnd - trimStart;
        const effectiveDuration = trimmedDuration / speedMultiplier;
        cumulativeTime += effectiveDuration;
      }

      const speedMultiplier = video.effects.speed || 1;
      // Account for trimming in this video's duration
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = trimEnd - trimStart;
      const effectiveDuration = trimmedDuration / speedMultiplier;

      const leftPercent = Math.max(0, (cumulativeTime / totalDuration) * 100);
      const widthPercent = Math.max(
        0.5,
        (effectiveDuration / totalDuration) * 100
      );

      // Ensure the video segment doesn't overflow the container
      const maxWidth = 100 - leftPercent;
      const constrainedWidthPercent = Math.min(widthPercent, maxWidth);

      return { leftPercent, widthPercent: constrainedWidthPercent };
    },
    [totalDuration, videos]
  );

  const getCurrentPosition = useMemo(() => {
    if (totalDuration === 0) return "0%";
    const percentage = (currentTime / totalDuration) * 100;
    return `${percentage}%`;
  }, [currentTime, totalDuration]);

  const handleTimelineClick = useCallback(() => {
    // This will be handled by mouseDown/mouseUp combination
    // to properly distinguish clicks from drags
  }, []);

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // Don't interfere with blur overlays
      if (target.closest(".blur-overlay")) {
        return;
      }

      // Get the timeline track element specifically (not the container)
      const timelineTrack = e.currentTarget.querySelector('.timeline-track');
      if (!timelineTrack) return;
      
      const rect = timelineTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      
      // Ensure we account for any padding/margins
      const trackWidth = rect.width;
      const percentage = Math.max(0, Math.min(1, clickX / trackWidth));
      const clickTime = percentage * totalDuration;

      // Debug logging (remove in production)
      if (Math.abs(clickTime - currentTime) > 1) { // Only log if time difference is significant
        console.log('Timeline click:', {
          clickX,
          trackWidth,
          percentage,
          clickTime,
          totalDuration,
          formattedTime: formatTime(clickTime),
          currentTime,
          timeDifference: Math.abs(clickTime - currentTime)
        });
      }

      setHoverPosition(null);
      setIsDragging(true);

      // Always seek to the clicked time, regardless of where we clicked
      onSeek(clickTime);

      e.preventDefault();
    },
    [totalDuration, onSeek, formatTime]
  );

  const handleTimelineMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Check if we're hovering over a blur overlay or its controls
      const target = e.target as HTMLElement;
      const isBlurOverlay =
        target.closest(".blur-overlay") ||
        target.closest("[data-blur-controls]");

      // Get the timeline track element specifically
      const timelineTrack = e.currentTarget.querySelector('.timeline-track');
      if (!timelineTrack) return;
      
      const rect = timelineTrack.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));

      if (isDragging) {
        // Update time while dragging - always use exact time calculation
        const newTime = percentage * totalDuration;
        onSeek(newTime);
      } else if (!isBlurOverlay) {
        // Only show hover indicator when not hovering over blur overlays or controls
        const hoverPercentage = percentage * 100;
        setHoverPosition(hoverPercentage);
      } else {
        // Clear hover position when over blur elements
        setHoverPosition(null);
      }
    },
    [isDragging, totalDuration, onSeek]
  );

  const handleTimelineMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  // Add global mouse up listener when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const timelineContainer = document.querySelector(
          ".timeline-track-container"
        );
        const timelineTrack = timelineContainer?.querySelector('.timeline-track');
        if (timelineTrack) {
          const rect = timelineTrack.getBoundingClientRect();
          const moveX = e.clientX - rect.left;
          const percentage = Math.max(0, Math.min(1, moveX / rect.width));
          const newTime = percentage * totalDuration;
          onSeek(newTime);
        }
      };

      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("mousemove", handleGlobalMouseMove);

      return () => {
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [isDragging, totalDuration, onSeek]);

  const handleVideoClick = useCallback(
    (video: VideoSequenceItem, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // Select the video first
      onVideoSelect(video.id);

      // Get the timeline track element for accurate calculation
      const timelineContainer = e.currentTarget.closest('.timeline-track-container');
      const timelineTrack = timelineContainer?.querySelector('.timeline-track');
      if (!timelineTrack) return;

      const timelineRect = timelineTrack.getBoundingClientRect();
      const clickX = e.clientX - timelineRect.left;
      const timelinePercentage = Math.max(0, Math.min(1, clickX / timelineRect.width));
      
      // Calculate the absolute time based on timeline position
      const absoluteTime = timelinePercentage * totalDuration;

      // Debug logging (remove in production)
      if (Math.abs(absoluteTime - currentTime) > 1) {
        console.log('Video segment click:', {
          videoName: video.file.name,
          clickX,
          timelineWidth: timelineRect.width,
          timelinePercentage,
          absoluteTime,
          formattedTime: formatTime(absoluteTime),
          currentTime
        });
      }

      // Seek to that position
      onSeek(absoluteTime);
    },
    [onVideoSelect, onSeek, totalDuration, formatTime]
  );

  const jumpToStart = useCallback(() => {
    onSeek(0);
  }, [onSeek]);

  const jumpToEnd = useCallback(() => {
    onSeek(totalDuration);
  }, [onSeek, totalDuration]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-pink-200 p-6">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={jumpToStart}
            className="p-2 hover:bg-pink-50 rounded-lg transition-all duration-200 hover:scale-105"
            title="Jump to start"
          >
            <SkipBack className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={jumpToEnd}
            className="p-2 hover:bg-pink-50 rounded-lg transition-all duration-200 hover:scale-105"
            title="Jump to end"
          >
            <SkipForward className="w-5 h-5 text-gray-700" />
          </button>

          {/* Frame-by-frame navigation controls */}
          <div className="flex items-center space-x-1 border-l border-pink-200 pl-4">
            <button
              onClick={goToPreviousFrame}
              className="p-2 hover:bg-pink-50 rounded-lg transition-all duration-200 hover:scale-105"
              title="Previous frame"
              disabled={getCurrentFrameIndex() <= 0}
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            
            <div className="text-xs text-gray-600 min-w-[80px] text-center bg-pink-50 px-2 py-1 rounded">
              Frame: {getCurrentFrameIndex() + 1}/{getTotalFrames()}
            </div>
            
            <button
              onClick={goToNextFrame}
              className="p-2 hover:bg-pink-50 rounded-lg transition-all duration-200 hover:scale-105"
              title="Next frame"
              disabled={getCurrentFrameIndex() >= getTotalFrames() - 1}
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Frame view toggle */}
          <button
            onClick={() => setShowFrameView(!showFrameView)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
              showFrameView
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                : "bg-pink-50 text-pink-700 hover:bg-pink-100"
            }`}
            title="Toggle frame thumbnails"
          >
            {showFrameView ? "Hide Frames" : "Show Frames"}
          </button>
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2 bg-pink-50 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-pink-500" />
            <span className="font-medium">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
          <div className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Timeline Track */}
      <div
        className="timeline-track-container relative rounded-xl cursor-pointer select-none shadow-inner border border-pink-200 overflow-hidden"
        style={{
          height: 88 + (blurAreaHeight - 28),
          background: 'linear-gradient(to right, rgb(243 244 246), rgb(249 250 251))',
        }}
        onClick={handleTimelineClick}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseLeave={handleTimelineMouseLeave}
      >
        {/* Blur overlay area */}
        <div
          className="absolute top-0 left-0 right-0 bg-pink-50 rounded-t-xl border-b border-pink-200"
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
          className="timeline-track absolute inset-x-0 bg-transparent"
          style={{
            top: timelineTrackTop,
            bottom: 4,
            left: 4,
            right: 4,
          }}
        >
          {/* Video Segments with Integrated Frame Thumbnails */}
          {videos.map((video, index) => {
            const { leftPercent, widthPercent } = getVideoPosition(video);
            const isSelected = video.id === selectedVideoId;
            const frames = videoFrames.get(video.id) || [];

            // Generate distinct colors for fallback when no frames
            const colors = [
              "from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600",
              "from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
              "from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700",
              "from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600",
              "from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700",
              "from-pink-300 to-pink-400 hover:from-pink-400 hover:to-pink-500",
            ];
            const colorClass = colors[index % colors.length];

            return (
              <div
                key={video.id}
                className={`
                  video-segment absolute cursor-pointer transition-all duration-300 shadow-md overflow-hidden rounded-lg
                  ${
                    isSelected
                      ? "ring-2 ring-pink-400 shadow-lg z-30"
                      : "hover:shadow-lg z-20"
                  }
                `}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  top: 4,
                  bottom: 4,
                  marginLeft: index > 0 ? "1px" : "0",
                }}
                onClick={(e) => handleVideoClick(video, e)}
                title={`${video.file.name} (${formatTime(video.trimEnd || video.duration)} ${video.trimStart || video.trimEnd ? "trimmed" : "full"})`}
              >
                {/* Frame Thumbnails or Loading State */}
                {showFrameView && frames.length > 0 ? (
                  /* Show frame thumbnails as navigation */
                  <div className="absolute inset-0 flex overflow-hidden rounded-lg">
                    {frames.map((frame, frameIndex) => {
                      const frameWidth = 100 / frames.length;
                      const isCurrentFrame = Math.abs((frame.time + video.startTime) - currentTime) < 0.25;
                      
                      return (
                        <div
                          key={frameIndex}
                          className={`relative cursor-pointer transition-all duration-200 border-r border-white/30 last:border-r-0 ${
                            isCurrentFrame ? 'ring-2 ring-pink-400 ring-inset' : 'hover:brightness-110'
                          }`}
                          style={{
                            width: `${frameWidth}%`,
                            height: '100%',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSeek(frame.time + video.startTime);
                            onVideoSelect(video.id);
                          }}
                          title={`${video.file.name} - Frame at ${formatTime(frame.time + video.startTime)}`}
                        >
                          <img
                            src={frame.thumbnail}
                            alt={`Frame at ${frame.time}s`}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                          {/* Current time indicator */}
                          {isCurrentFrame && (
                            <div className="absolute inset-0 bg-pink-400/20 pointer-events-none"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : showFrameView && frames.length === 0 ? (
                  /* Loading state with progress */
                  <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r ${colorClass} rounded-lg`}>
                    <div className="text-center text-white">
                      {(() => {
                        const progress = extractionProgress.get(video.id);
                        return progress ? (
                          <div className="space-y-1">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <div className="text-xs">
                              {progress.current}/{progress.total}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <div className="text-xs">Loading...</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  /* Fallback: Traditional colored segments */
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} rounded-lg`}></div>
                    {/* Video text content - adaptive based on segment width */}
                    {widthPercent > 15 ? (
                      <>
                        <div className={`absolute left-2 right-2 top-1 text-xs text-white font-semibold truncate drop-shadow-sm z-10`}>
                          {video.file.name}
                        </div>
                        <div className={`absolute left-2 right-2 bottom-1 text-xs text-white/90 font-medium drop-shadow-sm z-10`}>
                          {formatTime((video.trimEnd || video.duration) - (video.trimStart || 0))}
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-1 flex items-center justify-center z-10">
                        <div className="text-xs text-white font-medium bg-black/40 px-1.5 py-0.5 rounded shadow-sm">
                          {formatTime((video.trimEnd || video.duration) - (video.trimStart || 0))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Video Number Badge */}
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center z-50 shadow-lg">
                  <span className="text-xs font-bold text-gray-700">
                    {index + 1}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator */}
          {totalDuration > 0 && (
            <div
              className="timeline-scrubber absolute top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600 z-50 shadow-lg cursor-grab active:cursor-grabbing rounded-full"
              style={{ left: getCurrentPosition }}
            >
              <div className="absolute -top-2 -left-1 w-4 h-4 bg-pink-500 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white" />
              <div className="absolute -top-8 -left-10 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-pink-400 font-medium">
                {formatTime(currentTime)}
                {showFrameView && (
                  <div className="text-pink-200 text-xs mt-0.5">
                    Frame {getCurrentFrameIndex() + 1}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hover Position Indicator */}
          {hoverPosition !== null && totalDuration > 0 && !isDragging && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-pink-400 z-45 opacity-70 transition-all duration-200 rounded-full"
              style={{ left: `${hoverPosition}%` }}
            >
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-pink-400 rounded-full shadow-md border border-white" />
              <div className="absolute -top-7 -left-10 bg-pink-400 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg border border-pink-300 font-medium">
                {formatTime((hoverPosition / 100) * totalDuration)}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Ruler */}
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-600 dark:to-gray-700 rounded-b-xl border-t border-gray-300 dark:border-gray-500">
          {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }, (_, i) => {
            const time = i * 5;
            const position = (time / totalDuration) * 100;

            return (
              <div
                key={i}
                className="absolute bottom-0 w-px bg-gray-400 dark:bg-gray-500 opacity-60"
                style={{ left: `${position}%` }}
              >
                <div className="absolute -bottom-6 -left-6 text-xs text-gray-500 dark:text-gray-400 font-medium bg-white dark:bg-gray-800 px-1 rounded">
                  {formatTime(time)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Video Info */}
      {selectedVideoId && videos.find((v) => v.id === selectedVideoId) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200 dark:border-pink-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-pink-900 dark:text-pink-100">
                  {videos.find((v) => v.id === selectedVideoId)?.file.name}
                </h4>
                <p className="text-sm text-pink-700 dark:text-pink-300">
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
            <div className="text-sm text-pink-600 dark:text-pink-400 bg-white dark:bg-pink-900/30 px-3 py-1 rounded-full font-medium">
              Selected for editing
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
