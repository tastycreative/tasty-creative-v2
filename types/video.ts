export interface VideoEffects {
  blur: number;
  speed: number; // Video playback speed multiplier (0.5 = half speed, 2.0 = double speed)
  selectiveBlur?: SelectiveBlurRegion[]; // Optional selective blur regions
}

export interface SelectiveBlurRegion {
  id: string;
  x: number; // X position as percentage (0-100)
  y: number; // Y position as percentage (0-100)
  width: number; // Width as percentage (0-100)
  height: number; // Height as percentage (0-100)
  intensity: number; // Blur intensity (0-50)
  shape: "rectangle" | "circle"; // Shape of the blur region
}

export interface VideoSequenceItem {
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
}

export interface ExportSettings {
  fps: number;
  width: number;
  height: number;
  quality: number;
  startTime: number;
  endTime: number;
  format: "gif" | "mp4" | "webm"; // Export format options
}

export interface TimelinePosition {
  currentTime: number;
  totalDuration: number;
}

export interface DragItem {
  id: string;
  index: number;
  type: string;
}
