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
    async (files: File[]) => {
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

              const startTime =
                newVideos.length > 0
                  ? newVideos[newVideos.length - 1].endTime
                  : videos.length > 0
                    ? Math.max(...videos.map((v) => v.endTime))
                    : 0;

              newVideos.push({
                id: crypto.randomUUID(),
                file,
                url,
                duration,
                startTime,
                endTime: startTime + duration,
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
        setVideos((prev) => [...prev, ...newVideos]);
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
        // Recalculate start and end times
        return updated.map((video, index) => {
          const startTime = index > 0 ? updated[index - 1].endTime : 0;
          return {
            ...video,
            startTime,
            endTime: startTime + video.duration,
          };
        });
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

      // Recalculate start and end times
      return newVideos.map((video, index) => {
        const startTime = index > 0 ? newVideos[index - 1].endTime : 0;
        return {
          ...video,
          startTime,
          endTime: startTime + video.duration,
        };
      });
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

    // Calculate total duration accounting for speed effects and trimming
    let totalDuration = 0;
    videos.forEach((video) => {
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = trimEnd - trimStart;
      const speedMultiplier = video.effects.speed || 1;
      totalDuration += trimmedDuration / speedMultiplier;
    });

    return totalDuration;
  }, [videos]);

  const getCurrentVideo = useCallback(() => {
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
  };
};
