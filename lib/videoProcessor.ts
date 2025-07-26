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


  // --- Apply scale, positionX, positionY ---
  const videoAspect = video.videoWidth / video.videoHeight;
  // --- COVER LOGIC: always fill and center, may crop ---
  const canvasAspect = targetWidth / targetHeight;
  const scale = Math.max(0.1, effects.scale || 1.0);
  let drawWidth = targetWidth * scale;
  let drawHeight = targetHeight * scale;
  // Use only one videoAspect variable
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    const videoAspect = video.videoWidth / video.videoHeight;
    if (videoAspect > canvasAspect) {
      drawHeight = targetHeight * scale;
      drawWidth = drawHeight * videoAspect;
    } else {
      drawWidth = targetWidth * scale;
      drawHeight = drawWidth / videoAspect;
    }
    // videoAspect is only used for calculation above
  }
  // Center and apply positionX/positionY as pixel offsets
  const posX = (effects.positionX || 0) * (targetWidth / 100);
  const posY = (effects.positionY || 0) * (targetHeight / 100);
  const offsetX = (targetWidth - drawWidth) / 2 + posX;
  const offsetY = (targetHeight - drawHeight) / 2 + posY;

  // Clear canvas with black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Save context state
  ctx.save();
  try {
    // Apply global blur filter (excluding blur if we have selective blur)
    const hasSelectiveBlur = effects.selectiveBlur && effects.selectiveBlur.length > 0;
    const globalBlur = hasSelectiveBlur ? 0 : effects.blur;
    if (globalBlur > 0) {
      ctx.filter = `blur(${Math.max(0, globalBlur)}px)`;
    }
    // Draw the video frame with scale/position (cover logic)
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
  }
  ctx.restore();
}

// --- Patch: Support side-by-side export in canvasBasedVideoExport ---
// If videos have gridId, render each grid's video in its half of the canvas
// (left: grid-1, right: grid-2)
const getGrids = (videos: VideoSequenceItem[]) => {
  const grids: Record<string, VideoSequenceItem[]> = {};
  for (const v of videos) {
    const grid = v.gridId || "grid-1";
    if (!grids[grid]) grids[grid] = [];
    grids[grid].push(v);
  }
  return grids;
};

export const canvasBasedVideoExport = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // Detect if side-by-side (multiple grids)
  const grids = getGrids(videos);
  const gridKeys = Object.keys(grids);
  const isSideBySide = gridKeys.length > 1;

  if (!isSideBySide) {
    // --- Original single-grid logic ---
    // (copied from previous implementation)
    // Sort videos by start time
    const sortedVideos = [...videos].sort((a, b) => a.startTime - b.startTime);
    const canvas = document.createElement("canvas");
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    const ffmpeg = await initFFmpeg();
    if (!ffmpeg || !ffmpeg.isLoaded()) throw new Error("FFmpeg not loaded");
    // Calculate total frames
    let totalDuration = 0;
    for (const video of sortedVideos) {
      const speedMultiplier = video.effects.speed || 1;
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = Math.max(0.1, trimEnd - trimStart);
      const effectiveDuration = trimmedDuration / speedMultiplier;
      totalDuration += effectiveDuration;
    }
    const totalFrames = Math.ceil(totalDuration * settings.fps);
    let currentFrame = 0;
    const frameFiles: string[] = [];
    // let videoStartTime = 0;
    for (const video of sortedVideos) {
      const speedMultiplier = video.effects.speed || 1;
      const trimStart = video.trimStart || 0;
      const trimEnd = video.trimEnd || video.duration;
      const trimmedDuration = Math.max(0.1, trimEnd - trimStart);
      const effectiveDuration = trimmedDuration / speedMultiplier;
      const frameCount = Math.ceil(effectiveDuration * settings.fps);
      // Prepare video element
      const videoElement = document.createElement("video");
      videoElement.src = video.url;
      videoElement.muted = true;
      videoElement.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        videoElement.onloadeddata = () => resolve();
        videoElement.onerror = () => reject(new Error("Failed to load video"));
      });
      for (let frame = 0; frame < frameCount; frame++) {
        const normalizedTime = frame / (frameCount - 1);
        const frameTime = trimStart + normalizedTime * trimmedDuration;
        videoElement.currentTime = Math.min(Math.max(frameTime, trimStart), trimEnd - 0.01);
        await new Promise<void>(resolve => {
          videoElement.onseeked = () => resolve();
          if (videoElement.readyState >= 2) resolve();
        });
        applyVideoEffects(
          videoElement,
          canvas,
          video.effects,
          settings.width,
          settings.height
        );
        const frameImageData = canvas.toDataURL("image/png");
        const frameData = frameImageData.split(",")[1];
        const frameBytes = Uint8Array.from(atob(frameData), c => c.charCodeAt(0));
        const frameFilename = `frame_${currentFrame.toString().padStart(6, "0")}.png`;
        ffmpeg.FS("writeFile", frameFilename, frameBytes);
        frameFiles.push(frameFilename);
        currentFrame++;
        if (onProgress) onProgress(15 + (currentFrame / totalFrames) * 60);
      }
      // videoStartTime += effectiveDuration;
    }
    if (onProgress) onProgress(75);
    const outputFilename = `output.${settings.format}`;
    const pixelCount = settings.width * settings.height;
    const baseBitrate = Math.min(8000, Math.max(2000, Math.floor((pixelCount * 2) / 1000)));
    const qualityMultiplier = settings.quality / 100;
    const targetBitrate = Math.floor(baseBitrate * qualityMultiplier);
    let outputArgs: string[];
    if (settings.format === "mp4") {
      outputArgs = [
        "-framerate",
        String(settings.fps),
        "-i",
        "frame_%06d.png",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-b:v",
        `${targetBitrate}k`,
        "-preset",
        "fast",
        "-movflags",
        "+faststart",
        "-y",
        outputFilename,
      ];
    } else {
      outputArgs = [
        "-framerate",
        String(settings.fps),
        "-i",
        "frame_%06d.png",
        "-c:v",
        "libvpx-vp9",
        "-b:v",
        `${targetBitrate}k`,
        "-crf",
        "30",
        "-speed",
        "4",
        "-y",
        outputFilename,
      ];
    }
    await ffmpeg.run(...outputArgs);
    if (onProgress) onProgress(90);
    const outputData = ffmpeg.FS("readFile", outputFilename);
    if (onProgress) onProgress(95);
    for (const frameFile of frameFiles) {
      try { ffmpeg.FS("unlink", frameFile); } catch {}
    }
    try { ffmpeg.FS("unlink", outputFilename); } catch {}
    if (onProgress) onProgress(100);
    const mimeType = settings.format === "mp4" ? "video/mp4" : "video/webm";
    const blob = new Blob([outputData], { type: mimeType });
    return blob;
  }

  // --- Side-by-side logic ---
  // Side-by-side: render each grid's video in its half of the canvas
  // Assume only two grids: grid-1 (left), grid-2 (right)
  const width = settings.width;
  const height = settings.height;
  const halfWidth = Math.floor(width / 2);

  // Find max duration across both grids
  const allVideos = [...(grids["grid-1"] || []), ...(grids["grid-2"] || [])];
  const maxDuration = Math.max(
    ...allVideos.map(v => (v.trimEnd || v.duration) - (v.trimStart || 0))
  );
  const fps = settings.fps;
  const totalFrames = Math.ceil(maxDuration * fps);

  // Prepare video elements for each grid
  const gridVideoElements: Record<string, HTMLVideoElement[]> = {};
  for (const gridId of gridKeys) {
    gridVideoElements[gridId] = grids[gridId].map(v => {
      const el = document.createElement("video");
      el.src = v.url;
      el.muted = true;
      el.crossOrigin = "anonymous";
      return el;
    });
  }

  // Wait for all videos to load
  await Promise.all(
    Object.values(gridVideoElements).flat().map(
      v => new Promise<void>((resolve, reject) => {
        v.onloadeddata = () => resolve();
        v.onerror = () => reject(new Error("Failed to load video"));
      })
    )
  );

  // Prepare canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // Prepare FFmpeg
  const ffmpeg = await initFFmpeg();
  if (!ffmpeg || !ffmpeg.isLoaded()) throw new Error("FFmpeg not loaded");

  // For each frame, draw both grids' videos (if present at this time)
  const frameFiles: string[] = [];
  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / fps;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // For each grid (left/right)
    for (const [i, gridId] of ["grid-1", "grid-2"].entries()) {
      const gridVideos = grids[gridId] || [];
      // Find the video active at time t, accounting for speed
      let video: VideoSequenceItem | undefined;
      let videoElement: HTMLVideoElement | undefined;
      let localTimeline = t;
      let acc = 0;
      for (let vIdx = 0; vIdx < gridVideos.length; vIdx++) {
        const v = gridVideos[vIdx];
        const speedMultiplier = v.effects.speed || 1;
        const trimStart = v.trimStart || 0;
        const trimEnd = v.trimEnd || v.duration;
        const trimmedDuration = trimEnd - trimStart;
        const effectiveDuration = trimmedDuration / speedMultiplier;
        if (localTimeline >= acc && localTimeline < acc + effectiveDuration) {
          video = v;
          videoElement = gridVideoElements[gridId][vIdx];
          // Map timeline time to video time, accounting for speed
          const relativeTime = localTimeline - acc;
          localTimeline = trimStart + (relativeTime * speedMultiplier);
          break;
        }
        acc += effectiveDuration;
      }
      if (video && videoElement) {
        // Seek video to localTimeline
        videoElement.currentTime = Math.min(Math.max(localTimeline, 0), (video.trimEnd || video.duration) - 0.01);
        await new Promise<void>(resolve => {
          videoElement.onseeked = () => resolve();
          if (videoElement.readyState >= 2) resolve();
        });
        // Draw to left or right half
        ctx.save();
        ctx.beginPath();
        ctx.rect(i === 0 ? 0 : halfWidth, 0, halfWidth, height);
        ctx.clip();
        // Draw video with effects, scaled to halfWidth x height
        applyVideoEffects(
          videoElement,
          canvas,
          video.effects,
          halfWidth,
          height
        );
        ctx.restore();
      }
    }

    // Save frame
    const frameImageData = canvas.toDataURL("image/png");
    const frameData = frameImageData.split(",")[1];
    const frameBytes = Uint8Array.from(atob(frameData), c => c.charCodeAt(0));
    const frameFilename = `frame_${frame.toString().padStart(6, "0")}.png`;
    ffmpeg.FS("writeFile", frameFilename, frameBytes);
    frameFiles.push(frameFilename);
    if (onProgress) onProgress(15 + (frame / totalFrames) * 60);
  }

  // Encode video from frames (reuse logic from original)
  if (onProgress) onProgress(75);
  const outputFilename = `output.${settings.format}`;
  const pixelCount = width * height;
  const baseBitrate = Math.min(8000, Math.max(2000, Math.floor((pixelCount * 2) / 1000)));
  const qualityMultiplier = settings.quality / 100;
  const targetBitrate = Math.floor(baseBitrate * qualityMultiplier);
  let outputArgs: string[];
  if (settings.format === "mp4") {
    outputArgs = [
      "-framerate",
      String(fps),
      "-i",
      "frame_%06d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      `${targetBitrate}k`,
      "-preset",
      "fast",
      "-movflags",
      "+faststart",
      "-y",
      outputFilename,
    ];
  } else {
    outputArgs = [
      "-framerate",
      String(fps),
      "-i",
      "frame_%06d.png",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      `${targetBitrate}k`,
      "-crf",
      "30",
      "-speed",
      "4",
      "-y",
      outputFilename,
    ];
  }
  await ffmpeg.run(...outputArgs);
  if (onProgress) onProgress(90);
  const outputData = ffmpeg.FS("readFile", outputFilename);
  if (onProgress) onProgress(95);
  for (const frameFile of frameFiles) {
    try { ffmpeg.FS("unlink", frameFile); } catch {}
  }
  try { ffmpeg.FS("unlink", outputFilename); } catch {}
  if (onProgress) onProgress(100);
  const mimeType = settings.format === "mp4" ? "video/mp4" : "video/webm";
  const blob = new Blob([outputData], { type: mimeType });
  return blob;
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

  // Check if any video has selective blur regions
  const hasSelectiveBlur = videos.some(
    (video) =>
      video.effects.selectiveBlur && video.effects.selectiveBlur.length > 0
  );

  if (hasSelectiveBlur) {
    console.warn(
      "Selective blur regions detected. MP4/WebM export uses canvas-based processing for selective blur support."
    );
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

    // Apply trimming - use trimStart and trimEnd if they exist
    const trimStart = video.trimStart || 0;
    const trimEnd = video.trimEnd || video.duration;
    const trimmedDuration = Math.max(0.1, trimEnd - trimStart); // Ensure minimum duration

    // Add input arguments with trimming
    inputArgs.push("-ss", String(trimStart)); // Start from trim point
    inputArgs.push("-t", String(trimmedDuration)); // Use trimmed duration
    inputArgs.push("-i", `input${i}.mp4`);

    // Build filter for this input
    let videoFilter = `[${i}:v]`;

    // Apply speed effect using setpts
    if (speedMultiplier !== 1) {
      videoFilter += `setpts=${1 / speedMultiplier}*PTS,`;
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

    if (region.shape === "circle") {
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

// --- Patch: Support side-by-side GIF export ---
export const exportToGif = async (
  videos: VideoSequenceItem[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const { default: GIF } = await import("gif.js");
    const gif = new GIF({
      workers: 2,
      quality: Math.round((100 - settings.quality) / 10),
      width: settings.width,
      height: settings.height,
      workerScript: "/gif.worker.js",
      background: "#000000",
      transparent: null,
    });
    const canvas = document.createElement("canvas");
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    // --- Side-by-side detection ---
    const getGrids = (videos: VideoSequenceItem[]) => {
      const grids: Record<string, VideoSequenceItem[]> = {};
      for (const v of videos) {
        const grid = v.gridId || "grid-1";
        if (!grids[grid]) grids[grid] = [];
        grids[grid].push(v);
      }
      return grids;
    };
    const grids = getGrids(videos);
    const gridKeys = Object.keys(grids);
    const isSideBySide = gridKeys.length > 1;

    // Preload all videos for all grids
    const gridVideoElements: Record<string, HTMLVideoElement[]> = {};
    for (const gridId of gridKeys) {
      gridVideoElements[gridId] = grids[gridId].map(v => {
        const el = document.createElement("video");
        el.src = v.url;
        el.muted = true;
        el.crossOrigin = "anonymous";
        return el;
      });
    }
    await Promise.all(
      Object.values(gridVideoElements).flat().map(
        v => new Promise<void>((resolve, reject) => {
          v.onloadeddata = () => resolve();
          v.onerror = () => reject(new Error("Failed to load video"));
        })
      )
    );
    if (onProgress) onProgress(10);

    // Calculate max duration for both grids
    const allVideos = Object.values(grids).flat();
    const maxDuration = Math.max(
      ...allVideos.map(v => (v.trimEnd || v.duration) - (v.trimStart || 0))
    );
    const fps = settings.fps;
    const totalFrames = Math.ceil(maxDuration * fps);
    const frameDelay = Math.round(1000 / fps);

    // let frameCount = 0;
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const t = frameIndex / fps;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, settings.width, settings.height);

      if (isSideBySide) {
        // For each grid (left/right), draw to offscreen then blit to main canvas
        const width = settings.width;
        const height = settings.height;
        const halfWidth = Math.floor(width / 2);
        for (const [i, gridId] of ["grid-1", "grid-2"].entries()) {
          const gridVideos = grids[gridId] || [];
          // Find the video active at time t, accounting for speed
          let video: VideoSequenceItem | undefined;
          let videoElement: HTMLVideoElement | undefined;
          let localTimeline = t;
          let acc = 0;
          for (let vIdx = 0; vIdx < gridVideos.length; vIdx++) {
            const v = gridVideos[vIdx];
            const speedMultiplier = v.effects.speed || 1;
            const trimStart = v.trimStart || 0;
            const trimEnd = v.trimEnd || v.duration;
            const trimmedDuration = trimEnd - trimStart;
            const effectiveDuration = trimmedDuration / speedMultiplier;
            if (localTimeline >= acc && localTimeline < acc + effectiveDuration) {
              video = v;
              videoElement = gridVideoElements[gridId][vIdx];
              // Map timeline time to video time, accounting for speed
              const relativeTime = localTimeline - acc;
              localTimeline = trimStart + (relativeTime * speedMultiplier);
              break;
            }
            acc += effectiveDuration;
          }
          if (video && videoElement) {
            // Seek video to localTimeline
            videoElement.currentTime = Math.min(Math.max(localTimeline, 0), (video.trimEnd || video.duration) - 0.01);
            await new Promise<void>(resolve => {
              videoElement.onseeked = () => resolve();
              if (videoElement.readyState >= 2) resolve();
            });
            // Draw to offscreen canvas, then to main canvas
            const offscreen = document.createElement("canvas");
            offscreen.width = halfWidth;
            offscreen.height = height;
            applyVideoEffects(
              videoElement,
              offscreen,
              video.effects,
              halfWidth,
              height
            );
            ctx.drawImage(offscreen, i === 0 ? 0 : halfWidth, 0);
          }
        }
      } else {
        // Single layout: account for speed effect
        let cumulativeTime = 0;
        let currentVideo: VideoSequenceItem | undefined;
        let videoIndex = -1;
        for (let i = 0; i < videos.length; i++) {
          const video = videos[i];
          const speedMultiplier = video.effects.speed || 1;
          const trimStart = video.trimStart || 0;
          const trimEnd = video.trimEnd || video.duration;
          const trimmedDuration = Math.max(0.1, trimEnd - trimStart);
          const effectiveDuration = trimmedDuration / speedMultiplier;
          if (t >= cumulativeTime && t < cumulativeTime + effectiveDuration) {
            currentVideo = video;
            videoIndex = i;
            break;
          }
          cumulativeTime += effectiveDuration;
        }
        if (currentVideo && videoIndex >= 0) {
          const videoElement = gridVideoElements["grid-1"][videoIndex];
          if (
            videoElement &&
            videoElement.videoWidth > 0 &&
            videoElement.videoHeight > 0
          ) {
            // Calculate video time relative to the video start, accounting for speed
            const speedMultiplier = currentVideo.effects.speed || 1;
            let videoStartTime = 0;
            for (let i = 0; i < videoIndex; i++) {
              const video = videos[i];
              const videoSpeedMultiplier = video.effects.speed || 1;
              const videoTrimStart = video.trimStart || 0;
              const videoTrimEnd = video.trimEnd || video.duration;
              const videoTrimmedDuration = Math.max(0.1, videoTrimEnd - videoTrimStart);
              const videoEffectiveDuration = videoTrimmedDuration / videoSpeedMultiplier;
              videoStartTime += videoEffectiveDuration;
            }
            const relativeTime = t - videoStartTime;
            const trimStart = currentVideo.trimStart || 0;
            const trimEnd = currentVideo.trimEnd || currentVideo.duration;
            const videoTime = Math.max(
              trimStart,
              Math.min(trimStart + (relativeTime * speedMultiplier), trimEnd - 0.01)
            );
            videoElement.currentTime = videoTime;
            await new Promise<void>(resolve => {
              videoElement.onseeked = () => resolve();
              if (videoElement.readyState >= 2) resolve();
            });
            try {
              applyVideoEffects(
                videoElement,
                canvas,
                currentVideo.effects,
                settings.width,
                settings.height
              );
            } catch {
              // fallback: draw without effects
              ctx.drawImage(
                videoElement,
                0,
                0,
                settings.width,
                settings.height
              );
            }
          }
        }
      }

      gif.addFrame(canvas, {
        delay: frameDelay,
        copy: true,
      });
      // frameCount++;
      if (onProgress && frameIndex % 5 === 0) {
        onProgress(30 + (frameIndex / totalFrames) * 50);
      }
      if (frameIndex % 3 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
    if (onProgress) onProgress(80);
    return new Promise<Blob>((resolve) => {
      gif.on("finished", (blob: Blob) => {
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

