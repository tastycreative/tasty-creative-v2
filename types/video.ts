interface VideoEffects {
  blur: number;
  speed: number; // Video playback speed multiplier (0.5 = half speed, 2.0 = double speed)
  selectiveBlur?: SelectiveBlurRegion[]; // Optional selective blur regions
  scale: number; // Video scale (0.1 = 10%, 1.0 = 100%, 2.0 = 200%)
  positionX: number; // X position offset as percentage (-100 to 100)
  positionY: number; // Y position offset as percentage (-100 to 100)
}

interface SelectiveBlurRegion {
  id: string;
  x: number; // X position as percentage (0-100)
  y: number; // Y position as percentage (0-100)
  width: number; // Width as percentage (0-100)
  height: number; // Height as percentage (0-100)
  intensity: number; // Blur intensity (0-50)
  shape: "rectangle" | "circle"; // Shape of the blur region
  rotation?: number; // Rotation angle in degrees (0-360), only for rectangles
}

interface VideoSequenceItem {
  id: string;
  file: File;
  url: string;
  duration: number;
  startTime: number;
  endTime: number;
  effects: VideoEffects;
  thumbnail?: string;
  trimStart?: number; // Time (in seconds) to start the video from (default: 0)
  trimEnd?: number; // Time (in seconds) to end the video at (default: duration)
  gridId?: string; // Which grid this video belongs to (for side-by-side layout)
}

interface ExportSettings {
  fps: number;
  width: number;
  height: number;
  quality: number;
  startTime: number;
  endTime: number;
  format: "gif" | "mp4" | "webm"; // Export format options
  forceSquare: boolean; // Force square aspect ratio output
}

interface TimelinePosition {
  currentTime: number;
  totalDuration: number;
}

interface DragItem {
  id: string;
  index: number;
  type: string;
}
