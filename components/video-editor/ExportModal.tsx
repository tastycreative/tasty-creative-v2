"use client";

import React, { useState } from "react";
import { VideoSequenceItem, ExportSettings } from "@/types/video";
import { Download, X, Settings, Film, Loader2 } from "lucide-react";
import { exportMedia } from "@/lib/videoProcessor";

interface ExportModalProps {
  isOpen: boolean;
  videos: VideoSequenceItem[];
  onClose: () => void;
  totalDuration: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  videos,
  onClose,
  totalDuration,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    fps: 30, // Default to 30 FPS for video formats
    width: 1280,
    height: 720,
    quality: 75,
    startTime: 0,
    endTime: totalDuration,
    format: "mp4", // Default to MP4 for better quality
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Update end time when total duration changes and adjust defaults based on format
  React.useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      endTime: totalDuration,
    }));
  }, [totalDuration]);

  // Update FPS and quality defaults when format changes
  React.useEffect(() => {
    if (settings.format === "gif") {
      setSettings((prev) => ({
        ...prev,
        fps: prev.fps > 30 ? 15 : prev.fps,
        width: prev.width > 640 ? 480 : prev.width,
        height: prev.height > 480 ? 320 : prev.height,
      }));
    } else {
      // For video formats, ensure minimum quality settings
      setSettings((prev) => ({
        ...prev,
        fps: prev.fps < 15 ? 30 : prev.fps,
        width: prev.width < 480 ? 1280 : prev.width,
        height: prev.height < 320 ? 720 : prev.height,
      }));
    }
  }, [settings.format]);

  const handleExport = async () => {
    if (videos.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Filter videos within the export time range
      const exportVideos = videos.filter(
        (video) =>
          video.startTime < settings.endTime &&
          video.endTime > settings.startTime
      );

      const blob = await exportMedia(
        exportVideos,
        settings,
        (progress: number) => {
          setExportProgress(progress);
        }
      );

      // Create download link with appropriate file extension
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = settings.format; // Use the selected format
      a.download = `video-sequence-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);

      // Provide more specific error messages
      let errorMessage = "Export failed. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("FFmpeg")) {
          errorMessage =
            "Video encoding failed. This might be due to browser limitations or insufficient memory. Try reducing the video resolution or duration.";
        } else if (error.message.includes("load")) {
          errorMessage =
            "Failed to load video files. Please ensure all videos are properly uploaded.";
        }
      }

      alert(errorMessage);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const estimatedFileSize = () => {
    const duration = settings.endTime - settings.startTime;
    const pixels = settings.width * settings.height;

    if (settings.format === "gif") {
      const frames = duration * settings.fps;
      const bytesPerFrame = (pixels * 3 * settings.quality) / 100;
      const totalBytes = frames * bytesPerFrame;
      const mb = totalBytes / (1024 * 1024);
      return mb.toFixed(1);
    } else {
      // For video formats, estimate based on bitrate
      const bitrate = settings.format === "mp4" ? 5000000 : 3000000; // 5Mbps for MP4, 3Mbps for WebM
      const adjustedBitrate = (bitrate * settings.quality) / 100;
      const totalBytes = (adjustedBitrate * duration) / 8; // Convert bits to bytes
      const mb = totalBytes / (1024 * 1024);
      return mb.toFixed(1);
    }
  };

  const updateSetting = <K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm border border-pink-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-pink-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Film className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700">
                Export Video
              </h2>
              <p className="text-sm text-gray-600">
                Configure your export settings for{" "}
                {settings.format.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video Info */}
          <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">
              Source Videos
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">
                  Videos:
                </span>
                <span className="ml-2 font-medium text-gray-700">
                  {videos.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">
                  Duration:
                </span>
                <span className="ml-2 font-medium text-gray-700">
                  {formatTime(totalDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Export Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-700">
                Export Settings
              </h3>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateSetting("format", "gif")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.format === "gif"
                      ? "bg-pink-50 border-pink-300 text-pink-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  GIF
                </button>
                <button
                  onClick={() => updateSetting("format", "mp4")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.format === "mp4"
                      ? "bg-rose-50 border-rose-300 text-rose-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  MP4
                </button>
                <button
                  onClick={() => updateSetting("format", "webm")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.format === "webm"
                      ? "bg-pink-50 border-pink-300 text-pink-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  WebM
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {settings.format === "gif" &&
                  "GIF - Best for short animations and loops"}
                {settings.format === "mp4" &&
                  "MP4 - High quality video with proper encoding"}
                {settings.format === "webm" &&
                  "WebM - Efficient compression for web use"}
              </div>
              {settings.format !== "gif" && (
                <div className="mt-2 p-2 bg-pink-50 rounded text-xs text-pink-700">
                  <strong>Performance Tips:</strong> MP4/WebM export uses FFmpeg
                  encoding.
                  <br />• Lower resolution = faster export
                  <br />• Shorter duration = faster export
                  <br />• MP4 is faster than WebM
                  <br />• <strong>New:</strong> Improved black frame prevention
                  & validation
                  <br />• Expected time: ~1-2 seconds per second of video
                </div>
              )}
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={settings.width}
                  onChange={(e) =>
                    updateSetting("width", parseInt(e.target.value))
                  }
                  min="100"
                  max="1920"
                  step="10"
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={settings.height}
                  onChange={(e) =>
                    updateSetting("height", parseInt(e.target.value))
                  }
                  min="100"
                  max="1080"
                  step="10"
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* FPS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frame Rate (FPS): {settings.fps}
              </label>
              <input
                type="range"
                min={settings.format === "gif" ? "5" : "15"}
                max={settings.format === "gif" ? "30" : "60"}
                step="1"
                value={settings.fps}
                onChange={(e) => updateSetting("fps", parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>{settings.format === "gif" ? "5 FPS" : "15 FPS"}</span>
                <span>{settings.format === "gif" ? "15 FPS" : "30 FPS"}</span>
                <span>{settings.format === "gif" ? "30 FPS" : "60 FPS"}</span>
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality: {settings.quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={settings.quality}
                onChange={(e) =>
                  updateSetting("quality", parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="number"
                  value={settings.startTime}
                  onChange={(e) =>
                    updateSetting(
                      "startTime",
                      Math.max(0, parseFloat(e.target.value))
                    )
                  }
                  min="0"
                  max={totalDuration}
                  step="0.1"
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="number"
                  value={settings.endTime}
                  onChange={(e) =>
                    updateSetting(
                      "endTime",
                      Math.min(totalDuration, parseFloat(e.target.value))
                    )
                  }
                  min={settings.startTime}
                  max={totalDuration}
                  step="0.1"
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Quality Presets
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    width: settings.format === "gif" ? 320 : 854,
                    height: settings.format === "gif" ? 240 : 480,
                    fps: settings.format === "gif" ? 10 : 24,
                    quality: 50,
                  }))
                }
                className="px-3 py-2 text-sm border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Small
              </button>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    width: settings.format === "gif" ? 480 : 1280,
                    height: settings.format === "gif" ? 320 : 720,
                    fps: settings.format === "gif" ? 15 : 30,
                    quality: 70,
                  }))
                }
                className="px-3 py-2 text-sm border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Medium
              </button>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    width: settings.format === "gif" ? 640 : 1920,
                    height: settings.format === "gif" ? 480 : 1080,
                    fps: settings.format === "gif" ? 20 : 60,
                    quality: 85,
                  }))
                }
                className="px-3 py-2 text-sm border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Large
              </button>
              {settings.format !== "gif" && (
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      width: 640,
                      height: 480,
                      fps: 24,
                      quality: 60,
                    }))
                  }
                  className="px-3 py-2 text-sm border border-rose-300 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors text-rose-700"
                >
                  Fast
                </button>
              )}
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-pink-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">
              Export Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-pink-700">
                  Duration:
                </span>
                <span className="ml-2 font-medium text-gray-700">
                  {formatTime(settings.endTime - settings.startTime)}
                </span>
              </div>
              <div>
                <span className="text-pink-700">
                  Est. Size:
                </span>
                <span className="ml-2 font-medium text-gray-700">
                  ~{estimatedFileSize()} MB
                </span>
              </div>
              <div>
                <span className="text-pink-700">
                  Frames:
                </span>
                <span className="ml-2 font-medium text-gray-700">
                  {Math.ceil(
                    (settings.endTime - settings.startTime) * settings.fps
                  )}
                </span>
              </div>
              <div>
                <span className="text-pink-700">
                  Resolution:
                </span>
                <span className="ml-2 font-medium text-gray-700">
                  {settings.width}×{settings.height}
                </span>
              </div>
            </div>

            {/* Effects Information */}
            {(() => {
              const hasSpeedEffects = videos.some((v) => v.effects.speed !== 1);
              const hasBlurEffects = videos.some((v) => v.effects.blur > 0);
              const hasSelectiveBlur = videos.some(
                (v) =>
                  v.effects.selectiveBlur && v.effects.selectiveBlur.length > 0
              );

              if (hasSpeedEffects || hasBlurEffects || hasSelectiveBlur) {
                return (
                  <div className="mt-3 pt-3 border-t border-pink-200">
                    <h5 className="text-xs font-medium text-pink-700 mb-1">
                      Effects Applied:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {hasSpeedEffects && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded">
                          Speed Control
                        </span>
                      )}
                      {hasBlurEffects && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded">
                          Global Blur
                        </span>
                      )}
                      {hasSelectiveBlur && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded">
                          Selective Blur
                        </span>
                      )}
                    </div>
                    {hasSelectiveBlur && settings.format !== "gif" && (
                      <div className="mt-2 p-2 bg-pink-50 border border-pink-200 rounded text-xs">
                        <p className="text-pink-700">
                          <strong>Note:</strong> Selective blur uses
                          canvas-based processing for MP4/WebM exports, which
                          may take longer than regular exports.
                        </p>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div
              className={`rounded-lg p-4 ${
                settings.format === "gif"
                  ? "bg-pink-50"
                  : settings.format === "mp4"
                    ? "bg-pink-50"
                    : "bg-pink-50"
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Loader2
                  className={`w-5 h-5 animate-spin ${
                    settings.format === "gif"
                      ? "text-pink-600"
                      : settings.format === "mp4"
                        ? "text-rose-600"
                        : "text-pink-600"
                  }`}
                />
                <span
                  className={`font-medium ${
                    settings.format === "gif"
                      ? "text-pink-700"
                      : settings.format === "mp4"
                        ? "text-gray-700"
                        : "text-pink-700"
                  }`}
                >
                  Exporting {settings.format.toUpperCase()}...
                </span>
              </div>
              <div
                className={`w-full rounded-full h-2 ${
                  settings.format === "gif"
                    ? "bg-pink-200"
                    : settings.format === "mp4"
                      ? "bg-rose-200"
                      : "bg-pink-200"
                }`}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    settings.format === "gif"
                      ? "bg-pink-600"
                      : settings.format === "mp4"
                        ? "bg-rose-600"
                        : "bg-pink-600"
                  }`}
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p
                className={`text-sm mt-2 ${
                  settings.format === "gif"
                    ? "text-pink-700"
                    : settings.format === "mp4"
                      ? "text-pink-700"
                      : "text-pink-700"
                }`}
              >
                {settings.format === "gif" &&
                  "Creating animated GIF with effects..."}
                {settings.format === "mp4" &&
                  (exportProgress < 70
                    ? "Enhanced frame rendering with black frame prevention..."
                    : "Fast MP4 encoding with FFmpeg...")}
                {settings.format === "webm" &&
                  (exportProgress < 70
                    ? "Processing frames with enhanced validation..."
                    : "WebM encoding with VP9 compression...")}
                <br />
                <span className="font-medium">
                  Progress: {Math.round(exportProgress)}%
                  {settings.format !== "gif" &&
                    exportProgress < 70 &&
                    ` • ~${Math.ceil((70 - exportProgress) / 2)} seconds remaining`}
                  {settings.format !== "gif" &&
                    exportProgress >= 70 &&
                    ` • Video encoding in progress`}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-pink-200">
          <div className="text-sm text-gray-600">
            {videos.length} video{videos.length !== 1 ? "s" : ""} •{" "}
            {formatTime(totalDuration)} total
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || videos.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-md hover:shadow-pink-500/20 transform hover:-translate-y-0.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {isExporting
                  ? "Exporting..."
                  : `Export ${settings.format.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
