import {
  VideoSequenceItem,
  ExportSettings,
  SelectiveBlurRegion,
} from "@/types/video";
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

// FFmpeg-based export using direct video processing (like GIF maker)
const ffmpegVideoExport = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  console.log(`Starting FFmpeg video export as ${settings.format.toUpperCase()}`);
  
  // Check if any video has selective blur regions
  const hasSelectiveBlur = videos.some(video => 
    video.effects.selectiveBlur && video.effects.selectiveBlur.length > 0
  );

  if (hasSelectiveBlur) {
    console.warn('Selective blur regions detected. MP4/WebM export uses canvas-based processing for selective blur support.');
    // Use canvas-based export for selective blur support
    return await canvasBasedVideoExport(videos, settings, onProgress);
  }
  
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
      videoFilter += `setpts=${1/speedMultiplier}*PTS,`;
    }
    
    // Scale and pad to target dimensions
    videoFilter += `scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
    
    // Apply global blur effects (selective blur handled by canvas-based export)
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
  filterComplex += sortedVideos.map((_, i) => `[v${i}]`).join("") + 
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
  const baseBitrate = Math.min(8000, Math.max(2000, Math.floor(pixelCount * 2 / 1000)));
  const qualityMultiplier = settings.quality / 100;
  const targetBitrate = Math.floor(baseBitrate * qualityMultiplier);

  if (settings.format === 'mp4') {
    outputArgs = [
      "-i", "concatenated.mp4",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-b:v", `${targetBitrate}k`,
      "-preset", "fast", // Use faster preset for better performance
      "-movflags", "+faststart",
      "-y",
      outputFilename
    ];
  } else {
    // WebM
    outputArgs = [
      "-i", "concatenated.mp4", 
      "-c:v", "libvpx-vp9",
      "-b:v", `${targetBitrate}k`,
      "-crf", "30",
      "-speed", "4", // Faster encoding
      "-y",
      outputFilename
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
  const mimeType = settings.format === 'mp4' ? 'video/mp4' : 'video/webm';
  const blob = new Blob([outputData], { type: mimeType });
  
  console.log(`FFmpeg export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
  return blob;
};

// Fallback MediaRecorder export for WebM
const mediaRecorderVideoExport = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  videos: VideoSequenceItem[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings: ExportSettings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // This would be the old MediaRecorder implementation as fallback
  // For now, just throw an error
  throw new Error("MediaRecorder fallback not implemented yet");
};

// Selective blur application function
const applySelectiveBlur = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  selectiveBlurRegions: SelectiveBlurRegion[],
  offsetX: number,
  offsetY: number,
  drawWidth: number,
  drawHeight: number,
  targetWidth: number,
  targetHeight: number
): void => {
  // Create a temporary canvas for blurring specific regions
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;
  const tempCtx = tempCanvas.getContext("2d");
  
  if (!tempCtx) return;

  // Process each blur region
  selectiveBlurRegions.forEach((region) => {
    // Convert percentage-based coordinates to actual canvas coordinates
    const regionX = Math.round((region.x / 100) * drawWidth) + offsetX;
    const regionY = Math.round((region.y / 100) * drawHeight) + offsetY;
    const regionWidth = Math.round((region.width / 100) * drawWidth);
    const regionHeight = Math.round((region.height / 100) * drawHeight);

    // Ensure region stays within canvas bounds
    const clampedX = Math.max(0, Math.min(regionX, targetWidth));
    const clampedY = Math.max(0, Math.min(regionY, targetHeight));
    const clampedWidth = Math.min(regionWidth, targetWidth - clampedX);
    const clampedHeight = Math.min(regionHeight, targetHeight - clampedY);

    if (clampedWidth <= 0 || clampedHeight <= 0) return;

    // Clear temp canvas
    tempCtx.clearRect(0, 0, targetWidth, targetHeight);

    // Draw the video to temp canvas with blur
    tempCtx.save();
    tempCtx.filter = `blur(${Math.max(0, region.intensity)}px)`;
    tempCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    tempCtx.restore();

    // Create a clipping path for the blur region
    ctx.save();
    
    if (region.shape === 'circle') {
      // Create circular clipping path
      const centerX = clampedX + clampedWidth / 2;
      const centerY = clampedY + clampedHeight / 2;
      const radius = Math.min(clampedWidth, clampedHeight) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();
    } else {
      // Create rectangular clipping path
      ctx.beginPath();
      ctx.rect(clampedX, clampedY, clampedWidth, clampedHeight);
      ctx.clip();
    }

    // Draw the blurred region from the temp canvas
    ctx.drawImage(
      tempCanvas,
      clampedX,
      clampedY,
      clampedWidth,
      clampedHeight,
      clampedX,
      clampedY,
      clampedWidth,
      clampedHeight
    );

    ctx.restore();
  });
};

// GIF export function (using existing reliable implementation)
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

    // Generate frames sequentially to avoid seeking issues
    let frameCount = 0;
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

          // Use reliable seeking method
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

      // Add frame to GIF
      gif.addFrame(canvas, {
        delay: frameDelay,
        copy: true,
      });

      frameCount++;

      // Report progress (30-80% for frame generation)
      if (onProgress && frameIndex % 5 === 0) {
        onProgress(30 + (frameIndex / totalFrames) * 50);
      }

      // Small delay to prevent UI blocking
      if (frameIndex % 3 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    if (onProgress) onProgress(80);

    console.log(`Generated ${frameCount} frames, rendering final GIF...`);

    // Render the GIF
    return new Promise<Blob>((resolve) => {
      gif.on("finished", (blob: Blob) => {
        console.log(
          `GIF export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`
        );
        if (onProgress) onProgress(100);
        resolve(blob);
      });

      gif.on("progress", (p: number) => {
        if (onProgress) {
          onProgress(80 + p * 20);
        }
      });

      gif.render();
    });
  } catch (error) {
    console.error("Error during GIF export:", error);
    throw error;
  }
};

// Canvas-based video export for selective blur support
const canvasBasedVideoExport = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  console.log(`Starting canvas-based video export as ${settings.format.toUpperCase()} with selective blur support`);
  
  if (onProgress) onProgress(5);

  // Initialize FFmpeg
  const ffmpeg = await initFFmpeg();
  
  if (!ffmpeg || !ffmpeg.isLoaded()) {
    throw new Error("FFmpeg not loaded");
  }

  if (onProgress) onProgress(10);

  // Create canvas for frame processing
  const canvas = document.createElement('canvas');
  canvas.width = settings.width;
  canvas.height = settings.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Sort videos by start time
  const sortedVideos = [...videos].sort((a, b) => a.startTime - b.startTime);
  
  // Calculate total duration with speed effects
  let totalFrames = 0;
  const videoFrameCounts: number[] = [];
  
  for (const video of sortedVideos) {
    const speedMultiplier = video.effects.speed || 1;
    const effectiveDuration = video.duration / speedMultiplier;
    const frameCount = Math.ceil(effectiveDuration * settings.fps);
    videoFrameCounts.push(frameCount);
    totalFrames += frameCount;
  }

  if (onProgress) onProgress(15);

  // Process each video to create frames
  let currentFrame = 0;
  const frameFiles: string[] = [];

  for (let videoIndex = 0; videoIndex < sortedVideos.length; videoIndex++) {
    const video = sortedVideos[videoIndex];
    const frameCount = videoFrameCounts[videoIndex];
    const speedMultiplier = video.effects.speed || 1;
    
    // Create video element for processing
    const videoElement = document.createElement('video');
    videoElement.src = video.url;
    videoElement.muted = true;
    videoElement.crossOrigin = 'anonymous';
    
    // Wait for video to load
    await new Promise<void>((resolve, reject) => {
      videoElement.onloadeddata = () => resolve();
      videoElement.onerror = () => reject(new Error('Failed to load video'));
    });

    // Generate frames for this video
    for (let frame = 0; frame < frameCount; frame++) {
      const frameTime = (frame / settings.fps) * speedMultiplier;
      videoElement.currentTime = Math.min(frameTime, video.duration - 0.01);
      
      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        videoElement.onseeked = () => resolve();
        if (videoElement.readyState >= 2) resolve(); // Already at the right position
      });

      // Apply effects and draw frame
      applyVideoEffects(
        videoElement,
        canvas,
        video.effects,
        settings.width,
        settings.height
      );

      // Convert canvas to image data
      const frameImageData = canvas.toDataURL('image/png');
      const frameData = frameImageData.split(',')[1];
      const frameBytes = Uint8Array.from(atob(frameData), c => c.charCodeAt(0));
      
      // Write frame to FFmpeg file system
      const frameFilename = `frame_${currentFrame.toString().padStart(6, '0')}.png`;
      ffmpeg.FS('writeFile', frameFilename, frameBytes);
      frameFiles.push(frameFilename);
      
      currentFrame++;
      
      // Update progress
      const progress = 15 + (currentFrame / totalFrames) * 60;
      if (onProgress) onProgress(Math.min(75, progress));
    }
  }

  if (onProgress) onProgress(75);

  // Create video from frames using FFmpeg
  const outputFilename = `output.${settings.format}`;
  
  // Calculate bitrate based on resolution and quality
  const pixelCount = settings.width * settings.height;
  const baseBitrate = Math.min(8000, Math.max(2000, Math.floor(pixelCount * 2 / 1000)));
  const qualityMultiplier = settings.quality / 100;
  const targetBitrate = Math.floor(baseBitrate * qualityMultiplier);

  let outputArgs: string[];

  if (settings.format === 'mp4') {
    outputArgs = [
      '-framerate', String(settings.fps),
      '-i', 'frame_%06d.png',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-b:v', `${targetBitrate}k`,
      '-preset', 'fast',
      '-movflags', '+faststart',
      '-y',
      outputFilename
    ];
  } else {
    // WebM
    outputArgs = [
      '-framerate', String(settings.fps),
      '-i', 'frame_%06d.png',
      '-c:v', 'libvpx-vp9',
      '-b:v', `${targetBitrate}k`,
      '-crf', '30',
      '-speed', '4',
      '-y',
      outputFilename
    ];
  }

  if (onProgress) onProgress(80);

  // Encode final video
  await ffmpeg.run(...outputArgs);

  if (onProgress) onProgress(90);

  // Read the output file
  const outputData = ffmpeg.FS('readFile', outputFilename);
  
  if (onProgress) onProgress(95);

  // Clean up frame files
  for (const frameFile of frameFiles) {
    try {
      ffmpeg.FS('unlink', frameFile);
    } catch {
      // Ignore cleanup errors
    }
  }
  
  try {
    ffmpeg.FS('unlink', outputFilename);
  } catch {
    // Ignore cleanup errors
  }

  if (onProgress) onProgress(100);

  // Create blob from output data
  const mimeType = settings.format === 'mp4' ? 'video/mp4' : 'video/webm';
  const blob = new Blob([outputData], { type: mimeType });
  
  console.log(`Canvas-based video export complete. Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
  return blob;
};
