/**
 * Transform utilities for clip positioning and scaling
 * Handles default transforms, validation, and transform operations
 */

export const DEFAULT_TRANSFORM: ClipTransform = {
  scale: 1.0,
  positionX: 0,
  positionY: 0,
  rotation: 0,
  fitMode: "contain",
};

/**
 * Creates a default transform with optional overrides
 */
export const createDefaultTransform = (overrides?: Partial<ClipTransform>): ClipTransform => ({
  ...DEFAULT_TRANSFORM,
  ...overrides,
});

/**
 * Validates transform values and clamps them to reasonable ranges
 */
export const validateTransform = (transform: Partial<ClipTransform>): Partial<ClipTransform> => {
  const validated: Partial<ClipTransform> = {};

  if (transform.scale !== undefined) {
    validated.scale = Math.max(0.1, Math.min(5.0, transform.scale)); // 10% to 500%
  }

  if (transform.positionX !== undefined) {
    validated.positionX = Math.max(-1920, Math.min(1920, transform.positionX)); // Reasonable pixel bounds
  }

  if (transform.positionY !== undefined) {
    validated.positionY = Math.max(-1080, Math.min(1080, transform.positionY)); // Reasonable pixel bounds
  }

  if (transform.rotation !== undefined) {
    validated.rotation = transform.rotation % 360; // Keep within 0-359 degrees
  }

  if (transform.fitMode !== undefined) {
    validated.fitMode = transform.fitMode;
  }

  if (transform.crop !== undefined) {
    validated.crop = {
      top: Math.max(0, Math.min(100, transform.crop.top || 0)),
      right: Math.max(0, Math.min(100, transform.crop.right || 0)),
      bottom: Math.max(0, Math.min(100, transform.crop.bottom || 0)),
      left: Math.max(0, Math.min(100, transform.crop.left || 0)),
    };
  }

  return validated;
};

/**
 * Applies a transform to get the final CSS transform string
 */
export const getTransformCSS = (transform: ClipTransform): string => {
  const { scale, positionX, positionY, rotation } = transform;
  
  const transforms = [
    `translate(${positionX}px, ${positionY}px)`,
    `scale(${scale})`,
    rotation !== 0 ? `rotate(${rotation}deg)` : null,
  ].filter(Boolean);

  return transforms.join(' ');
};

/**
 * Gets the object-fit CSS property based on fitMode
 */
export const getFitModeCSS = (fitMode: ClipTransform['fitMode']): string => {
  switch (fitMode) {
    case "contain":
      return "object-fit: contain;";
    case "cover":
      return "object-fit: cover;";
    case "fill":
      return "object-fit: fill;";
    default:
      return "object-fit: contain;";
  }
};

/**
 * Transform presets for quick application
 */
export const TRANSFORM_PRESETS = {
  fit: (): ClipTransform => ({
    ...DEFAULT_TRANSFORM,
    fitMode: "contain",
  }),
  
  fill: (): ClipTransform => ({
    ...DEFAULT_TRANSFORM,
    fitMode: "cover",
  }),
  
  center: (): ClipTransform => ({
    ...DEFAULT_TRANSFORM,
    positionX: 0,
    positionY: 0,
  }),
  
  reset: (): ClipTransform => ({
    ...DEFAULT_TRANSFORM,
  }),
};

/**
 * Calculates transform bounds for a given canvas size
 */
export const getTransformBounds = (canvasWidth: number, canvasHeight: number) => ({
  minScale: 0.1,
  maxScale: 5.0,
  minX: -canvasWidth,
  maxX: canvasWidth,
  minY: -canvasHeight,
  maxY: canvasHeight,
});

/**
 * Snaps a value to a grid or guide
 */
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Keyboard nudge amounts
 */
export const NUDGE_AMOUNTS = {
  normal: 1,    // Normal arrow keys
  fine: 0.1,    // With Alt modifier
  coarse: 10,   // With Ctrl/Cmd modifier
};