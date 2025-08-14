import { createFFmpeg } from "@ffmpeg/ffmpeg";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any = null;

export const initFFmpeg = async () => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = createFFmpeg({
    log: true,
    corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
  });

  await ffmpeg.load();

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

export const fetchFile = async (file: File): Promise<Uint8Array> => {
  return new Uint8Array(await file.arrayBuffer());
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
  if (settings.format === "gif") {
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
    if (onProgress) onProgress(5);

    // Use FFmpeg for reliable MP4/WebM export
    console.log(
      `Exporting video sequence as ${settings.format.toUpperCase()} using FFmpeg`
    );
    return await ffmpegVideoExport(videos, settings, onProgress);
  } catch (error) {
    console.error("Error during video export:", error);

    // Fallback to MediaRecorder for WebM if FFmpeg fails
    if (settings.format === "webm") {
      console.warn(
        "FFmpeg export failed, falling back to MediaRecorder for WebM"
      );
      return await mediaRecorderVideoExport(videos, settings, onProgress);
    }

    throw error;
  }
};

// FFmpeg-based export for reliable MP4/WebM encoding (optimized for speed)
const ffmpegVideoExport = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  console.log(
    `Starting FFmpeg video export as ${settings.format.toUpperCase()}`
  );

  if (onProgress) onProgress(5);

  // Initialize FFmpeg
  const ffmpeg = await initFFmpeg();

  if (!ffmpeg || !ffmpeg.isLoaded()) {
    throw new Error("FFmpeg not loaded");
  }

  if (onProgress) onProgress(10);

  // Sort videos by start time to ensure correct order
  const sortedVideos = [...videos].sort((a, b) => a.startTime - b.startTime);

  // Write all video files to FFmpeg file system
  for (let i = 0; i < sortedVideos.length; i++) {
    const video = sortedVideos[i];
    const data = await fetchFile(video.file);
    ffmpeg.FS("writeFile", `input${i}.mp4`, data);
  }

  if (onProgress) onProgress(20);

  // Create filter complex for video processing
  let filterComplex = "";
  const inputArgs: string[] = [];

  // Add inputs with proper trimming, scaling, and effects
  for (let i = 0; i < sortedVideos.length; i++) {
    const video = sortedVideos[i];

    // Calculate adjusted duration based on speed effect
    const speedMultiplier = video.effects.speed || 1;

    // Add input arguments
    inputArgs.push("-ss", String(0)); // Start from beginning of each file
    inputArgs.push("-t", String(video.duration)); // Use original duration, we'll adjust with setpts
    inputArgs.push("-i", `input${i}.mp4`);

    // Build filter for this input
    let videoFilter = `[${i}:v]`;

    // Apply speed effect using setpts
    if (speedMultiplier !== 1) {
      videoFilter += `setpts=${1 / speedMultiplier}*PTS,`;
    }

    // Scale and pad to target dimensions
    videoFilter += `scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;

    // Apply blur effects
    if (video.effects.blur > 0) {
      videoFilter += `,boxblur=${video.effects.blur}:${video.effects.blur}`;
    }

    // Set fps
    videoFilter += `,fps=${settings.fps}`;

    videoFilter += `[v${i}];`;
    filterComplex += videoFilter;
  }

  if (onProgress) onProgress(30);

  // Concatenate all processed videos
  filterComplex +=
    sortedVideos.map((_, i) => `[v${i}]`).join("") +
    `concat=n=${sortedVideos.length}:v=1:a=0[vout]`;

  console.log("Filter complex:", filterComplex);

  // Create the concatenated video
  await ffmpeg.run(
    ...inputArgs,
    "-filter_complex",
    filterComplex,
    "-map",
    "[vout]",
    "-y",
    "concatenated.mp4"
  );

  if (onProgress) onProgress(60);

  // Prepare output arguments based on format
  const outputFilename = `output.${settings.format}`;
  let outputArgs: string[];

  // Calculate bitrate based on resolution and quality
  const pixelCount = settings.width * settings.height;
  const baseBitrate = Math.min(
    8000,
    Math.max(2000, Math.floor((pixelCount * 2) / 1000))
  );
  const qualityMultiplier = settings.quality / 100;
  const targetBitrate = Math.floor(baseBitrate * qualityMultiplier);

  if (settings.format === "mp4") {
    outputArgs = [
      "-i",
      "concatenated.mp4",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      `${targetBitrate}k`,
      "-preset",
      "fast", // Use faster preset for better performance
      "-movflags",
      "+faststart",
      "-y",
      outputFilename,
    ];
  } else {
    // WebM
    outputArgs = [
      "-i",
      "concatenated.mp4",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      `${targetBitrate}k`,
      "-crf",
      "30",
      "-speed",
      "4", // Faster encoding
      "-y",
      outputFilename,
    ];
  }

  if (onProgress) onProgress(75);

  // Encode final video
  await ffmpeg.run(...outputArgs);

  if (onProgress) onProgress(90);

  // Read the output file
  const outputData = ffmpeg.FS("readFile", outputFilename);

  if (onProgress) onProgress(95);

  // Clean up files
  for (let i = 0; i < sortedVideos.length; i++) {
    try {
      ffmpeg.FS("unlink", `input${i}.mp4`);
    } catch {
      // Ignore cleanup errors
    }
  }

  try {
    ffmpeg.FS("unlink", "concatenated.mp4");
    ffmpeg.FS("unlink", outputFilename);
  } catch {
    // Ignore cleanup errors
  }

  if (onProgress) onProgress(100);

  // Create blob from output data
  const mimeType = settings.format === "mp4" ? "video/mp4" : "video/webm";
  const blob = new Blob([outputData], { type: mimeType });

  console.log(
    `FFmpeg export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`
  );
  return blob;
};

// Fallback MediaRecorder export (renamed from highQualityCanvasVideoExport)
const mediaRecorderVideoExport = async (
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

  // Create video elements for all videos using same reliable approach as GIF
  const videoElements: { [key: string]: HTMLVideoElement } = {};

  if (onProgress) onProgress(10);

  // Preload all videos using the same reliable method as GIF export
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

  // Calculate frame timing accounting for speed effects (same as GIF)
  const totalDuration = videos.reduce((total, video) => {
    const speedMultiplier = video.effects.speed || 1;
    const effectiveDuration = video.duration / speedMultiplier;
    return total + effectiveDuration;
  }, 0);

  const totalFrames = Math.ceil(totalDuration * settings.fps);

  console.log(
    `Exporting ${totalFrames} frames over ${totalDuration}s at ${settings.fps} FPS as ${settings.format.toUpperCase()}`
  );

  // Collect all frames first using the same reliable approach as GIF
  const frames: ImageData[] = [];

  // Generate frames sequentially to avoid seeking issues (same as GIF)
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

    // Always start with a black background (same as GIF)
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
          Math.min(relativeTime * speedMultiplier, videoElement.duration - 0.01)
        );

        // Use the same reliable seeking method as GIF
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

        // Ensure we have a valid frame before drawing (same as GIF)
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

    // Validate that we have content on the canvas before adding frame (same as GIF)
    const imageData = ctx.getImageData(0, 0, settings.width, settings.height);
    const hasContent = imageData.data.some(
      (value, index) => index % 4 !== 3 && value > 0 // Check RGB values (skip alpha)
    );

    if (!hasContent && currentVideo) {
      console.warn(
        `Frame ${frameIndex} appears to be black, but video should be present`
      );
    }

    // Store frame
    frames.push(imageData);

    // Report progress (30-70% for frame generation)
    if (onProgress) {
      onProgress(30 + (frameIndex / totalFrames) * 40);
    }

    // Small delay to prevent UI blocking (same as GIF)
    if (frameIndex % 3 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

  console.log(`Collected ${frames.length} frames, now creating video...`);

  if (onProgress) onProgress(75);

  // Now create video from collected frames using MediaRecorder with improved timing
  return new Promise<Blob>((resolve, reject) => {
    // Create a new canvas for video recording
    const recordingCanvas = document.createElement("canvas");
    recordingCanvas.width = settings.width;
    recordingCanvas.height = settings.height;
    const recordingCtx = recordingCanvas.getContext("2d");

    if (!recordingCtx) {
      reject(new Error("Could not get recording canvas context"));
      return;
    }

    // Use proper FPS for the stream
    const stream = recordingCanvas.captureStream(settings.fps);

    // Determine best codec based on browser support and format
    let mimeType: string;
    if (settings.format === "mp4") {
      // For MP4 request, use best WebM codec available (MediaRecorder limitation)
      if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9")) {
        mimeType = "video/webm; codecs=vp9";
      } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp8")) {
        mimeType = "video/webm; codecs=vp8";
      } else {
        mimeType = "video/webm";
      }
    } else {
      // For WebM, use best codec available
      mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp8")
        ? "video/webm; codecs=vp8"
        : "video/webm";
    }

    // Calculate appropriate bitrate based on resolution and quality
    const pixelCount = settings.width * settings.height;
    const baseBitrate = Math.min(8000000, Math.max(2000000, pixelCount * 2));
    const qualityMultiplier = settings.quality / 100;
    const targetBitrate = Math.floor(baseBitrate * qualityMultiplier);

    console.log(
      `Using ${mimeType} with target bitrate: ${Math.floor(targetBitrate / 1000)} kbps`
    );

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: targetBitrate,
      });
    } catch (error) {
      console.warn("Falling back to basic MediaRecorder options:", error);
      mediaRecorder = new MediaRecorder(stream, { mimeType });
    }

    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    let isRecordingComplete = false;
    mediaRecorder.onstop = () => {
      if (!isRecordingComplete) {
        isRecordingComplete = true;
        const finalMimeType =
          settings.format === "mp4" ? "video/mp4" : "video/webm";
        const blob = new Blob(chunks, { type: finalMimeType });
        console.log(
          `Video export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`
        );
        resolve(blob);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error("MediaRecorder error:", event);
      reject(new Error("MediaRecorder error"));
    };

    // Start recording
    mediaRecorder.start();

    // Use requestAnimationFrame for smooth, precise timing instead of setTimeout
    let currentFrameIndex = 0;
    const frameInterval = 1000 / settings.fps;
    let lastFrameTime = performance.now();

    const playFrames = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - lastFrameTime;

      // Only draw frame if enough time has passed
      if (elapsed >= frameInterval - 1) {
        // Small tolerance for timing
        if (currentFrameIndex >= frames.length) {
          // All frames played, stop recording
          setTimeout(() => {
            if (!isRecordingComplete && mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
          }, 500);
          return;
        }

        // Draw current frame to recording canvas
        const currentFrame = frames[currentFrameIndex];
        recordingCtx.putImageData(currentFrame, 0, 0);

        currentFrameIndex++;
        lastFrameTime = currentTime;

        // Update progress
        if (onProgress && currentFrameIndex % 10 === 0) {
          const progress = 75 + (currentFrameIndex / frames.length) * 20;
          onProgress(Math.min(progress, 95));
        }
      }

      // Continue to next frame
      if (currentFrameIndex < frames.length) {
        requestAnimationFrame(playFrames);
      }
    };

    // Start playing frames
    requestAnimationFrame(playFrames);
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

        if (
          time >= cumulativeTime &&
          time < cumulativeTime + effectiveDuration
        ) {
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
            const videoEffectiveDuration =
              video.duration / videoSpeedMultiplier;
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

// Debug function to test video loading and canvas drawing
export const debugVideoExport = async (
  video: VideoSequenceItem
): Promise<string> => {
  console.log("Starting video debug...");

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Create and load video element
  const videoElement = document.createElement("video");
  videoElement.src = video.url;
  videoElement.muted = true;
  videoElement.crossOrigin = "anonymous";
  videoElement.preload = "auto";
  videoElement.playsInline = true;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Timeout loading video for debug"));
    }, 15000);

    videoElement.oncanplaythrough = async () => {
      clearTimeout(timeoutId);
      console.log(`Debug: Video loaded - ${video.file.name}`);
      console.log(`Duration: ${videoElement.duration}s`);
      console.log(
        `Dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`
      );
      console.log(`Ready state: ${videoElement.readyState}`);

      try {
        // Test seeking to middle of video
        const testTime = videoElement.duration / 2;
        videoElement.currentTime = testTime;

        // Wait for seek
        await new Promise<void>((seekResolve) => {
          const handleSeeked = () => {
            videoElement.removeEventListener("seeked", handleSeeked);
            seekResolve();
          };
          videoElement.addEventListener("seeked", handleSeeked);
          setTimeout(() => {
            videoElement.removeEventListener("seeked", handleSeeked);
            seekResolve();
          }, 1000);
        });

        console.log(`Debug: Seeked to ${videoElement.currentTime}s`);

        // Test drawing to canvas
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          console.log("Debug: Successfully drew video to canvas");
        } else {
          console.warn("Debug: Video not ready for drawing");
        }

        const dataURL = canvas.toDataURL();
        console.log("Debug: Canvas data URL length:", dataURL.length);

        resolve(dataURL);
      } catch (error) {
        console.error("Debug: Error during test:", error);
        reject(error);
      }
    };

    videoElement.onerror = (error) => {
      clearTimeout(timeoutId);
      console.error("Debug: Video load error:", error);
      reject(new Error("Failed to load video for debug"));
    };
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
