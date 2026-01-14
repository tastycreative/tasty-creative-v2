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
import {
  useShowTransformHandles,
  useSetShowTransformHandles,
} from "../hooks/useSelectionStore";

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
      <div className="h-12 bg-white/80 dark:bg-[#121216] backdrop-blur-md border-b border-pink-200/60 dark:border-pink-500/20 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left: Primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportGif}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-sm font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all"
            title="Export as GIF"
          >
            <Download className="h-4 w-4" />
            <span>Export GIF</span>
          </button>

          <button
            onClick={onShowShortcuts}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-pink-200/60 dark:border-pink-500/20 bg-white/70 dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors shadow-sm"
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
          <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/70 dark:bg-[#1a1a1f] border border-pink-200/60 dark:border-pink-500/20">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Speed
            </span>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={Number(playbackSpeed || 1)}
              onChange={(e) => onPlaybackSpeedChange(Number(e.target.value))}
              className="w-28 accent-pink-500 bg-pink-100 dark:bg-pink-500/20 rounded-full h-2"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-mono min-w-[2.5rem] text-right">
              {`${(playbackSpeed || 1).toFixed(2)}x`}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/70 dark:bg-[#1a1a1f] border border-pink-200/60 dark:border-pink-500/20">
            <button
              onClick={onZoomOut}
              className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-500/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOutIcon className="h-3 w-3" />
            </button>
            <span className="px-2 text-xs text-gray-600 dark:text-gray-400">{`${timelineZoom?.toFixed?.(1) ?? 1}x`}</span>
            <button
              onClick={onZoomIn}
              className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-500/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomInIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Editing Row */}
      <div className="h-12 bg-pink-50/50 dark:bg-[#121216] border-b border-pink-200/60 dark:border-pink-500/20 flex items-center justify-between px-4 flex-shrink-0">
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
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-pink-200/60 dark:border-pink-500/20 bg-white/70 dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-pink-50 dark:hover:bg-pink-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-pink-200/60 dark:border-pink-500/20 bg-white/70 dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-pink-50 dark:hover:bg-pink-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Clone"
            aria-label="Clone"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Selection hint */}
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[40%] text-center">
          {selectedTextOverlay
            ? `Editing text: ${selectedTextOverlay.text?.slice(0, 24) || ""}`
            : selectedClip
              ? `Selected clip: ${selectedClip.fileName || selectedClip.id}`
              : "No selection"}
        </div>

        {/* Right: Add elements and layout controls */}
        <div className="flex items-center gap-2">
          {/* Layout Selection */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/70 dark:bg-[#1a1a1f] border border-pink-200/60 dark:border-pink-500/20">
            <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">
              Layout:
            </span>

            <button
              onClick={() => onVideoLayoutChange?.("single")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                videoLayout === "single"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                  : "hover:bg-pink-50 dark:hover:bg-pink-500/10 text-gray-600 dark:text-gray-300"
              }`}
              title="Single Layer"
            >
              <Square className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("2-layer")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                videoLayout === "2-layer"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                  : "hover:bg-pink-50 dark:hover:bg-pink-500/10 text-gray-600 dark:text-gray-300"
              }`}
              title="2-Layer Split"
            >
              <Layers className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("v-triptych")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                videoLayout === "v-triptych"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                  : "hover:bg-pink-50 dark:hover:bg-pink-500/10 text-gray-600 dark:text-gray-300"
              }`}
              title="Vertical Triptych"
            >
              <RectangleVertical className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("h-triptych")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                videoLayout === "h-triptych"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                  : "hover:bg-pink-50 dark:hover:bg-pink-500/10 text-gray-600 dark:text-gray-300"
              }`}
              title="Horizontal Triptych"
            >
              <RectangleHorizontal className="h-3 w-3" />
            </button>

            <button
              onClick={() => onVideoLayoutChange?.("2x2-grid")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                videoLayout === "2x2-grid"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                  : "hover:bg-pink-50 dark:hover:bg-pink-500/10 text-gray-600 dark:text-gray-300"
              }`}
              title="2×2 Grid"
            >
              <Grid3X3 className="h-3 w-3" />
            </button>
          </div>

          <div className="h-6 w-px bg-pink-200/60 dark:bg-pink-500/20" />

          {/* Transform Handles Toggle */}
          <button
            onClick={() => setShowTransformHandles(!showTransformHandles)}
            className={`inline-flex items-center justify-center h-9 w-9 rounded-xl transition-colors ${
              showTransformHandles
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                : "bg-white/70 dark:bg-[#1a1a1f] border border-pink-200/60 dark:border-pink-500/20 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-500/10"
            }`}
            title="Toggle Transform Handles"
          >
            <Move className="h-4 w-4" />
          </button>

          <div className="h-6 w-px bg-pink-200/60 dark:bg-pink-500/20" />

          <button
            onClick={onAddTextOverlay}
            className="px-3 h-9 inline-flex items-center justify-center rounded-xl bg-white/70 dark:bg-[#1a1a1f] border border-pink-200/60 dark:border-pink-500/20 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-500/10 hover:text-gray-900 dark:hover:text-white text-sm transition-colors shadow-sm"
            title="Add Text"
          >
            + Text
          </button>
          <button
            onClick={() => {
              onAddBlurOverlay();
            }}
            className="px-3 h-9 inline-flex items-center justify-center rounded-xl bg-white/70 dark:bg-[#1a1a1f] border border-pink-200/60 dark:border-pink-500/20 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-500/10 hover:text-gray-900 dark:hover:text-white text-sm transition-colors shadow-sm"
            title="Add Blur Overlay"
          >
            + Blur
          </button>
        </div>
      </div>

      {/* Layer Assignment Panel - Shows when video clip is selected in multi-layer mode */}
      {selectedClip &&
        selectedClip.type === "video" &&
        videoLayout !== "single" &&
        onAssignClipToLayer && (
          <div className="bg-pink-50/80 dark:bg-[#121216] backdrop-blur-md border-b border-pink-200/60 dark:border-pink-500/20 px-4 py-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Layer Assignment
                  </span>
                  <div className="h-4 w-px bg-pink-200 dark:bg-pink-500/30" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Assign "{selectedClip.fileName || selectedClip.id.slice(-6)}
                    " to layer:
                  </span>

                  <div className="flex gap-1">
                    {Array.from({ length: getMaxLayers?.() || 1 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => onAssignClipToLayer(selectedClip.id, i)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          (layerAssignments[selectedClip.id] ?? 0) === i
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                            : "bg-white/70 dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 border border-pink-200/60 dark:border-pink-500/20 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                        }`}
                        title={`Layer ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  Current: Layer {(layerAssignments[selectedClip.id] ?? 0) + 1}
                </span>

                {/* Auto-fit toggle */}
                {getAutoFit && setAutoFit && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getAutoFit(selectedClip.id)}
                      onChange={(e) =>
                        setAutoFit(selectedClip.id, e.target.checked)
                      }
                      className="w-3 h-3 accent-pink-500 rounded border-pink-300 dark:border-pink-500/30"
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
        <div className="bg-purple-50/80 dark:bg-[#121216] backdrop-blur-md border-b border-pink-200/60 dark:border-pink-500/20 px-4 py-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Blur Settings
                </span>
                <div className="h-4 w-px bg-pink-200 dark:bg-pink-500/30" />
              </div>

              <div className="flex items-center gap-4">
                {/* Blur Type */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Type
                  </label>
                  <select
                    className="bg-white/70 dark:bg-[#1a1a1f] text-gray-900 dark:text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-pink-200/60 dark:border-pink-500/20 hover:bg-pink-50 dark:hover:bg-pink-500/10 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all"
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
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Shape
                  </label>
                  <select
                    className="bg-white/70 dark:bg-[#1a1a1f] text-gray-900 dark:text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-pink-200/60 dark:border-pink-500/20 hover:bg-pink-50 dark:hover:bg-pink-500/10 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all"
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
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">
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
                      className="w-24 accent-pink-500 bg-pink-100 dark:bg-pink-500/20 rounded-full h-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono min-w-[3rem] text-right">
                      {selectedBlur.blurIntensity || 10}px
                    </span>
                  </div>
                </div>

                {/* Rotation Slider */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">
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
                      className="w-28 accent-pink-500 bg-pink-100 dark:bg-pink-500/20 rounded-full h-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono min-w-[3rem] text-right">
                      {Math.round(selectedBlur.rotation || 0)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions for selected blur */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Selected: Blur {selectedBlur.id.slice(-4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Removed per-clip speed controls; using global speed */}

      {/* Minimal Text Controls Panel */}
      {selectedTextOverlay && (
        <div className="bg-pink-50/80 dark:bg-[#121216] backdrop-blur-sm border-b border-pink-200/60 dark:border-pink-500/20 px-4 py-2">
          <div className="flex items-center gap-4">
            {/* Text Input */}
            <input
              type="text"
              value={selectedTextOverlay.text}
              onChange={(e) =>
                onUpdateTextSettings?.(selectedTextOverlay.id, {
                  text: e.target.value,
                } as any)
              }
              className="bg-white/70 dark:bg-[#1a1a1f] text-gray-900 dark:text-gray-100 text-sm rounded-lg px-3 py-1.5 border border-pink-200/60 dark:border-pink-500/20 focus:border-pink-400 focus:ring-1 focus:ring-pink-500/20 outline-none transition-colors w-40"
              placeholder="Text..."
            />

            {/* Font Family */}
            <select
              value={selectedTextOverlay.fontFamily || "system-ui"}
              onChange={(e) =>
                onUpdateTextSettings?.(selectedTextOverlay.id, {
                  fontFamily: e.target.value,
                })
              }
              className="bg-white/70 dark:bg-[#1a1a1f] text-gray-900 dark:text-gray-200 text-sm rounded-lg px-2 py-1.5 border border-pink-200/60 dark:border-pink-500/20 focus:border-pink-400 focus:ring-1 focus:ring-pink-500/20 outline-none transition-colors"
            >
              <option value="system-ui">Times</option>
              <option value="Arial">Arial</option>
              <option value="Impact">Impact</option>
            </select>

            {/* Font Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Size
              </span>
              <input
                type="range"
                min={8}
                max={80}
                value={Math.round((selectedTextOverlay.fontSize || 5) * 16)}
                onChange={(e) =>
                  onUpdateTextSettings?.(selectedTextOverlay.id, {
                    fontSize: Math.max(
                      0.5,
                      Math.min(8, Number(e.target.value) / 16)
                    ),
                  })
                }
                className="w-16 accent-pink-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-mono w-8">
                {Math.round((selectedTextOverlay.fontSize || 5) * 16)}
              </span>
            </div>

            {/* Color Picker */}
            <input
              type="color"
              value={selectedTextOverlay.color || "#ffffff"}
              onChange={(e) =>
                onUpdateTextSettings?.(selectedTextOverlay.id, {
                  color: e.target.value,
                })
              }
              className="w-8 h-8 rounded-lg border border-pink-200/60 dark:border-pink-500/20 cursor-pointer"
              title="Text color"
            />

            {/* Bold Toggle */}
            <button
              onClick={() =>
                onUpdateTextSettings?.(selectedTextOverlay.id, {
                  fontWeight:
                    selectedTextOverlay.fontWeight === "normal"
                      ? "bold"
                      : "normal",
                })
              }
              className={`px-2 py-1 rounded-lg text-sm font-bold transition-colors ${
                selectedTextOverlay.fontWeight === "bold" ||
                selectedTextOverlay.fontWeight === 600
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                  : "bg-white/70 dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 border border-pink-200/60 dark:border-pink-500/20 hover:bg-pink-50 dark:hover:bg-pink-500/10"
              }`}
              title="Bold"
            >
              B
            </button>

            {/* Alignment */}
            <div className="flex gap-0.5">
              {["left", "center", "right"].map((align) => (
                <button
                  key={align}
                  onClick={() =>
                    onUpdateTextSettings?.(selectedTextOverlay.id, {
                      textAlign: align as any,
                    })
                  }
                  className={`px-1.5 py-1 rounded-lg text-xs transition-colors ${
                    selectedTextOverlay.textAlign === align
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                      : "bg-white/70 dark:bg-[#1a1a1f] text-gray-700 dark:text-gray-300 border border-pink-200/60 dark:border-pink-500/20 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                  }`}
                  title={`Align ${align}`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {align === "left" && (
                      <path d="M3 5h10v2H3V5zm0 4h14v2H3V9zm0 4h10v2H3v-2zm0 4h14v2H3v-2z" />
                    )}
                    {align === "center" && (
                      <path d="M7 5h10v2H7V5zm-4 4h18v2H3V9zm4 4h10v2H7v-2zm-4 4h18v2H3v-2z" />
                    )}
                    {align === "right" && (
                      <path d="M11 5h10v2H11V5zm-4 4h14v2H7V9zm4 4h10v2H11v-2zm-4 4h14v2H7v-2z" />
                    )}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineToolbar;
