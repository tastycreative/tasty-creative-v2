"use client";

import React from "react";
import {
  Trash2,
  Copy,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { Clip, TextOverlay, BlurOverlay } from "@/types/types";
import TransportControls from "./TransportControls";
import { PlayerRef } from "@remotion/player";

interface TimelineToolbarProps {
  selectedClipId: string | null;
  selectedBlurOverlayId?: string | null;
  clips: Clip[];
  textOverlays: TextOverlay[];
  blurOverlays?: BlurOverlay[];
  currentFrame: number;
  totalDuration: number;
  playerRef: React.RefObject<PlayerRef>;
  onDeleteSelectedClip: () => void;
  onCloneClip: () => void;
  onAddTextOverlay: () => void;
  onCloneText?: (id: string) => void;
  onDeleteText?: (id: string) => void;
  selectedTextOverlay?: TextOverlay | null;
  onUpdateTextSettings?: (id: string, updates: Partial<TextOverlay>) => void;
  // Optional: open settings for text overlay
  // onOpenTextSettings?: () => void;
  onAddBlurOverlay: () => void;
  onShowShortcuts: () => void;
  onFrameChange?: (frame: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  timelineZoom?: number;
  onExportGif?: () => void;
  onBlurOverlayUpdate?: (
    overlayId: string,
    updates: Partial<BlurOverlay>
  ) => void;
}

const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  selectedClipId,
  clips,
  selectedBlurOverlayId,
  blurOverlays = [],
  textOverlays,
  currentFrame,
  totalDuration,
  playerRef,
  onDeleteSelectedClip,
  onCloneClip,
  onAddTextOverlay,
  onCloneText,
  onDeleteText,
  selectedTextOverlay,
  onUpdateTextSettings,
  onAddBlurOverlay,
  onShowShortcuts,
  onFrameChange,
  onZoomIn,
  onZoomOut,
  timelineZoom,
  onExportGif,
  onBlurOverlayUpdate,
}) => {
  const selectedBlur: BlurOverlay | null =
    (selectedBlurOverlayId &&
      blurOverlays.find((b) => b.id === selectedBlurOverlayId)) ||
    null;

  const updateSelectedBlur = (updates: Partial<BlurOverlay>) => {
    if (selectedBlur && onBlurOverlayUpdate) {
      onBlurOverlayUpdate(selectedBlur.id, updates);
    }
  };

  return (
    <div className="relative">
      {/* Main Toolbar */}
      <div className="h-14 bg-slate-900/70 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 flex-shrink-0 shadow-[0_-1px_0_0_rgba(255,255,255,0.02)_inset]">
        {/* Left Side - Edit Controls (works for clips and selected text) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedTextOverlay) {
                onDeleteText?.(selectedTextOverlay.id);
              } else {
                onDeleteSelectedClip();
              }
            }}
            disabled={!selectedClipId && !selectedTextOverlay}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-slate-700/70 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              if (selectedTextOverlay) {
                onCloneText?.(selectedTextOverlay.id);
              } else {
                onCloneClip();
              }
            }}
            disabled={!selectedClipId && !selectedTextOverlay}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-slate-700/70 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Clone"
            aria-label="Clone"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Center - Transport Controls */}
        <div className="flex-1 flex items-center justify-center max-w-md">
          <TransportControls
            playerRef={playerRef}
            currentFrame={currentFrame}
            totalDuration={totalDuration}
            onFrameChange={onFrameChange}
          />
        </div>

        {/* Right Side - Primary Actions (Always Visible) */}
        <div className="flex items-center gap-2">
          {/* Add Text Button */}
          <button
            onClick={onAddTextOverlay}
            className="px-3 h-9 inline-flex items-center justify-center rounded-md bg-slate-800/60 border border-slate-700/70 text-slate-200 hover:bg-slate-700/60 hover:text-white text-sm transition-colors"
            title="Add Text"
          >
            + Text
          </button>

          {/* Add Blur Button */}
          <button
            onClick={() => {
              onAddBlurOverlay();
            }}
            className="px-3 h-9 inline-flex items-center justify-center rounded-md bg-slate-800/60 border border-slate-700/70 text-slate-200 hover:bg-slate-700/60 hover:text-white text-sm transition-colors"
            title="Add Blur Overlay"
          >
            + Blur
          </button>

          {/* Zoom Controls - Compact */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/40 border border-slate-700/50">
            <button
              onClick={onZoomOut}
              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOutIcon className="h-3 w-3" />
            </button>

            {/* Discrete zoom buttons for stability; slider caused redundant recomputes */}
            <span className="px-2 text-xs text-slate-400">{`${timelineZoom?.toFixed?.(1) ?? 1}x`}</span>

            <button
              onClick={onZoomIn}
              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomInIcon className="h-3 w-3" />
            </button>
          </div>

          {/* Export GIF - Always Visible Priority Action */}
          <button
            onClick={onExportGif}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-sm font-medium shadow-lg hover:shadow-emerald-500/25 transition-all"
            title="Export as GIF"
          >
            <Download className="h-4 w-4" />
            <span>Export GIF</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onShowShortcuts}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-slate-700/70 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
            title="Settings"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contextual Blur Controls Panel - Slides down when blur overlay is selected */}
      {selectedBlur && (
        <div className="bg-slate-800/95 backdrop-blur-md border-b border-slate-700/60 px-4 py-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">
                  Blur Settings
                </span>
                <div className="h-4 w-px bg-slate-600" />
              </div>

              <div className="flex items-center gap-4">
                {/* Blur Type */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Type
                  </label>
                  <select
                    className="bg-slate-700/80 text-slate-200 text-sm rounded-md px-3 py-1.5 border border-slate-600/70 hover:bg-slate-600/80 focus:bg-slate-600/80 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                    value={selectedBlur.blurType || "gaussian"}
                    onChange={(e) =>
                      updateSelectedBlur({ blurType: e.target.value as any })
                    }
                  >
                    <option value="gaussian">Gaussian</option>
                    <option value="pixelate">Pixelate</option>
                    <option value="mosaic">Mosaic</option>
                  </select>
                </div>

                {/* Shape */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Shape
                  </label>
                  <select
                    className="bg-slate-700/80 text-slate-200 text-sm rounded-md px-3 py-1.5 border border-slate-600/70 hover:bg-slate-600/80 focus:bg-slate-600/80 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                    value={selectedBlur.shape || "rectangle"}
                    onChange={(e) =>
                      updateSelectedBlur({ shape: e.target.value as any })
                    }
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>

                {/* Intensity Slider */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 font-medium">
                    Intensity
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={selectedBlur.blurIntensity || 10}
                      onChange={(e) =>
                        updateSelectedBlur({
                          blurIntensity: parseInt(e.target.value),
                        })
                      }
                      className="w-24 accent-emerald-500 bg-slate-600/60 rounded-full h-2"
                    />
                    <span className="text-sm text-slate-300 font-mono min-w-[3rem] text-right">
                      {selectedBlur.blurIntensity || 10}px
                    </span>
                  </div>
                </div>

                {/* Rotation Slider */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 font-medium">
                    Rotation
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={Math.round(selectedBlur.rotation || 0)}
                      onChange={(e) =>
                        updateSelectedBlur({
                          rotation: parseInt(e.target.value),
                        })
                      }
                      className="w-28 accent-emerald-500 bg-slate-600/60 rounded-full h-2"
                    />
                    <span className="text-sm text-slate-300 font-mono min-w-[3rem] text-right">
                      {Math.round(selectedBlur.rotation || 0)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions for selected blur */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Selected: Blur {selectedBlur.id.slice(-4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Text Controls Panel - Slides down when text overlay is selected */}
      {selectedTextOverlay && (
        <div className="bg-slate-800/95 backdrop-blur-md border-b border-slate-700/60 px-4 py-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-200">
                  Text Settings
                </span>
                <div className="h-4 w-px bg-slate-600" />
              </div>

              <div className="flex items-center gap-4">
                {/* Content */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Text
                  </label>
                  <input
                    type="text"
                    value={selectedTextOverlay.text}
                    onChange={(e) =>
                      onUpdateTextSettings?.(selectedTextOverlay.id, {
                        text: e.target.value,
                      } as any)
                    }
                    className="bg-slate-700/80 text-slate-200 text-sm rounded-md px-3 py-1.5 border border-slate-600/70 hover:bg-slate-600/80 focus:bg-slate-600/80 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all min-w-[14rem]"
                    placeholder="Enter text"
                  />
                </div>

                {/* Color */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Color
                  </label>
                  <input
                    type="color"
                    value={selectedTextOverlay.color || "#ffffff"}
                    onChange={(e) =>
                      onUpdateTextSettings?.(selectedTextOverlay.id, {
                        color: e.target.value,
                      })
                    }
                    className="h-7 w-7 rounded"
                  />
                </div>

                {/* Font */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Size
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={200}
                    value={Math.round((selectedTextOverlay.fontSize || 5) * 16)}
                    onChange={(e) =>
                      onUpdateTextSettings?.(selectedTextOverlay.id, {
                        fontSize: Math.max(
                          0.5,
                          Math.min(12, Number(e.target.value) / 16)
                        ),
                      })
                    }
                    className="w-20 bg-slate-700/60 text-slate-200 text-xs px-2 py-1 rounded"
                  />
                </div>

                {/* Align */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Align
                  </label>
                  <select
                    value={selectedTextOverlay.textAlign || "center"}
                    onChange={(e) =>
                      onUpdateTextSettings?.(selectedTextOverlay.id, {
                        textAlign: e.target.value as any,
                      })
                    }
                    className="bg-slate-700/80 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600/70"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {/* Weight */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Weight
                  </label>
                  <select
                    value={String(selectedTextOverlay.fontWeight || "bold")}
                    onChange={(e) =>
                      onUpdateTextSettings?.(selectedTextOverlay.id, {
                        fontWeight: e.target.value as any,
                      })
                    }
                    className="bg-slate-700/80 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600/70"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value={300}>Light</option>
                    <option value={600}>Semi-bold</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineToolbar;
