// gifMakerUtils.ts
import { FFmpeg } from "@ffmpeg/ffmpeg";

export interface VideoClip {
  file: File | null;
  startTime: number;
  endTime: number;
  duration: number;
  positionX?: number;
  positionY?: number;
  scale?: number;
  // For timeline-based clips (merged videos)
  timelineStartTime?: number; // When this clip starts in the overall timeline
  timelineEndTime?: number; // When this clip ends in the overall timeline
  clipIndex?: number; // Order in the timeline
}

export interface TimelineClip {
  file: File;
  startTime: number;
  endTime: number;
  duration: number;
  timelineStartTime: number;
  timelineEndTime: number;
  clipIndex: number;
}

export interface BlurSettings {
  blurType: "gaussian" | "pixelated" | "mosaic";
  blurIntensity: number;
  brushSize: number;
}

export interface GifSettings {
  maxDuration: number;
  fps: number;
  quality: number;
}

export type Layout =
  | "Single"
  | "Side by Side"
  | "Horizontal Triptych"
  | "Vertical Triptych"
  | "2x2 Grid";

export const fetchFile = async (file: File): Promise<Uint8Array> => {
  return new Uint8Array(await file.arrayBuffer());
};

export const createFilterComplex = (
  layout: Layout,
  clips: VideoClip[],
  fps: number,
  dimensions: { width: number; height: number }
): string => {
  const { width, height } = dimensions;
  if (width === 0 || height === 0) {
    throw new Error("GIF dimensions are not set");
  }

  const clipCount = clips.length;

  // Calculate base dimensions for each cell in the square grid
  const baseW =
    layout === "Side by Side"
      ? width / 2 // 2 horizontal rectangles
      : layout === "Horizontal Triptych"
        ? width / 3 // 3 horizontal rectangles
        : layout === "Vertical Triptych"
          ? width // 1 vertical rectangle per row, full width
          : layout === "2x2 Grid"
            ? width / 2 // 2x2 grid
            : width; // Single

  const baseH =
    layout === "Side by Side"
      ? height // Full height for horizontal rectangles
      : layout === "Horizontal Triptych"
        ? height // Full height for horizontal rectangles
        : layout === "Vertical Triptych"
          ? height / 3 // 3 vertical rectangles
          : layout === "2x2 Grid"
            ? height / 2 // 2x2 grid
            : height; // Single

  const scale = (index: number) => {
    const clip = clips[index];
    const scaleFactor = clip.scale || 1;
    const scaledW = baseW * scaleFactor;
    const scaledH = baseH * scaleFactor;

    // Scale position values based on cell size relative to full dimensions
    // This ensures consistent positioning across different layouts
    const positionScaleX = baseW / width;
    const positionScaleY = baseH / height;

    const scaledPositionX = (clip.positionX || 0) * positionScaleX;
    const scaledPositionY = (clip.positionY || 0) * positionScaleY;

    // Fix positioning: crop offset should be from center minus position movement
    // When user drags right (+positionX), we crop from further left to show content on the right
    const offsetX = Math.max(0, (scaledW - baseW) / 2 - scaledPositionX);
    const offsetY = Math.max(0, (scaledH - baseH) / 2 - scaledPositionY);

    return `[${index}:v]scale=${scaledW}:${scaledH}:force_original_aspect_ratio=decrease,crop=${baseW}:${baseH}:${offsetX}:${offsetY}[v${index}];`;
  };

  const label = (i: number) => `[v${i}]`;

  if (layout === "Single") {
    const clip = clips[0];
    if (
      clipCount === 1 &&
      (clip.positionX !== 0 || clip.positionY !== 0 || clip.scale !== 1)
    ) {
      return scale(0) + `${label(0)}fps=${fps},palettegen=stats_mode=diff[p]`;
    }

    if (
      clipCount === 1 &&
      clip.positionX === 0 &&
      clip.positionY === 0 &&
      clip.scale === 1
    ) {
      return `fps=${fps},palettegen=stats_mode=diff[p]`;
    }

    throw new Error("Single layout must have exactly one clip");
  }

  if (layout === "Side by Side" && clipCount === 2) {
    // Simple horizontal stack for 2 videos side by side
    return (
      scale(0) +
      scale(1) +
      `${label(0)}${label(1)}hstack=inputs=2,fps=${fps},palettegen=stats_mode=diff[p]`
    );
  }

  if (layout === "Horizontal Triptych" && clipCount === 3) {
    // Simple horizontal stack for 3 videos
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(2)}hstack=inputs=3,fps=${fps},palettegen=stats_mode=diff[p]`
    );
  }

  if (layout === "Vertical Triptych" && clipCount === 3) {
    // Simple vertical stack for 3 videos
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(2)}vstack=inputs=3,fps=${fps},palettegen=stats_mode=diff[p]`
    );
  }

  if (layout === "2x2 Grid" && clipCount === 4) {
    // Standard 2x2 grid
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      scale(3) +
      `color=black:size=${width}x${height}[bg];` +
      `[bg]${label(0)}overlay=0:0[tmp1];` +
      `[tmp1]${label(1)}overlay=${baseW}:0[tmp2];` +
      `[tmp2]${label(2)}overlay=0:${baseH}[tmp3];` +
      `[tmp3]${label(3)}overlay=${baseW}:${baseH}[v];` +
      `[v]fps=${fps},palettegen=stats_mode=diff[p]`
    );
  }

  throw new Error(`Unsupported layout ${layout} for ${clipCount} clips`);
};

export const createUseFilterComplex = (
  layout: Layout,
  clips: VideoClip[],
  fps: number,
  dimensions: { width: number; height: number }
): string => {
  const { width, height } = dimensions;
  if (width === 0 || height === 0) {
    throw new Error("GIF dimensions are not set");
  }

  const clipCount = clips.length;

  // Calculate base dimensions for each cell in the square grid
  const baseW =
    layout === "Side by Side"
      ? width / 2 // 2 horizontal rectangles
      : layout === "Horizontal Triptych"
        ? width / 3 // 3 horizontal rectangles
        : layout === "Vertical Triptych"
          ? width // 1 vertical rectangle per row, full width
          : layout === "2x2 Grid"
            ? width / 2 // 2x2 grid
            : width; // Single

  const baseH =
    layout === "Side by Side"
      ? height // Full height for horizontal rectangles
      : layout === "Horizontal Triptych"
        ? height // Full height for horizontal rectangles
        : layout === "Vertical Triptych"
          ? height / 3 // 3 vertical rectangles
          : layout === "2x2 Grid"
            ? height / 2 // 2x2 grid
            : height; // Single

  const scale = (index: number) => {
    const clip = clips[index];
    const scaleFactor = clip.scale || 1;
    const scaledW = baseW * scaleFactor;
    const scaledH = baseH * scaleFactor;

    // Scale position values based on cell size relative to full dimensions
    // This ensures consistent positioning across different layouts
    const positionScaleX = baseW / width;
    const positionScaleY = baseH / height;

    const scaledPositionX = (clip.positionX || 0) * positionScaleX;
    const scaledPositionY = (clip.positionY || 0) * positionScaleY;

    // Fix positioning: crop offset should be from center minus position movement
    // When user drags right (+positionX), we crop from further left to show content on the right
    const offsetX = Math.max(0, (scaledW - baseW) / 2 - scaledPositionX);
    const offsetY = Math.max(0, (scaledH - baseH) / 2 - scaledPositionY);

    return `[${index}:v]scale=${scaledW}:${scaledH}:force_original_aspect_ratio=decrease,crop=${baseW}:${baseH}:${offsetX}:${offsetY}[v${index}];`;
  };

  const label = (i: number) => `[v${i}]`;

  if (layout === "Single") {
    const clip = clips[0];
    if (
      clipCount === 1 &&
      (clip.positionX !== 0 || clip.positionY !== 0 || clip.scale !== 1)
    ) {
      return (
        scale(0) + `${label(0)}fps=${fps}[x];[x][1:v]paletteuse=dither=bayer`
      );
    }

    if (
      clipCount === 1 &&
      clip.positionX === 0 &&
      clip.positionY === 0 &&
      clip.scale === 1
    ) {
      return `fps=${fps}[x];[x][1:v]paletteuse=dither=bayer`;
    }

    throw new Error("Single layout must have exactly one clip");
  }

  if (layout === "Side by Side" && clipCount === 2) {
    // Simple horizontal stack for 2 videos side by side
    return (
      scale(0) +
      scale(1) +
      `${label(0)}${label(1)}hstack=inputs=2,fps=${fps}[x];[x][2:v]paletteuse=dither=bayer`
    );
  }

  if (layout === "Horizontal Triptych" && clipCount === 3) {
    // Simple horizontal stack for 3 videos
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(2)}hstack=inputs=3,fps=${fps}[x];[x][3:v]paletteuse=dither=bayer`
    );
  }

  if (layout === "Vertical Triptych" && clipCount === 3) {
    // Simple vertical stack for 3 videos
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(2)}vstack=inputs=3,fps=${fps}[x];[x][3:v]paletteuse=dither=bayer`
    );
  }

  if (layout === "2x2 Grid" && clipCount === 4) {
    // Standard 2x2 grid
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      scale(3) +
      `color=black:size=${width}x${height}[bg];` +
      `[bg]${label(0)}overlay=0:0[tmp1];` +
      `[tmp1]${label(1)}overlay=${baseW}:0[tmp2];` +
      `[tmp2]${label(2)}overlay=0:${baseH}[tmp3];` +
      `[tmp3]${label(3)}overlay=${baseW}:${baseH}[v];` +
      `[v]fps=${fps}[x];[x][4:v]paletteuse=dither=bayer`
    );
  }

  throw new Error(`Unsupported layout ${layout} for ${clipCount} clips`);
};
