"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { VideoSequenceItem } from "@/types/video";
import { applyVideoEffects } from "@/lib/videoProcessor";

interface VideoPreviewProps {
  videos: VideoSequenceItem[];
  currentTime: number;
  isPlaying: boolean;
  width?: number;
  height?: number;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videos,
  currentTime,
  isPlaying,
  width = 640,
  height = 360,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const animationFrameRef = useRef<number | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const lastRenderTimeRef = useRef<number>(0);

  // Create video elements for each video file
  useEffect(() => {
    videos.forEach((video) => {
      if (!videoRefs.current[video.id]) {
        const videoElement = document.createElement("video");
        videoElement.src = video.url;
        videoElement.preload = "metadata";
        videoElement.muted = true;
        videoElement.crossOrigin = "anonymous";

        // Track when video is loaded and ready
        videoElement.addEventListener("loadeddata", () => {
          setLoadedVideos((prev) => new Set([...prev, video.id]));
        });

        videoElement.addEventListener("canplay", () => {
          setLoadedVideos((prev) => new Set([...prev, video.id]));
        });

        videoRefs.current[video.id] = videoElement;
      }
    });

    // Cleanup removed videos
    Object.keys(videoRefs.current).forEach((id) => {
      if (!videos.find((v) => v.id === id)) {
        const videoElement = videoRefs.current[id];
        if (videoElement) {
          videoElement.pause();
          videoElement.src = "";
          videoElement.load();
        }
        setLoadedVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        delete videoRefs.current[id];
      }
    });
  }, [videos]);

  // Find current video (memoized to prevent unnecessary re-calculations)
  const getCurrentVideo = useCallback(() => {
    return videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );
  }, [videos, currentTime]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentVideo = getCurrentVideo();

    // Update current video ID
    if (currentVideo?.id !== currentVideoId) {
      setCurrentVideoId(currentVideo?.id || null);
    }

    if (!currentVideo) {
      // Clear canvas and draw placeholder
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No video at current time", width / 2, height / 2);
      return;
    }

    const videoElement = videoRefs.current[currentVideo.id];
    const isVideoLoaded = loadedVideos.has(currentVideo.id);

    if (!videoElement || !isVideoLoaded) {
      // Show loading state only if video is not loaded yet
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Loading video...", width / 2, height / 2);
      return;
    }

    // Calculate video time within the clip (accounting for speed, cumulative timing, and trimming)
    const speedMultiplier = currentVideo.effects.speed || 1;
    
    // Find the cumulative start time for this video
    let cumulativeTime = 0;
    for (const video of videos) {
      if (video.id === currentVideo.id) {
        break;
      }
      const videoSpeedMultiplier = video.effects.speed || 1;
      // Account for trimming in cumulative time calculation
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = trimEnd - trimStart;
      const videoEffectiveDuration = trimmedDuration / videoSpeedMultiplier;
      cumulativeTime += videoEffectiveDuration;
    }
    
    const relativeTime = currentTime - cumulativeTime;
    const videoTime = relativeTime * speedMultiplier;
    
    // Apply trimming - offset by trimStart and constrain within trim bounds
    const trimStart = currentVideo.trimStart || 0;
    const trimEnd = currentVideo.trimEnd || currentVideo.duration;
    const adjustedVideoTime = trimStart + Math.max(0, Math.min(videoTime, trimEnd - trimStart));

    // Only update video time if there's a significant difference to reduce seeking and lag
    const timeDiff = Math.abs(videoElement.currentTime - adjustedVideoTime);
    if (timeDiff > 0.5) { // Increased threshold significantly to reduce lag
      videoElement.currentTime = Math.max(0, Math.min(adjustedVideoTime, videoElement.duration - 0.01));
    }

    // Check if video is ready to render
    if (
      videoElement.readyState >= 2 &&
      videoElement.videoWidth > 0 &&
      videoElement.videoHeight > 0
    ) {
      try {
        // Apply effects and draw to canvas
        applyVideoEffects(
          videoElement,
          canvas,
          currentVideo.effects,
          width,
          height
        );
      } catch (error) {
        console.error("Error applying video effects:", error);
        // Fallback: draw black screen instead of error message to reduce flickering
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(0, 0, width, height);
      }
    }
  }, [
    getCurrentVideo,
    currentVideoId,
    loadedVideos,
    currentTime,
    width,
    height,
    videos,
  ]);

  // Throttled rendering to reduce flickering
  const throttledRender = useCallback(() => {
    const now = Date.now();
    if (now - lastRenderTimeRef.current >= 50) {
      // ~20fps max for better performance
      renderFrame();
      lastRenderTimeRef.current = now;
    }
  }, [renderFrame]);

  // Update canvas with animation frame for smooth rendering
  useEffect(() => {
    const animate = () => {
      throttledRender();
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animate();
    } else {
      throttledRender(); // Render once when paused
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [throttledRender, isPlaying]);

  // Handle video playback state with debouncing
  useEffect(() => {
    const currentVideo = getCurrentVideo();

    // Pause all videos first
    Object.values(videoRefs.current).forEach((videoElement) => {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    });

    // Play current video if needed
    if (currentVideo && isPlaying && loadedVideos.has(currentVideo.id)) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement && videoElement.readyState >= 2) {
        const speedMultiplier = currentVideo.effects.speed || 1;
        
        // Find the cumulative start time for this video
        let cumulativeTime = 0;
        for (const video of videos) {
          if (video.id === currentVideo.id) {
            break;
          }
          const videoSpeedMultiplier = video.effects.speed || 1;
          const videoEffectiveDuration = video.duration / videoSpeedMultiplier;
          cumulativeTime += videoEffectiveDuration;
        }
        
        const relativeTime = currentTime - cumulativeTime;
        const videoTime = relativeTime * speedMultiplier;

        // Set time accurately only if there's a significant difference
        if (Math.abs(videoElement.currentTime - videoTime) > 0.3) { // Increased threshold to reduce lag
          videoElement.currentTime = Math.max(0, Math.min(videoTime, videoElement.duration - 0.01));
        }

        // Play the video
        videoElement.play().catch((error) => {
          // Silently handle play errors to avoid console spam
          if (error.name !== "AbortError") {
            console.error("Error playing video:", error);
          }
        });
      }
    }
  }, [getCurrentVideo, currentTime, isPlaying, loadedVideos, videos]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Preview
        </h3>
        <div className="text-sm text-gray-600">
          {width} × {height}
        </div>
      </div>

      <div
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: `${width}/${height}` }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full object-contain"
        />

        {/* Overlay for current video info */}
        {(() => {
          const currentVideo = videos.find(
            (video) =>
              currentTime >= video.startTime && currentTime < video.endTime
          );

          if (currentVideo) {
            return (
              <div className="absolute top-4 left-4 bg-black/75 text-white px-3 py-1 rounded-lg text-sm">
                {currentVideo.file.name}
              </div>
            );
          }
          return null;
        })()}

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[20px] border-l-gray-700 border-y-[12px] border-y-transparent ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">
            Total Videos:
          </span>
          <span className="ml-2 font-medium text-gray-700">
            {videos.length}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Current:</span>
          <span className="ml-2 font-medium text-gray-700">
            {(() => {
              const currentVideo = videos.find(
                (video) =>
                  currentTime >= video.startTime && currentTime < video.endTime
              );
              return currentVideo ? videos.indexOf(currentVideo) + 1 : "None";
            })()}
          </span>
        </div>
      </div>
    </div>
  );
};
