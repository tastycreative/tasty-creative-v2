"use client";

import React from "react";
import { LayoutType, LayoutSettings } from "@/types/video";
import { Grid3X3, RectangleHorizontal, RectangleVertical, Square } from "lucide-react";

interface LayoutSelectorProps {
  currentLayout: LayoutSettings;
  onLayoutChange: (layout: LayoutSettings) => void;
  videoCount: number;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onLayoutChange,
  videoCount,
}) => {
  const layouts = [
    {
      type: "single" as LayoutType,
      name: "Single Video",
      description: "One video fills the entire square",
      icon: Square,
      minVideos: 1,
      maxVideos: 1,
      positions: 1,
    },
    {
      type: "sideBySide" as LayoutType,
      name: "Side by Side",
      description: "Two videos side by side",
      icon: RectangleHorizontal,
      minVideos: 2,
      maxVideos: 2,
      positions: 2,
    },
    {
      type: "verticalTriptych" as LayoutType,
      name: "Vertical Triptych",
      description: "Three videos stacked vertically",
      icon: RectangleVertical,
      minVideos: 3,
      maxVideos: 3,
      positions: 3,
    },
    {
      type: "horizontalTriptych" as LayoutType,
      name: "Horizontal Triptych",
      description: "Three videos arranged horizontally",
      icon: RectangleHorizontal,
      minVideos: 3,
      maxVideos: 3,
      positions: 3,
    },
    {
      type: "grid2x2" as LayoutType,
      name: "2×2 Grid",
      description: "Four videos in a 2×2 grid",
      icon: Grid3X3,
      minVideos: 4,
      maxVideos: 4,
      positions: 4,
    },
  ];

  const handleLayoutSelect = (layoutType: LayoutType, positions: number) => {
    // Create default video assignments (first N videos)
    const videoAssignments: { [position: number]: string } = {};
    
    // This will be handled in the parent component with actual video IDs
    for (let i = 0; i < positions; i++) {
      videoAssignments[i] = ""; // Empty, will be assigned by parent
    }

    onLayoutChange({
      type: layoutType,
      videoAssignments,
    });
  };

  const renderLayoutPreview = (layout: typeof layouts[0]) => {
    const Icon = layout.icon;
    
    switch (layout.type) {
      case "single":
        return (
          <div className="w-12 h-12 bg-pink-200 rounded border-2 border-pink-300 flex items-center justify-center">
            <div className="w-8 h-8 bg-pink-500 rounded"></div>
          </div>
        );
      case "sideBySide":
        return (
          <div className="w-12 h-12 bg-pink-200 rounded border-2 border-pink-300 flex space-x-1 p-1">
            <div className="flex-1 bg-pink-500 rounded"></div>
            <div className="flex-1 bg-pink-400 rounded"></div>
          </div>
        );
      case "verticalTriptych":
        return (
          <div className="w-12 h-12 bg-pink-200 rounded border-2 border-pink-300 flex flex-col space-y-1 p-1">
            <div className="flex-1 bg-pink-500 rounded"></div>
            <div className="flex-1 bg-pink-400 rounded"></div>
            <div className="flex-1 bg-pink-300 rounded"></div>
          </div>
        );
      case "horizontalTriptych":
        return (
          <div className="w-12 h-12 bg-pink-200 rounded border-2 border-pink-300 flex space-x-1 p-1">
            <div className="flex-1 bg-pink-500 rounded"></div>
            <div className="flex-1 bg-pink-400 rounded"></div>
            <div className="flex-1 bg-pink-300 rounded"></div>
          </div>
        );
      case "grid2x2":
        return (
          <div className="w-12 h-12 bg-pink-200 rounded border-2 border-pink-300 grid grid-cols-2 grid-rows-2 gap-1 p-1">
            <div className="bg-pink-500 rounded"></div>
            <div className="bg-pink-400 rounded"></div>
            <div className="bg-pink-300 rounded"></div>
            <div className="bg-pink-200 rounded"></div>
          </div>
        );
      default:
        return <Icon className="w-12 h-12 text-pink-500" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-pink-50 rounded-xl border border-pink-300 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Layout Style</h3>
        <div className="text-sm text-pink-600 font-medium">
          {videoCount} video{videoCount !== 1 ? "s" : ""} available
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {layouts.map((layout) => {
          const isSelected = currentLayout.type === layout.type;
          const isAvailable = videoCount >= 1; // Allow any layout with at least 1 video
          
          return (
            <button
              key={layout.type}
              onClick={() => handleLayoutSelect(layout.type, layout.positions)}
              disabled={!isAvailable}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected
                  ? "border-pink-500 bg-gradient-to-r from-pink-100 to-rose-100 shadow-md"
                  : isAvailable
                  ? "border-pink-200 bg-white hover:border-pink-300 hover:bg-pink-50 hover:shadow-sm"
                  : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {renderLayoutPreview(layout)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm ${
                    isAvailable 
                      ? isSelected ? "text-pink-800" : "text-gray-800"
                      : "text-gray-500"
                  }`}>
                    {layout.name}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    isAvailable 
                      ? isSelected ? "text-pink-700" : "text-gray-600"
                      : "text-gray-400"
                  }`}>
                    {layout.description}
                  </p>
                  <div className={`text-xs mt-2 font-medium ${
                    isAvailable 
                      ? isSelected ? "text-pink-600" : "text-gray-500"
                      : "text-gray-400"
                  }`}>
                    {layout.minVideos === 1 ? "Single video layout" : `Click empty positions to upload more videos`}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {videoCount > 4 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p className="text-sm text-yellow-800">
              Only the first 4 videos will be used in multi-video layouts. 
              Consider using timeline sequencing for more videos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};