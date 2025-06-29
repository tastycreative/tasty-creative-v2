"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SelectiveBlurRegion } from "@/types/video";
import { X, Trash2, Circle, Square, Eye, EyeOff } from "lucide-react";

interface BlurEditorModalProps {
  region: SelectiveBlurRegion;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<SelectiveBlurRegion>) => void;
  onDelete: () => void;
  videoElement?: HTMLVideoElement | null;
}

export const BlurEditorModal: React.FC<BlurEditorModalProps> = ({
  region,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
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
      const maxWidth = 400;
      const maxHeight = 225;

      let canvasWidth = maxWidth;
      let canvasHeight = maxWidth / aspectRatio;

      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw background
      if (!videoElement) {
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = "#6b7280";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Video Preview", canvasWidth / 2, canvasHeight / 2);
      } else {
        ctx.drawImage(videoElement, 0, 0, canvasWidth, canvasHeight);
      }

      // Draw blur region
      const x = (region.x / 100) * canvasWidth;
      const y = (region.y / 100) * canvasHeight;
      const width = (region.width / 100) * canvasWidth;
      const height = (region.height / 100) * canvasHeight;

      ctx.save();
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      if (region.shape === "circle") {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, width, height);
      }

      // Draw resize handle
      ctx.fillStyle = "#8b5cf6";
      ctx.fillRect(x + width - 6, y + height - 6, 12, 12);

      // Add blur overlay to show effect
      ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
      if (region.shape === "circle") {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, width, height);
      }

      ctx.restore();
    } catch (error) {
      console.warn("Error updating canvas:", error);
    }
  }, [region, videoElement]);

  useEffect(() => {
    if (isOpen && showPreview) {
      updateCanvas();
    }
  }, [isOpen, showPreview, updateCanvas, region]);

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
        const newX = Math.max(
          0,
          Math.min(100 - initialRegion.width, initialRegion.x + deltaX)
        );
        const newY = Math.max(
          0,
          Math.min(100 - initialRegion.height, initialRegion.y + deltaY)
        );
        onUpdate({ x: newX, y: newY });
      } else if (isResizing) {
        const newWidth = Math.max(
          5,
          Math.min(100 - initialRegion.x, initialRegion.width + deltaX)
        );
        const newHeight = Math.max(
          5,
          Math.min(100 - initialRegion.y, initialRegion.height + deltaY)
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {region.shape === "circle" ? (
              <Circle className="w-5 h-5 text-purple-500" />
            ) : (
              <Square className="w-5 h-5 text-purple-500" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit {region.shape === "circle" ? "Circle" : "Rectangle"} Blur
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg ${
                showPreview
                  ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
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
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Preview Canvas */}
          {showPreview && (
            <div className="mb-6">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  className={`w-full h-auto cursor-${
                    isDragging || isResizing ? "grabbing" : "pointer"
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Drag to move • Drag corner to resize
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-6">
            {/* Shape Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Shape
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => onUpdate({ shape: "rectangle" })}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                    region.shape === "rectangle"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span>Rectangle</span>
                </button>
                <button
                  onClick={() => onUpdate({ shape: "circle" })}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                    region.shape === "circle"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Circle className="w-4 h-4" />
                  <span>Circle</span>
                </button>
              </div>
            </div>

            {/* Blur Intensity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Blur Intensity: {region.intensity}px
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={region.intensity}
                onChange={(e) =>
                  onUpdate({ intensity: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Position and Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Blur</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
