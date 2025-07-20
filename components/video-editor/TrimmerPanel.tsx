"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Scissors, Check, X, RotateCcw, Play, Pause } from "lucide-react";
import type { VideoSequenceItem } from "@/types/video";

interface TrimmerPanelProps {
  video: VideoSequenceItem;
  onSave: (startTime: number, endTime: number) => void;
  onClose: () => void;
}

export const TrimmerPanel: React.FC<TrimmerPanelProps> = ({
  video,
  onSave,
  onClose,
}) => {
  // Initialize trim values - use existing trim or full duration
  const [startTime, setStartTime] = useState(video.trimStart || 0);
  const [endTime, setEndTime] = useState(video.trimEnd || video.duration);

  // Internal playback state - start at trim start if exists
  const [currentTime, setCurrentTime] = useState(video.trimStart || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [frames, setFrames] = useState<{ time: number; src: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const extractionAbortRef = useRef<AbortController | null>(null);

  // Update local state when video changes
  useEffect(() => {
    const newStartTime = video.trimStart || 0;
    const newEndTime = video.trimEnd || video.duration;
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    // Set current time to the start of the trim range
    setCurrentTime(newStartTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newStartTime;
    }
  }, [video.id, video.trimStart, video.trimEnd, video.duration]);

  // Create video element for trimmer preview and sync currentTime
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.src = video.url;
      videoEl.currentTime = currentTime;

      // Ensure the video seeks to the correct time
      const handleLoadedData = () => {
        if (videoEl) {
          videoEl.currentTime = currentTime;
        }
      };

      videoEl.addEventListener("loadeddata", handleLoadedData);

      return () => {
        videoEl.removeEventListener("loadeddata", handleLoadedData);
      };
    }
  }, [video.url, currentTime]);

  // Handle video playback within trim bounds
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (isPlaying) {
      // Start playback from current time, but constrain to trim bounds
      const playFromTime = Math.max(startTime, Math.min(currentTime, endTime));
      video.currentTime = playFromTime;
      setCurrentTime(playFromTime);

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(console.error);
      }

      // Monitor playback and stop at end trim
      const handleTimeUpdate = () => {
        const videoCurrentTime = video.currentTime;

        if (videoCurrentTime >= endTime) {
          video.pause();
          setIsPlaying(false);
          setCurrentTime(endTime);
          return;
        }

        if (videoCurrentTime < startTime) {
          video.currentTime = startTime;
          setCurrentTime(startTime);
          return;
        }

        setCurrentTime(videoCurrentTime);
      };

      video.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    } else {
      video.pause();
    }
  }, [isPlaying, startTime, endTime, currentTime]);

  // Generate frames for timeline using advanced extraction
  useEffect(() => {
    const extractFrames = async () => {
      if (!video.url || video.duration === 0) {
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
        const frameCount = 12; // Number of frames to extract
        const targetWidth = 120;
        const videoUrl = video.url;
        const extractedFrames: { time: number; src: string }[] = [];

        // Create multiple video elements for parallel processing
        const videoPool = Array(3)
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

        // Wait for all videos to load metadata
        await Promise.all(
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
        );

        if (abortSignal.aborted) return;

        // Calculate dimensions
        const aspectRatio = videoPool[0].videoWidth / videoPool[0].videoHeight;
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
          vid: HTMLVideoElement,
          canvas: HTMLCanvasElement,
          ctx: CanvasRenderingContext2D | null,
          time: number
        ): Promise<{ time: number; src: string } | null> => {
          if (!ctx || abortSignal.aborted) return null;

          return new Promise((resolve) => {
            const timeout = setTimeout(() => {
              resolve(null);
            }, 2000);

            const seekHandler = () => {
              clearTimeout(timeout);
              try {
                ctx.drawImage(vid, 0, 0, targetWidth, targetHeight);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                resolve({ time, src: dataUrl });
              } catch {
                resolve(null);
              }
            };

            vid.addEventListener("seeked", seekHandler, { once: true });
            vid.currentTime = time;
          });
        };

        // Extract frames in batches
        const frameTimes = Array.from(
          { length: frameCount },
          (_, i) => (video.duration / (frameCount - 1)) * i
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
            (f): f is { time: number; src: string } => f !== null
          );

          extractedFrames.push(...validFrames);

          // Update UI progressively
          if (!abortSignal.aborted) {
            setFrames([...extractedFrames]);
          }
        }

        // Clean up video elements
        videoPool.forEach((vid) => {
          vid.src = "";
          vid.load();
        });

        if (!abortSignal.aborted) {
          setFrames(extractedFrames);
        }
      } catch (error) {
        if (!abortSignal.aborted) {
          console.error("Frame extraction failed:", error);
          setFrames([]);
        }
      } finally {
        if (!abortSignal.aborted) {
          setIsProcessing(false);
        }
      }
    };

    extractFrames();

    return () => {
      // Cleanup on unmount
      if (extractionAbortRef.current) {
        extractionAbortRef.current.abort();
      }
    };
  }, [video.url, video.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const getTimelinePosition = (time: number) => {
    return (time / video.duration) * 100;
  };

  const getTimeFromPosition = (position: number) => {
    return (position / 100) * video.duration;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const time = Math.max(
      0,
      Math.min(video.duration, getTimeFromPosition(position))
    );

    // Constrain the seek to within trim bounds
    const constrainedTime = Math.max(startTime, Math.min(time, endTime));
    setCurrentTime(constrainedTime);
    if (videoRef.current) {
      videoRef.current.currentTime = constrainedTime;
    }
  };

  const handlePlay = () => {
    // When play is pressed, if current time is outside trim range, start from trim start
    if (currentTime < startTime || currentTime >= endTime) {
      setCurrentTime(startTime);
      if (videoRef.current) {
        videoRef.current.currentTime = startTime;
      }
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSave = () => {
    onSave(startTime, endTime);
  };

  const handleReset = () => {
    const newStart = 0;
    const newEnd = video.duration;
    setStartTime(newStart);
    setEndTime(newEnd);
    setCurrentTime(newStart);
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleHandleMouseDown = (
    handle: "start" | "end",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(handle);
    setDragStartX(e.clientX);
    setDragStartValue(handle === "start" ? startTime : endTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX;
      const deltaPosition = (deltaX / rect.width) * 100;
      const deltaTime = (deltaPosition / 100) * video.duration;
      const newTime = Math.max(
        0,
        Math.min(video.duration, dragStartValue + deltaTime)
      );

      if (isDragging === "start") {
        const constrainedStart = Math.max(0, Math.min(newTime, endTime - 0.1));
        setStartTime(constrainedStart);

        // If current time is before new start, move it to start
        if (currentTime < constrainedStart) {
          setCurrentTime(constrainedStart);
          if (videoRef.current) {
            videoRef.current.currentTime = constrainedStart;
          }
        }
      } else {
        const constrainedEnd = Math.min(
          video.duration,
          Math.max(newTime, startTime + 0.1)
        );
        setEndTime(constrainedEnd);

        // If current time is after new end, move it to end
        if (currentTime > constrainedEnd) {
          setCurrentTime(constrainedEnd);
          if (videoRef.current) {
            videoRef.current.currentTime = constrainedEnd;
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging,
    dragStartX,
    dragStartValue,
    startTime,
    endTime,
    video.duration,
    currentTime,
  ]);

  const handleApplyTrim = () => {
    handleSave();
    onClose();
  };

  const handleResetTrim = () => {
    handleReset();
  };

  const handleQuickSeek = (time: number) => {
    // Constrain the seek to within trim bounds
    const constrainedTime = Math.max(startTime, Math.min(time, endTime));
    setCurrentTime(constrainedTime);
    if (videoRef.current) {
      videoRef.current.currentTime = constrainedTime;
    }
  };

  const trimmedDuration = endTime - startTime;
  const currentPositionPercent = getTimelinePosition(currentTime);
  const startPositionPercent = getTimelinePosition(startTime);
  const endPositionPercent = getTimelinePosition(endTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pink-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Scissors className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Trim Video
              </h3>
              <p className="text-sm text-gray-600">
                {video.file.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              muted
              playsInline
            />

            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="p-4 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Time Display */}
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-sm font-mono backdrop-blur-sm">
              {formatTime(currentTime)} / {formatTime(video.duration)}
            </div>
          </div>

          {/* Trim Timeline */}
          <div className="space-y-3 pb-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Trim Range
              </span>
              <span className="text-gray-700 font-medium">
                {formatTime(trimmedDuration)} selected
              </span>
            </div>

            {/* Timeline Container */}
            <div
              ref={timelineRef}
              className="relative h-20 bg-gray-800 rounded-lg cursor-pointer select-none overflow-hidden border border-pink-200"
              onClick={handleTimelineClick}
            >
              {/* Frame Thumbnails Background */}
              {frames.length === 0 ? (
                <div className="w-full h-20 flex items-center justify-center text-gray-500 text-sm">
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading timeline...
                    </div>
                  ) : (
                    "Processing video frames..."
                  )}
                </div>
              ) : (
                <>
                  {/* Render frames as background */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: 12 }).map((_, index) => {
                      const frame = frames[index];

                      return (
                        <div key={index} className="flex-1 relative">
                          {frame ? (
                            <Image
                              src={frame.src}
                              alt={`Frame ${index}`}
                              className="w-full h-20 object-cover"
                              width={120}
                              height={80}
                              draggable={false}
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-20 bg-gray-700 animate-pulse" />
                          )}
                          {/* Frame time label */}
                          {frame && (
                            <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-70 px-1 rounded">
                              {formatTime(frame.time)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Selected range overlay and handles */}
              {frames.length > 0 && (
                <>
                  {/* Dimmed areas outside selection */}
                  <div
                    className="absolute top-0 h-full bg-black/60 pointer-events-none"
                    style={{
                      left: "0%",
                      width: `${startPositionPercent}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 h-full bg-black/60 pointer-events-none"
                    style={{
                      left: `${endPositionPercent}%`,
                      width: `${100 - endPositionPercent}%`,
                    }}
                  />

                  {/* Selected range highlight border */}
                  <div
                    className="absolute top-0 h-full border-l-2 border-r-2 border-pink-400 bg-pink-500 opacity-20 pointer-events-none"
                    style={{
                      left: `${startPositionPercent}%`,
                      width: `${endPositionPercent - startPositionPercent}%`,
                    }}
                  />
                </>
              )}

              {/* Current Time Indicator */}
              <div
                className="absolute top-0 h-full w-0.5 bg-red-500 z-30"
                style={{ left: `${currentPositionPercent}%` }}
              >
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg" />
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg" />
              </div>

              {/* Start Handle */}
              <div
                className="absolute top-0 h-full w-6 bg-pink-600 cursor-ew-resize z-20 flex items-center justify-center group hover:bg-pink-700 transition-colors shadow-lg"
                style={{
                  left: `${startPositionPercent}%`,
                  transform: "translateX(-50%)",
                }}
                onMouseDown={(e) => handleHandleMouseDown("start", e)}
              >
                <div className="w-1 h-12 bg-white rounded group-hover:h-14 transition-all shadow-sm" />
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-pink-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {formatTime(startTime)}
                </div>
              </div>

              {/* End Handle */}
              <div
                className="absolute top-0 h-full w-6 bg-pink-600 cursor-ew-resize z-20 flex items-center justify-center group hover:bg-pink-700 transition-colors shadow-lg"
                style={{
                  left: `${endPositionPercent}%`,
                  transform: "translateX(-50%)",
                }}
                onMouseDown={(e) => handleHandleMouseDown("end", e)}
              >
                <div className="w-1 h-12 bg-white rounded group-hover:h-14 transition-all shadow-sm" />
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-pink-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {formatTime(endTime)}
                </div>
              </div>

              {/* Time markers */}
              <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                0:00
              </div>
              <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
                {formatTime(video.duration)}
              </div>
            </div>

            {/* Trim Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-pink-50 rounded-lg p-3">
                <div className="text-gray-600 mb-1">
                  Start Time
                </div>
                <div className="font-mono text-lg text-pink-600">
                  {formatTime(startTime)}
                </div>
                <button
                  onClick={() => handleQuickSeek(startTime)}
                  className="mt-1 text-xs text-pink-600 hover:underline"
                >
                  Seek to start
                </button>
              </div>

              <div className="bg-pink-50 rounded-lg p-3">
                <div className="text-gray-600 mb-1">
                  End Time
                </div>
                <div className="font-mono text-lg text-pink-600">
                  {formatTime(endTime)}
                </div>
                <button
                  onClick={() => handleQuickSeek(endTime)}
                  className="mt-1 text-xs text-pink-600 hover:underline"
                >
                  Seek to end
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-pink-200">
            <button
              onClick={handleResetTrim}
              className="px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTrim}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply Trim</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
