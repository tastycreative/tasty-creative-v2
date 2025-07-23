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
      <div className="bg-gradient-to-br from-gray-50 via-white to-pink-50 backdrop-blur-sm rounded-xl border border-pink-300 shadow-lg p-6">
        <div className="text-center py-12">
          <Sliders className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Video Selected
          </h3>
          <p className="text-gray-700">
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
    <div className="bg-gradient-to-br from-gray-50 via-white to-pink-50 backdrop-blur-sm rounded-xl border border-pink-300 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg border border-pink-200">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Video Effects
          </h3>
        </div>
        <button
          onClick={() => onRemoveVideo(selectedVideo.id)}
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
          title="Remove video"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Video Info */}
      <div className="mb-6 p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg border border-pink-200 shadow-sm">
        <h4 className="font-medium text-gray-800 mb-2 truncate">
          {selectedVideo.file.name}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="block text-pink-700 font-medium">Duration</span>
            <span className="font-semibold text-gray-800">
              {formatDuration(selectedVideo.duration)}
            </span>
          </div>
          <div>
            <span className="block text-pink-700 font-medium">Size</span>
            <span className="font-semibold text-gray-800">
              {formatFileSize(selectedVideo.file.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Effects Controls */}
      <div className="space-y-6">
        {/* Blur */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-800">
              Blur Effect
            </label>
            <span className="text-sm font-bold text-pink-700 bg-pink-100 px-2 py-1 rounded">
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
            className="w-full h-3 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs font-medium text-gray-700 mt-2">
            <span>0px</span>
            <span>20px</span>
          </div>
        </div>

        {/* Speed */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-800">
              Playback Speed
            </label>
            <span className="text-sm font-bold text-pink-700 bg-pink-100 px-2 py-1 rounded">
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
            className="w-full h-3 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs font-medium text-gray-700 mt-2">
            <span>0.25x</span>
            <span>1x</span>
            <span>4x</span>
          </div>
        </div>

        {/* Scale Control */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-800">
              Video Scale
            </label>
            <span className="text-sm font-bold text-pink-700 bg-pink-100 px-2 py-1 rounded">
              {((selectedVideo.effects.scale ?? 1.0) * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={selectedVideo.effects.scale ?? 1.0}
            onChange={(e) =>
              handleEffectChange("scale", parseFloat(e.target.value))
            }
            className="w-full h-3 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs font-medium text-gray-700 mt-2">
            <span>10%</span>
            <span>100%</span>
            <span>300%</span>
          </div>
        </div>

        {/* Position X Control */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-800">
              Horizontal Position
            </label>
            <span className="text-sm font-bold text-pink-700 bg-pink-100 px-2 py-1 rounded">
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
            className="w-full h-3 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs font-medium text-gray-700 mt-2">
            <span>Left</span>
            <span>Center</span>
            <span>Right</span>
          </div>
        </div>

        {/* Position Y Control */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-800">
              Vertical Position
            </label>
            <span className="text-sm font-bold text-pink-700 bg-pink-100 px-2 py-1 rounded">
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
            className="w-full h-3 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs font-medium text-gray-700 mt-2">
            <span>Top</span>
            <span>Center</span>
            <span>Bottom</span>
          </div>
        </div>

        {/* Selective Blur */}
        <div className="border-t-2 border-pink-200 pt-6 bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg">
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
          className="w-full px-4 py-3 text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg transition-all duration-200 hover:scale-105 shadow-md border border-gray-300"
        >
          Reset All Effects
        </button>

        {onTrimVideo && (
          <button
            onClick={() => onTrimVideo(selectedVideo.id)}
            className="w-full px-4 py-3 text-sm font-semibold text-pink-800 bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 rounded-lg transition-all duration-200 hover:scale-105 shadow-md border border-pink-300 flex items-center justify-center space-x-2"
          >
            <Scissors className="w-4 h-4" />
            <span>Trim Video</span>
          </button>
        )}

        <div className="flex items-center justify-center text-xs text-gray-700 bg-pink-50 p-2 rounded-lg border border-pink-200">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-pink-600" />
            <span className="font-medium">Effects preview in real-time</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3), 0 0 0 1px rgba(236, 72, 153, 0.2);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(236, 72, 153, 0.4), 0 0 0 2px rgba(236, 72, 153, 0.3);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3), 0 0 0 1px rgba(236, 72, 153, 0.2);
        }

        .slider::-webkit-slider-track {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #fce7f3, #fda4af);
        }

        .slider::-moz-range-track {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #fce7f3, #fda4af);
        }
      `}</style>
    </div>
  );
};
