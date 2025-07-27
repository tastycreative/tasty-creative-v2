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
  width = 400,
  height = 400, // Always square
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

  // Find current video(s) based on layout
  const getCurrentVideo = useCallback(() => {
    if (layout === "single") {
      return videos.find(
        (video) => currentTime >= video.startTime && currentTime < video.endTime
      );
    }
    return null; // For side-by-side, we handle differently
  }, [videos, currentTime, layout]);

  const getCurrentVideosByGrid = useCallback(() => {
    const grid1Videos = videos.filter((v) => v.gridId === "grid-1");
    const grid2Videos = videos.filter((v) => v.gridId === "grid-2");
    const grid3Videos = videos.filter((v) => v.gridId === "grid-3");

    const grid1Current = grid1Videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );
    const grid2Current = grid2Videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );
    const grid3Current = grid3Videos.find(
      (video) => currentTime >= video.startTime && currentTime < video.endTime
    );

    return { grid1: grid1Current, grid2: grid2Current, grid3: grid3Current };
  }, [videos, currentTime]);

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

      // Draw center divider line at the division point
      ctx.fillStyle = "#ffffff80"; // Semi-transparent white
      ctx.fillRect(halfWidth - 1, 0, 2, height); // 2px wide line centered on division

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
      // Vertical triptych layout - 3 horizontal sections
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

      // Draw horizontal divider line
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

      // Draw second horizontal divider line
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
      // Horizontal triptych layout - 3 vertical sections
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

      // Draw vertical divider line
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

      // Draw second vertical divider line
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
    }
  }, [
    getCurrentVideo,
    getCurrentVideosByGrid,
    currentVideoId,
    loadedVideos,
    currentTime,
    width,
    height,
    videos,
    layout,
  ]);

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
      const isVideoLoaded = loadedVideos.has(video.id);

      if (!videoElement || !isVideoLoaded) {
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
      if ((layout === "side-by-side" || layout === "vertical-triptych" || layout === "horizontal-triptych") && video.gridId) {
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

      if (!isPlaying) {
        const timeDiff = Math.abs(videoElement.currentTime - adjustedVideoTime);
        if (timeDiff > 0.1) {
          videoElement.currentTime = Math.max(
            0,
            Math.min(adjustedVideoTime, videoElement.duration - 0.01)
          );
        }
      }

      if (
        videoElement.readyState >= 2 &&
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0
      ) {
        try {
          // --- CLIP TO GRID AREA FOR MULTI-GRID LAYOUTS ---
          let didClip = false;
          if (layout === "side-by-side" || layout === "vertical-triptych" || layout === "horizontal-triptych") {
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
      }
    },
    [videos, currentTime, isPlaying, loadedVideos, layout]
  );

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

  // Handle video playback state for both single and side-by-side layouts
  useEffect(() => {
    // Pause all videos first
    Object.values(videoRefs.current).forEach((videoElement) => {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    });

    if (layout === "single") {
      // Single layout - play one video at a time
      const currentVideo = getCurrentVideo();
      if (currentVideo && isPlaying && loadedVideos.has(currentVideo.id)) {
        const videoElement = videoRefs.current[currentVideo.id];
        if (videoElement && videoElement.readyState >= 2) {
          videoElement.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.error("Error playing video:", error);
            }
          });
        }
      }
    } else {
      // Side-by-side layout - play videos from both grids simultaneously
      const currentVideos = getCurrentVideosByGrid();

      // Play Grid 1 video
      if (
        currentVideos.grid1 &&
        isPlaying &&
        loadedVideos.has(currentVideos.grid1.id)
      ) {
        const videoElement = videoRefs.current[currentVideos.grid1.id];
        if (videoElement && videoElement.readyState >= 2) {
          videoElement.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.error("Error playing Grid 1 video:", error);
            }
          });
        }
      }

      // Play Grid 2 video
      if (
        currentVideos.grid2 &&
        isPlaying &&
        loadedVideos.has(currentVideos.grid2.id)
      ) {
        const videoElement = videoRefs.current[currentVideos.grid2.id];
        if (videoElement && videoElement.readyState >= 2) {
          videoElement.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.error("Error playing Grid 2 video:", error);
            }
          });
        }
      }

      // Play Grid 3 video (for triptych layouts)
      if (
        currentVideos.grid3 &&
        isPlaying &&
        loadedVideos.has(currentVideos.grid3.id)
      ) {
        const videoElement = videoRefs.current[currentVideos.grid3.id];
        if (videoElement && videoElement.readyState >= 2) {
          videoElement.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.error("Error playing Grid 3 video:", error);
            }
          });
        }
      }
    }
  }, [
    getCurrentVideo,
    getCurrentVideosByGrid,
    currentTime,
    isPlaying,
    loadedVideos,
    videos,
    layout,
  ]);

  // Video synchronization during playback for both layouts
  useEffect(() => {
    if (!isPlaying) {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
        syncAnimationFrameRef.current = null;
      }
      return;
    }

    const syncVideoTime = () => {
      if (layout === "single") {
        // Single layout sync
        const currentVideo = getCurrentVideo();
        if (currentVideo && loadedVideos.has(currentVideo.id)) {
          const videoElement = videoRefs.current[currentVideo.id];

          if (videoElement && !videoElement.paused && !videoElement.ended) {
            const now = performance.now();

            if (now - lastSyncTimeRef.current >= 100) {
              const speedMultiplier = currentVideo.effects.speed || 1;

              // Calculate expected timeline position
              let cumulativeTime = 0;
              for (const video of videos) {
                if (video.id === currentVideo.id) break;
                const videoSpeedMultiplier = video.effects.speed || 1;
                const trimStart = video.trimStart || 0;
                const trimEnd = video.trimEnd || video.duration;
                const trimmedDuration = trimEnd - trimStart;
                const videoEffectiveDuration =
                  trimmedDuration / videoSpeedMultiplier;
                cumulativeTime += videoEffectiveDuration;
              }

              const trimStart = currentVideo.trimStart || 0;
              const videoTimeInClip = videoElement.currentTime - trimStart;
              const timelineTime =
                cumulativeTime + videoTimeInClip / speedMultiplier;

              if (Math.abs(timelineTime - currentTime) > 0.05 && onTimeUpdate) {
                onTimeUpdate(timelineTime);
              }

              lastSyncTimeRef.current = now;
            }
          }
        }
      } else {
        // Side-by-side layout sync - prioritize Grid 1 for timeline sync
        const currentVideos = getCurrentVideosByGrid();
        const syncVideo = currentVideos.grid1 || currentVideos.grid2; // Use Grid 1 if available, otherwise Grid 2

        if (syncVideo && loadedVideos.has(syncVideo.id)) {
          const videoElement = videoRefs.current[syncVideo.id];

          if (videoElement && !videoElement.paused && !videoElement.ended) {
            const now = performance.now();

            if (now - lastSyncTimeRef.current >= 100) {
              const speedMultiplier = syncVideo.effects.speed || 1;

              // Calculate expected timeline position for this grid
              let cumulativeTime = 0;
              const sameGridVideos = videos.filter(
                (v) => v.gridId === syncVideo.gridId
              );
              for (const video of sameGridVideos) {
                if (video.id === syncVideo.id) break;
                const videoSpeedMultiplier = video.effects.speed || 1;
                const trimStart = video.trimStart || 0;
                const trimEnd = video.trimEnd || video.duration;
                const trimmedDuration = trimEnd - trimStart;
                const videoEffectiveDuration =
                  trimmedDuration / videoSpeedMultiplier;
                cumulativeTime += videoEffectiveDuration;
              }

              const trimStart = syncVideo.trimStart || 0;
              const videoTimeInClip = videoElement.currentTime - trimStart;
              const timelineTime =
                cumulativeTime + videoTimeInClip / speedMultiplier;

              if (Math.abs(timelineTime - currentTime) > 0.05 && onTimeUpdate) {
                onTimeUpdate(timelineTime);
              }

              lastSyncTimeRef.current = now;
            }
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
    loadedVideos,
    currentTime,
    videos,
    onTimeUpdate,
    layout,
  ]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Square Preview</h3>
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

        {/* Overlay for current video info removed as requested */}

        {/* Grid Click Overlays for Side-by-Side Layout */}
        {layout === "side-by-side" && onGridClick && (() => {
          const halfWidth = width / 2;
          
          return (
            <>
              {/* Grid 1 Clickable Area - exactly matches canvas division */}
              <div
                className="absolute top-0 left-0"
                style={{ 
                  width: `${halfWidth}px`,
                  height: `${height}px`
                }}
              >
                {!videos.some((v) => v.gridId === "grid-1") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-1")}
                  >
                    <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 1
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Grid 2 Clickable Area - exactly matches canvas division */}
              <div
                className="absolute top-0"
                style={{
                  left: `${halfWidth}px`,
                  width: `${halfWidth}px`,
                  height: `${height}px`
                }}
              >
                {!videos.some((v) => v.gridId === "grid-2") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-2")}
                  >
                    <div className="absolute inset-0 bg-green-500/20 group-hover:bg-green-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 2
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          );
        })()}

        {/* Grid Click Overlays for Vertical Triptych Layout */}
        {layout === "vertical-triptych" && onGridClick && (() => {
          // Use same calculation as canvas rendering for exact match
          const sectionHeight = height / 3;
          
          return (
            <>
              {/* Grid 1 Clickable Area (top) */}
              <div
                className="absolute left-0 top-0"
                style={{
                  width: `${width}px`,
                  height: `${sectionHeight}px`,
                }}
              >
                {!videos.some((v) => v.gridId === "grid-1") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-1")}
                  >
                    <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 1
                      </div>
                    </div>
                  </div>
                ) : null}
                {activeGridId === "grid-1" && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Active Grid
                  </div>
                )}
              </div>

              {/* Grid 2 Clickable Area (middle) */}
              <div
                className="absolute left-0"
                style={{
                  top: `${sectionHeight}px`,
                  width: `${width}px`,
                  height: `${sectionHeight}px`,
                }}
              >
                {!videos.some((v) => v.gridId === "grid-2") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-2")}
                  >
                    <div className="absolute inset-0 bg-green-500/20 group-hover:bg-green-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 2
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Grid 3 Clickable Area (bottom) */}
              <div
                className="absolute left-0"
                style={{
                  top: `${sectionHeight * 2}px`,
                  width: `${width}px`,
                  height: `${sectionHeight}px`,
                }}
              >
                {!videos.some((v) => v.gridId === "grid-3") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-3")}
                  >
                    <div className="absolute inset-0 bg-purple-500/20 group-hover:bg-purple-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 3
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          );
        })()}

        {/* Grid Click Overlays for Horizontal Triptych Layout */}
        {layout === "horizontal-triptych" && onGridClick && (() => {
          // Use same calculation as canvas rendering for exact match
          const sectionWidth = width / 3;
          
          return (
            <>
              {/* Grid 1 Clickable Area (left) */}
              <div
                className="absolute left-0 top-0"
                style={{
                  width: `${sectionWidth}px`,
                  height: `${height}px`,
                }}
              >
                {!videos.some((v) => v.gridId === "grid-1") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-1")}
                  >
                    <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 1
                      </div>
                    </div>
                  </div>
                ) : null}
                {activeGridId === "grid-1" && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Active Grid
                  </div>
                )}
              </div>

              {/* Grid 2 Clickable Area (middle) */}
              <div
                className="absolute top-0"
                style={{
                  left: `${sectionWidth}px`,
                  width: `${sectionWidth}px`,
                  height: `${height}px`,
                }}
              >
                {!videos.some((v) => v.gridId === "grid-2") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-2")}
                  >
                    <div className="absolute inset-0 bg-green-500/20 group-hover:bg-green-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 2
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Grid 3 Clickable Area (right) */}
              <div
                className="absolute top-0"
                style={{
                  left: `${sectionWidth * 2}px`,
                  width: `${sectionWidth}px`,
                  height: `${height}px`,
                }}
              >
                {!videos.some((v) => v.gridId === "grid-3") ? (
                  <div
                    className="absolute inset-0 cursor-pointer group transition-all duration-200"
                    onClick={() => onGridClick("grid-3")}
                  >
                    <div className="absolute inset-0 bg-purple-500/20 group-hover:bg-purple-500/40 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Click to upload to Grid 3
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          );
        })()}
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
                  if (currentVideos.grid1) {
                    const grid1Videos = videos.filter(
                      (v) => v.gridId === "grid-1"
                    );
                    const index = grid1Videos.indexOf(currentVideos.grid1) + 1;
                    parts.push(`G1:${index}`);
                  }
                  if (currentVideos.grid2) {
                    const grid2Videos = videos.filter(
                      (v) => v.gridId === "grid-2"
                    );
                    const index = grid2Videos.indexOf(currentVideos.grid2) + 1;
                    parts.push(`G2:${index}`);
                  }
                  if (currentVideos.grid3) {
                    const grid3Videos = videos.filter(
                      (v) => v.gridId === "grid-3"
                    );
                    const index = grid3Videos.indexOf(currentVideos.grid3) + 1;
                    parts.push(`G3:${index}`);
                  }
                  return parts.length > 0 ? parts.join(", ") : "None";
                })()}
          </span>
        </div>
      </div>
    </div>
  );
};
