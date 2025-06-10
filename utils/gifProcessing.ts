// gifProcessing.ts
import { parseGIF, decompressFrames } from "gifuct-js";
import GIF from "gif.js";
import { GifSettings } from './gifMakerUtils';

export interface OriginalGifData {
  frames: {
    patch: Uint8ClampedArray;
    dims: {
      width: number;
      height: number;
      left: number;
      top: number;
    };
    disposalType: number;
    delay: number;
    transparentIndex?: number;
  }[];
  width: number;
  height: number;
  globalColorTable: number[] | null;
}

export const extractGifFrames = async (
  gifBlob: Blob,
  targetWidth: number,
  targetHeight: number
): Promise<{
  extractedFrames: ImageData[];
  originalGifData: OriginalGifData;
}> => {
  if (!gifBlob) {
    throw new Error("No GIF blob provided");
  }

  const arrayBuffer = await gifBlob.arrayBuffer();
  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true);

  // Get GIF dimensions from logical screen descriptor
  const gifWidth = gif.lsd?.width || 1;
  const gifHeight = gif.lsd?.height || 1;

  const extractedFrames: ImageData[] = [];
  const originalFrameData: OriginalGifData['frames'] = [];

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = gifWidth;
  tempCanvas.height = gifHeight;

  const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  let prevCanvasState: ImageData | null = null;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    if (!frame.patch || frame.patch.length === 0) {
      console.warn(`Skipping frame ${i} due to missing patch data`);
      continue;
    }

    try {
      const frameWidth = frame.dims.width;
      const frameHeight = frame.dims.height;
      const frameLeft = frame.dims.left;
      const frameTop = frame.dims.top;

      // Save original frame data
      originalFrameData.push({
        patch: new Uint8ClampedArray(frame.patch),
        dims: {
          width: frameWidth,
          height: frameHeight,
          left: frameLeft,
          top: frameTop,
        },
        disposalType: frame.disposalType,
        delay: frame.delay,
        transparentIndex: frame.transparentIndex,
      });

      // Handle frame disposal
      if (i > 0) {
        const prevFrame = frames[i - 1];
        switch (prevFrame.disposalType) {
          case 2:
            ctx.clearRect(
              prevFrame.dims.left,
              prevFrame.dims.top,
              prevFrame.dims.width,
              prevFrame.dims.height
            );
            break;
          case 3:
            if (prevCanvasState) {
              ctx.putImageData(prevCanvasState, 0, 0);
            }
            break;
        }
      } else {
        ctx.clearRect(0, 0, gifWidth, gifHeight);
      }

      if (frame.disposalType === 3) {
        prevCanvasState = ctx.getImageData(0, 0, gifWidth, gifHeight);
      }

      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = frameWidth;
      frameCanvas.height = frameHeight;
      const frameCtx = frameCanvas.getContext("2d");
      if (!frameCtx) continue;

      const imageData = new ImageData(
        new Uint8ClampedArray(frame.patch),
        frameWidth,
        frameHeight
      );
      frameCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(frameCanvas, frameLeft, frameTop);

      // Only scale if necessary
      if (targetWidth !== gifWidth || targetHeight !== gifHeight) {
        const scaledCanvas = document.createElement("canvas");
        scaledCanvas.width = targetWidth;
        scaledCanvas.height = targetHeight;
        const scaledCtx = scaledCanvas.getContext("2d");
        if (!scaledCtx) continue;

        scaledCtx.drawImage(
          ctx.canvas,
          0,
          0,
          gifWidth,
          gifHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        const croppedImageData = scaledCtx.getImageData(
          0,
          0,
          targetWidth,
          targetHeight
        );
        extractedFrames.push(croppedImageData);
      } else {
        // Use original dimensions
        const imageData = ctx.getImageData(0, 0, gifWidth, gifHeight);
        extractedFrames.push(imageData);
      }
    } catch (frameError) {
      console.error(`Error processing frame ${i}:`, frameError);
    }
  }

  if (extractedFrames.length === 0) {
    throw new Error("No valid frames could be extracted from the GIF");
  }

  return {
    extractedFrames,
    originalGifData: {
      frames: originalFrameData,
      width: gifWidth,
      height: gifHeight,
      globalColorTable: gif.gct ? gif.gct.flat() : null,
    }
  };
};

export const reconstructGif = async (
  gifFrames: ImageData[],
  originalGifData: OriginalGifData,
  gifSettings: GifSettings
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!gifFrames.length || !originalGifData) {
      reject(new Error("No frames or original data to reconstruct"));
      return;
    }

    const width = originalGifData.width;
    const height = originalGifData.height;

    const gif = new GIF({
      workers: 4,
      quality: gifSettings.quality,
      width: width,
      height: height,
      workerScript: "/gif.worker.js",
      dither: false,
      transparent: "auto",
      debug: false,
      repeat: 0,
    });

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const frameCanvas = document.createElement("canvas");
    const frameCtx = frameCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!frameCtx) {
      reject(new Error("Could not get frame canvas context"));
      return;
    }

    let prevCanvasState: ImageData | null = null;

    for (let i = 0; i < gifFrames.length; i++) {
      if (i > 0) {
        const prevFrameData = originalGifData.frames[i - 1];

        switch (prevFrameData.disposalType) {
          case 2:
            ctx.clearRect(
              prevFrameData.dims.left,
              prevFrameData.dims.top,
              prevFrameData.dims.width,
              prevFrameData.dims.height
            );
            break;
          case 3:
            if (prevCanvasState) {
              ctx.putImageData(prevCanvasState, 0, 0);
            }
            break;
        }
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      if (originalGifData.frames[i].disposalType === 3) {
        prevCanvasState = ctx.getImageData(0, 0, width, height);
      }

      const currentFrameData = originalGifData.frames[i];
      const frameWidth = currentFrameData.dims.width;
      const frameHeight = currentFrameData.dims.height;
      const frameLeft = currentFrameData.dims.left;
      const frameTop = currentFrameData.dims.top;

      frameCanvas.width = frameWidth;
      frameCanvas.height = frameHeight;

      const modifiedFrame = gifFrames[i];
      const extractedRegion = new ImageData(
        new Uint8ClampedArray(frameWidth * frameHeight * 4),
        frameWidth,
        frameHeight
      );

      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          const srcPos = ((frameTop + y) * width + (frameLeft + x)) * 4;
          const destPos = (y * frameWidth + x) * 4;

          extractedRegion.data[destPos] = modifiedFrame.data[srcPos];
          extractedRegion.data[destPos + 1] = modifiedFrame.data[srcPos + 1];
          extractedRegion.data[destPos + 2] = modifiedFrame.data[srcPos + 2];
          extractedRegion.data[destPos + 3] = modifiedFrame.data[srcPos + 3];
        }
      }

      frameCtx.putImageData(extractedRegion, 0, 0);
      ctx.drawImage(frameCanvas, frameLeft, frameTop);

      gif.addFrame(ctx, {
        delay: currentFrameData.delay,
        copy: true,
        dispose: currentFrameData.disposalType,
      });
    }

    gif.on("finished", (blob: Blob) => {
      resolve(blob);
    });

    gif.on("abort", () => {
      reject(new Error("GIF rendering aborted"));
    });

    gif.render();
  });
};