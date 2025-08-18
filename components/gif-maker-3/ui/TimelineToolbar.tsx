"use client";

import React from "react";
import {
  Trash2,
  Copy,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download,
  SlidersHorizontal,
  Grid3X3,
  Layers,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Move,
} from "lucide-react";
import TransportControls from "./TransportControls";
import { PlayerRef } from "@remotion/player";
import { VideoLayout } from "../hooks/useTimeline";
import { useShowTransformHandles, useSetShowTransformHandles } from "../hooks/useSelectionStore";

interface TimelineToolbarProps {
  selectedClipId: string | null;
  selectedBlurOverlayId?: string | null;
  clips: Clip[];
  textOverlays: TextOverlay[];
  blurOverlays?: BlurOverlay[];
  currentFrame: number;
  totalDuration: number;
  playerRef: React.RefObject<PlayerRef>;
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
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
  onDeleteBlurOverlay?: (id: string) => void;
  onCloneBlurOverlay?: (id: string) => void;
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
  // New layout props
  videoLayout?: VideoLayout;
  onVideoLayoutChange?: (layout: VideoLayout) => void;
  layerAssignments?: Record<string, number>;
  onAssignClipToLayer?: (clipId: string, layer: number) => void;
  getMaxLayers?: () => number;
  // Auto-fit props
  getAutoFit?: (clipId: string) => boolean;
  setAutoFit?: (clipId: string, autoFit: boolean) => void;
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
  onClipUpdate,
  onDeleteSelectedClip,
  onCloneClip,
  onAddTextOverlay,
  onCloneText,
  onDeleteText,
  selectedTextOverlay,
  onUpdateTextSettings,
  onAddBlurOverlay,
  onDeleteBlurOverlay,
  onCloneBlurOverlay,
  onShowShortcuts,
  onFrameChange,
  onZoomIn,
  onZoomOut,
  timelineZoom,
  onExportGif,
  onBlurOverlayUpdate,
  playbackSpeed,
  onPlaybackSpeedChange,
  // New layout props
  videoLayout = "single",
  onVideoLayoutChange,
  layerAssignments = {},
  onAssignClipToLayer,
  getMaxLayers,
  getAutoFit,
  setAutoFit,
}) => {
  const showTransformHandles = useShowTransformHandles();
  const setShowTransformHandles = useSetShowTransformHandles();
  const selectedBlur: BlurOverlay | null =
    (selectedBlurOverlayId &&
      blurOverlays.find((b) => b.id === selectedBlurOverlayId)) ||
    null;

  const selectedClip: Clip | null =
    (selectedClipId && clips.find((c) => c.id === selectedClipId)) || null;

  const updateSelectedBlur = (updates: Partial<BlurOverlay>) => {
    if (selectedBlur && onBlurOverlayUpdate) {
      onBlurOverlayUpdate(selectedBlur.id, updates);
    }
  };

  return (
    <div className="relative">
      {/* Top Utility Row */}
      <div className="h-12 bg-gray-50/90 dark:bg-slate-900/70 backdrop-blur-md border-b border-gray-200/70 dark:border-slate-800/60 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left: Primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportGif}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-sm font-medium shadow-lg hover:shadow-emerald-500/25 transition-all"
            title="Export as GIF"
          >
            <Download className="h-4 w-4" />
            <span>Export GIF</span>
          </button>

          <button
            onClick={onShowShortcuts}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/60 transition-colors shadow-sm"
            title="Settings"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Transport Controls */}
        <div className="flex-1 flex items-center justify-center max-w-lg">
          <TransportControls
            playerRef={playerRef}
            currentFrame={currentFrame}
            totalDuration={totalDuration}
            onFrameChange={onFrameChange}
            playbackSpeed={playbackSpeed}
          />
        </div>

        {/* Right: Global speed and zoom */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/60 dark:bg-slate-800/40 border border-gray-300 dark:border-slate-700/50">
            <span className="text-xs text-gray-600 dark:text-slate-400">
              Speed
            </span>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={Number(playbackSpeed || 1)}
              onChange={(e) => onPlaybackSpeedChange(Number(e.target.value))}
              className="w-28 accent-purple-500 bg-gray-200 dark:bg-slate-600/60 rounded-full h-2"
            />
            <span className="text-xs text-gray-700 dark:text-slate-300 font-mono min-w-[2.5rem] text-right">
              {`${(playbackSpeed || 1).toFixed(2)}x`}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 dark:bg-slate-800/40 border border-gray-300 dark:border-slate-700/50">
            <button
              onClick={onZoomOut}
              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200 dark:hover:bg-slate-700/60 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOutIcon className="h-3 w-3" />
            </button>
            <span className="px-2 text-xs text-gray-600 dark:text-slate-400">{`${timelineZoom?.toFixed?.(1) ?? 1}x`}</span>
            <button
              onClick={onZoomIn}
              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200 dark:hover:bg-slate-700/60 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomInIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Editing Row */}
      <div className="h-12 bg-gray-100/80 dark:bg-slate-900/60 border-b border-gray-300/60 dark:border-slate-800/60 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left: Edit controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedBlur) {
                onDeleteBlurOverlay?.(selectedBlur.id);
              } else if (selectedTextOverlay) {
                onDeleteText?.(selectedTextOverlay.id);
              } else {
                onDeleteSelectedClip();
              }
            }}
            disabled={!selectedClipId && !selectedTextOverlay && !selectedBlur}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (selectedBlur) {
                onCloneBlurOverlay?.(selectedBlur.id);
              } else if (selectedTextOverlay) {
                onCloneText?.(selectedTextOverlay.id);
              } else {
                onCloneClip();
              }
            }}
            disabled={!selectedClipId && !selectedTextOverlay && !selectedBlur}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Clone"
            aria-label="Clone"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Selection hint */}
        <div className="text-xs text-gray-600 dark:text-slate-400 truncate max-w-[40%] text-center">
          {selectedTextOverlay
            ? `Editing text: ${selectedTextOverlay.text?.slice(0, 24) || ""}`
            : selectedClip
              ? `Selected clip: ${selectedClip.fileName || selectedClip.id}`
              : "No selection"}
        </div>

        {/* Right: Add elements and layout controls */}
        <div className="flex items-center gap-2">
          {/* Layout Selection */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 dark:bg-slate-800/40 border border-gray-300 dark:border-slate-700/50">
            <span className="text-xs text-gray-600 dark:text-slate-400 mr-1">Layout:</span>
            
            <button
              onClick={() => onVideoLayoutChange?.("single")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                videoLayout === "single"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700/60 text-gray-600 dark:text-slate-300"
              }`}
              title="Single Layer"
            >
              <Square className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("2-layer")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                videoLayout === "2-layer"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700/60 text-gray-600 dark:text-slate-300"
              }`}
              title="2-Layer Split"
            >
              <Layers className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("v-triptych")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                videoLayout === "v-triptych"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700/60 text-gray-600 dark:text-slate-300"
              }`}
              title="Vertical Triptych"
            >
              <RectangleVertical className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("h-triptych")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                videoLayout === "h-triptych"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700/60 text-gray-600 dark:text-slate-300"
              }`}
              title="Horizontal Triptych"
            >
              <RectangleHorizontal className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("2x2-grid")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                videoLayout === "2x2-grid"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700/60 text-gray-600 dark:text-slate-300"
              }`}
              title="2×2 Grid"
            >
              <Grid3X3 className="h-3 w-3" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-slate-700/50" />

          {/* Transform Handles Toggle */}
          <button
            onClick={() => setShowTransformHandles(!showTransformHandles)}
            className={`inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors ${
              showTransformHandles
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white/80 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700/70 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/60"
            }`}
            title="Toggle Transform Handles"
          >
            <Move className="h-4 w-4" />
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-slate-700/50" />

          <button
            onClick={onAddTextOverlay}
            className="px-3 h-9 inline-flex items-center justify-center rounded-md bg-white/80 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700/70 text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-white text-sm transition-colors shadow-sm"
            title="Add Text"
          >
            + Text
          </button>
          <button
            onClick={() => {
              onAddBlurOverlay();
            }}
            className="px-3 h-9 inline-flex items-center justify-center rounded-md bg-white/80 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700/70 text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-white text-sm transition-colors shadow-sm"
            title="Add Blur Overlay"
          >
            + Blur
          </button>
        </div>
      </div>

      {/* Layer Assignment Panel - Shows when video clip is selected in multi-layer mode */}
      {selectedClip && selectedClip.type === "video" && videoLayout !== "single" && onAssignClipToLayer && (
        <div className="bg-blue-50/95 dark:bg-blue-900/20 backdrop-blur-md border-b border-blue-300/60 dark:border-blue-700/60 px-4 py-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  Layer Assignment
                </span>
                <div className="h-4 w-px bg-gray-400 dark:bg-slate-600" />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-slate-400">
                  Assign "{selectedClip.fileName || selectedClip.id.slice(-6)}" to layer:
                </span>
                
                <div className="flex gap-1">
                  {Array.from({ length: getMaxLayers?.() || 1 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => onAssignClipToLayer(selectedClip.id, i)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        (layerAssignments[selectedClip.id] ?? 0) === i
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                      }`}
                      title={`Layer ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-slate-400">
              <span>Current: Layer {(layerAssignments[selectedClip.id] ?? 0) + 1}</span>
              
              {/* Auto-fit toggle */}
              {getAutoFit && setAutoFit && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={getAutoFit(selectedClip.id)}
                    onChange={(e) => setAutoFit(selectedClip.id, e.target.checked)}
                    className="w-3 h-3 text-blue-500 rounded border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span>Auto-fit</span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contextual Blur Controls Panel - Slides down when blur overlay is selected */}
      {selectedBlur && (
        <div className="bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-gray-300/60 dark:border-slate-700/60 px-4 py-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  Blur Settings
                </span>
                <div className="h-4 w-px bg-gray-400 dark:bg-slate-600" />
              </div>

              <div className="flex items-center gap-4">
                {/* Blur Type */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                    Type
                  </label>
                  <select
                    className="bg-white dark:bg-slate-700/80 text-gray-900 dark:text-slate-200 text-sm rounded-md px-3 py-1.5 border border-gray-300 dark:border-slate-600/70 hover:bg-gray-50 dark:hover:bg-slate-600/80 focus:bg-white dark:focus:bg-slate-600/80 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
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
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                    Shape
                  </label>
                  <select
                    className="bg-white dark:bg-slate-700/80 text-gray-900 dark:text-slate-200 text-sm rounded-md px-3 py-1.5 border border-gray-300 dark:border-slate-600/70 hover:bg-gray-50 dark:hover:bg-slate-600/80 focus:bg-white dark:focus:bg-slate-600/80 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
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
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
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
                      className="w-24 accent-emerald-500 bg-gray-200 dark:bg-slate-600/60 rounded-full h-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300 font-mono min-w-[3rem] text-right">
                      {selectedBlur.blurIntensity || 10}px
                    </span>
                  </div>
                </div>

                {/* Rotation Slider */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
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
                      className="w-28 accent-emerald-500 bg-gray-200 dark:bg-slate-600/60 rounded-full h-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300 font-mono min-w-[3rem] text-right">
                      {Math.round(selectedBlur.rotation || 0)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions for selected blur */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
              <span>Selected: Blur {selectedBlur.id.slice(-4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Removed per-clip speed controls; using global speed */}

      {/* Contextual Text Controls Panel - Slides down when text overlay is selected */}
      {selectedTextOverlay && (
        <div className="bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-gray-300/60 dark:border-slate-700/60 px-4 py-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  Text Settings
                </span>
                <div className="h-4 w-px bg-gray-400 dark:bg-slate-600" />
              </div>

              <div className="flex items-center gap-4">
                {/* Content */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
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
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
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
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
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
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
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
                  <label className="text-xs text-gray-600 dark:text-slate-400 font-medium">
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
