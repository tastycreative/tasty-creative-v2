// blurFunctions.ts
import { BlurSettings } from './gifMakerUtils';

export const applyGaussianBlur = (
  x: number,
  y: number,
  imageData: ImageData,
  blurIntensity: number
) => {
  const intensity = blurIntensity;
  const radius = Math.floor(intensity / 2);
  let r = 0,
    g = 0,
    b = 0,
    a = 0,
    count = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = Math.min(Math.max(x + dx, 0), imageData.width - 1);
      const ny = Math.min(Math.max(y + dy, 0), imageData.height - 1);
      const ni = (ny * imageData.width + nx) * 4;

      r += imageData.data[ni];
      g += imageData.data[ni + 1];
      b += imageData.data[ni + 2];
      a += imageData.data[ni + 3];
      count++;
    }
  }

  const i = (y * imageData.width + x) * 4;
  imageData.data[i] = r / count;
  imageData.data[i + 1] = g / count;
  imageData.data[i + 2] = b / count;
  imageData.data[i + 3] = a / count;
};

export const applyPixelatedBlur = (
  x: number,
  y: number,
  imageData: ImageData,
  blurIntensity: number
) => {
  const blockSize = Math.max(1, Math.floor(blurIntensity / 2));
  const blockX = Math.floor(x / blockSize) * blockSize;
  const blockY = Math.floor(y / blockSize) * blockSize;

  const baseI = (blockY * imageData.width + blockX) * 4;
  const r = imageData.data[baseI];
  const g = imageData.data[baseI + 1];
  const b = imageData.data[baseI + 2];
  const a = imageData.data[baseI + 3];

  const i = (y * imageData.width + x) * 4;
  imageData.data[i] = r;
  imageData.data[i + 1] = g;
  imageData.data[i + 2] = b;
  imageData.data[i + 3] = a;
};

export const applyMosaicBlur = (
  x: number,
  y: number,
  imageData: ImageData,
  blurIntensity: number
) => {
  const blockSize = Math.max(1, Math.floor(blurIntensity / 2));
  const blockX = Math.floor(x / blockSize) * blockSize;
  const blockY = Math.floor(y / blockSize) * blockSize;

  let r = 0,
    g = 0,
    b = 0,
    a = 0,
    count = 0;

  for (let dy = 0; dy < blockSize && blockY + dy < imageData.height; dy++) {
    for (let dx = 0; dx < blockSize && blockX + dx < imageData.width; dx++) {
      const nx = blockX + dx;
      const ny = blockY + dy;
      const ni = (ny * imageData.width + nx) * 4;

      r += imageData.data[ni];
      g += imageData.data[ni + 1];
      b += imageData.data[ni + 2];
      a += imageData.data[ni + 3];
      count++;
    }
  }

  const avgR = r / count;
  const avgG = g / count;
  const avgB = b / count;
  const avgA = a / count;

  const i = (y * imageData.width + x) * 4;
  imageData.data[i] = avgR;
  imageData.data[i + 1] = avgG;
  imageData.data[i + 2] = avgB;
  imageData.data[i + 3] = avgA;
};

export const processAllFramesWithBlur = async (
  gifFrames: ImageData[],
  maskCanvas: HTMLCanvasElement,
  blurSettings: BlurSettings,
  applyBlurFunctions: {
    gaussian: typeof applyGaussianBlur;
    pixelated: typeof applyPixelatedBlur;
    mosaic: typeof applyMosaicBlur;
  }
): Promise<ImageData[]> => {
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskCtx) throw new Error("Could not get mask context");

  // Get the mask data once (assumes same mask for all frames)
  const maskData = maskCtx.getImageData(
    0,
    0,
    maskCanvas.width,
    maskCanvas.height
  );

  const processedFrames = await Promise.all(
    gifFrames.map((frame) => {
      return new Promise<ImageData>((resolve) => {
        const frameData = new ImageData(
          new Uint8ClampedArray(frame.data),
          frame.width,
          frame.height
        );

        // Apply blur based on mask
        for (let y = 0; y < frame.height; y++) {
          for (let x = 0; x < frame.width; x++) {
            const i = (y * frame.width + x) * 4;

            // If pixel is in the mask (white)
            if (maskData.data[i + 3] > 0) {
              if (blurSettings.blurType === "pixelated") {
                applyBlurFunctions.pixelated(x, y, frameData, blurSettings.blurIntensity);
              } else if (blurSettings.blurType === "gaussian") {
                applyBlurFunctions.gaussian(x, y, frameData, blurSettings.blurIntensity);
              } else if (blurSettings.blurType === "mosaic") {
                applyBlurFunctions.mosaic(x, y, frameData, blurSettings.blurIntensity);
              }
            }
          }
        }

        resolve(frameData);
      });
    })
  );

  return processedFrames;
};