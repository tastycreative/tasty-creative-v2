"use client";

import React from "react";
import { Sliders, Trash2, Eye, Scissors } from "lucide-react";
import { SelectiveBlurPanel } from "./SelectiveBlurPanel";

interface EffectsPanelProps {
  selectedVideo: VideoSequenceItem | null;
  onEffectsChange: (id: string, effects: Partial<VideoEffects>) => void;
  onRemoveVideo: (id: string) => void;
  onTrimVideo?: (id: string) => void;
  onAddSelectiveBlurRegion: (
    videoId: string,
    region: Omit<SelectiveBlurRegion, "id">
  ) => void;
  onUpdateSelectiveBlurRegion: (
    videoId: string,
    regionId: string,
    updates: Partial<SelectiveBlurRegion>
  ) => void;
  onRemoveSelectiveBlurRegion: (videoId: string, regionId: string) => void;
  videoElement?: HTMLVideoElement | null;
  currentTime?: number;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  selectedVideo,
  onEffectsChange,
  onRemoveVideo,
  onTrimVideo,
  onAddSelectiveBlurRegion,
  onUpdateSelectiveBlurRegion,
  onRemoveSelectiveBlurRegion,
  videoElement,
  currentTime,
}) => {
  if (!selectedVideo) {
    return (
      <div className="bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 backdrop-blur-sm rounded-xl border border-pink-300 dark:border-pink-500/30 shadow-lg p-6">
        <div className="text-center py-12">
          <Sliders className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            No Video Selected
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Select a video from the timeline to edit its effects
          </p>
        </div>
      </div>
    );
  }

  const handleEffectChange = (effect: keyof VideoEffects, value: number) => {
    onEffectsChange(selectedVideo.id, { [effect]: value });
  };

  const resetEffects = () => {
    onEffectsChange(selectedVideo.id, {
      blur: 0,
      speed: 1,
      scale: 1.0,
      positionX: 0,
      positionY: 0,
    });
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 backdrop-blur-sm rounded-xl border border-pink-300 dark:border-pink-500/30 shadow-lg p-4 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 p-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg border border-pink-200 dark:border-pink-500/30">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-pink-600" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Video Effects
          </h3>
        </div>
        <button
          onClick={() => onRemoveVideo(selectedVideo.id)}
          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
          title="Remove video"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Video Info */}
      <div className="mb-3 p-3 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg border border-pink-200 dark:border-pink-500/30 shadow-sm">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-xs mb-1 truncate">
          {selectedVideo.file.name}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
          <div>
            <span className="block text-pink-700 dark:text-pink-400 font-medium">
              Duration
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {formatDuration(selectedVideo.duration)}
            </span>
          </div>
          <div>
            <span className="block text-pink-700 dark:text-pink-400 font-medium">
              Size
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {formatFileSize(selectedVideo.file.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Effects Controls - Grid Layout */}
      <div className="grid grid-cols-1 gap-3 mb-3">
        {/* Transform Controls - Side by side */}
        <div className="grid grid-cols-2 gap-2">
          {/* Scale Control */}
          <div className="p-2 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Scale
              </label>
              <span className="text-xs font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">
                {((selectedVideo.effects.scale ?? 1.0) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={selectedVideo.effects.scale ?? 1.0}
              onChange={(e) =>
                handleEffectChange("scale", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Speed */}
          <div className="p-2 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Speed
              </label>
              <span className="text-xs font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">
                {(selectedVideo.effects.speed ?? 1).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={selectedVideo.effects.speed ?? 1}
              onChange={(e) =>
                handleEffectChange("speed", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Position Controls - Side by side */}
        <div className="grid grid-cols-2 gap-2">
          {/* Position X Control */}
          <div className="p-2 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                X Pos
              </label>
              <span className="text-xs font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">
                {(selectedVideo.effects.positionX ?? 0).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="5"
              value={selectedVideo.effects.positionX ?? 0}
              onChange={(e) =>
                handleEffectChange("positionX", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Position Y Control */}
          <div className="p-2 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Y Pos
              </label>
              <span className="text-xs font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">
                {(selectedVideo.effects.positionY ?? 0).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="5"
              value={selectedVideo.effects.positionY ?? 0}
              onChange={(e) =>
                handleEffectChange("positionY", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Blur - Full Width */}
        <div className="p-2 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Blur Effect
            </label>
            <span className="text-xs font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">
              {selectedVideo.effects.blur}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={selectedVideo.effects.blur}
            onChange={(e) =>
              handleEffectChange("blur", parseFloat(e.target.value))
            }
            className="w-full h-2 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Selective Blur */}
        <div className="border-t-2 border-pink-200 dark:border-pink-500/30 pt-2 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-2 rounded-lg">
          <SelectiveBlurPanel
            blurRegions={selectedVideo.effects.selectiveBlur || []}
            onAddRegion={(region: Omit<SelectiveBlurRegion, "id">) =>
              onAddSelectiveBlurRegion(selectedVideo.id, region)
            }
            onUpdateRegion={(
              regionId: string,
              updates: Partial<SelectiveBlurRegion>
            ) =>
              onUpdateSelectiveBlurRegion(selectedVideo.id, regionId, updates)
            }
            onRemoveRegion={(regionId: string) =>
              onRemoveSelectiveBlurRegion(selectedVideo.id, regionId)
            }
            videoElement={videoElement}
            currentTime={currentTime}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={resetEffects}
            className="px-2 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-500 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-400 rounded-lg transition-all duration-200 hover:scale-105 shadow-md border border-gray-300 dark:border-gray-600"
          >
            Reset
          </button>

          {onTrimVideo && (
            <button
              onClick={() => onTrimVideo(selectedVideo.id)}
              className="px-2 py-2 text-xs font-semibold text-pink-800 dark:text-pink-200 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/40 dark:to-rose-800/40 hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-700/50 dark:hover:to-rose-700/50 rounded-lg transition-all duration-200 hover:scale-105 shadow-md border border-pink-300 dark:border-pink-500/40 flex items-center justify-center space-x-1"
            >
              <Scissors className="w-3 h-3" />
              <span>Trim</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 bg-pink-50 dark:bg-pink-900/20 p-1.5 rounded-lg border border-pink-200 dark:border-pink-500/30">
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3 text-pink-600" />
            <span className="font-medium">Live preview</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow:
            0 2px 4px rgba(236, 72, 153, 0.3),
            0 0 0 1px rgba(236, 72, 153, 0.2);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow:
            0 3px 6px rgba(236, 72, 153, 0.4),
            0 0 0 2px rgba(236, 72, 153, 0.3);
        }

        .slider::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow:
            0 2px 4px rgba(236, 72, 153, 0.3),
            0 0 0 1px rgba(236, 72, 153, 0.2);
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #fce7f3, #fda4af);
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #fce7f3, #fda4af);
        }
      `}</style>
    </div>
  );
};
