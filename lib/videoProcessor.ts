import {
  VideoSequenceItem,
  ExportSettings,
  SelectiveBlurRegion,
} from "@/types/video";

// Mock FFmpeg functionality for now - replace with actual implementation
export const initFFmpeg = async (): Promise<object> => {
  // This would be replaced with actual FFmpeg initialization
  return Promise.resolve({});
};

export const generateVideoThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.onloadeddata = () => {
      canvas.width = 160;
      canvas.height = 90;
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL());
      }
    };

    video.src = URL.createObjectURL(file);
  });
};

export const applyVideoEffects = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  effects: VideoSequenceItem["effects"],
  targetWidth: number,
  targetHeight: number
): void => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Ensure video is ready and has valid dimensions
  if (
    !video ||
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return;
  }

  // Keep canvas size consistent with target dimensions
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Calculate scaling to fit video in canvas while maintaining aspect ratio
  const videoAspect = video.videoWidth / video.videoHeight;
  const canvasAspect = targetWidth / targetHeight;

  let drawWidth = targetWidth;
  let drawHeight = targetHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > canvasAspect) {
    // Video is wider - fit to width
    drawHeight = targetWidth / videoAspect;
    offsetY = (targetHeight - drawHeight) / 2;
  } else {
    // Video is taller - fit to height
    drawWidth = targetHeight * videoAspect;
    offsetX = (targetWidth - drawWidth) / 2;
  }

  // Clear canvas with black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Save context state
  ctx.save();

  try {
    // Apply global blur filter (excluding blur if we have selective blur)
    const hasSelectiveBlur =
      effects.selectiveBlur && effects.selectiveBlur.length > 0;
    const globalBlur = hasSelectiveBlur ? 0 : effects.blur;

    if (globalBlur > 0) {
      ctx.filter = `blur(${Math.max(0, globalBlur)}px)`;
    }

    // Draw the video frame
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

    // Apply selective blur if defined
    if (hasSelectiveBlur) {
      applySelectiveBlur(
        ctx,
        video,
        effects.selectiveBlur!,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight,
        targetWidth,
        targetHeight
      );
    }
  } catch (error) {
    console.error("Error drawing video frame:", error);
    // Fallback: draw without effects
    ctx.filter = "none";
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
  } finally {
    // Restore context state
    ctx.restore();
  }
};

export const exportMedia = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  if (settings.format === 'gif') {
    return exportToGif(videos, settings, onProgress);
  } else {
    return exportToVideo(videos, settings, onProgress);
  }
};

export const exportToVideo = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    if (onProgress) onProgress(10);

    // Calculate total duration accounting for speed effects
    const totalDuration = videos.reduce((total, video) => {
      const speedMultiplier = video.effects.speed || 1;
      const effectiveDuration = video.duration / speedMultiplier;
      return total + effectiveDuration;
    }, 0);

    console.log(`Exporting video sequence over ${totalDuration}s as ${settings.format.toUpperCase()}`);

    if (onProgress) onProgress(30);

    // Check if we need to apply any visual effects (not speed)
    const needsVisualEffects = videos.some(video => 
      video.effects.blur > 0 || 
      (video.effects.selectiveBlur && video.effects.selectiveBlur.length > 0)
    );

    // Use optimized export for all cases (it handles speed efficiently)
    if (!needsVisualEffects) {
      console.log("No visual effects needed, using optimized video export");
      return await optimizedCanvasVideoExport(videos, settings, onProgress);
    }

    // If visual effects are needed, use canvas-based approach
    console.log("Visual effects detected, using canvas-based export");
    return await canvasBasedVideoExport(videos, settings, onProgress);

  } catch (error) {
    console.error("Error during video export:", error);
    throw error;
  }
};

// Optimized canvas export using frame-by-frame approach like GIF but for video
const optimizedCanvasVideoExport = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = settings.width;
  canvas.height = settings.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Calculate total duration accounting for speed effects
  const totalDuration = videos.reduce((total, video) => {
    const speedMultiplier = video.effects.speed || 1;
    const effectiveDuration = video.duration / speedMultiplier;
    return total + effectiveDuration;
  }, 0);

  console.log(`Optimized export: ${totalDuration}s total duration at ${settings.fps} FPS`);

  // Create video elements for all videos and ensure they're fully loaded
  const videoElements: { [key: string]: HTMLVideoElement } = {};

  // Preload all videos and wait for them to be fully ready
  await Promise.all(
    videos.map(
      (video) =>
        new Promise<void>((resolve, reject) => {
          const videoElement = document.createElement("video");
          videoElement.src = video.url;
          videoElement.muted = true;
          videoElement.crossOrigin = "anonymous";
          videoElement.preload = "metadata";

          videoElement.onloadedmetadata = () => {
            console.log(`Loaded video: ${video.file.name} (${videoElement.duration}s)`);
            // Wait for video to be fully ready for seeking
            videoElement.onseeked = () => {
              videoElements[video.id] = videoElement;
              resolve();
            };
            // Seek to beginning to ensure video is ready
            videoElement.currentTime = 0;
          };

          videoElement.onerror = () => {
            reject(new Error(`Failed to load video: ${video.file.name}`));
          };
        })
    )
  );

  if (onProgress) onProgress(40);

  // Use MediaRecorder with manual frame control
  const stream = canvas.captureStream(0); // 0 = manual frame capture
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm; codecs=vp8',
    videoBitsPerSecond: 8000000 // Higher bitrate for better quality
  });

  const chunks: BlobPart[] = [];
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return new Promise<Blob>((resolve, reject) => {
    let isRecordingComplete = false;
    
    mediaRecorder.onstop = () => {
      if (!isRecordingComplete) {
        isRecordingComplete = true;
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log(`Video export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
        resolve(blob);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      reject(new Error('MediaRecorder error'));
    };

    const processFrameByFrame = async () => {
      try {
        const totalFrames = Math.ceil(totalDuration * settings.fps);
        const frameDelay = 1000 / settings.fps; // Delay between frames in ms
        
        console.log(`Processing ${totalFrames} frames at ${settings.fps} FPS`);
        
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
          const time = frameIndex / settings.fps; // Current time in the export timeline

          // Find current video for this time using cumulative timing
          let cumulativeTime = 0;
          let currentVideo: VideoSequenceItem | undefined;
          let videoIndex = -1;
          
          for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            const speedMultiplier = video.effects.speed || 1;
            const effectiveDuration = video.duration / speedMultiplier;
            
            if (time >= cumulativeTime && time < cumulativeTime + effectiveDuration) {
              currentVideo = video;
              videoIndex = i;
              break;
            }
            
            cumulativeTime += effectiveDuration;
          }

          // Clear canvas with black background
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, settings.width, settings.height);

          if (currentVideo && videoIndex >= 0) {
            const videoElement = videoElements[currentVideo.id];
            if (videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
              // Calculate video time relative to the video start, accounting for speed
              const speedMultiplier = currentVideo.effects.speed || 1;
              
              // Find the cumulative start time for this video
              let videoStartTime = 0;
              for (let i = 0; i < videoIndex; i++) {
                const video = videos[i];
                const videoSpeedMultiplier = video.effects.speed || 1;
                const videoEffectiveDuration = video.duration / videoSpeedMultiplier;
                videoStartTime += videoEffectiveDuration;
              }
              
              const relativeTime = time - videoStartTime;
              const videoTime = Math.max(
                0,
                Math.min(
                  relativeTime * speedMultiplier,
                  videoElement.duration - 0.01
                )
              );

              // Seek to the exact frame time
              await new Promise<void>((resolve) => {
                let attempts = 0;
                const maxAttempts = 3;

                const seekToTime = async () => {
                  attempts++;
                  videoElement.currentTime = videoTime;

                  // Wait for the seek to complete
                  const waitForSeek = () => {
                    return new Promise<void>((seekResolve) => {
                      const checkReady = () => {
                        const timeDiff = Math.abs(videoElement.currentTime - videoTime);
                        if (timeDiff < 0.1 && videoElement.readyState >= 2) {
                          seekResolve();
                        } else if (attempts < maxAttempts) {
                          setTimeout(checkReady, 30);
                        } else {
                          seekResolve(); // Give up after max attempts
                        }
                      };
                      setTimeout(checkReady, 30);
                    });
                  };

                  await waitForSeek();
                  
                  if (videoElement.readyState >= 2) {
                    resolve();
                  } else if (attempts < maxAttempts) {
                    setTimeout(seekToTime, 50);
                  } else {
                    resolve(); // Give up after max attempts
                  }
                };

                seekToTime();
              });

              // Draw the frame
              if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
                try {
                  // Apply effects if any, otherwise draw directly
                  if (currentVideo.effects.blur > 0 || (currentVideo.effects.selectiveBlur && currentVideo.effects.selectiveBlur.length > 0)) {
                    applyVideoEffects(videoElement, canvas, currentVideo.effects, settings.width, settings.height);
                  } else {
                    // Direct draw without effects for better performance
                    const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
                    const canvasAspect = settings.width / settings.height;

                    let drawWidth = settings.width;
                    let drawHeight = settings.height;
                    let offsetX = 0;
                    let offsetY = 0;

                    if (videoAspect > canvasAspect) {
                      drawHeight = settings.width / videoAspect;
                      offsetY = (settings.height - drawHeight) / 2;
                    } else {
                      drawWidth = settings.height * videoAspect;
                      offsetX = (settings.width - drawWidth) / 2;
                    }

                    ctx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
                  }
                } catch (error) {
                  console.warn("Error drawing frame:", error);
                }
              }
            }
          }

          // Manually capture this frame for the video
          const track = stream.getVideoTracks()[0];
          if (track && 'requestFrame' in track) {
            try {
              (track as MediaStreamTrack & { requestFrame(): void }).requestFrame();
            } catch {
              // requestFrame might not be supported, that's okay
            }
          }

          // Update progress
          if (onProgress) {
            const progress = 40 + (frameIndex / totalFrames) * 50;
            onProgress(Math.min(progress, 90));
          }

          // Add precise timing delay between frames
          if (frameIndex < totalFrames - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.max(16, frameDelay / 4))); // Minimum 16ms, max frameDelay/4
          }
        }

        console.log('All frames processed, stopping recording...');
        
        // Add a small delay to ensure the last frame is captured
        setTimeout(() => {
          if (!isRecordingComplete && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 200);
        
      } catch (error) {
        console.error('Error in frame processing:', error);
        reject(error);
      }
    };

    // Start recording and process frames
    mediaRecorder.start();
    processFrameByFrame().catch(reject);
  });
};

// Canvas-based export with proper timing
const canvasBasedVideoExport = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = settings.width;
  canvas.height = settings.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Calculate total duration accounting for speed effects
  const totalDuration = videos.reduce((total, video) => {
    const speedMultiplier = video.effects.speed || 1;
    const effectiveDuration = video.duration / speedMultiplier;
    return total + effectiveDuration;
  }, 0);

  // Use a higher bitrate for better quality
  const stream = canvas.captureStream(settings.fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: settings.format === 'mp4' ? 'video/webm; codecs=vp9' : `video/${settings.format}`,
    videoBitsPerSecond: 5000000 // 5 Mbps for better quality
  });

  const chunks: BlobPart[] = [];
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return new Promise<Blob>((resolve, reject) => {
    let cumulativeTime = 0;

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { 
        type: settings.format === 'mp4' ? 'video/webm' : `video/${settings.format}` 
      });
      console.log(`Video export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB, Duration: ${totalDuration}s`);
      resolve(blob);
    };

    mediaRecorder.onerror = (event) => {
      reject(new Error('MediaRecorder error: ' + event));
    };

    const processVideoSequence = async () => {
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const speedMultiplier = video.effects.speed || 1;
        const effectiveDuration = video.duration / speedMultiplier;
        
        console.log(`Processing video ${i + 1}/${videos.length}: ${video.file.name} (${effectiveDuration}s at ${speedMultiplier}x speed)`);
        
        await processVideo(video, effectiveDuration);
        
        cumulativeTime += effectiveDuration;
        
        // Update progress
        if (onProgress) {
          const progress = 30 + (cumulativeTime / totalDuration) * 60;
          onProgress(Math.min(progress, 90));
        }
      }
      
      // Stop recording after all videos processed
      mediaRecorder.stop();
    };

    const processVideo = async (video: VideoSequenceItem, duration: number): Promise<void> => {
      return new Promise<void>((videoResolve, videoReject) => {
        const videoElement = document.createElement("video");
        videoElement.src = video.url;
        videoElement.muted = true;
        videoElement.crossOrigin = "anonymous";
        videoElement.playbackRate = video.effects.speed || 1;

        const timeoutId = setTimeout(() => {
          videoReject(new Error(`Timeout processing video: ${video.file.name}`));
        }, 15000);

        videoElement.onloadeddata = () => {
          clearTimeout(timeoutId);
          
          const frameInterval = 1000 / settings.fps; // ms per frame
          const totalFrames = Math.ceil(duration * settings.fps);
          let frameCount = 0;
          
          const renderFrames = () => {
            if (frameCount >= totalFrames) {
              videoResolve();
              return;
            }

            const videoTime = (frameCount / settings.fps) * (video.effects.speed || 1);
            
            // Ensure we don't exceed video duration
            if (videoTime >= videoElement.duration) {
              videoResolve();
              return;
            }

            videoElement.currentTime = videoTime;
            
            const drawFrame = () => {
              // Clear canvas
              ctx.fillStyle = "#000000";
              ctx.fillRect(0, 0, settings.width, settings.height);

              if (videoElement.readyState >= 2) {
                try {
                  applyVideoEffects(
                    videoElement,
                    canvas,
                    video.effects,
                    settings.width,
                    settings.height
                  );
                } catch (error) {
                  console.warn("Error applying effects:", error);
                  // Fallback: draw without effects
                  const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
                  const canvasAspect = settings.width / settings.height;

                  let drawWidth = settings.width;
                  let drawHeight = settings.height;
                  let offsetX = 0;
                  let offsetY = 0;

                  if (videoAspect > canvasAspect) {
                    drawHeight = settings.width / videoAspect;
                    offsetY = (settings.height - drawHeight) / 2;
                  } else {
                    drawWidth = settings.height * videoAspect;
                    offsetX = (settings.width - drawWidth) / 2;
                  }

                  ctx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
                }
              }

              frameCount++;
              
              // Schedule next frame
              setTimeout(() => {
                renderFrames();
              }, frameInterval);
            };

            // Wait a bit for the seek to complete
            setTimeout(drawFrame, 50);
          };

          renderFrames();
        };

        videoElement.onerror = () => {
          clearTimeout(timeoutId);
          videoReject(new Error(`Failed to load video: ${video.file.name}`));
        };
      });
    };

    // Start recording and process videos
    mediaRecorder.start();
    processVideoSequence().catch(reject);
  });
};

export const exportToGif = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    // Import GIF.js dynamically to avoid SSR issues
    const { default: GIF } = await import("gif.js");

    // Create GIF encoder with better settings
    const gif = new GIF({
      workers: 2,
      quality: Math.round((100 - settings.quality) / 10),
      width: settings.width,
      height: settings.height,
      workerScript: "/gif.worker.js",
      background: "#000000", // Set black background
      transparent: null, // Disable transparency
    });

    // Create a canvas for rendering frames
    const canvas = document.createElement("canvas");
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Create video elements for all videos and ensure they're fully loaded
    const videoElements: { [key: string]: HTMLVideoElement } = {};

    if (onProgress) onProgress(10);

    // Preload all videos and wait for them to be fully ready
    await Promise.all(
      videos.map(
        (video) =>
          new Promise<void>((resolve, reject) => {
            const videoElement = document.createElement("video");
            videoElement.src = video.url;
            videoElement.muted = true;
            videoElement.crossOrigin = "anonymous";
            videoElement.preload = "metadata";

            videoElement.onloadedmetadata = () => {
              // Wait for video to be fully ready for seeking
              videoElement.onseeked = () => {
                videoElements[video.id] = videoElement;
                resolve();
              };
              // Seek to beginning to ensure video is ready
              videoElement.currentTime = 0;
            };

            videoElement.onerror = () => {
              reject(new Error(`Failed to load video: ${video.file.name}`));
            };
          })
      )
    );

    if (onProgress) onProgress(30);

    // Calculate frame timing accounting for speed effects
    // Use the full duration of all videos for GIF export
    const totalDuration = videos.reduce((total, video) => {
      const speedMultiplier = video.effects.speed || 1;
      const effectiveDuration = video.duration / speedMultiplier;
      return total + effectiveDuration;
    }, 0);
    
    const totalFrames = Math.ceil(totalDuration * settings.fps);
    const frameDelay = Math.round(1000 / settings.fps);

    console.log(
      `Exporting ${totalFrames} frames over ${totalDuration}s at ${settings.fps} FPS as GIF`
    );

    let frameCount = 0;

    // Generate frames sequentially to avoid seeking issues
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const time = frameIndex / settings.fps; // Current time in the sequence

      // Find current video for this time using cumulative timing
      let cumulativeTime = 0;
      let currentVideo: VideoSequenceItem | undefined;
      let videoIndex = -1;
      
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const speedMultiplier = video.effects.speed || 1;
        const effectiveDuration = video.duration / speedMultiplier;
        
        if (time >= cumulativeTime && time < cumulativeTime + effectiveDuration) {
          currentVideo = video;
          videoIndex = i;
          break;
        }
        
        cumulativeTime += effectiveDuration;
      }

      // Always start with a black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, settings.width, settings.height);

      if (currentVideo && videoIndex >= 0) {
        const videoElement = videoElements[currentVideo.id];
        
        if (
          videoElement &&
          videoElement.videoWidth > 0 &&
          videoElement.videoHeight > 0
        ) {
          // Calculate video time relative to the video start, accounting for speed
          const speedMultiplier = currentVideo.effects.speed || 1;
          
          // Find the cumulative start time for this video
          let videoStartTime = 0;
          for (let i = 0; i < videoIndex; i++) {
            const video = videos[i];
            const videoSpeedMultiplier = video.effects.speed || 1;
            const videoEffectiveDuration = video.duration / videoSpeedMultiplier;
            videoStartTime += videoEffectiveDuration;
          }
          
          const relativeTime = time - videoStartTime;
          const videoTime = Math.max(
            0,
            Math.min(
              relativeTime * speedMultiplier,
              videoElement.duration - 0.01
            )
          );

          // Use a more reliable seeking method
          await new Promise<void>((resolve) => {
            let attempts = 0;
            const maxAttempts = 3;

            const seekToTime = async () => {
              attempts++;

              videoElement.currentTime = videoTime;

              // Wait for the seek to complete
              const waitForSeek = () => {
                return new Promise<void>((seekResolve) => {
                  const checkReady = () => {
                    // Check if video is at the right time and ready
                    const timeDiff = Math.abs(
                      videoElement.currentTime - videoTime
                    );
                    if (timeDiff < 0.1 && videoElement.readyState >= 2) {
                      seekResolve();
                    } else if (attempts < maxAttempts) {
                      setTimeout(checkReady, 50);
                    } else {
                      seekResolve(); // Give up after max attempts
                    }
                  };
                  setTimeout(checkReady, 50);
                });
              };

              await waitForSeek();

              // Double-check the frame is ready before drawing
              if (videoElement.readyState >= 2) {
                resolve();
              } else if (attempts < maxAttempts) {
                setTimeout(seekToTime, 100);
              } else {
                resolve(); // Give up after max attempts
              }
            };

            seekToTime();
          });

          // Ensure we have a valid frame before drawing
          if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
            try {
              applyVideoEffects(
                videoElement,
                canvas,
                currentVideo.effects,
                settings.width,
                settings.height
              );
            } catch (error) {
              console.warn("Error applying effects to frame:", error);
              // Fallback: draw without effects
              const videoAspect =
                videoElement.videoWidth / videoElement.videoHeight;
              const canvasAspect = settings.width / settings.height;

              let drawWidth = settings.width;
              let drawHeight = settings.height;
              let offsetX = 0;
              let offsetY = 0;

              if (videoAspect > canvasAspect) {
                drawHeight = settings.width / videoAspect;
                offsetY = (settings.height - drawHeight) / 2;
              } else {
                drawWidth = settings.height * videoAspect;
                offsetX = (settings.width - drawWidth) / 2;
              }

              ctx.drawImage(
                videoElement,
                offsetX,
                offsetY,
                drawWidth,
                drawHeight
              );
            }
          }
        }
      }

      // Validate that we have content on the canvas before adding to GIF
      const imageData = ctx.getImageData(0, 0, settings.width, settings.height);
      const hasContent = imageData.data.some(
        (value, index) => index % 4 !== 3 && value > 0 // Check RGB values (skip alpha)
      );

      if (!hasContent && currentVideo) {
        console.warn(
          `Frame ${frameIndex} appears to be black, but video should be present`
        );
      }

      // Add frame to GIF
      gif.addFrame(canvas, {
        delay: frameDelay,
        copy: true,
      });

      frameCount++;

      // Report progress (30-80% for frame generation)
      if (onProgress) {
        onProgress(30 + (frameCount / totalFrames) * 50);
      }

      // Small delay to prevent UI blocking
      if (frameIndex % 3 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    if (onProgress) onProgress(85);

    console.log(`Generated ${frameCount} frames, starting GIF encoding...`);

    // Render GIF
    return new Promise<Blob>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("GIF generation timed out"));
      }, 120000); // 2 minute timeout for encoding

      gif.on("progress", (progress: number) => {
        console.log(`GIF encoding progress: ${Math.round(progress * 100)}%`);
        if (onProgress) {
          onProgress(85 + progress * 15);
        }
      });

      gif.on("finished", (blob: Blob) => {
        console.log(
          `GIF export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`
        );
        clearTimeout(timeoutId);
        resolve(blob);
      });

      try {
        gif.render();
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  } catch (error) {
    console.error("Error during export:", error);
    throw error;
  }
};

export const getVideoMetadata = async (
  file: File
): Promise<{
  duration: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
};

const applySelectiveBlur = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  blurRegions: SelectiveBlurRegion[],
  videoOffsetX: number,
  videoOffsetY: number,
  videoDrawWidth: number,
  videoDrawHeight: number,
  canvasWidth: number,
  canvasHeight: number
): void => {
  // Create a temporary canvas for each blur region
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvasWidth;
  tempCanvas.height = canvasHeight;
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) return;

  blurRegions.forEach((region) => {
    // Calculate actual pixel coordinates from percentages
    const regionX = (region.x / 100) * videoDrawWidth + videoOffsetX;
    const regionY = (region.y / 100) * videoDrawHeight + videoOffsetY;
    const regionWidth = (region.width / 100) * videoDrawWidth;
    const regionHeight = (region.height / 100) * videoDrawHeight;

    // Clear temp canvas
    tempCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Create clipping path based on shape
    tempCtx.save();

    if (region.shape === "circle") {
      // Create circular clipping path
      const centerX = regionX + regionWidth / 2;
      const centerY = regionY + regionHeight / 2;
      const radius = Math.min(regionWidth, regionHeight) / 2;

      tempCtx.beginPath();
      tempCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      tempCtx.clip();
    } else {
      // Create rectangular clipping path
      tempCtx.beginPath();
      tempCtx.rect(regionX, regionY, regionWidth, regionHeight);
      tempCtx.clip();
    }

    // Apply blur filter and draw video in the clipped region
    tempCtx.filter = `blur(${Math.max(0, region.intensity)}px)`;
    tempCtx.drawImage(
      video,
      videoOffsetX,
      videoOffsetY,
      videoDrawWidth,
      videoDrawHeight
    );

    tempCtx.restore();

    // Composite the blurred region onto the main canvas
    ctx.save();

    // Create the same clipping path on main canvas
    if (region.shape === "circle") {
      const centerX = regionX + regionWidth / 2;
      const centerY = regionY + regionHeight / 2;
      const radius = Math.min(regionWidth, regionHeight) / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(regionX, regionY, regionWidth, regionHeight);
      ctx.clip();
    }

    // Draw the blurred region
    ctx.drawImage(tempCanvas, 0, 0);

    ctx.restore();
  });
};
