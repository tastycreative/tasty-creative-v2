"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Clip, TextOverlay, BlurOverlay } from "@/types/types";

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

  const renderTimelineItem = (item: any, type: "clip" | "text" | "blur") => {
    const x = item.start * PIXELS_PER_FRAME;
    const width = item.duration * PIXELS_PER_FRAME;
    const y = TRACK_MARGIN + (item.row || 0) * (TRACK_HEIGHT + TRACK_MARGIN);
    
    const isSelected = type === "blur" 
      ? selectedBlurOverlayId === item.id 
      : selectedClipId === item.id;

    const colors = {
      clip: "#3b82f6",
      text: "#10b981", 
      blur: "#f59e0b"
    };

    return (
      <div
        key={item.id}
        className={`absolute cursor-move rounded ${isSelected ? 'ring-2 ring-red-500' : ''}`}
        style={{
          left: x,
          top: y,
          width: Math.max(width, 20),
          height: TRACK_HEIGHT,
          backgroundColor: isSelected ? "#ef4444" : colors[type],
          minWidth: "20px",
        }}
        onMouseDown={(e) => handleMouseDown(e, item, type)}
      >
        <div className="p-2 text-white text-xs truncate">
          {type === "text" ? item.text : 
           type === "blur" ? `Blur ${item.blurIntensity || 10}` :
           item.name || `${item.type} ${item.id}`}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full bg-slate-900 border border-slate-700 rounded-lg overflow-x-auto">
      <div 
        ref={timelineRef}
        className="relative bg-slate-800"
        style={{ 
          width: TIMELINE_WIDTH,
          height: 300,
          minWidth: "100%"
        }}
        onClick={handleTimelineClick}
      >
        {/* Grid lines */}
        <div className="absolute inset-0">
          {Array.from({ length: Math.ceil(totalDuration / 30) + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute border-l border-slate-600"
              style={{ left: i * 30 * PIXELS_PER_FRAME }}
            />
          ))}
        </div>

        {/* Track lines */}
        <div className="absolute inset-0">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="absolute border-t border-slate-600"
              style={{ top: TRACK_HEIGHT + i * (TRACK_HEIGHT + TRACK_MARGIN) }}
            />
          ))}
        </div>

        {/* Render clips */}
        {clips.map(clip => renderTimelineItem(clip, "clip"))}
        
        {/* Render text overlays */}
        {textOverlays.map(overlay => renderTimelineItem(overlay, "text"))}
        
        {/* Render blur overlays */}
        {blurOverlays.map(overlay => renderTimelineItem(overlay, "blur"))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
          style={{ left: currentFrame * PIXELS_PER_FRAME }}
        >
          <div className="absolute -top-2 -left-1.5 w-3 h-4 bg-red-600 rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export default Timeline;