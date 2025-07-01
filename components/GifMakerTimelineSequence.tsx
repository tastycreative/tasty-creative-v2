import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Settings2, Plus, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineClip } from "@/utils/gifMakerUtils";

type TimelineSequenceProps = {
  timelineClips: TimelineClip[];
  onTimelineClipsChange: (clips: TimelineClip[]) => void;
  currentTime?: number;
  isPlaying?: boolean;
  onCurrentTimeChange?: (time: number) => void;
  onPlayPause?: () => void;
  targetWidth?: number;
  setMaxDuration: (duration: number) => void;
  maxDuration: number;
  setIsGifSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAddClip?: () => void;
  hasAvailableVideos?: boolean;
  onDirectUpload?: (file: File) => void;
};

const GifMakerTimelineSequence = ({
  timelineClips,
  onTimelineClipsChange,
  currentTime = 0,
  isPlaying = true,
  onCurrentTimeChange,
  onPlayPause,
  targetWidth = 120,
  maxDuration,
  setIsGifSettingsOpen,
  onAddClip,
  hasAvailableVideos = false,
  onDirectUpload,
}: TimelineSequenceProps) => {
  const [frames, setFrames] = useState<{ time: number; src: string; clipIndex: number }[]>([]);
  const [isDragging, setIsDragging] = useState<{ type: "clip" | "current"; clipIndex?: number } | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(
    null
  );
  const timelineRef = useRef<HTMLDivElement>(null);
  const extractionAbortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total timeline duration
  const totalDuration =
    timelineClips.length > 0
      ? Math.max(...timelineClips.map((clip) => clip.timelineEndTime))
      : 0;

  const frameCount = 12; // More frames for timeline view

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get current active clip based on current time
  const getCurrentClip = () => {
    return timelineClips.find(
      (clip) =>
        currentTime >= clip.timelineStartTime &&
        currentTime <= clip.timelineEndTime
    );
  };

  // Extract frames from all clips
  const extractFrames = useCallback(async () => {
    if (timelineClips.length === 0 || totalDuration === 0) {
      setFrames([]);
      return;
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
      const allFrames: { time: number; src: string; clipIndex: number }[] = [];

      // Extract frames from each clip
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

            video.addEventListener("loadedmetadata", () => {
              clearTimeout(timeoutId);
              resolve();
            }, { once: true });

            video.addEventListener("error", () => {
              clearTimeout(timeoutId);
              reject(new Error("Video loading error"));
            }, { once: true });

            video.load();
          });

          if (abortSignal.aborted) break;

          // Calculate aspect ratio and canvas dimensions
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
          const framesPerClip = Math.min(4, Math.max(2, Math.ceil(clipDuration)));
          
          for (let i = 0; i < framesPerClip; i++) {
            if (abortSignal.aborted) break;

            const timeInClip = clip.startTime + (clipDuration / (framesPerClip - 1)) * i;
            const timelineTime = clip.timelineStartTime + (clipDuration / (framesPerClip - 1)) * i;

            await new Promise<void>((resolve) => {
              const seekHandler = () => {
                try {
                  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
                  allFrames.push({ 
                    time: timelineTime, 
                    src: dataUrl, 
                    clipIndex 
                  });
                } catch (error) {
                  console.error(`Error extracting frame at ${timeInClip}s:`, error);
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
      allFrames.sort((a, b) => a.time - b.time);

      if (!abortSignal.aborted) {
        setFrames(allFrames);
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
  }, [timelineClips, totalDuration, targetWidth]);

  // Extract frames when clips change
  useEffect(() => {
    if (timelineClips.length > 0) {
      extractFrames();
    }

    return () => {
      if (extractionAbortRef.current) {
        extractionAbortRef.current.abort();
      }
    };
  }, [extractFrames]);

  // Handle clip removal
  const handleRemoveClip = (clipIndex: number) => {
    const newClips = timelineClips.filter((_, index) => index !== clipIndex);

    // Recalculate timeline positions
    let currentTime = 0;
    const updatedClips = newClips.map((clip, index) => {
      const clipDuration = clip.endTime - clip.startTime;
      const newClip = {
        ...clip,
        clipIndex: index,
        timelineStartTime: currentTime,
        timelineEndTime: currentTime + clipDuration,
      };
      currentTime += clipDuration;
      return newClip;
    });

    onTimelineClipsChange(updatedClips);
  };

  // Handle clip time editing
  const handleClipTimeChange = (
    clipIndex: number,
    startTime: number,
    endTime: number
  ) => {
    const newClips = [...timelineClips];
    const clip = newClips[clipIndex];
    const oldDuration = clip.endTime - clip.startTime;
    const newDuration = endTime - startTime;
    const durationDiff = newDuration - oldDuration;

    // Update the clip
    newClips[clipIndex] = {
      ...clip,
      startTime,
      endTime,
      timelineEndTime: clip.timelineEndTime + durationDiff,
    };

    // Update subsequent clips' timeline positions
    for (let i = clipIndex + 1; i < newClips.length; i++) {
      newClips[i] = {
        ...newClips[i],
        timelineStartTime: newClips[i].timelineStartTime + durationDiff,
        timelineEndTime: newClips[i].timelineEndTime + durationDiff,
      };
    }

    onTimelineClipsChange(newClips);
  };

  // Handle timeline click
  const handleTimelineClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!timelineRef.current || isDragging) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = (clickX / rect.width) * totalDuration;

    onCurrentTimeChange?.(Math.max(0, Math.min(totalDuration, clickTime)));
  };

  // Handle direct file upload
  const handleDirectUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onDirectUpload) {
        onDirectUpload(file);
      }
      // Reset the input value so the same file can be selected again
      event.target.value = "";
    },
    [onDirectUpload]
  );

  // Calculate positions as percentages
  const currentPercent =
    totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      {/* Hidden file input */}
      <input
        type="file"
        accept="video/*"
        onChange={handleDirectUpload}
        style={{ display: "none" }}
        ref={fileInputRef}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-gray-300 font-medium">Timeline Sequence</h3>
          <span className="text-sm text-gray-400">
            {timelineClips.length} clips • {formatTime(totalDuration)} total
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Loading timeline...
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full transition-colors"
            title="Upload video"
          >
            <Upload className="w-4 h-4" />
          </button>
          {hasAvailableVideos && (
            <button
              onClick={onAddClip}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full transition-colors"
              title="Add video from grid"
            >
              <Plus className="w-4 h-4" />
            </button>
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
            disabled={isProcessing || timelineClips.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
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
        <span>Total: {formatTime(totalDuration)}</span>
        <span>Current: {formatTime(currentTime)}</span>
        {getCurrentClip() && (
          <span>Clip: {getCurrentClip()?.file.name.slice(0, 20)}</span>
        )}
      </div>

      {/* Clips List */}
      {timelineClips.length > 0 && (
        <div className="mb-4 max-h-32 overflow-y-auto">
          <div className="space-y-1">
            {timelineClips.map((clip, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded border ${
                  selectedClipIndex === index
                    ? "border-blue-400 bg-blue-400/10"
                    : "border-gray-600 bg-gray-800/50"
                }`}
                onClick={() =>
                  setSelectedClipIndex(
                    selectedClipIndex === index ? null : index
                  )
                }
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs text-gray-400 w-6">{index + 1}</span>
                  <span className="text-sm text-white truncate flex-1">
                    {clip.file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(clip.endTime - clip.startTime)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveClip(index);
                  }}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Container */}
      <div className="relative">
        <div
          ref={timelineRef}
          className="relative flex rounded-md overflow-hidden bg-gray-800 border border-gray-600 cursor-pointer min-h-[80px]"
          onClick={handleTimelineClick}
        >
          {timelineClips.length === 0 ? (
            <div className="w-full h-20 flex items-center justify-center text-gray-500 text-sm">
              <div className="flex items-center gap-3">
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Video
                </button>

                {/* Add from grid button (if available) */}
                {hasAvailableVideos && (
                  <button
                    onClick={onAddClip}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add from Grid
                  </button>
                )}
              </div>
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
              {/* Render frames across timeline */}
              {frames.map((frame, index) => {
                const leftPercent = totalDuration > 0 ? (frame.time / totalDuration) * 100 : 0;
                const clip = timelineClips[frame.clipIndex];
                
                return (
                  <div
                    key={index}
                    className="absolute top-0 h-20"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${100 / frames.length}%`,
                    }}
                  >
                    <img
                      src={frame.src}
                      alt={`Frame ${index}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {/* Clip boundary indicators */}
                    {frame.time === clip.timelineStartTime && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400"></div>
                    )}
                    {Math.abs(frame.time - clip.timelineEndTime) < 0.1 && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-400"></div>
                    )}
                  </div>
                );
              })}

              {/* Clip separators */}
              {timelineClips.map((clip, index) => {
                if (index === timelineClips.length - 1) return null;
                
                const separatorPercent = totalDuration > 0 
                  ? (clip.timelineEndTime / totalDuration) * 100 
                  : 0;
                
                return (
                  <div
                    key={`sep-${index}`}
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
                    style={{ left: `${separatorPercent}%` }}
                  />
                );
              })}
            </>
          )}

          {/* Playhead */}
          {totalDuration > 0 && (
            <div
              className="absolute w-1 h-full bg-white z-50 rounded-sm shadow-lg border border-red-400"
              style={{
                left: `calc(${currentPercent}% - 2px)`,
                transition: "left 0.1s ease-out",
              }}
            />
          )}
        </div>

        {/* Time Markers */}
        {totalDuration > 0 && (
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
            <span>0:00</span>
            <span>{formatTime(totalDuration / 4)}</span>
            <span>{formatTime(totalDuration / 2)}</span>
            <span>{formatTime((3 * totalDuration) / 4)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        )}
      </div>

      {/* Selected Clip Editor */}
      {selectedClipIndex !== null && timelineClips[selectedClipIndex] && (
        <div className="mt-4 p-3 bg-gray-800 rounded border border-blue-400">
          <h4 className="text-sm font-medium text-blue-300 mb-2">
            Edit Clip {selectedClipIndex + 1}:{" "}
            {timelineClips[selectedClipIndex].file.name}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Start Time</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={timelineClips[selectedClipIndex].duration}
                value={timelineClips[selectedClipIndex].startTime}
                onChange={(e) => {
                  const newStart = parseFloat(e.target.value);
                  if (!isNaN(newStart)) {
                    handleClipTimeChange(
                      selectedClipIndex,
                      newStart,
                      timelineClips[selectedClipIndex].endTime
                    );
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">End Time</label>
              <input
                type="number"
                step="0.1"
                min={timelineClips[selectedClipIndex].startTime}
                max={timelineClips[selectedClipIndex].duration}
                value={timelineClips[selectedClipIndex].endTime}
                onChange={(e) => {
                  const newEnd = parseFloat(e.target.value);
                  if (!isNaN(newEnd)) {
                    handleClipTimeChange(
                      selectedClipIndex,
                      timelineClips[selectedClipIndex].startTime,
                      newEnd
                    );
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* File Input for Direct Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleDirectUpload}
        className="hidden"
      />
    </div>
  );
};

export default GifMakerTimelineSequence;
