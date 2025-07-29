import { useState, useCallback, useRef } from "react";
import {
  VideoSequenceItem,
  VideoEffects,
  SelectiveBlurRegion,
} from "@/types/video";

export const useVideoSequence = () => {
  const [videos, setVideos] = useState<VideoSequenceItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addVideos = useCallback(
    async (files: File[], gridId?: string) => {
      const newVideos: VideoSequenceItem[] = [];

      for (const file of files) {
        const url = URL.createObjectURL(file);

        try {
          const video = document.createElement("video");
          video.src = url;
          video.preload = "metadata";
          video.muted = true;

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Timeout loading video: ${file.name}`));
            }, 10000); // 10 second timeout

            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              const duration = video.duration;

              if (isNaN(duration) || duration <= 0) {
                reject(new Error(`Invalid duration for video: ${file.name}`));
                return;
              }

              // Calculate start time based on layout
              let startTime = 0;
              if (gridId) {
                // Side-by-side layout: videos in same grid are sequential, different grids start at 0
                const existingGridVideos = videos.filter(v => v.gridId === gridId);
                const newGridVideos = newVideos.filter(v => v.gridId === gridId);
                const allGridVideos = [...existingGridVideos, ...newGridVideos];
                
                if (allGridVideos.length > 0) {
                  // Sequential within the same grid - find the latest end time
                  startTime = Math.max(...allGridVideos.map(v => v.endTime));
                } else {
                  // First video in this grid always starts at 0
                  startTime = 0;
                }
              } else {
                // Single layout - sequential timing for all videos
                const existingEndTime = videos.length > 0
                  ? Math.max(...videos.map((v) => v.endTime))
                  : 0;
                const newVideosEndTime = newVideos.length > 0
                  ? newVideos[newVideos.length - 1].endTime
                  : 0;
                startTime = Math.max(existingEndTime, newVideosEndTime);
              }

              newVideos.push({
                id: crypto.randomUUID(),
                file,
                url,
                duration,
                startTime,
                endTime: startTime + duration,
                gridId,
                effects: {
                  blur: 0,
                  speed: 1,
                  selectiveBlur: [],
                  scale: 1.0,
                  positionX: 0,
                  positionY: 0,
                },
              });
              resolve();
            };

            video.onerror = () => {
              clearTimeout(timeout);
              reject(new Error(`Failed to load video: ${file.name}`));
            };
          });
        } catch (error) {
          console.error("Error loading video:", error);
          URL.revokeObjectURL(url); // Clean up on error
          // Continue with other videos instead of failing completely
        }
      }

      if (newVideos.length > 0) {
        setVideos((prev) => {
          // Add new videos to the list
          const combined = [...prev, ...newVideos];
          // If gridId is set, recalculate start/end for all videos in that grid
          if (gridId) {
            // Get all videos in this grid, sorted by insertion order
            const gridVideos = combined.filter(v => v.gridId === gridId);
            let runningTime = 0;
            for (const v of gridVideos) {
              v.startTime = runningTime;
              v.endTime = runningTime + v.duration;
              runningTime = v.endTime;
            }
            // Now update the combined list with new start/end for grid videos
            return combined.map(v => {
              if (v.gridId === gridId) {
                const updated = gridVideos.find(gv => gv.id === v.id);
                return updated ? { ...v, startTime: updated.startTime, endTime: updated.endTime } : v;
              }
              return v;
            });
          } else {
            // Single layout: recalculate all start/end times sequentially
            let runningTime = 0;
            return combined.map(v => {
              const updated = { ...v, startTime: runningTime, endTime: runningTime + v.duration };
              runningTime = updated.endTime;
              return updated;
            });
          }
        });
      }
    },
    [videos]
  );

  const removeVideo = useCallback(
    (id: string) => {
      setVideos((prev) => {
        const videoToRemove = prev.find((v) => v.id === id);
        if (videoToRemove) {
          // Clean up the object URL to prevent memory leaks
          URL.revokeObjectURL(videoToRemove.url);
        }

        const updated = prev.filter((v) => v.id !== id);
        
        // If the removed video had a gridId, recalculate times for that grid only
        if (videoToRemove?.gridId) {
          const gridVideos = updated.filter(v => v.gridId === videoToRemove.gridId);
          let runningTime = 0;
          for (const v of gridVideos) {
            v.startTime = runningTime;
            v.endTime = runningTime + v.duration;
            runningTime = v.endTime;
          }
          // Update the full list with recalculated grid videos
          return updated.map(v => {
            if (v.gridId === videoToRemove.gridId) {
              const updated_grid = gridVideos.find(gv => gv.id === v.id);
              return updated_grid ? { ...v, startTime: updated_grid.startTime, endTime: updated_grid.endTime } : v;
            }
            return v;
          });
        } else {
          // Single layout: recalculate all start/end times sequentially
          return updated.map((video, index) => {
            const startTime = index > 0 ? updated[index - 1].endTime : 0;
            return {
              ...video,
              startTime,
              endTime: startTime + video.duration,
            };
          });
        }
      });

      if (selectedVideoId === id) {
        setSelectedVideoId(null);
      }
    },
    [selectedVideoId]
  );

  const reorderVideos = useCallback((dragIndex: number, hoverIndex: number) => {
    setVideos((prev) => {
      const newVideos = [...prev];
      const draggedVideo = newVideos[dragIndex];
      newVideos.splice(dragIndex, 1);
      newVideos.splice(hoverIndex, 0, draggedVideo);

      // Recalculate start and end times per grid
      const gridIds = new Set(newVideos.map(v => v.gridId).filter(Boolean));
      
      if (gridIds.size > 0) {
        // Multi-grid layout: recalculate times per grid
        for (const gridId of gridIds) {
          const gridVideos = newVideos.filter(v => v.gridId === gridId);
          let runningTime = 0;
          for (const v of gridVideos) {
            v.startTime = runningTime;
            v.endTime = runningTime + v.duration;
            runningTime = v.endTime;
          }
        }
        
        // Handle videos without gridId (single layout videos) separately
        const singleVideos = newVideos.filter(v => !v.gridId);
        let runningTime = 0;
        for (const v of singleVideos) {
          v.startTime = runningTime;
          v.endTime = runningTime + v.duration;
          runningTime = v.endTime;
        }
        
        return newVideos;
      } else {
        // Single layout: recalculate all start/end times sequentially
        return newVideos.map((video, index) => {
          const startTime = index > 0 ? newVideos[index - 1].endTime : 0;
          return {
            ...video,
            startTime,
            endTime: startTime + video.duration,
          };
        });
      }
    });
  }, []);

  const updateVideoEffects = useCallback(
    (id: string, effects: Partial<VideoEffects>) => {
      setVideos((prev) =>
        prev.map((video) =>
          video.id === id
            ? { ...video, effects: { ...video.effects, ...effects } }
            : video
        )
      );
    },
    []
  );

  const getTotalDuration = useCallback(() => {
    if (videos.length === 0) return 0;

    // Check if we have videos with gridId (side-by-side layout)
    const hasGridVideos = videos.some(v => v.gridId);
    
    if (hasGridVideos) {
      // Multi-grid layout: calculate duration for each grid and return the maximum
      const grid1Videos = videos.filter(v => v.gridId === 'grid-1');
      const grid2Videos = videos.filter(v => v.gridId === 'grid-2');
      const grid3Videos = videos.filter(v => v.gridId === 'grid-3');
      const grid4Videos = videos.filter(v => v.gridId === 'grid-4');
      const singleVideos = videos.filter(v => !v.gridId);

      const calculateGridDuration = (gridVideos: typeof videos) => {
        return gridVideos.reduce((total, video) => {
          const trimStart = video.trimStart || 0;
          const trimEnd = video.trimEnd || video.duration;
          const trimmedDuration = trimEnd - trimStart;
          const speedMultiplier = video.effects.speed || 1;
          return total + (trimmedDuration / speedMultiplier);
        }, 0);
      };

      const grid1Duration = calculateGridDuration(grid1Videos);
      const grid2Duration = calculateGridDuration(grid2Videos);
      const grid3Duration = calculateGridDuration(grid3Videos);
      const grid4Duration = calculateGridDuration(grid4Videos);
      const singleDuration = calculateGridDuration(singleVideos);

      // Return the maximum duration among all grids
      return Math.max(grid1Duration, grid2Duration, grid3Duration, grid4Duration, singleDuration);
    } else {
      // Single layout: sequential timing
      let totalDuration = 0;
      videos.forEach((video) => {
        const trimStart = video.trimStart || 0;
        const trimEnd = video.trimEnd || video.duration;
        const trimmedDuration = trimEnd - trimStart;
        const speedMultiplier = video.effects.speed || 1;
        totalDuration += trimmedDuration / speedMultiplier;
      });

      return totalDuration;
    }
  }, [videos]);

  const getCurrentVideo = useCallback(() => {
    // Check if we have grid videos (side-by-side layout)
    const hasGridVideos = videos.some(v => v.gridId);
    
    if (hasGridVideos) {
      // For multi-grid layouts, return the first video found in any grid at current time
      const grids = ['grid-1', 'grid-2', 'grid-3', 'grid-4'];
      
      for (const gridId of grids) {
        const gridVideos = videos.filter(v => v.gridId === gridId);
        let cumulativeTime = 0;
        
        for (const video of gridVideos) {
          const trimStart = video.trimStart || 0;
          const trimEnd = video.trimEnd || video.duration;
          const trimmedDuration = trimEnd - trimStart;
          const speedMultiplier = video.effects.speed || 1;
          const effectiveDuration = trimmedDuration / speedMultiplier;

          if (
            currentTime >= cumulativeTime &&
            currentTime < cumulativeTime + effectiveDuration
          ) {
            return video;
          }

          cumulativeTime += effectiveDuration;
        }
      }
      
      // Also check single videos (no gridId)
      const singleVideos = videos.filter(v => !v.gridId);
      let cumulativeTime = 0;
      
      for (const video of singleVideos) {
        const trimStart = video.trimStart || 0;
        const trimEnd = video.trimEnd || video.duration;
        const trimmedDuration = trimEnd - trimStart;
        const speedMultiplier = video.effects.speed || 1;
        const effectiveDuration = trimmedDuration / speedMultiplier;

        if (
          currentTime >= cumulativeTime &&
          currentTime < cumulativeTime + effectiveDuration
        ) {
          return video;
        }

        cumulativeTime += effectiveDuration;
      }
    } else {
      // Single layout: sequential lookup
      let cumulativeTime = 0;

      for (const video of videos) {
        const trimStart = video.trimStart || 0;
        const trimEnd = video.trimEnd || video.duration;
        const trimmedDuration = trimEnd - trimStart;
        const speedMultiplier = video.effects.speed || 1;
        const effectiveDuration = trimmedDuration / speedMultiplier;

        if (
          currentTime >= cumulativeTime &&
          currentTime < cumulativeTime + effectiveDuration
        ) {
          return video;
        }

        cumulativeTime += effectiveDuration;
      }
    }

    return undefined;
  }, [videos, currentTime]);

  const play = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const total = getTotalDuration();
          const next = prev + 0.1;
          return next >= total ? 0 : next;
        });
      }, 100); // Keep 100ms for smooth timeline updates, but limit video rendering separately
    }
  }, [isPlaying, getTotalDuration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const seek = useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, Math.min(time, getTotalDuration())));
    },
    [getTotalDuration]
  );

  const addSelectiveBlurRegion = useCallback(
    (videoId: string, region: Omit<SelectiveBlurRegion, "id">) => {
      const newRegion = {
        ...region,
        id: `blur-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                effects: {
                  ...video.effects,
                  selectiveBlur: [
                    ...(video.effects.selectiveBlur || []),
                    newRegion,
                  ],
                },
              }
            : video
        )
      );

      return newRegion.id;
    },
    []
  );

  const updateSelectiveBlurRegion = useCallback(
    (
      videoId: string,
      regionId: string,
      updates: Partial<SelectiveBlurRegion>
    ) => {
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                effects: {
                  ...video.effects,
                  selectiveBlur:
                    video.effects.selectiveBlur?.map((region) =>
                      region.id === regionId
                        ? { ...region, ...updates }
                        : region
                    ) || [],
                },
              }
            : video
        )
      );
    },
    []
  );

  const removeSelectiveBlurRegion = useCallback(
    (videoId: string, regionId: string) => {
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                effects: {
                  ...video.effects,
                  selectiveBlur:
                    video.effects.selectiveBlur?.filter(
                      (region) => region.id !== regionId
                    ) || [],
                },
              }
            : video
        )
      );
    },
    []
  );

  const updateVideoTrim = useCallback(
    (id: string, trimStart?: number, trimEnd?: number) => {
      setVideos((prev) =>
        prev.map((video) => {
          if (video.id === id) {
            const updatedVideo = {
              ...video,
              trimStart:
                trimStart !== undefined
                  ? Math.max(0, Math.min(trimStart, video.duration))
                  : video.trimStart,
              trimEnd:
                trimEnd !== undefined
                  ? Math.max(0, Math.min(trimEnd, video.duration))
                  : video.trimEnd,
            };

            // Ensure trimStart is less than trimEnd
            if (
              updatedVideo.trimStart !== undefined &&
              updatedVideo.trimEnd !== undefined
            ) {
              if (updatedVideo.trimStart >= updatedVideo.trimEnd) {
                updatedVideo.trimStart = Math.max(
                  0,
                  updatedVideo.trimEnd - 0.1
                );
              }
            }

            return updatedVideo;
          }
          return video;
        })
      );
    },
    []
  );

  return {
    videos,
    selectedVideoId,
    currentTime,
    isPlaying,
    addVideos,
    removeVideo,
    reorderVideos,
    updateVideoEffects,
    setSelectedVideoId,
    getTotalDuration,
    getCurrentVideo,
    play,
    pause,
    seek,
    addSelectiveBlurRegion,
    updateSelectiveBlurRegion,
    removeSelectiveBlurRegion,
    updateVideoTrim,
    setVideos, // Expose setVideos for direct video state updates
  };
};
