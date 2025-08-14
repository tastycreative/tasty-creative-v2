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

// Fallback MediaRecorder export for WebM
const mediaRecorderVideoExport = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
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
  // Implementation would go here - for now just log
  console.log("Selective blur not implemented in new FFmpeg export");
};

// GIF export function (simplified for now)
export const exportToGif = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // This would use the existing GIF export logic
  throw new Error("GIF export not implemented in new version yet");
};
