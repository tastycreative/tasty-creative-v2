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

export type Layout = "Single" | "Side by Side" | "Horizontal Triptych" | "Vertical Triptych" | "2x2 Grid";

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

  const baseW =
    width /
    (layout === "Side by Side"
      ? 2
      : layout === "Horizontal Triptych"
      ? 3
      : layout === "2x2 Grid"
      ? 2
      : 1);
  const baseH =
    height /
    (layout === "Vertical Triptych" ? 3 : layout === "2x2 Grid" ? 2 : 1);

  const scale = (index: number) => {
    const clip = clips[index];
    const scaleFactor = clip.scale || 1;
    const scaledW = baseW * scaleFactor;
    const scaledH = baseH * scaleFactor;
    const offsetX = (scaledW - baseW) / 2 - (clip.positionX || 0);
    const offsetY = (scaledH - baseH) / 2 - (clip.positionY || 0);

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
    return (
      scale(0) +
      scale(1) +
      `${label(0)}${label(
        1
      )}hstack=inputs=2,fps=${fps},palettegen=stats_mode=diff[p]`
    );
  }

  if (layout === "Horizontal Triptych" && clipCount === 3) {
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(
        2
      )}hstack=inputs=3[v];[v]fps=${fps},palettegen=stats_mode=diff[p]`
    );
  }

  if (layout === "Vertical Triptych" && clipCount === 3) {
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(
        2
      )}vstack=inputs=3[v];[v]fps=${fps},palettegen=stats_mode=diff[p]`
    );
  }

  if (layout === "2x2 Grid" && clipCount === 4) {
    const layoutStr = clips
      .map(
        (clip) =>
          `${Math.round((clip.positionX ?? 0) * baseW)}_${Math.round(
            (clip.positionY ?? 0) * baseH
          )}`
      )
      .join("|");

    return (
      scale(0) +
      scale(1) +
      scale(2) +
      scale(3) +
      `${label(0)}${label(1)}${label(2)}${label(
        3
      )}xstack=inputs=4:layout=${layoutStr},fps=${fps},palettegen=stats_mode=diff[p]`
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

  const baseW =
    width /
    (layout === "Side by Side"
      ? 2
      : layout === "Horizontal Triptych"
      ? 3
      : layout === "2x2 Grid"
      ? 2
      : 1);
  const baseH =
    height /
    (layout === "Vertical Triptych" ? 3 : layout === "2x2 Grid" ? 2 : 1);

  const scale = (index: number) => {
    const clip = clips[index];
    const scaleFactor = clip.scale || 1;
    const scaledW = baseW * scaleFactor;
    const scaledH = baseH * scaleFactor;
    const offsetX = (scaledW - baseW) / 2 - (clip.positionX || 0);
    const offsetY = (scaledH - baseH) / 2 - (clip.positionY || 0);

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
    return (
      scale(0) +
      scale(1) +
      `${label(0)}${label(
        1
      )}hstack=inputs=2,fps=${fps}[x];[x][2:v]paletteuse=dither=bayer`
    );
  }

  if (layout === "Horizontal Triptych" && clipCount === 3) {
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(
        2
      )}hstack=inputs=3,fps=${fps}[x];[x][3:v]paletteuse=dither=bayer`
    );
  }

  if (layout === "Vertical Triptych" && clipCount === 3) {
    return (
      scale(0) +
      scale(1) +
      scale(2) +
      `${label(0)}${label(1)}${label(
        2
      )}vstack=inputs=3,fps=${fps}[x];[x][3:v]paletteuse=dither=bayer`
    );
  }

  if (layout === "2x2 Grid" && clipCount === 4) {
    const layoutStr = clips
      .map(
        (clip) =>
          `${Math.round((clip.positionX ?? 0) * baseW)}_${Math.round(
            (clip.positionY ?? 0) * baseH
          )}`
      )
      .join("|");

    return (
      scale(0) +
      scale(1) +
      scale(2) +
      scale(3) +
      `${label(0)}${label(1)}${label(2)}${label(
        3
      )}xstack=inputs=4:layout=${layoutStr},fps=${fps}[x];[x][4:v]paletteuse=dither=bayer`
    );
  }

  throw new Error(`Unsupported layout ${layout} for ${clipCount} clips`);
};