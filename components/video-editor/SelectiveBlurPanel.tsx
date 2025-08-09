"use client";

import React, { useState } from "react";
import { SelectiveBlurRegion } from "@/types/video";
import { Plus, Circle, Square } from "lucide-react";

interface SelectiveBlurPanelProps {
  blurRegions: SelectiveBlurRegion[];
  onAddRegion: (region: Omit<SelectiveBlurRegion, "id">) => void;
  onUpdateRegion: (
    regionId: string,
    updates: Partial<SelectiveBlurRegion>
  ) => void;
  onRemoveRegion: (regionId: string) => void;
  videoElement?: HTMLVideoElement | null;
  currentTime?: number;
}

export const SelectiveBlurPanel: React.FC<SelectiveBlurPanelProps> = ({
  blurRegions,
  onAddRegion,
}) => {
  const [selectedShape, setSelectedShape] = useState<"rectangle" | "circle">(
    "rectangle"
  );

  const handleAddBlur = () => {
    const baseRegion = {
      x: 30,
      y: 30,
      width: 25,
      height: 25,
      intensity: 15,
      shape: selectedShape,
    };

    // Add rotation property for rectangles
    if (selectedShape === "rectangle") {
      onAddRegion({
        ...baseRegion,
        rotation: 0,
      });
    } else {
      onAddRegion(baseRegion);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-purple-500/10 rounded-md">
            <Circle className="w-4 h-4 text-purple-500" />
          </div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Selective Blur
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          {blurRegions.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {blurRegions.length} region{blurRegions.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => setSelectedShape("rectangle")}
            className={`p-1 rounded text-xs ${
              selectedShape === "rectangle"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
            }`}
            title="Rectangle"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => setSelectedShape("circle")}
            className={`p-1 rounded text-xs ${
              selectedShape === "circle"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
            }`}
            title="Circle"
          >
            <Circle className="w-3 h-3" />
          </button>
          <button
            onClick={handleAddBlur}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-purple-500/25 font-medium"
            title="Add new blur region"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Blur</span>
          </button>
        </div>
      </div>



      <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-start space-x-2">
          <span className="text-purple-500">💡</span>
          <div>
            <div className="font-medium mb-1">Quick Tips:</div>
            <ul className="space-y-1 text-xs">
              <li>• Blur regions appear as purple overlays on the timeline</li>
              <li>• Click timeline overlays to open the detailed editor</li>
              <li>• Drag and resize regions in the preview canvas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
