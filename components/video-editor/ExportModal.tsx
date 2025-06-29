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
    fps: 8, // Lower FPS for smoother GIF playback
    width: 480,
    height: 320,
    quality: 75,
    startTime: 0,
    endTime: totalDuration,
    format: 'gif', // Default format
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Update end time when total duration changes
  React.useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      endTime: totalDuration,
    }));
  }, [totalDuration]);

  // Since we only support GIF now, keep FPS reasonable for GIF
  // No need for format change effects since format is always GIF

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

      const blob = await exportMedia(exportVideos, settings, (progress: number) => {
        setExportProgress(progress);
      });

      // Create download link with appropriate file extension
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = 'gif'; // Only GIF export is currently available
      a.download = `video-sequence-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
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
    const frames = duration * settings.fps;
    const bytesPerFrame = (pixels * 3 * settings.quality) / 100;
    const totalBytes = frames * bytesPerFrame;
    const mb = totalBytes / (1024 * 1024);
    return mb.toFixed(1);
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
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Film className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export to GIF
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure your export settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Source Videos
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Videos:
                </span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {videos.length}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Duration:
                </span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {formatTime(totalDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Export Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Export Settings
              </h3>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => updateSetting("format", "gif")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.format === "gif"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  GIF
                </button>
                {/* Temporarily disabled - video export needs optimization */}
                {/* 
                <button
                  onClick={() => updateSetting("format", "mp4")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.format === "mp4"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  MP4
                </button>
                <button
                  onClick={() => updateSetting("format", "webm")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.format === "webm"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  WebM
                </button>
                */}
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* FPS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frame Rate (FPS): {settings.fps}
              </label>
              <input
                type="range"
                min={settings.format === 'gif' ? "5" : "15"}
                max={settings.format === 'gif' ? "30" : "60"}
                step="1"
                value={settings.fps}
                onChange={(e) => updateSetting("fps", parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>{settings.format === 'gif' ? '5 FPS' : '15 FPS'}</span>
                <span>{settings.format === 'gif' ? '15 FPS' : '30 FPS'}</span>
                <span>{settings.format === 'gif' ? '30 FPS' : '60 FPS'}</span>
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quality Presets
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    width: 320,
                    height: 240,
                    fps: settings.format === 'gif' ? 10 : 24,
                    quality: 50,
                  }))
                }
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Small
              </button>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    width: 480,
                    height: 320,
                    fps: settings.format === 'gif' ? 15 : 30,
                    quality: 70,
                  }))
                }
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Medium
              </button>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    width: 640,
                    height: 480,
                    fps: settings.format === 'gif' ? 20 : 60,
                    quality: 85,
                  }))
                }
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Large
              </button>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Export Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">
                  Duration:
                </span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {formatTime(settings.endTime - settings.startTime)}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">
                  Est. Size:
                </span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  ~{estimatedFileSize()} MB
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">
                  Frames:
                </span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {Math.ceil(
                    (settings.endTime - settings.startTime) * settings.fps
                  )}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">
                  Resolution:
                </span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {settings.width}×{settings.height}
                </span>
              </div>
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Loader2 className="w-5 h-5 text-green-600 dark:text-green-400 animate-spin" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  Exporting {settings.format.toUpperCase()}...
                </span>
              </div>
              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                <div
                  className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                This may take a few moments depending on the video length and
                quality settings.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {videos.length} video{videos.length !== 1 ? "s" : ""} •{" "}
            {formatTime(totalDuration)} total
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || videos.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExporting ? "Exporting..." : `Export ${settings.format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
