/* eslint-disable @typescript-eslint/no-explicit-any */
import { Clock, UploadIcon } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDrag } from "react-use-gesture";
import VaultSelector from "./VaultSelector";
import { TimelineClip } from "@/utils/gifMakerUtils";

// Helper function for file validation
const validateVideoFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return { isValid: false, error: 'Please select a valid video file (MP4, WebM, MOV, etc.)' };
  }
  
  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 100MB' };
  }
  
  return { isValid: true };
};

// Sequence Video Player Component
const SequenceVideoPlayer: React.FC<{
  timelineClips: TimelineClip[];
  currentTime?: number;
  isPlaying?: boolean;
  videoRefs: React.RefObject<(HTMLVideoElement)[]>;
}> = ({ timelineClips, currentTime = 0, isPlaying = false, videoRefs }) => {
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find which clip should be active at current time
  const findActiveClip = useCallback(() => {
    return timelineClips.findIndex(clip => 
      currentTime >= clip.timelineStartTime && currentTime < clip.timelineEndTime
    );
  }, [currentTime, timelineClips]);

  // Update active clip when currentTime changes
  useEffect(() => {
    if (timelineClips.length === 0) return;

    const newActiveIndex = findActiveClip();
    if (newActiveIndex !== -1 && newActiveIndex !== activeClipIndex) {
      setActiveClipIndex(newActiveIndex);
      
      // Clean up previous URL
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      
      // Create new URL for the new active clip
      const newUrl = URL.createObjectURL(timelineClips[newActiveIndex].file);
      setVideoUrl(newUrl);
    }
  }, [currentTime, timelineClips, activeClipIndex, videoUrl, findActiveClip]);

  // Initialize with first clip
  useEffect(() => {
    if (timelineClips.length > 0 && !videoUrl) {
      const newUrl = URL.createObjectURL(timelineClips[0].file);
      setVideoUrl(newUrl);
    }

    // Cleanup on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [timelineClips.length, videoUrl]);

  // Update video time when clip or currentTime changes
  useEffect(() => {
    if (!videoRef.current || timelineClips.length === 0) return;

    const video = videoRef.current;
    const activeClip = timelineClips[activeClipIndex];
    
    if (activeClip) {
      // Calculate time within the clip
      const relativeTime = currentTime - activeClip.timelineStartTime;
      const videoTime = activeClip.startTime + relativeTime;
      
      // Clamp to clip bounds
      const clampedTime = Math.max(
        activeClip.startTime, 
        Math.min(activeClip.endTime, videoTime)
      );
      
      // Update video time if different
      if (Math.abs(video.currentTime - clampedTime) > 0.1) {
        video.currentTime = clampedTime;
      }
    }
  }, [currentTime, activeClipIndex, timelineClips]);

  // Handle play/pause state
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    if (isPlaying) {
      video.play().catch(() => {
        // Video play failed, ignore
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Register video element with parent refs
  useEffect(() => {
    if (videoRef.current && videoRefs.current) {
      videoRefs.current[0] = videoRef.current;
    }
  }, [videoRefs]);

  if (timelineClips.length === 0) {
    return (
      <div className="w-full max-w-md h-64 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-sm">No videos in timeline</p>
          <p className="text-xs text-gray-500 mt-1">Add clips to see preview</p>
        </div>
      </div>
    );
  }

  const activeClip = timelineClips[activeClipIndex] || timelineClips[0];
  const timeInClip = currentTime - activeClip.timelineStartTime + activeClip.startTime;

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-md bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl || ''}
            className="w-full h-64 object-contain"
            muted
            playsInline
            onLoadedMetadata={() => {
              if (videoRef.current && activeClip) {
                const relativeTime = currentTime - activeClip.timelineStartTime;
                const videoTime = activeClip.startTime + relativeTime;
                const clampedTime = Math.max(
                  activeClip.startTime, 
                  Math.min(activeClip.endTime, videoTime)
                );
                videoRef.current.currentTime = clampedTime;
              }
            }}
            onTimeUpdate={() => {
              // Keep video within clip bounds
              if (videoRef.current && activeClip) {
                const video = videoRef.current;
                if (video.currentTime < activeClip.startTime) {
                  video.currentTime = activeClip.startTime;
                } else if (video.currentTime > activeClip.endTime) {
                  video.currentTime = activeClip.endTime;
                }
              }
            }}
          />
          
          {/* Clip info overlay */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            Clip {activeClipIndex + 1}/{timelineClips.length}: {activeClip.file.name.slice(0, 15)}...
          </div>
          
          {/* Time overlay */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {Math.floor(timeInClip / 60)}:{Math.floor(timeInClip % 60).toString().padStart(2, '0')} / {Math.floor(activeClip.duration / 60)}:{Math.floor(activeClip.duration % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

type Template = {
  cols: number;
  rows: number;
  icon: React.ReactNode;
  name: string;
};

type Templates = {
  [key: string]: Template;
};

type VideoClip = {
  file: File | null;
  startTime: number;
  endTime: number;
  duration: number;
  scale?: number;
  positionX?: number;
  positionY?: number;
};

type GifMakerVideoCropperProps = {
  templates: Templates;
  videoClips: VideoClip[];
  setSelectedTemplate: (template: string) => void;
  setVideoClips: (
    clips: VideoClip[] | ((prevClips: VideoClip[]) => VideoClip[])
  ) => void;
  setActiveVideoIndex: (index: number | null) => void;
  videoRefs: React.RefObject<(HTMLVideoElement)[]>;
  selectedTemplate: string;
  outputGridRef: React.RefObject<HTMLDivElement>;
  activeVideoIndex: number | null;
  setIsPlaying: (isPlaying: boolean) => void;
  handleVideoChange: (index: number, file: File | null) => void;
  totalCells: number;
  setDimensions: (width: number, height: number) => void;
  currentTime?: number;
  isPlaying?: boolean;
  onCurrentTimeChange?: (time: number) => void;
  videoUrls: (string | null)[];
  vaultName?: string;
  // Timeline sequence props
  timelineClips?: TimelineClip[];
  timelineMode?: 'grid' | 'sequence';
};

const GifMakerVideoCropper = ({
  templates,
  videoClips,
  setSelectedTemplate,
  setVideoClips,
  setActiveVideoIndex,
  videoRefs,
  selectedTemplate,
  outputGridRef,
  activeVideoIndex,
  setIsPlaying,
  handleVideoChange,
  totalCells,
  setDimensions,
  currentTime = 0,
  isPlaying = false,
  videoUrls,
  vaultName,
  timelineClips = [],
  timelineMode = 'grid',
}: GifMakerVideoCropperProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseHeight = 360;
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const dragTargetRef = useRef<HTMLDivElement | null>(null);

  // Calculate aspect ratio dimensions
  const getAspectRatioSize = (layout: string) => {
    const template = templates[layout];
    if (!template) return { width: baseHeight, height: baseHeight };

    switch (layout) {
      case "Single":
        return { width: baseHeight * (16 / 9), height: baseHeight };
      case "Side by Side":
        return { width: baseHeight * 2, height: baseHeight };
      case "Horizontal Triptych":
        return { width: baseHeight * 3, height: baseHeight };
      case "Vertical Triptych":
        return { width: baseHeight, height: baseHeight * 3 };
      case "2x2 Grid":
        return { width: baseHeight * 2, height: baseHeight * 2 };
      default:
        return {
          width: baseHeight * template.cols,
          height: baseHeight * template.rows,
        };
    }
  };

  // Handle video scaling with performance optimization
  const handleVideoScale = (index: number, newScale: number) => {
    const videoElement = videoRefs.current?.[index]?.parentElement;
    if (videoElement) {
      videoElement.style.setProperty("--scale", newScale.toString());
    }

    setVideoClips((prevClips: VideoClip[]) => {
      const newClips = [...prevClips];
      newClips[index] = {
        ...newClips[index],
        scale: Math.max(0.1, Math.min(3, newScale)),
      };
      return newClips;
    });
  };

  // Use react-use-gesture for smooth dragging
  const bind = useDrag(({ movement: [mx, my], down }) => {
    if (activeVideoIndex === null || !dragTargetRef.current) return;

    const currentClip = videoClips[activeVideoIndex];
    const baseX = currentClip?.positionX || 0;
    const baseY = currentClip?.positionY || 0;

    if (down) {
      // Apply live drag offset using base position + current drag movement
      const offsetX = baseX + mx * 0.3;
      const offsetY = baseY + my * 0.3;

      dragTargetRef.current.style.setProperty("--translate-x", `${offsetX}px`);
      dragTargetRef.current.style.setProperty("--translate-y", `${offsetY}px`);
    }

    if (!down) {
      // Persist final position to state
      setVideoClips((prevClips: VideoClip[]) => {
        const newClips = [...prevClips];
        newClips[activeVideoIndex] = {
          ...newClips[activeVideoIndex],
          positionX: baseX + mx * 0.3,
          positionY: baseY + my * 0.3,
        };
        return newClips;
      });

      // Clear temporary drag styles
      dragTargetRef.current.style.removeProperty("--translate-x");
      dragTargetRef.current.style.removeProperty("--translate-y");
    }
  });

  // Set up responsive container
  useEffect(() => {
    const updateContainerSize = () => {
      if (!containerRef.current || !outputGridRef.current) return;

      const aspectRatio = getAspectRatioSize(selectedTemplate);
      setDimensions(aspectRatio.width, aspectRatio.height);

      const containerWidth = containerRef.current.offsetWidth;

      let scale = 1;
      if (selectedTemplate !== "Single") {
        scale = Math.min(containerWidth / aspectRatio.width, 1);
      }

      outputGridRef.current.style.width = `${aspectRatio.width * scale}px`;
      outputGridRef.current.style.height = `${aspectRatio.height * scale}px`;
      outputGridRef.current.style.margin = "0 auto";
    };

    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
  }, [selectedTemplate]);

  useEffect(() => {
    const videoEls = videoRefs.current;
    const handlers: (() => void)[] = [];

    videoEls?.forEach((video, i) => {
      if (!video || i === activeVideoIndex || !videoClips[i]) return;

      const clip = videoClips[i];
      const loopHandler = () => {
        if (video.currentTime >= clip.endTime) {
          video.currentTime = clip.startTime;
        }
      };

      video.addEventListener("timeupdate", loopHandler);
      video.play().catch(() => {});
      handlers.push(() => video.removeEventListener("timeupdate", loopHandler));
    });

    return () => {
      videoRefs?.current?.forEach((video) => video?.pause());
      handlers.forEach((cleanup) => cleanup());
    };
  }, [videoRefs, videoClips, activeVideoIndex]);

  // Video overlay with optimized drag handling
  const renderVideoOverlay = (index: number) => {
    if (!videoClips[index]?.file) return null;

    return (
      <div
        className="absolute inset-0 z-10 cursor-move"
        onMouseDown={() => setActiveVideoIndex(index)}
      />
    );
  };

  const handleOpenUploadModal = (index: number) => {
    setUploadingIndex(index);
    setUploadModalOpen(true);
  };

  const handleModalUpload = (file: File) => {
    if (uploadingIndex !== null) {
      handleVideoChange(uploadingIndex, file);
    }
  };

  return (
    <div className="flex-1">
      <VaultSelector
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleModalUpload}
        vaultName={vaultName}
      />

      <h2 className="text-xl font-semibold text-blue-300">GIF Template</h2>
      <p className="text-gray-300 mb-2">Choose a template for your GIF.</p>
      
      {/* Video Status */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Videos loaded: </span>
            <span className="text-white font-medium">
              {videoClips.filter(clip => clip.file).length} / {totalCells}
            </span>
          </div>
          {videoClips.filter(clip => clip.file).length < totalCells && (
            <button
              onClick={() => {
                const emptyIndex = videoClips.findIndex(clip => !clip.file);
                if (emptyIndex !== -1) {
                  handleOpenUploadModal(emptyIndex);
                }
              }}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full transition-colors"
            >
              + Add Video
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {totalCells > 1 ? 
            `Upload up to ${totalCells} videos to create a multi-video GIF with this template` :
            "Upload 1 video for this template"
          }
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {Object.keys(templates).map((key) => (
          <button
            key={key}
            onClick={() => {
              videoClips.forEach((clip) => {
                if (clip.file)
                  URL.revokeObjectURL(URL.createObjectURL(clip.file));
              });

              setSelectedTemplate(key);
              setVideoClips(
                Array(templates[key].cols * templates[key].rows)
                  .fill(null)
                  .map(() => ({
                    file: null,
                    startTime: 0,
                    endTime: 5,
                    duration: 0,
                    scale: 1,
                    positionX: 0,
                    positionY: 0,
                  }))
              );
              setActiveVideoIndex(null);
              if (videoRefs.current) {
                videoRefs.current.length = 0;
              }
            }}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
              selectedTemplate === key
                ? "bg-blue-600 text-white ring-2 ring-blue-400"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {templates[key].icon}
            <span className="text-xs mt-2">{templates[key].name}</span>
          </button>
        ))}
      </div>

      {/* Grid Preview */}
      <div className="mb-6">
        <h3 className="text-gray-300 mb-2 font-medium">Preview</h3>
        
        {timelineMode === 'sequence' ? (
          /* Sequence Mode - Single Video Preview */
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <div className="flex flex-col items-center">
              {timelineClips.length > 0 ? (
                <SequenceVideoPlayer
                  timelineClips={timelineClips}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  videoRefs={videoRefs}
                />
              ) : (
                <div className="w-full max-w-md h-64 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">No videos in timeline</p>
                    <p className="text-xs text-gray-500 mt-1">Use &quot;Add Video&quot; to add clips to the sequence</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Grid Mode - Original Multi-Video Grid */
          <div
            ref={containerRef}
            className="bg-gray-900 p-4 rounded-lg border border-gray-700"
          >
            <div
              ref={outputGridRef}
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${templates[selectedTemplate].cols}, 1fr)`,
                gridTemplateRows: `repeat(${templates[selectedTemplate].rows}, 1fr)`,
                gap: "2px",
                aspectRatio: `${getAspectRatioSize(selectedTemplate).width}/${
                  getAspectRatioSize(selectedTemplate).height
                }`,
              }}
            >
            {Array.from({ length: totalCells }).map((_, i) => (
              <div key={i} className="relative">
                <div
                  className={`relative bg-gray-700 w-full h-full flex items-center justify-center text-gray-400 transition overflow-hidden ${
                    activeVideoIndex === i ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  {videoClips[i]?.file ? (
                    <>
                      <div
                        ref={i === activeVideoIndex ? dragTargetRef : null}
                        {...(i === activeVideoIndex ? bind() : {})}
                        className="w-full h-full relative overflow-hidden"
                        style={{
                          transform: `translate(var(--translate-x, ${
                            videoClips[i].positionX || 0
                          }px), var(--translate-y, ${
                            videoClips[i].positionY || 0
                          }px)) scale(var(--scale, ${
                            videoClips[i].scale || 1
                          }))`,
                          transformOrigin: "center",
                          willChange: "transform",
                        }}
                        onWheel={(e) => {
                          if (activeVideoIndex !== i) return;
                          e.preventDefault();
                          const delta = e.deltaY * -0.01;
                          handleVideoScale(
                            i,
                            (videoClips[i].scale || 1) + delta
                          );
                        }}
                      >
                        <video
                          ref={(el) => {
                            if (!el || !videoRefs.current) return;
                            videoRefs.current[i] = el;
                          }}
                          src={videoUrls[i] || ""}
                          className="absolute inset-0 w-full h-full object-contain"
                          muted
                          playsInline
                          autoPlay={i === activeVideoIndex}
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            const clip = videoClips[i];

                            if (i === activeVideoIndex) {
                              // For active video, set to current time or start time
                              video.currentTime = currentTime || clip.startTime;
                              // Don't auto-play - let parent control
                            } else {
                              // For non-active videos, set up preview loop
                              video.currentTime = clip.startTime;

                              const loopVideo = () => {
                                if (video.currentTime >= clip.endTime) {
                                  video.currentTime = clip.startTime;
                                }
                              };

                              video.addEventListener("timeupdate", loopVideo);
                              video.play().catch(() => {});

                              // Return cleanup function
                              return () => {
                                video.removeEventListener(
                                  "timeupdate",
                                  loopVideo
                                );
                              };
                            }
                          }}
                        />
                        {renderVideoOverlay(i)}
                      </div>

                      {videoClips[i]?.file && activeVideoIndex === i && (
                        <div
                          key={`slider-${i}`}
                          className="absolute right-0 bottom-12 -mr-[41px] opacity-70 hover:opacity-100 transition-all duration-300"
                        >
                          <div className="flex flex-col items-end text-end justify-end">
                            <input
                              name={i.toString()}
                              id={`video-scale-${i}`}
                              type="range"
                              min="0.1"
                              max="3"
                              step="0.05"
                              value={videoClips[i].scale || 1}
                              onChange={(e) =>
                                handleVideoScale(i, parseFloat(e.target.value))
                              }
                              className="h-32 vertical-slider text-blue-500 accent-blue-500"
                              style={{
                                WebkitAppearance: "slider-vertical",
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-2 right-2 flex gap-2 z-30">
                        <button
                          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveVideoIndex(i);
                            setIsPlaying(false);
                            document
                              .getElementById("timeframe-editor")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                          }}
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        <button
                          className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-full"
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenUploadModal(i);
                          }}
                        >
                          <UploadIcon className="w-4 h-4" />
                        </button>

                        {/* Direct file upload button */}
                        <div className="relative">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const validation = validateVideoFile(file);
                                if (!validation.isValid) {
                                  alert(validation.error);
                                  return;
                                }

                                handleVideoChange(i, file);
                              }
                              e.target.value = '';
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full">
                            📁
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gray-700 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-600 transition z-10 w-full h-full">
                      {/* Vault Upload Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenUploadModal(i);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                      >
                        <Clock className="w-4 h-4" /> Upload from Vault
                      </button>
                      
                      {/* Direct File Upload */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const validation = validateVideoFile(file);
                              if (!validation.isValid) {
                                alert(validation.error);
                                return;
                              }

                              handleVideoChange(i, file);
                            }
                            e.target.value = '';
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                          📁 Upload from Device
                        </button>
                      </div>
                      
                      <span className="text-xs text-gray-400">or</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default GifMakerVideoCropper;