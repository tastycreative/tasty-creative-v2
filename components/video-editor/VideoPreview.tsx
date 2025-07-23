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
  width = 400,
  height = 400, // Always square
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const animationFrameRef = useRef<number | null>(null);
  const syncAnimationFrameRef = useRef<number | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);

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

    // Apply GifMaker pattern: avoid seeking during playback to prevent lag
    // Only seek when not playing to avoid conflicts with video playback
    if (!isPlaying) {
      const timeDiff = Math.abs(videoElement.currentTime - adjustedVideoTime);
      const threshold = 0.1; // Smaller threshold when not playing for accuracy
      if (timeDiff > threshold) {
        videoElement.currentTime = Math.max(0, Math.min(adjustedVideoTime, videoElement.duration - 0.01));
      }
    }

    // Check if video is ready to render
    if (
      videoElement.readyState >= 2 &&
      videoElement.videoWidth > 0 &&
      videoElement.videoHeight > 0
    ) {
      try {
        // Clear canvas with black background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        
        // Calculate scaling and positioning
        const scale = currentVideo.effects.scale || 1.0;
        const posX = (currentVideo.effects.positionX || 0) * (width / 100);
        const posY = (currentVideo.effects.positionY || 0) * (height / 100);
        
        // Calculate video dimensions maintaining aspect ratio
        const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        let drawWidth = width * scale;
        let drawHeight = height * scale;
        
        // Maintain video aspect ratio within scaled dimensions
        if (videoAspectRatio > 1) {
          // Video is wider than tall
          drawHeight = drawWidth / videoAspectRatio;
        } else {
          // Video is taller than wide
          drawWidth = drawHeight * videoAspectRatio;
        }
        
        // Calculate centered position with offset
        const drawX = (width - drawWidth) / 2 + posX;
        const drawY = (height - drawHeight) / 2 + posY;
        
        // Draw the video
        ctx.drawImage(
          videoElement,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );
        
        // Apply blur effect if needed
        if (currentVideo.effects.blur > 0) {
          ctx.filter = `blur(${currentVideo.effects.blur}px)`;
          ctx.drawImage(
            videoElement,
            drawX,
            drawY,
            drawWidth,
            drawHeight
          );
          ctx.filter = 'none';
        }
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

  // Throttled rendering to reduce flickering while maintaining responsiveness
  const throttledRender = useCallback(() => {
    const now = Date.now();
    const renderInterval = isPlaying ? 33 : 50; // 30fps when playing, 20fps when paused
    if (now - lastRenderTimeRef.current >= renderInterval) {
      renderFrame();
      lastRenderTimeRef.current = now;
    }
  }, [renderFrame, isPlaying]);

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

  // Handle video playback state inspired by GifMaker's approach
  useEffect(() => {
    const currentVideo = getCurrentVideo();

    // Pause all videos first
    Object.values(videoRefs.current).forEach((videoElement) => {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    });

    // Play current video if needed - inspired by GifMakerLivePreview
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
          const trimStart = video.trimStart || 0;
          const trimEnd = video.trimEnd || video.duration;
          const trimmedDuration = trimEnd - trimStart;
          const videoEffectiveDuration = trimmedDuration / videoSpeedMultiplier;
          cumulativeTime += videoEffectiveDuration;
        }
        
        const relativeTime = currentTime - cumulativeTime;
        const videoTime = relativeTime * speedMultiplier;
        const trimStart = currentVideo.trimStart || 0;
        const adjustedVideoTime = trimStart + Math.max(0, Math.min(videoTime, (currentVideo.trimEnd || currentVideo.duration) - trimStart));

        // ONLY set time when NOT playing to avoid seeking conflicts (GifMaker pattern)
        if (!isPlaying && Math.abs(videoElement.currentTime - adjustedVideoTime) > 0.1) {
          videoElement.currentTime = Math.max(0, Math.min(adjustedVideoTime, videoElement.duration - 0.01));
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

  // Add GifMaker-style video synchronization during playback
  useEffect(() => {
    if (!isPlaying) {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
        syncAnimationFrameRef.current = null;
      }
      return;
    }

    const syncVideoTime = () => {
      const currentVideo = getCurrentVideo();
      if (currentVideo && loadedVideos.has(currentVideo.id)) {
        const videoElement = videoRefs.current[currentVideo.id];
        
        if (videoElement && !videoElement.paused && !videoElement.ended) {
          const now = performance.now();
          
          // Throttle updates to every 100ms like GifMaker
          if (now - lastSyncTimeRef.current >= 100) {
            const speedMultiplier = currentVideo.effects.speed || 1;
            
            // Calculate expected timeline position based on video time
            let cumulativeTime = 0;
            for (const video of videos) {
              if (video.id === currentVideo.id) {
                break;
              }
              const videoSpeedMultiplier = video.effects.speed || 1;
              const trimStart = video.trimStart || 0;
              const trimEnd = video.trimEnd || video.duration;
              const trimmedDuration = trimEnd - trimStart;
              const videoEffectiveDuration = trimmedDuration / videoSpeedMultiplier;
              cumulativeTime += videoEffectiveDuration;
            }
            
            const trimStart = currentVideo.trimStart || 0;
            const videoTimeInClip = videoElement.currentTime - trimStart;
            const timelineTime = cumulativeTime + (videoTimeInClip / speedMultiplier);
            
            // Only update if there's a significant difference (avoid jitter like GifMaker)
            if (Math.abs(timelineTime - currentTime) > 0.05) {
              // Update currentTime through parent component if possible
              // This would need to be passed as a prop from VideoEditor
            }
            
            lastSyncTimeRef.current = now;
          }
        }
      }

      if (isPlaying) {
        syncAnimationFrameRef.current = requestAnimationFrame(syncVideoTime);
      }
    };

    syncAnimationFrameRef.current = requestAnimationFrame(syncVideoTime);

    return () => {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
      }
    };
  }, [isPlaying, getCurrentVideo, loadedVideos, currentTime, videos]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Square Preview
        </h3>
        <div className="text-sm text-pink-600 font-medium">
          {width} × {height} (1:1)
        </div>
      </div>

      <div
        className="relative bg-black rounded-lg overflow-hidden shadow-lg border-2 border-pink-200"
        style={{ aspectRatio: "1/1" }}
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
