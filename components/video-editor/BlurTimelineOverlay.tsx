"use client";

import React, { useState, useEffect } from "react";
import { Circle, Square, ChevronUp, ChevronDown } from "lucide-react";

interface BlurRegionWithVideo {
  region: SelectiveBlurRegion;
  videoId: string;
  videoLeft: number;
  videoWidth: number;
}

interface BlurTimelineOverlayProps {
  allRegions: BlurRegionWithVideo[];
  onClick: (regionId: string, videoId: string) => void;
  activeRegionId?: string; // Currently editing blur region ID
  activeVideoId?: string; // Currently editing video ID
  blurAreaHeight: number; // Height of the blur area
}

export const BlurTimelineOverlay: React.FC<BlurTimelineOverlayProps> = ({
  allRegions,
  onClick,
  activeRegionId,
  activeVideoId,
  blurAreaHeight,
}) => {
  const [startIndex, setStartIndex] = useState(0);

  // Calculate dynamic overlay height based on available space and number of regions
  const baseOverlayHeight = 10;
  const overlaySpacing = 1;
  const availableHeight = blurAreaHeight - 8; // Available height minus padding

  // Calculate the best height to fit all regions
  let overlayHeight = baseOverlayHeight;
  let maxPossibleOverlays = Math.floor(
    availableHeight / (overlayHeight + overlaySpacing)
  );

  // If we can't fit all regions with default height, make them smaller
  if (allRegions.length > maxPossibleOverlays && allRegions.length > 0) {
    // Calculate height needed to fit all regions
    overlayHeight = Math.max(
      6,
      Math.floor(
        (availableHeight - (allRegions.length - 1) * overlaySpacing) /
          allRegions.length
      )
    );
    maxPossibleOverlays = Math.floor(
      availableHeight / (overlayHeight + overlaySpacing)
    );
  }

  // Always try to show all regions if possible
  const maxOverlays = allRegions.length; // Force showing all regions
  const visibleRegions = allRegions.slice(startIndex, startIndex + maxOverlays);

  const canScrollUp = false; // No scrolling needed since we show all regions
  const canScrollDown = false; // No scrolling needed since we show all regions

  // Auto-scroll to show active region
  useEffect(() => {
    if (activeRegionId && activeVideoId && allRegions.length > 0) {
      const activeIndex = allRegions.findIndex(
        (item) =>
          item.region.id === activeRegionId && item.videoId === activeVideoId
      );
      if (activeIndex !== -1) {
        // Check if active region is visible
        if (
          activeIndex < startIndex ||
          activeIndex >= startIndex + maxOverlays
        ) {
          // Scroll to show the active region
          const newStartIndex = Math.max(
            0,
            Math.min(activeIndex, allRegions.length - maxOverlays)
          );
          setStartIndex(newStartIndex);
        }
      }
    }
  }, [activeRegionId, activeVideoId, allRegions, startIndex, maxOverlays]);

  if (allRegions.length === 0) return null;

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: "0%",
        width: "100%",
        top: 4, // Position within the blur overlay area
        height: blurAreaHeight - 8, // Use available height minus padding
        zIndex: 35, // Above video segments but below scrubber and badges
      }}
    >
      {/* Navigation controls for multiple regions - only show if needed */}
      {allRegions.length > maxOverlays && (
        <div
          className="absolute -right-6 top-0 flex flex-col space-y-0.5"
          data-blur-controls="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStartIndex(Math.max(0, startIndex - 1));
            }}
            disabled={!canScrollUp}
            className={`w-4 h-4 rounded text-xs flex items-center justify-center transition-all ${
              canScrollUp
                ? "bg-purple-500 hover:bg-purple-600 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title="Previous blur regions"
          >
            <ChevronUp className="w-2 h-2" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStartIndex(
                Math.min(allRegions.length - maxOverlays, startIndex + 1)
              );
            }}
            disabled={!canScrollDown}
            className={`w-4 h-4 rounded text-xs flex items-center justify-center transition-all ${
              canScrollDown
                ? "bg-purple-500 hover:bg-purple-600 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title="Next blur regions"
          >
            <ChevronDown className="w-2 h-2" />
          </button>
        </div>
      )}

      {/* Region index indicator - only show if not all regions are visible */}
      {allRegions.length > maxOverlays && (
        <div
          className="absolute -left-8 top-0 bg-purple-600 text-white text-xs px-1 py-0.5 rounded text-center"
          style={{ fontSize: "10px", lineHeight: "1" }}
          data-blur-controls="true"
        >
          {startIndex + 1}-
          {Math.min(startIndex + maxOverlays, allRegions.length)}/
          {allRegions.length}
        </div>
      )}

      {visibleRegions.map((item, index) => {
        const { region, videoId, videoLeft, videoWidth } = item;
        const isActive =
          region.id === activeRegionId && videoId === activeVideoId;
        const topPosition = index * (overlayHeight + overlaySpacing);

        return (
          <div
            key={`${videoId}-${region.id}`}
            className={`blur-overlay absolute rounded cursor-pointer transition-all duration-200 shadow-sm border hover:shadow-md ${
              isActive
                ? "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 border-yellow-300 ring-2 ring-yellow-400 ring-opacity-50"
                : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-purple-400"
            }`}
            style={{
              left: `${videoLeft}%`, // Start at video segment position
              width: `${videoWidth}%`, // Span the full width of the video segment
              height: overlayHeight,
              top: topPosition, // Use calculated position for vertical stacking
              zIndex: 1, // Ensure proper stacking
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick(region.id, videoId);
            }}
            title={`${region.shape} blur - Intensity: ${region.intensity}px - Click to edit${isActive ? " (Currently Active)" : ""}`}
          >
            <div className="flex items-center justify-between h-full px-1">
              <div className="flex items-center space-x-0.5">
                {region.shape === "circle" ? (
                  <Circle
                    className={`w-1.5 h-1.5 flex-shrink-0 drop-shadow-sm ${isActive ? "text-white" : "text-white"}`}
                  />
                ) : (
                  <Square
                    className={`w-1.5 h-1.5 flex-shrink-0 drop-shadow-sm ${isActive ? "text-white" : "text-white"}`}
                  />
                )}
                <span
                  className={`text-xs font-medium truncate drop-shadow-sm ${isActive ? "text-white" : "text-white"}`}
                >
                  #{startIndex + index + 1}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                )}
              </div>
              <span
                className={`text-xs font-medium rounded text-center min-w-[16px] px-0.5 py-0.5 ${
                  isActive
                    ? "bg-yellow-600/60 text-white"
                    : "bg-purple-700/60 text-purple-100"
                }`}
              >
                {region.intensity}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
