/**
 * Content Rectangle Calculation Utility
 *
 * Computes the exact screen-space bounding box for video/image content
 * after applying fit modes, transforms, crops, and zoom levels.
 *
 * This ensures transform overlays align perfectly with visible content.
 */

interface ContentRect {
  x: number; // Left position in screen pixels
  y: number; // Top position in screen pixels
  width: number; // Width in screen pixels
  height: number; // Height in screen pixels
}

interface MediaDimensions {
  width: number;
  height: number;
}

interface CanvasDimensions {
  width: number;
  height: number;
}

interface ClipTransform {
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
  fitMode: "contain" | "cover" | "fill";
  crop?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface LayoutCell {
  x: number; // Left position as percentage of canvas (0-100)
  y: number; // Top position as percentage of canvas (0-100)
  width: number; // Width as percentage of canvas (0-100)
  height: number; // Height as percentage of canvas (0-100)
}

interface ComputeContentRectOptions {
  clip: {
    transform?: ClipTransform;
    // Media intrinsic dimensions (from video/image metadata)
    intrinsicWidth?: number;
    intrinsicHeight?: number;
  };
  canvas: CanvasDimensions;
  layout?: {
    // Layout cell that this clip is assigned to
    cell?: LayoutCell;
    // Small gutter inside cell for auto-fit (in pixels)
    gutter?: number;
  };
  zoom?: number;
  devicePixelRatio?: number;
}

/**
 * Helper: Convert layout cell percentages to pixel dimensions
 */
export function layoutCellToPixels(
  cell: LayoutCell,
  canvas: CanvasDimensions
): CanvasDimensions & { offsetX: number; offsetY: number } {
  return {
    width: (cell.width / 100) * canvas.width,
    height: (cell.height / 100) * canvas.height,
    offsetX: (cell.x / 100) * canvas.width,
    offsetY: (cell.y / 100) * canvas.height,
  };
}

/**
 * Helper: Calculate auto-fit transform for a clip within a layout cell
 */
export function calculateAutoFitTransform(
  intrinsic: MediaDimensions,
  cellDimensions: CanvasDimensions,
  gutter: number = 8
): { scale: number; positionX: number; positionY: number } {
  // Apply gutter to get available area
  const availableWidth = Math.max(1, cellDimensions.width - gutter * 2);
  const availableHeight = Math.max(1, cellDimensions.height - gutter * 2);

  // Calculate scale to fit entirely within available area (contain behavior)
  const scaleX = availableWidth / intrinsic.width;
  const scaleY = availableHeight / intrinsic.height;
  const scale = Math.min(scaleX, scaleY);

  return {
    scale,
    positionX: 0, // Centered in cell
    positionY: 0, // Centered in cell
  };
}

/**
 * Step 1: Calculate base content dimensions after object-fit
 *
 * This replicates CSS object-fit behavior:
 * - contain: Scale to fit entirely within container, maintaining aspect ratio
 * - cover: Scale to fill container completely, maintaining aspect ratio
 * - fill: Stretch to fill container exactly (may distort aspect ratio)
 */
export function calculateFitDimensions(
  intrinsic: MediaDimensions,
  container: CanvasDimensions,
  fitMode: ClipTransform["fitMode"]
): MediaDimensions {
  const intrinsicAspect = intrinsic.width / intrinsic.height;
  const containerAspect = container.width / container.height;

  switch (fitMode) {
    case "fill":
      // Fill stretches to container dimensions exactly
      return {
        width: container.width,
        height: container.height,
      };

    case "contain":
      // Contain: scale down/up to fit entirely within container
      if (intrinsicAspect > containerAspect) {
        // Media is wider - fit to width
        return {
          width: container.width,
          height: container.width / intrinsicAspect,
        };
      } else {
        // Media is taller - fit to height
        return {
          width: container.height * intrinsicAspect,
          height: container.height,
        };
      }

    case "cover":
    default:
      // Cover: scale to fill container completely
      if (intrinsicAspect > containerAspect) {
        // Media is wider - fit to height, crop width
        return {
          width: container.height * intrinsicAspect,
          height: container.height,
        };
      } else {
        // Media is taller - fit to width, crop height
        return {
          width: container.width,
          height: container.width / intrinsicAspect,
        };
      }
  }
}

/**
 * Step 2: Apply crop to the fitted dimensions
 *
 * Crop values are percentages (0-100) that reduce the visible area
 */
export function applyCrop(
  dimensions: MediaDimensions,
  crop?: ClipTransform["crop"]
): MediaDimensions & { offsetX: number; offsetY: number } {
  if (!crop) {
    return { ...dimensions, offsetX: 0, offsetY: 0 };
  }

  const cropLeft = (crop.left || 0) / 100;
  const cropRight = (crop.right || 0) / 100;
  const cropTop = (crop.top || 0) / 100;
  const cropBottom = (crop.bottom || 0) / 100;

  const croppedWidth = dimensions.width * (1 - cropLeft - cropRight);
  const croppedHeight = dimensions.height * (1 - cropTop - cropBottom);

  return {
    width: croppedWidth,
    height: croppedHeight,
    offsetX: dimensions.width * cropLeft,
    offsetY: dimensions.height * cropTop,
  };
}

/**
 * Step 3: Apply transforms (scale, position, rotation)
 *
 * Order: scale → translate → rotate (around center)
 * Transform origin is always center of the content (or center of layout cell)
 */
export function applyTransforms(
  baseDimensions: MediaDimensions & { offsetX: number; offsetY: number },
  transform: ClipTransform,
  canvas: CanvasDimensions,
  layoutCell?: LayoutCell
): ContentRect {
  const { scale, positionX, positionY, rotation } = transform;

  // Apply scale to cropped dimensions
  const scaledWidth = baseDimensions.width * scale;
  const scaledHeight = baseDimensions.height * scale;

  // Calculate base position - use layout cell center if available, otherwise canvas center
  let baseCenterX = canvas.width / 2;
  let baseCenterY = canvas.height / 2;

  if (layoutCell) {
    const cellPixels = layoutCellToPixels(layoutCell, canvas);
    baseCenterX = cellPixels.offsetX + cellPixels.width / 2;
    baseCenterY = cellPixels.offsetY + cellPixels.height / 2;
  }

  // Apply position offset
  const centerX = baseCenterX + positionX;
  const centerY = baseCenterY + positionY;

  // For rotation, we need to calculate the axis-aligned bounding box
  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));

    // Rotated bounding box dimensions
    const rotatedWidth = scaledWidth * cos + scaledHeight * sin;
    const rotatedHeight = scaledWidth * sin + scaledHeight * cos;

    return {
      x: centerX - rotatedWidth / 2,
      y: centerY - rotatedHeight / 2,
      width: rotatedWidth,
      height: rotatedHeight,
    };
  }

  // No rotation - simple rectangle
  return {
    x: centerX - scaledWidth / 2,
    y: centerY - scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight,
  };
}

/**
 * Step 4: Apply zoom and device pixel ratio for screen coordinates
 */
export function applyScreenTransform(
  rect: ContentRect,
  zoom: number,
  devicePixelRatio: number
): ContentRect {
  const scale = zoom * devicePixelRatio;

  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/**
 * Main function: Compute exact content rectangle for transform overlay
 *
 * @param options - Clip data, canvas dimensions, layout cell, zoom level
 * @returns Screen-space bounding rectangle that matches visible content
 */
export function computeContentRect(
  options: ComputeContentRectOptions
): ContentRect {
  const {
    clip,
    canvas,
    layout,
    zoom = 1,
    devicePixelRatio = window.devicePixelRatio || 1,
  } = options;

  // Default transform values
  const transform: ClipTransform = {
    scale: 1,
    positionX: 0,
    positionY: 0,
    rotation: 0,
    fitMode: "cover",
    ...clip.transform,
  };

  // Default intrinsic dimensions (assume 16:9 if not provided)
  const intrinsic: MediaDimensions = {
    width: clip.intrinsicWidth || 1920,
    height: clip.intrinsicHeight || 1080,
  };

  // Use layout cell dimensions if provided, otherwise use full canvas
  // Note: For fitting, we only need the cell dimensions, not the offset position
  const containerDimensions: CanvasDimensions = layout?.cell
    ? {
        width: (layout.cell.width / 100) * canvas.width,
        height: (layout.cell.height / 100) * canvas.height,
      }
    : canvas;

  // Step 1: Calculate base dimensions after object-fit within the container
  const fittedDimensions = calculateFitDimensions(
    intrinsic,
    containerDimensions,
    transform.fitMode
  );

  // Step 2: Apply crop
  const croppedDimensions = applyCrop(fittedDimensions, transform.crop);

  // Step 3: Apply transforms (scale, position, rotation) - use layout cell for positioning
  const transformedRect = applyTransforms(
    croppedDimensions,
    transform,
    canvas,
    layout?.cell
  );

  // Step 4: Convert to screen coordinates
  const screenRect = applyScreenTransform(
    transformedRect,
    zoom,
    devicePixelRatio
  );

  return screenRect;
}

/**
 * Utility: Get media intrinsic dimensions from HTMLVideoElement or HTMLImageElement
 */
export function getMediaDimensions(
  element: HTMLVideoElement | HTMLImageElement
): MediaDimensions {
  if (element instanceof HTMLVideoElement) {
    return {
      width: element.videoWidth || 1920,
      height: element.videoHeight || 1080,
    };
  } else {
    return {
      width: element.naturalWidth || 1920,
      height: element.naturalHeight || 1080,
    };
  }
}

/**
 * Utility: Get layout cells for different video layout modes
 */
export function getLayoutCells(layout: string): LayoutCell[] {
  switch (layout) {
    case "single":
      return [{ x: 0, y: 0, width: 100, height: 100 }];

    case "2-layer":
      return [
        { x: 0, y: 0, width: 50, height: 100 }, // Left half
        { x: 50, y: 0, width: 50, height: 100 }, // Right half
      ];

    case "v-triptych":
      return [
        { x: 0, y: 0, width: 100, height: 33.33 }, // Top
        { x: 0, y: 33.33, width: 100, height: 33.33 }, // Middle
        { x: 0, y: 66.66, width: 100, height: 33.34 }, // Bottom
      ];

    case "h-triptych":
      return [
        { x: 0, y: 0, width: 33.33, height: 100 }, // Left
        { x: 33.33, y: 0, width: 33.33, height: 100 }, // Center
        { x: 66.66, y: 0, width: 33.34, height: 100 }, // Right
      ];

    case "2x2-grid":
      return [
        { x: 0, y: 0, width: 50, height: 50 }, // Top-left
        { x: 50, y: 0, width: 50, height: 50 }, // Top-right
        { x: 0, y: 50, width: 50, height: 50 }, // Bottom-left
        { x: 50, y: 50, width: 50, height: 50 }, // Bottom-right
      ];

    default:
      return [{ x: 0, y: 0, width: 100, height: 100 }];
  }
}

/**
 * Utility: Check if a point is inside a content rectangle
 */
export function isPointInRect(
  point: { x: number; y: number },
  rect: ContentRect
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
