"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import TimelineItem from "./TimelineItem";

interface TimelineProps {
  clips: Clip[];
  textOverlays: TextOverlay[];
  blurOverlays: BlurOverlay[];
  totalDuration: number;
  currentFrame: number;
  selectedClipId: string | null;
  selectedBlurOverlayId: string | null;
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void;
  onTextOverlayUpdate: (overlayId: string, updates: Partial<TextOverlay>) => void;
  onBlurOverlayUpdate: (overlayId: string, updates: Partial<BlurOverlay>) => void;
  onSelectionChange: (itemId: string | null) => void;
  onTimelineClick: (time: number) => void;
  onSplitClip?: (clipId: string, splitTime: number, trimSide?: "left" | "right") => void;
}

const Timeline: React.FC<TimelineProps> = ({
  clips,
  textOverlays,
  blurOverlays,
  totalDuration,
  currentFrame,
  selectedClipId,
  selectedBlurOverlayId,
  onClipUpdate,
  onTextOverlayUpdate,
  onBlurOverlayUpdate,
  onSelectionChange,
  onTimelineClick,
  onSplitClip,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<{
    type: "clip" | "text" | "blur";
    id: string;
    startX: number;
    startTime: number;
  } | null>(null);

  // Fixed constants to prevent expansion
  const TRACK_HEIGHT = 60;
  const TRACK_MARGIN = 10;
  const PIXELS_PER_FRAME = 2; // Fixed ratio
  const TIMELINE_WIDTH = Math.max(800, totalDuration * PIXELS_PER_FRAME);

  const handleMouseDown = useCallback((e: React.MouseEvent, item: any, type: string) => {
    e.stopPropagation();
    setDragData({
      type: type as any,
      id: item.id,
      startX: e.clientX,
      startTime: item.start,
    });
    setIsDragging(true);
    
    if (type === "blur") {
      onSelectionChange(item.id);
    } else {
      onSelectionChange(item.id);
    }
  }, [onSelectionChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragData) return;

    const deltaX = e.clientX - dragData.startX;
    const deltaTime = deltaX / PIXELS_PER_FRAME;
    const newStart = Math.max(0, dragData.startTime + deltaTime);

    if (dragData.type === "clip") {
      onClipUpdate(dragData.id, { start: newStart });
    } else if (dragData.type === "text") {
      onTextOverlayUpdate(dragData.id, { start: newStart });
    } else if (dragData.type === "blur") {
      onBlurOverlayUpdate(dragData.id, { start: newStart });
    }
  }, [isDragging, dragData, onClipUpdate, onTextOverlayUpdate, onBlurOverlayUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragData(null);
  }, []);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / PIXELS_PER_FRAME;
      onTimelineClick(time);
      onSelectionChange(null);
    }
  }, [onTimelineClick, onSelectionChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderTimelineItem = (item: any, type: "clip" | "text", index: number) => {
    return (
      <TimelineItem
        key={item.id}
        item={item}
        type={type}
        index={index}
        totalDuration={totalDuration}
      />
    );
  };

  const renderBlurOverlay = (item: any, index: number) => {
    const x = item.start * PIXELS_PER_FRAME;
    const width = item.duration * PIXELS_PER_FRAME;
    const y = TRACK_MARGIN + (item.row || 0) * (TRACK_HEIGHT + TRACK_MARGIN);
    
    const isSelected = selectedBlurOverlayId === item.id;

    return (
      <div
        key={item.id}
        className={`absolute cursor-move rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
          isSelected 
            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 dark:from-amber-500 dark:to-yellow-600 ring-2 ring-emerald-400 dark:ring-emerald-300 ring-offset-1' 
            : 'bg-gradient-to-r from-amber-300 to-yellow-400 dark:from-amber-400 dark:to-yellow-500 hover:from-amber-400 hover:to-yellow-500 dark:hover:from-amber-500 dark:hover:to-yellow-600'
        } border border-amber-200 dark:border-amber-600/50`}
        style={{
          left: x,
          top: y,
          width: Math.max(width, 20),
          height: TRACK_HEIGHT,
          minWidth: "20px",
        }}
        onMouseDown={(e) => handleMouseDown(e, item, "blur")}
      >
        {/* Blur overlay content */}
        <div className="relative h-full flex items-center px-3 py-2">
          {/* Icon */}
          <div className="w-4 h-4 mr-2 rounded bg-white/30 dark:bg-black/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-white/70 dark:bg-white/60 rounded-full blur-[1px]"></div>
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="text-white dark:text-amber-100 text-xs font-medium truncate">
              Blur Effect
            </div>
            <div className="text-white/70 dark:text-amber-200/70 text-xs">
              {item.blurIntensity || 10}px
            </div>
          </div>
        </div>

        {/* Resize handles */}
        <div className="absolute left-0 top-0 w-1 h-full bg-white/30 rounded-l-lg cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"></div>
        <div className="absolute right-0 top-0 w-1 h-full bg-white/30 rounded-r-lg cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"></div>
      </div>
    );
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner">
      {/* Timeline Header */}
      <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 border-b border-gray-300 dark:border-slate-600 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-gray-700 dark:text-slate-300">Timeline</span>
        </div>
        <div className="ml-auto text-xs text-gray-500 dark:text-slate-400">
          {Math.floor(totalDuration / 30)}:{((totalDuration % 30) / 30 * 60).toFixed(0).padStart(2, '0')}
        </div>
      </div>

      {/* Scrollable Timeline Content */}
      <div className="overflow-x-auto overflow-y-hidden">
        <div 
          ref={timelineRef}
          className="relative bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
          style={{ 
            width: TIMELINE_WIDTH,
            height: 280,
            minWidth: "100%"
          }}
          onClick={handleTimelineClick}
        >
          {/* Enhanced Grid Pattern */}
          <div className="absolute inset-0">
            {/* Major grid lines (every second) */}
            {Array.from({ length: Math.ceil(totalDuration / 30) + 1 }, (_, i) => (
              <div
                key={`major-${i}`}
                className="absolute border-l border-gray-300/60 dark:border-slate-600/60"
                style={{ 
                  left: i * 30 * PIXELS_PER_FRAME,
                  top: 0,
                  bottom: 0
                }}
              >
                {/* Time markers */}
                {i % 2 === 0 && (
                  <div className="absolute -top-6 left-1 text-xs text-gray-500 dark:text-slate-400 font-mono">
                    {Math.floor(i / 2)}s
                  </div>
                )}
              </div>
            ))}
            
            {/* Minor grid lines (every half second) */}
            {Array.from({ length: Math.ceil(totalDuration / 15) + 1 }, (_, i) => (
              i % 2 !== 0 && (
                <div
                  key={`minor-${i}`}
                  className="absolute border-l border-gray-200/40 dark:border-slate-700/40"
                  style={{ left: i * 15 * PIXELS_PER_FRAME }}
                />
              )
            ))}
          </div>

          {/* Enhanced Track Separators */}
          <div className="absolute inset-0">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={`track-${i}`}
                className="absolute border-t border-gray-200/50 dark:border-slate-700/50"
                style={{ 
                  top: TRACK_HEIGHT + i * (TRACK_HEIGHT + TRACK_MARGIN),
                  left: 0,
                  right: 0
                }}
              >
                {/* Track labels */}
                <div className="absolute -left-12 -top-7 w-10 h-6 bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded text-xs text-gray-600 dark:text-slate-400 flex items-center justify-center font-medium">
                  T{i + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Track Background Alternating Pattern */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={`track-bg-${i}`}
                className={`absolute ${
                  i % 2 === 0 
                    ? 'bg-gray-50/30 dark:bg-slate-900/30' 
                    : 'bg-gray-100/30 dark:bg-slate-800/30'
                }`}
                style={{ 
                  top: i * (TRACK_HEIGHT + TRACK_MARGIN),
                  left: 0,
                  right: 0,
                  height: TRACK_HEIGHT + TRACK_MARGIN
                }}
              />
            ))}
          </div>

          {/* Render clips */}
          {clips.map((clip, index) => renderTimelineItem(clip, "clip", index))}
          
          {/* Render text overlays */}
          {textOverlays.map((overlay, index) => renderTimelineItem(overlay, "text", index))}
          
          {/* Render blur overlays */}
          {blurOverlays.map((overlay, index) => renderBlurOverlay(overlay, index))}

          {/* Enhanced Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-400 via-red-500 to-red-600 dark:from-red-300 dark:via-red-400 dark:to-red-500 z-20 shadow-lg"
            style={{ left: currentFrame * PIXELS_PER_FRAME }}
          >
            {/* Playhead Handle */}
            <div className="absolute -top-3 -left-2 w-4 h-6 bg-gradient-to-b from-red-400 to-red-600 dark:from-red-300 dark:to-red-500 rounded-sm shadow-lg border border-red-300 dark:border-red-400">
              <div className="absolute inset-0.5 bg-red-200 dark:bg-red-300 rounded-sm"></div>
            </div>
            
            {/* Playhead Line Glow */}
            <div className="absolute top-0 bottom-0 -left-1 w-2 bg-red-500/20 dark:bg-red-400/20 blur-sm"></div>
          </div>

          {/* Current Time Indicator */}
          <div
            className="absolute -top-8 bg-red-500 dark:bg-red-400 text-white text-xs px-2 py-1 rounded shadow-lg font-mono z-20"
            style={{ 
              left: Math.max(0, Math.min(currentFrame * PIXELS_PER_FRAME - 30, TIMELINE_WIDTH - 80)),
              transform: 'translateX(0)'
            }}
          >
            {Math.floor(currentFrame / 30)}:{((currentFrame % 30) / 30 * 60).toFixed(0).padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;