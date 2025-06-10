// drawingFunctions.ts

import { applyPixelatedBlur, applyGaussianBlur, applyMosaicBlur } from './blurFunctions';
import { BlurSettings } from './gifMakerUtils';

export const getMousePos = (
  e: React.MouseEvent | React.TouchEvent,
  canvasRef: React.RefObject<HTMLCanvasElement>
): { x: number; y: number } => {
  if (!canvasRef.current) return { x: 0, y: 0 };
  const rect = canvasRef.current.getBoundingClientRect();

  // Get position considering touch or mouse events
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

  return {
    x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
    y: (clientY - rect.top) * (canvasRef.current.height / rect.height),
  };
};

export const drawMask = (
  pos: { x: number; y: number },
  maskCanvas: HTMLCanvasElement | null,
  brushSize: number
) => {
  if (!maskCanvas) return;

  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return;

  // Set drawing properties
  maskCtx.globalCompositeOperation = "source-over";
  maskCtx.fillStyle = "white";
  maskCtx.beginPath();
  maskCtx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
  maskCtx.fill();
};

export const clearMask = (
  maskCanvas: HTMLCanvasElement | null,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (!maskCanvas) return;

  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return;

  // Clear the mask canvas
  maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
};

export const displayFrame = (
  index: number,
  gifFrames: ImageData[],
  canvasRef: React.RefObject<HTMLCanvasElement>,
  maskCanvas: HTMLCanvasElement | null,
  setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>
) => {
  // Validate frames array exists and has content
  if (!Array.isArray(gifFrames)) {
    console.error("gifFrames is not an array");
    return;
  }

  if (gifFrames.length === 0) {
    console.error("No frames available to display");
    return;
  }

  // Validate index is within bounds
  const safeIndex = Math.max(0, Math.min(index, gifFrames.length - 1));
  if (index !== safeIndex) {
    console.warn(`Adjusted frame index from ${index} to ${safeIndex}`);
    index = safeIndex;
  }

  const canvas = canvasRef.current;
  if (!canvas) {
    console.error("Canvas ref not available");
    return;
  }

  const frame = gifFrames[index];
  if (!frame || !frame.data || frame.data.length === 0) {
    console.error("Invalid frame data at index", index);
    return;
  }

  // Ensure we have valid dimensions
  const frameWidth = Math.max(1, frame.width || 1);
  const frameHeight = Math.max(1, frame.height || 1);

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    console.error("Could not get canvas context");
    return;
  }

  // Set canvas dimensions
  canvas.width = frameWidth;
  canvas.height = frameHeight;

  // Update mask canvas dimensions to match
  if (
    maskCanvas &&
    (maskCanvas.width !== frameWidth || maskCanvas.height !== frameHeight)
  ) {
    maskCanvas.width = frameWidth;
    maskCanvas.height = frameHeight;
  }

  // Draw frame
  ctx.putImageData(frame, 0, 0);
  setCurrentFrameIndex(index);
};

export const applyBlurToCurrentFramePreview = (
  originalFrames: ImageData[],
  currentFrameIndex: number,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  maskCanvas: HTMLCanvasElement | null,
  blurSettings: BlurSettings
) => {
  if (
    !originalFrames.length ||
    currentFrameIndex < 0 ||
    currentFrameIndex >= originalFrames.length
  )
    return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  if (!maskCanvas) return;

  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskCtx) return;

  // Get the mask data
  const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);

  // Create a copy from the original frame for preview
  const frameData = new ImageData(
    new Uint8ClampedArray(originalFrames[currentFrameIndex].data),
    originalFrames[currentFrameIndex].width,
    originalFrames[currentFrameIndex].height
  );

  // Apply blur based on mask
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;

      // If pixel is in the mask (non-transparent)
      if (maskData.data[i + 3] > 0) {
        if (blurSettings.blurType === "pixelated") {
          applyPixelatedBlur(x, y, frameData, blurSettings.blurIntensity);
        } else if (blurSettings.blurType === "gaussian") {
          applyGaussianBlur(x, y, frameData, blurSettings.blurIntensity);
        } else if (blurSettings.blurType === "mosaic") {
          applyMosaicBlur(x, y, frameData, blurSettings.blurIntensity);
        }
      }
    }
  }

  // Display the preview without saving it
  ctx.putImageData(frameData, 0, 0);
};