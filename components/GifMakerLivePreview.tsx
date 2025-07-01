import React, { useRef, useEffect, useState } from "react";
import { VideoClip, TimelineClip } from "@/utils/gifMakerUtils";

type LivePreviewProps = {
  timelineMode: 'grid' | 'sequence';
  currentTime: number;
  isPlaying: boolean;
  // Grid mode props
  activeVideoIndex?: number | null;
  videoClips?: VideoClip[];
  // Sequence mode props
  timelineClips?: TimelineClip[];
  onCurrentTimeChange?: (time: number) => void;
};

export const GifMakerLivePreview = ({
  timelineMode,
  currentTime,
  isPlaying,
  activeVideoIndex = null,
  videoClips = [],
  timelineClips = [],
  onCurrentTimeChange,
}: LivePreviewProps) => {
  const sequenceVideoRefs = useRef<HTMLVideoElement[]>([]);
  const gridVideoRef = useRef<HTMLVideoElement>(null);
  const [currentActiveClip, setCurrentActiveClip] = useState<TimelineClip | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Update video time based on currentTime
  useEffect(() => {
    if (timelineMode === 'sequence') {
      // Find which clip should be active at current time
      let activeClip: TimelineClip | null = null;
      let videoCurrentTime = 0;

      for (const clip of timelineClips) {
        if (currentTime >= clip.timelineStartTime && currentTime < clip.timelineEndTime) {
          activeClip = clip;
          videoCurrentTime = (currentTime - clip.timelineStartTime) + clip.startTime;
          break;
        }
      }

      setCurrentActiveClip(activeClip);

      // Update video element time - only when not playing to avoid interference
      if (activeClip && !isPlaying) {
        const clipIndex = timelineClips.indexOf(activeClip);
        const videoElement = sequenceVideoRefs.current[clipIndex];
        if (videoElement && videoElement.readyState >= 2 && Math.abs(videoElement.currentTime - videoCurrentTime) > 0.1) {
          videoElement.currentTime = videoCurrentTime;
        }
      }
    } else if (timelineMode === 'grid' && activeVideoIndex !== null) {
      // Grid mode - update active video - only when not playing to avoid interference
      const activeClip = videoClips[activeVideoIndex];
      const videoElement = gridVideoRef.current;
      
      if (activeClip?.file && videoElement && videoElement.readyState >= 2 && !isPlaying && Math.abs(videoElement.currentTime - currentTime) > 0.1) {
        videoElement.currentTime = currentTime;
      }
    }
  }, [currentTime, timelineMode, timelineClips, activeVideoIndex, videoClips, isPlaying]);

  // Handle playback state changes
  useEffect(() => {
    const updateVideoPlayback = () => {
      if (timelineMode === 'sequence') {
        // Update all sequence videos
        sequenceVideoRefs.current.forEach((video, index) => {
          if (video) {
            if (isPlaying && currentActiveClip === timelineClips[index]) {
              video.play().catch(() => {
                // Video play failed, ignore
              });
            } else {
              video.pause();
            }
          }
        });
      } else if (timelineMode === 'grid') {
        // Update grid video
        const videoElement = gridVideoRef.current;
        if (videoElement) {
          if (isPlaying) {
            videoElement.play().catch(() => {
              // Video play failed, ignore
            });
          } else {
            videoElement.pause();
          }
        }
      }
    };

    updateVideoPlayback();
  }, [isPlaying, timelineMode, currentActiveClip, timelineClips]);

  // Sync video time with timeline during playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const syncVideoTime = () => {
      if (timelineMode === 'sequence' && currentActiveClip) {
        const clipIndex = timelineClips.indexOf(currentActiveClip);
        const videoElement = sequenceVideoRefs.current[clipIndex];
        
        if (videoElement && !videoElement.paused && !videoElement.ended) {
          const videoTime = videoElement.currentTime;
          const timelineTime = (videoTime - currentActiveClip.startTime) + currentActiveClip.timelineStartTime;
          
          // Only update if there's a significant difference to avoid jitter
          if (onCurrentTimeChange && Math.abs(timelineTime - currentTime) > 0.05) {
            onCurrentTimeChange(timelineTime);
          }
        }
      } else if (timelineMode === 'grid' && activeVideoIndex !== null && videoClips[activeVideoIndex]?.file) {
        const videoElement = gridVideoRef.current;
        
        if (videoElement && !videoElement.paused && !videoElement.ended && onCurrentTimeChange) {
          const videoTime = videoElement.currentTime;
          
          // Only update if there's a significant difference to avoid jitter
          if (Math.abs(videoTime - currentTime) > 0.05) {
            onCurrentTimeChange(videoTime);
          }
        }
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(syncVideoTime);
      }
    };

    animationFrameRef.current = requestAnimationFrame(syncVideoTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, timelineMode, currentActiveClip, timelineClips, activeVideoIndex, videoClips, currentTime, onCurrentTimeChange]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    const sequenceVideos = sequenceVideoRefs.current;
    const gridVideo = gridVideoRef.current;
    
    return () => {
      // Cleanup video object URLs
      sequenceVideos.forEach(video => {
        if (video?.src) {
          URL.revokeObjectURL(video.src);
        }
      });
      
      if (gridVideo?.src) {
        URL.revokeObjectURL(gridVideo.src);
      }
    };
  }, []);

  // Don't render if no content available
  const hasContent = timelineMode === 'sequence' 
    ? timelineClips.length > 0 
    : (activeVideoIndex !== null && videoClips[activeVideoIndex]?.file);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 mb-4 shadow-lg border border-gray-700/50 backdrop-blur-sm">
      <h3 className="text-gray-300 font-medium mb-3">Live Preview</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-80 h-44 bg-black rounded-lg overflow-hidden">
          {timelineMode === 'sequence' ? (
            // Sequence mode preview
            <>
              {timelineClips.map((clip, index) => (
                <video
                  key={`${clip.file.name}-${index}`}
                  ref={(el) => {
                    if (el) sequenceVideoRefs.current[index] = el;
                  }}
                  src={URL.createObjectURL(clip.file)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                    currentActiveClip === clip ? 'opacity-100' : 'opacity-0'
                  }`}
                  muted
                  playsInline
                  preload="metadata"
                />
              ))}
              {!currentActiveClip && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  No active clip
                </div>
              )}
            </>
          ) : (
            // Grid mode preview
            activeVideoIndex !== null && videoClips[activeVideoIndex]?.file && (
              <video
                ref={gridVideoRef}
                src={URL.createObjectURL(videoClips[activeVideoIndex].file)}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            )
          )}
          
          {/* Current time overlay */}
          <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-70 px-2 py-1 rounded">
            {formatTime(currentTime)}
          </div>
          
          {/* Grid mode selection overlay */}
          {timelineMode === 'grid' && activeVideoIndex !== null && videoClips[activeVideoIndex] && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Before start time overlay */}
              {currentTime < videoClips[activeVideoIndex].startTime && (
                <div className="absolute inset-0 bg-black opacity-70 flex items-center justify-center text-white text-sm">
                  Before start
                </div>
              )}
              {/* After end time overlay */}
              {currentTime > videoClips[activeVideoIndex].endTime && (
                <div className="absolute inset-0 bg-black opacity-70 flex items-center justify-center text-white text-sm">
                  After end
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
