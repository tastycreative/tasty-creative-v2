"use client";

import React, { useMemo, useCallback, useState } from "react";
import { VideoSequenceItem, SelectiveBlurRegion } from "@/types/video";
import { Play, Pause, SkipBack, SkipForward, Clock } from "lucide-react";
import { BlurTimelineOverlay } from "./BlurTimelineOverlay";

interface TimelineProps {
  videos: VideoSequenceItem[];
  currentTime: number;
  totalDuration: number;
  selectedVideoId: string | null;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onVideoSelect: (id: string) => void;
  onVideoReorder: (dragIndex: number, hoverIndex: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onBlurRegionClick?: (videoId: string, regionId: string) => void;
  editingBlur?: { videoId: string; regionId: string } | null;
}

export const Timeline: React.FC<TimelineProps> = ({
  videos,
  currentTime,
  totalDuration,
  selectedVideoId,
  isPlaying,
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

      // Don't interfere with blur overlays or video segments - let them handle their own clicks
      if (target.closest(".blur-overlay") || target.closest(".video-segment")) {
        return;
      }

      // Only allow seeking when clicking on empty timeline areas
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));

      // Check if the click is within any video segment bounds
      const clickTime = percentage * totalDuration;

      // Find clicked video using cumulative timing
      let cumulativeTime = 0;
      let clickedVideo: VideoSequenceItem | undefined;
      for (const video of videos) {
        const speedMultiplier = video.effects.speed || 1;
        // Account for trimming in timeline click detection
        const trimStart = video.trimStart || 0;
        const trimEnd = video.trimEnd || video.duration;
        const trimmedDuration = trimEnd - trimStart;
        const effectiveDuration = trimmedDuration / speedMultiplier;

        if (
          clickTime >= cumulativeTime &&
          clickTime < cumulativeTime + effectiveDuration
        ) {
          clickedVideo = video;
          break;
        }

        cumulativeTime += effectiveDuration;
      }

      // If we clicked on a video segment area but not on the actual segment element,
      // don't seek (this handles edge cases where the click goes through)
      if (clickedVideo) {
        return;
      }

      // Only seek when clicking in empty timeline space
      const newTime = percentage * totalDuration;

      setHoverPosition(null);

      // Start dragging mode for timeline interactions
      setIsDragging(true);

      // Immediately seek to clicked position
      onSeek(newTime);

      e.preventDefault();
    },
    [totalDuration, onSeek, videos]
  );

  const handleTimelineMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Check if we're hovering over a blur overlay or its controls
      const target = e.target as HTMLElement;
      const isBlurOverlay =
        target.closest(".blur-overlay") ||
        target.closest("[data-blur-controls]");

      const rect = e.currentTarget.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));

      if (isDragging) {
        // Update time while dragging
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
        if (timelineContainer) {
          const rect = timelineContainer.getBoundingClientRect();
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

      // Calculate the click position within the video and seek to that time
      const videoElement = e.currentTarget;
      const rect = videoElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const videoWidth = rect.width;

      // Calculate the percentage within this video segment
      const percentage = Math.max(0, Math.min(1, clickX / videoWidth));

      // Calculate the actual time within the video
      const timeWithinVideo = percentage * video.duration;
      const absoluteTime = video.startTime + timeWithinVideo;

      // Seek to that position
      onSeek(absoluteTime);
    },
    [onVideoSelect, onSeek]
  );

  const jumpToStart = useCallback(() => {
    onSeek(0);
  }, [onSeek]);

  const jumpToEnd = useCallback(() => {
    onSeek(totalDuration);
  }, [onSeek, totalDuration]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={jumpToStart}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105"
            title="Jump to start"
          >
            <SkipBack className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105"
            title="Jump to end"
          >
            <SkipForward className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="font-medium">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
          <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Timeline Track */}
      <div
        className="timeline-track-container relative bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-xl cursor-pointer select-none shadow-inner border border-gray-200 dark:border-gray-600 overflow-hidden"
        style={{
          height: 88 + (blurAreaHeight - 28), // Dynamic height based on blur regions
        }}
        onClick={handleTimelineClick}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseLeave={handleTimelineMouseLeave}
      >
        {/* Blur overlay area */}
        <div
          className="absolute top-0 left-0 right-0 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl border-b border-gray-200 dark:border-gray-600"
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
            top: timelineTrackTop, // Start after blur overlay area
            bottom: 4,
            left: 4,
            right: 4,
          }}
        >
          {/* Video Segments */}
          {videos.map((video, index) => {
            const { leftPercent, widthPercent } = getVideoPosition(video);
            const isSelected = video.id === selectedVideoId;

            // Generate distinct colors for each video segment
            const colors = [
              "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
              "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
              "from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
              "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
              "from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
              "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
            ];
            const colorClass = colors[index % colors.length];

            return (
              <div
                key={video.id}
                className={`
                  video-segment absolute cursor-pointer transition-all duration-300 shadow-md overflow-hidden
                  ${
                    isSelected
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 ring-2 ring-green-300 shadow-lg z-30"
                      : `bg-gradient-to-r ${colorClass} hover:shadow-lg z-20`
                  }
                `}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  top: 4,
                  bottom: 4,
                  marginLeft: index > 0 ? "1px" : "0", // Small gap between segments
                }}
                onClick={(e) => handleVideoClick(video, e)}
                title={`${video.file.name} (${formatTime(video.trimEnd || video.duration)} ${video.trimStart || video.trimEnd ? "trimmed" : "full"})`}
              >
                {/* Video text content - adaptive based on segment width and selection state */}
                {widthPercent > 15 ? (
                  /* Wide segments: show both name and duration separately */
                  <>
                    <div
                      className={`absolute ${isSelected ? "left-1 right-1" : "left-3 right-3"} ${isSelected ? "top-1" : "top-1.5"} text-xs text-white font-semibold truncate drop-shadow-sm`}
                    >
                      {video.file.name}
                    </div>
                    <div
                      className={`absolute ${isSelected ? "left-1 right-1" : "left-3 right-3"} ${isSelected ? "bottom-1" : "bottom-1.5"} text-xs text-white/90 font-medium drop-shadow-sm`}
                    >
                      {formatTime(
                        (video.trimEnd || video.duration) -
                          (video.trimStart || 0)
                      )}
                    </div>
                  </>
                ) : widthPercent > 8 ? (
                  /* Medium segments: show name and duration stacked compactly */
                  <div
                    className={`absolute ${isSelected ? "left-0.5 right-0.5" : "left-2 right-2"} ${isSelected ? "top-0.5 bottom-0.5" : "top-1 bottom-1"} flex flex-col justify-center items-center text-center`}
                  >
                    <div className="text-xs text-white font-semibold truncate max-w-full leading-tight drop-shadow-sm">
                      {video.file.name.split(".")[0]}{" "}
                      {/* Remove extension for space */}
                    </div>
                    <div className="text-xs text-white/90 font-medium leading-tight drop-shadow-sm">
                      {formatTime(
                        (video.trimEnd || video.duration) -
                          (video.trimStart || 0)
                      )}
                    </div>
                  </div>
                ) : (
                  /* Narrow segments: show only duration in center with background */
                  <div
                    className={`absolute ${isSelected ? "inset-0.5" : "inset-1"} flex items-center justify-center`}
                  >
                    <div
                      className={`text-xs text-white font-medium bg-black/40 ${isSelected ? "px-0.5 py-0.5" : "px-1.5 py-0.5"} rounded shadow-sm border border-white/20`}
                    >
                      {formatTime(
                        (video.trimEnd || video.duration) -
                          (video.trimStart || 0)
                      )}
                    </div>
                  </div>
                )}

                {/* Video Number Badge */}
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center z-40 shadow-lg">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
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
              <div className="absolute -top-2 -left-1 w-4 h-4 bg-red-500 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white" />
              <div className="absolute -top-8 -left-10 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-red-400 font-medium">
                {formatTime(currentTime)}
              </div>
            </div>
          )}

          {/* Hover Position Indicator */}
          {hoverPosition !== null && totalDuration > 0 && !isDragging && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-45 opacity-70 transition-all duration-200 rounded-full"
              style={{ left: `${hoverPosition}%` }}
            >
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-400 rounded-full shadow-md border border-white" />
              <div className="absolute -top-7 -left-10 bg-blue-400 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg border border-blue-300 font-medium">
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
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  {videos.find((v) => v.id === selectedVideoId)?.file.name}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
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
            <div className="text-sm text-green-600 dark:text-green-400 bg-white dark:bg-green-900/30 px-3 py-1 rounded-full font-medium">
              Selected for editing
            </div>
          </div>
        </div>
      )}
    </div>
  );
};