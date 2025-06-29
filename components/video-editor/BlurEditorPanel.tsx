"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SelectiveBlurRegion } from "@/types/video";
import { X, Trash2, Circle, Square, Eye, EyeOff } from "lucide-react";

interface BlurEditorPanelProps {
  region: SelectiveBlurRegion;
  onUpdate: (updates: Partial<SelectiveBlurRegion>) => void;
  onDelete: () => void;
  onClose: () => void;
  videoElement?: HTMLVideoElement | null;
}

export const BlurEditorPanel: React.FC<BlurEditorPanelProps> = ({
  region,
  onUpdate,
  onDelete,
  onClose,
  videoElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialRegion, setInitialRegion] =
    useState<SelectiveBlurRegion | null>(null);

  // Update canvas with current video frame and blur region
  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Set canvas size
      const aspectRatio = 16 / 9;
      const maxWidth = 320;
      const maxHeight = 180;

      let canvasWidth = maxWidth;
      let canvasHeight = maxWidth / aspectRatio;

      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw video frame if available
      if (videoElement && videoElement.readyState >= 2) {
        ctx.drawImage(videoElement, 0, 0, canvasWidth, canvasHeight);
      } else {
        // Draw placeholder
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvasWidth,
          canvasHeight
        );
        gradient.addColorStop(0, "#374151");
        gradient.addColorStop(1, "#1f2937");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Add placeholder text
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Video Preview", canvasWidth / 2, canvasHeight / 2);
      }

      // Draw blur region overlay
      const x = (region.x / 100) * canvasWidth;
      const y = (region.y / 100) * canvasHeight;
      const width = (region.width / 100) * canvasWidth;
      const height = (region.height / 100) * canvasHeight;

      ctx.save();
      ctx.fillStyle = "rgba(147, 51, 234, 0.3)";
      ctx.strokeStyle = "#9333ea";
      ctx.lineWidth = 2;

      if (region.shape === "circle") {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw resize handle for circle
        ctx.fillStyle = "#9333ea";
        ctx.beginPath();
        ctx.arc(centerX + radius - 5, centerY + radius - 5, 4, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);

        // Draw resize handle for rectangle
        ctx.fillStyle = "#9333ea";
        ctx.fillRect(x + width - 8, y + height - 8, 8, 8);
      }

      ctx.restore();
    } catch (error) {
      console.warn("Error updating canvas:", error);
    }
  }, [region, videoElement]);

  useEffect(() => {
    if (showPreview) {
      updateCanvas();
    }
  }, [showPreview, updateCanvas, region]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const clickX = (((e.clientX - rect.left) * scaleX) / canvas.width) * 100;
      const clickY = (((e.clientY - rect.top) * scaleY) / canvas.height) * 100;

      // Check if clicking inside the region
      const isInside =
        clickX >= region.x &&
        clickX <= region.x + region.width &&
        clickY >= region.y &&
        clickY <= region.y + region.height;

      if (isInside) {
        // Check if clicking on resize handle
        const isResizeHandle =
          clickX >= region.x + region.width - 5 &&
          clickY >= region.y + region.height - 5;

        setIsDragging(!isResizeHandle);
        setIsResizing(isResizeHandle);
        setDragStart({ x: clickX, y: clickY });
        setInitialRegion({ ...region });

        e.preventDefault();
      }
    },
    [region]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if ((!isDragging && !isResizing) || !canvasRef.current || !initialRegion)
        return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const currentX =
        (((e.clientX - rect.left) * scaleX) / canvas.width) * 100;
      const currentY =
        (((e.clientY - rect.top) * scaleY) / canvas.height) * 100;

      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;

      if (isDragging) {
        // Move the region
        const newX = Math.max(0, Math.min(80, initialRegion.x + deltaX));
        const newY = Math.max(0, Math.min(80, initialRegion.y + deltaY));
        onUpdate({ x: newX, y: newY });
      } else if (isResizing) {
        // Resize the region
        const newWidth = Math.max(
          5,
          Math.min(60, initialRegion.width + deltaX)
        );
        const newHeight = Math.max(
          5,
          Math.min(60, initialRegion.height + deltaY)
        );
        onUpdate({ width: newWidth, height: newHeight });
      }
    },
    [isDragging, isResizing, dragStart, initialRegion, onUpdate]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setInitialRegion(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 animate-in slide-in-from-top-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            {region.shape === "circle" ? (
              <Circle className="w-5 h-5 text-purple-500" />
            ) : (
              <Square className="w-5 h-5 text-purple-500" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit {region.shape === "circle" ? "Circle" : "Rectangle"} Blur
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adjust blur region position, size and intensity
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              showPreview
                ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Toggle preview"
          >
            {showPreview ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Preview Canvas */}
        {showPreview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Interactive Preview
              </h4>
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                Live
              </div>
            </div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border-2 border-gray-600 shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                className={`w-full h-auto transition-all duration-200 cursor-${
                  isDragging || isResizing ? "grabbing" : "pointer"
                } hover:brightness-110`}
              />
              {(isDragging || isResizing) && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-md">
                  {isDragging ? "Moving..." : "Resizing..."}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                Drag to move
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                Drag corner to resize
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4">
          {/* Shape Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Blur Shape
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdate({ shape: "rectangle" })}
                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-sm ${
                  region.shape === "rectangle"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-md"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <Square className="w-4 h-4" />
                <span className="font-medium">Rectangle</span>
              </button>
              <button
                onClick={() => onUpdate({ shape: "circle" })}
                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-sm ${
                  region.shape === "circle"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-md"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <Circle className="w-4 h-4" />
                <span className="font-medium">Circle</span>
              </button>
            </div>
          </div>

          {/* Blur Intensity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Blur Intensity
              </label>
              <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-md">
                {region.intensity}px
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={region.intensity}
              onChange={(e) =>
                onUpdate({ intensity: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Position and Size Controls */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Position & Size
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  X Position: {region.x.toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={region.x}
                  onChange={(e) => onUpdate({ x: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Y Position: {region.y.toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={region.y}
                  onChange={(e) => onUpdate({ y: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Width: {region.width.toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={region.width}
                  onChange={(e) =>
                    onUpdate({ width: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height: {region.height.toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={region.height}
                  onChange={(e) =>
                    onUpdate({ height: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onDelete}
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-red-500/25"
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-medium">Delete Region</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/25 font-medium"
            >
              Done Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
