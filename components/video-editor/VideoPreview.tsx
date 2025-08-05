"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { VideoSequenceItem } from "@/types/video";
import { applyVideoEffects } from "@/lib/videoProcessor";
import { VideoLayout } from "./VideoEditor";

interface VideoPreviewProps {
  videos: VideoSequenceItem[];
  currentTime: number;
  isPlaying: boolean;
  width?: number;
  height?: number;
  onTimeUpdate?: (time: number) => void;
  layout?: VideoLayout;
  activeGridId?: string;
  onGridClick?: (gridId: string) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videos,
  currentTime,
  isPlaying,
  width = 550,
  height = 550, // Always square
  onTimeUpdate,
  layout = "single",
  activeGridId = "grid-1",
  onGridClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const animationFrameRef = useRef<number | null>(null);
  const syncAnimationFrameRef = useRef<number | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [seekingVideos, setSeekingVideos] = useState<Set<string>>(new Set());
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  // Create video elements for each video file with immediate loading
  useEffect(() => {
    videos.forEach((video) => {
      if (!videoRefs.current[video.id]) {
        const videoElement = document.createElement("video");
        videoElement.src = video.url;
        videoElement.preload = "metadata"; // Faster initial load
        videoElement.muted = true;
        videoElement.crossOrigin = "anonymous";
        videoElement.style.display = "none";
        videoElement.controls = false;

        // Mark as loaded immediately for basic rendering
        setLoadedVideos((prev) => new Set([...prev, video.id]));

        // Enhanced loading for better experience
        videoElement.addEventListener("loadedmetadata", () => {
          // Force render update when metadata is ready
          renderFrame();
        });

        videoElement.addEventListener("loadeddata", () => {
          // Render again when data is ready
          renderFrame();
        });

        videoElement.addEventListener("canplay", () => {
          // Final render when fully ready
          renderFrame();
        });

        // Track seeking state
        videoElement.addEventListener("seeking", () => {
          setSeekingVideos((prev) => new Set([...prev, video.id]));
        });

        videoElement.addEventListener("seeked", () => {
          setSeekingVideos((prev) => {
            const newSet = new Set(prev);
            newSet.delete(video.id);
            return newSet;
          });
          // Render immediately after seek completes
          renderFrame();
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
        setSeekingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        delete videoRefs.current[id];
      }
    });
  }, [videos]);

  // Find current video(s) based on layout
  const getCurrentVideo = useCallback(() => {
    if (layout === "single") {
      return videos.find(
        (video) => currentTime >= video.startTime && currentTime < video.endTime
      );
    }
    return null;
  }, [videos, currentTime, layout]);

  const getCurrentVideosByGrid = useCallback(() => {
    const grid1Videos = videos.filter((v) => v.gridId === "grid-1");
    const grid2Videos = videos.filter((v) => v.gridId === "grid-2");
    const grid3Videos = videos.filter((v) => v.gridId === "grid-3");
    const grid4Videos = videos.filter((v) => v.gridId === "grid-4");

    const grid1Current = grid1Videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );
    const grid2Current = grid2Videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );
    const grid3Current = grid3Videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );
    const grid4Current = grid4Videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );

    return { grid1: grid1Current, grid2: grid2Current, grid3: grid3Current, grid4: grid4Current };
  }, [videos, currentTime]);

  const renderVideoToCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      video: VideoSequenceItem,
      x: number,
      y: number,
      drawWidth: number,
      drawHeight: number
    ) => {
      const videoElement = videoRefs.current[video.id];
      const isVideoSeeking = seekingVideos.has(video.id);

      // Show seeking state
      if (isVideoSeeking) {
        ctx.fillStyle = "#374151";
        ctx.fillRect(x, y, drawWidth, drawHeight);
        ctx.fillStyle = "#f59e0b";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Seeking...", x + drawWidth / 2, y + drawHeight / 2);
        return;
      }

      // Show loading if no video element
      if (!videoElement) {
        ctx.fillStyle = "#374151";
        ctx.fillRect(x, y, drawWidth, drawHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Loading...", x + drawWidth / 2, y + drawHeight / 2);
        return;
      }

      // Calculate video time within the clip
      const speedMultiplier = video.effects.speed || 1;

      // Find the cumulative start time for this video based on layout
      let cumulativeTime = 0;
      if ((layout === "side-by-side" || layout === "vertical-triptych" || layout === "horizontal-triptych" || layout === "grid-2x2") && video.gridId) {
        // For multi-grid layouts, only consider videos in the same grid
        const sameGridVideos = videos.filter((v) => v.gridId === video.gridId);
        for (const v of sameGridVideos) {
          if (v.id === video.id) break;
          const videoSpeedMultiplier = v.effects.speed || 1;
          const trimStart = v.trimStart || 0;
          const trimEnd = v.trimEnd || v.duration;
          const trimmedDuration = trimEnd - trimStart;
          const videoEffectiveDuration = trimmedDuration / videoSpeedMultiplier;
          cumulativeTime += videoEffectiveDuration;
        }
      } else {
        // For single layout, consider all videos sequentially
        for (const v of videos) {
          if (v.id === video.id) break;
          const videoSpeedMultiplier = v.effects.speed || 1;
          const trimStart = v.trimStart || 0;
          const trimEnd = v.trimEnd || v.duration;
          const trimmedDuration = trimEnd - trimStart;
          const videoEffectiveDuration = trimmedDuration / videoSpeedMultiplier;
          cumulativeTime += videoEffectiveDuration;
        }
      }

      const relativeTime = currentTime - cumulativeTime;
      const videoTime = relativeTime * speedMultiplier;

      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const adjustedVideoTime =
        trimStart + Math.max(0, Math.min(videoTime, trimEnd - trimStart));

      // Sync video element time more aggressively
      const timeDiff = Math.abs(videoElement.currentTime - adjustedVideoTime);
      if (timeDiff > 0.1) {
        const newTime = Math.max(
          0,
          Math.min(adjustedVideoTime, videoElement.duration - 0.01)
        );
        
        try {
          videoElement.currentTime = newTime;
        } catch (error) {
          console.warn("Error setting video time:", error);
        }
      }

      // Render video with reduced readiness requirements
      if (
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0 &&
        videoElement.readyState >= 1 // Reduced from >= 2 for faster display
      ) {
        try {
          // Apply clipping for multi-grid layouts
          let didClip = false;
          if (layout === "side-by-side" || layout === "vertical-triptych" || layout === "horizontal-triptych" || layout === "grid-2x2") {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, drawWidth, drawHeight);
            ctx.clip();
            didClip = true;
          }

          const scale = video.effects.scale || 1.0;
          const posX = (video.effects.positionX || 0) * (drawWidth / 100);
          const posY = (video.effects.positionY || 0) * (drawHeight / 100);

          const videoAspectRatio =
            videoElement.videoWidth / videoElement.videoHeight;
          let videoWidth = drawWidth * scale;
          let videoHeight = drawHeight * scale;

          if (videoAspectRatio > 1) {
            videoHeight = videoWidth / videoAspectRatio;
          } else {
            videoWidth = videoHeight * videoAspectRatio;
          }

          const videoX = x + (drawWidth - videoWidth) / 2 + posX;
          const videoY = y + (drawHeight - videoHeight) / 2 + posY;

          ctx.drawImage(videoElement, videoX, videoY, videoWidth, videoHeight);

          // Apply blur effect if needed
          if (video.effects.blur > 0) {
            ctx.filter = `blur(${video.effects.blur}px)`;
            ctx.drawImage(
              videoElement,
              videoX,
              videoY,
              videoWidth,
              videoHeight
            );
            ctx.filter = "none";
          }

          if (didClip) {
            ctx.restore();
          }
        } catch (error) {
          console.error("Error rendering video:", error);
          ctx.fillStyle = "#1f2937";
          ctx.fillRect(x, y, drawWidth, drawHeight);
        }
      } else {
        // Show loading state for unready videos
        ctx.fillStyle = "#374151";
        ctx.fillRect(x, y, drawWidth, drawHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Loading video...", x + drawWidth / 2, y + drawHeight / 2);
      }
    },
    [videos, currentTime, seekingVideos, layout]
  );

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    if (layout === "single") {
      const currentVideo = getCurrentVideo();

      // Update current video ID
      if (currentVideo?.id !== currentVideoId) {
        setCurrentVideoId(currentVideo?.id || null);
      }

      if (!currentVideo) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("No video at current time", width / 2, height / 2);
        return;
      }

      renderVideoToCanvas(ctx, currentVideo, 0, 0, width, height);
    } else if (layout === "side-by-side") {
      // Side-by-side layout
      const currentVideos = getCurrentVideosByGrid();
      const halfWidth = width / 2;
      
      // Render grid 1 (left side)
      if (currentVideos.grid1) {
        renderVideoToCanvas(ctx, currentVideos.grid1, 0, 0, halfWidth, height);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(0, 0, halfWidth, height);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 1", halfWidth / 2, height / 2);
      }

      // Draw center divider line
      ctx.fillStyle = "#ffffff80";
      ctx.fillRect(halfWidth - 1, 0, 2, height);

      // Render grid 2 (right side)
      if (currentVideos.grid2) {
        renderVideoToCanvas(
          ctx,
          currentVideos.grid2,
          halfWidth,
          0,
          halfWidth,
          height
        );
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(halfWidth, 0, halfWidth, height);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 2", halfWidth + halfWidth / 2, height / 2);
      }
    } else if (layout === "vertical-triptych") {
      // Vertical triptych layout
      const currentVideos = getCurrentVideosByGrid();
      const sectionHeight = height / 3;
      
      // Render grid 1 (top)
      if (currentVideos.grid1) {
        renderVideoToCanvas(ctx, currentVideos.grid1, 0, 0, width, sectionHeight);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(0, 0, width, sectionHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 1", width / 2, sectionHeight / 2);
      }

      // Draw horizontal divider
      ctx.fillStyle = "#ffffff80";
      ctx.fillRect(0, sectionHeight - 1, width, 2);

      // Render grid 2 (middle)
      if (currentVideos.grid2) {
        renderVideoToCanvas(ctx, currentVideos.grid2, 0, sectionHeight, width, sectionHeight);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(0, sectionHeight, width, sectionHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 2", width / 2, sectionHeight + sectionHeight / 2);
      }

      // Draw second horizontal divider
      ctx.fillStyle = "#ffffff80";
      ctx.fillRect(0, sectionHeight * 2 - 1, width, 2);

      // Render grid 3 (bottom)
      if (currentVideos.grid3) {
        renderVideoToCanvas(ctx, currentVideos.grid3, 0, sectionHeight * 2, width, sectionHeight);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(0, sectionHeight * 2, width, sectionHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 3", width / 2, sectionHeight * 2 + sectionHeight / 2);
      }
    } else if (layout === "horizontal-triptych") {
      // Horizontal triptych layout
      const currentVideos = getCurrentVideosByGrid();
      const sectionWidth = width / 3;
      
      // Render grid 1 (left)
      if (currentVideos.grid1) {
        renderVideoToCanvas(ctx, currentVideos.grid1, 0, 0, sectionWidth, height);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(0, 0, sectionWidth, height);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 1", sectionWidth / 2, height / 2);
      }

      // Draw vertical divider
      ctx.fillStyle = "#ffffff80";
      ctx.fillRect(sectionWidth - 1, 0, 2, height);

      // Render grid 2 (middle)
      if (currentVideos.grid2) {
        renderVideoToCanvas(ctx, currentVideos.grid2, sectionWidth, 0, sectionWidth, height);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(sectionWidth, 0, sectionWidth, height);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 2", sectionWidth + sectionWidth / 2, height / 2);
      }

      // Draw second vertical divider
      ctx.fillStyle = "#ffffff80";
      ctx.fillRect(sectionWidth * 2 - 1, 0, 2, height);

      // Render grid 3 (right)
      if (currentVideos.grid3) {
        renderVideoToCanvas(ctx, currentVideos.grid3, sectionWidth * 2, 0, sectionWidth, height);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(sectionWidth * 2, 0, sectionWidth, height);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 3", sectionWidth * 2 + sectionWidth / 2, height / 2);
      }
    } else if (layout === "grid-2x2") {
      // 2x2 grid layout
      const currentVideos = getCurrentVideosByGrid();
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      
      // Render grid 1 (top-left)
      if (currentVideos.grid1) {
        renderVideoToCanvas(ctx, currentVideos.grid1, 0, 0, halfWidth, halfHeight);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(0, 0, halfWidth, halfHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 1", halfWidth / 2, halfHeight / 2);
      }

      // Draw vertical divider
      ctx.fillStyle = "#ffffff80";
      ctx.fillRect(halfWidth - 1, 0, 2, height);

      // Render grid 2 (top-right)
      if (currentVideos.grid2) {
        renderVideoToCanvas(ctx, currentVideos.grid2, halfWidth, 0, halfWidth, halfHeight);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(halfWidth, 0, halfWidth, halfHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 2", halfWidth + halfWidth / 2, halfHeight / 2);
      }

      // Draw horizontal divider
      ctx.fillStyle = "#ffffff80";
      ctx.fillRect(0, halfHeight - 1, width, 2);

      // Render grid 3 (bottom-left)
      if (currentVideos.grid3) {
        renderVideoToCanvas(ctx, currentVideos.grid3, 0, halfHeight, halfWidth, halfHeight);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(0, halfHeight, halfWidth, halfHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 3", halfWidth / 2, halfHeight + halfHeight / 2);
      }

      // Render grid 4 (bottom-right)
      if (currentVideos.grid4) {
        renderVideoToCanvas(ctx, currentVideos.grid4, halfWidth, halfHeight, halfWidth, halfHeight);
      } else {
        ctx.fillStyle = "#374151";
        ctx.fillRect(halfWidth, halfHeight, halfWidth, halfHeight);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Grid 4", halfWidth + halfWidth / 2, halfHeight + halfHeight / 2);
      }
    }
  }, [
    getCurrentVideo,
    getCurrentVideosByGrid,
    currentVideoId,
    currentTime,
    width,
    height,
    videos,
    layout,
    renderVideoToCanvas,
  ]);

  // Immediate rendering with no throttling for responsive updates
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Animation loop for smooth playback
  useEffect(() => {
    const animate = () => {
      renderFrame();
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [renderFrame, isPlaying]);

  // Handle video playback state
  useEffect(() => {
    // Pause all videos first
    Object.values(videoRefs.current).forEach((videoElement) => {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    });

    if (layout === "single") {
      const currentVideo = getCurrentVideo();
      if (currentVideo && isPlaying) {
        const videoElement = videoRefs.current[currentVideo.id];
        if (videoElement) {
          videoElement.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.error("Error playing video:", error);
            }
          });
        }
      }
    } else {
      const currentVideos = getCurrentVideosByGrid();

      // Play all current grid videos
      [currentVideos.grid1, currentVideos.grid2, currentVideos.grid3, currentVideos.grid4]
        .filter(Boolean)
        .forEach((video) => {
          if (video && isPlaying) {
            const videoElement = videoRefs.current[video.id];
            if (videoElement) {
              videoElement.play().catch((error) => {
                if (error.name !== "AbortError") {
                  console.error("Error playing video:", error);
                }
              });
            }
          }
        });
    }
  }, [getCurrentVideo, getCurrentVideosByGrid, isPlaying, layout]);

  // Video synchronization during playback
  useEffect(() => {
    if (!isPlaying || !onTimeUpdate) {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
        syncAnimationFrameRef.current = null;
      }
      return;
    }

    const syncVideoTime = () => {
      const currentVideo = layout === "single" 
        ? getCurrentVideo() 
        : getCurrentVideosByGrid().grid1; // Use grid1 for sync in multi-layout

      if (currentVideo) {
        const videoElement = videoRefs.current[currentVideo.id];

        if (videoElement && !videoElement.paused && !videoElement.ended) {
          const now = performance.now();

          if (now - lastSyncTimeRef.current >= 100) {
            const speedMultiplier = currentVideo.effects.speed || 1;

            // Calculate timeline position
            let cumulativeTime = 0;
            const videosToCheck = layout === "single" 
              ? videos 
              : videos.filter((v) => v.gridId === currentVideo.gridId);

            for (const video of videosToCheck) {
              if (video.id === currentVideo.id) break;
              const videoSpeedMultiplier = video.effects.speed || 1;
              const trimStart = video.trimStart || 0;
              const trimEnd = video.trimEnd || video.duration;
              const trimmedDuration = trimEnd - trimStart;
              const videoEffectiveDuration = trimmedDuration / videoSpeedMultiplier;
              cumulativeTime += videoEffectiveDuration;
            }

            const trimStart = currentVideo.trimStart || 0;
            const videoTimeInClip = videoElement.currentTime - trimStart;
            const timelineTime = cumulativeTime + videoTimeInClip / speedMultiplier;

            if (Math.abs(timelineTime - currentTime) > 0.05) {
              onTimeUpdate(timelineTime);
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
  }, [
    isPlaying,
    getCurrentVideo,
    getCurrentVideosByGrid,
    currentTime,
    videos,
    onTimeUpdate,
    layout,
  ]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Video Preview</h3>
        <div className="text-sm text-pink-600 font-medium">
          {width} × {height} (1:1)
        </div>
      </div>

      <div
        className="relative bg-black rounded-lg overflow-hidden shadow-lg border-2 border-pink-200"
        style={{ 
          aspectRatio: "1/1",
          width: `${width}px`,
          height: `${height}px`
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full"
          style={{ display: 'block' }}
        />

        {/* Grid Click Overlays for Side-by-Side Layout */}
        {layout === "side-by-side" && onGridClick && (() => {
          const halfWidth = width / 2;
          
          return (
            <>
              {/* Grid 1 Clickable Area */}
              <div
                className="absolute top-0 left-0"
                style={{ 
                  width: `${Math.floor(halfWidth)}px`,
                  height: `${height}px`
                }}
              >
                {!videos.some((v) => v.gridId === "grid-1") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-1")}
                  >
                    <div className="absolute inset-0 bg-pink-500/20 group-hover:bg-pink-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Track 1
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Grid 2 Clickable Area */}
              <div
                className="absolute top-0"
                style={{
                  left: `${Math.floor(halfWidth)}px`,
                  width: `${width - Math.floor(halfWidth)}px`,
                  height: `${height}px`
                }}
              >
                {!videos.some((v) => v.gridId === "grid-2") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-2")}
                  >
                    <div className="absolute inset-0 bg-rose-500/20 group-hover:bg-rose-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Track 2
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          );
        })()}

        {/* Similar overlay patterns for other layouts... */}
      </div>

      {/* Video Info */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total Videos:</span>
          <span className="ml-2 font-medium text-gray-700">
            {videos.length}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Current:</span>
          <span className="ml-2 font-medium text-gray-700">
            {layout === "single"
              ? (() => {
                  const currentVideo = getCurrentVideo();
                  return currentVideo
                    ? videos.indexOf(currentVideo) + 1
                    : "None";
                })()
              : (() => {
                  const currentVideos = getCurrentVideosByGrid();
                  const parts = [];
                  if (currentVideos.grid1) parts.push("G1");
                  if (currentVideos.grid2) parts.push("G2");
                  if (currentVideos.grid3) parts.push("G3");
                  if (currentVideos.grid4) parts.push("G4");
                  return parts.length > 0 ? parts.join(", ") : "None";
                })()}
          </span>
        </div>
      </div>
    </div>
  );
};