"use client";

import React from "react";
import {
  VideoSequenceItem,
  VideoEffects,
  SelectiveBlurRegion,
} from "@/types/video";
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
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 p-6">
        <div className="text-center py-12">
          <Sliders className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Video Selected
          </h3>
          <p className="text-gray-600">
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
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-semibold text-gray-700">
            Video Effects
          </h3>
        </div>
        <button
          onClick={() => onRemoveVideo(selectedVideo.id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove video"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Video Info */}
      <div className="mb-6 p-4 bg-pink-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2 truncate">
          {selectedVideo.file.name}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="block">Duration</span>
            <span className="font-medium text-gray-700">
              {formatDuration(selectedVideo.duration)}
            </span>
          </div>
          <div>
            <span className="block">Size</span>
            <span className="font-medium text-gray-700">
              {formatFileSize(selectedVideo.file.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Effects Controls */}
      <div className="space-y-6">
        {/* Blur */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Blur
            </label>
            <span className="text-xs text-gray-600">
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0px</span>
            <span>20px</span>
          </div>
        </div>

        {/* Speed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Speed
            </label>
            <span className="text-xs text-gray-600">
              {(selectedVideo.effects.speed ?? 1).toFixed(2)}x
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0.25x</span>
            <span>1x</span>
            <span>4x</span>
          </div>
        </div>

        {/* Selective Blur */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
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
      <div className="mt-8 space-y-3">
        <button
          onClick={resetEffects}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Reset Effects
        </button>

        {onTrimVideo && (
          <button
            onClick={() => onTrimVideo(selectedVideo.id)}
            className="w-full px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Scissors className="w-4 h-4" />
            <span>Trim Video</span>
          </button>
        )}

        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>Effects preview in real-time</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};
