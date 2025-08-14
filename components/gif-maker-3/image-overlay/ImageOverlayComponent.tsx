"use client";

import React, { useState } from "react";

interface ImageOverlayComponentProps {
  src: string;
  x?: number; // Position as percentage
  y?: number; // Position as percentage
  width?: number; // Width as percentage
  height?: number; // Height as percentage
  rotation?: number; // Rotation in degrees
  isInteractive?: boolean; // Whether to show interactive controls
  onUpdate?: (updates: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
  }) => void;
  showPreview?: boolean; // Show the image preview inside the interactive box
  allowOverflow?: boolean;
}

const ImageOverlayComponent: React.FC<ImageOverlayComponentProps> = ({
  src,
  x = 50,
  y = 50,
  width = 50,
  height = 50,
  rotation = 0,
  isInteractive = false,
  onUpdate,
  showPreview = true,
  allowOverflow = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive || !onUpdate) return;

    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const rect =
      e.currentTarget.parentElement?.parentElement?.getBoundingClientRect?.() ||
      e.currentTarget.getBoundingClientRect();
    const startPosX = x;
    const startPosY = y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Convert pixel movement to percentage (more responsive)
      const containerRect = rect;
      if (containerRect) {
        const percentX = (deltaX / containerRect.width) * 100;
        const percentY = (deltaY / containerRect.height) * 100;
        const halfW = (width ?? 50) / 2;
        const halfH = (height ?? 50) / 2;
        const minX = allowOverflow ? 0 : Math.max(0, halfW);
        const maxX = allowOverflow ? 100 : Math.min(100, 100 - halfW);
        const minY = allowOverflow ? 0 : Math.max(0, halfH);
        const maxY = allowOverflow ? 100 : Math.min(100, 100 - halfH);
        const newX = Math.max(minX, Math.min(maxX, startPosX + percentX));
        const newY = Math.max(minY, Math.min(maxY, startPosY + percentY));
        onUpdate({ x: newX, y: newY });
      } else {
        // Fallback with improved sensitivity
        const halfW = (width ?? 50) / 2;
        const halfH = (height ?? 50) / 2;
        const minX = allowOverflow ? 0 : Math.max(0, halfW);
        const maxX = allowOverflow ? 100 : Math.min(100, 100 - halfW);
        const minY = allowOverflow ? 0 : Math.max(0, halfH);
        const maxY = allowOverflow ? 100 : Math.min(100, 100 - halfH);
        const newX = Math.max(minX, Math.min(maxX, startPosX + deltaX / 5));
        const newY = Math.max(minY, Math.min(maxY, startPosY + deltaY / 5));
        onUpdate({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        // Preserve box aspect ratio based on image natural ratio when available
        aspectRatio: "auto",
        cursor: isInteractive ? (isDragging ? "grabbing" : "grab") : "default",
        userSelect: isInteractive ? "none" : "auto",
        zIndex: isInteractive ? 10 : "auto",
        border: isInteractive ? "2px dashed rgba(255,255,255,0.85)" : "none",
        borderRadius: "6px",
        backgroundColor: isInteractive
          ? "rgba(255,255,255,0.08)"
          : "transparent",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Preview image: to avoid double-visual, allow hiding when the Remotion layer already shows it */}
      {showPreview && (
        <img
          src={src}
          alt={isInteractive ? "Interactive Image" : "Image"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            opacity: isInteractive ? 0.8 : 1,
          }}
        />
      )}

      {/* Removed top label to keep UI clean */}

      {/* Resize handles for interactive mode */}
      {isInteractive && onUpdate && (
        <>
          {/* Bottom-right resize handle */}
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              right: "-5px",
              width: "12px",
              height: "12px",
              backgroundColor: "rgba(100,255,100,0.9)",
              cursor: "se-resize",
              border: "2px solid #333",
              borderRadius: "2px",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();

              const startMouseX = e.clientX;
              const startMouseY = e.clientY;
              const startWidth = width;
              const startHeight = height;

              const handleResizeMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startMouseX;
                const deltaY = moveEvent.clientY - startMouseY;

                const newWidth = Math.max(
                  10,
                  Math.min(100, startWidth + deltaX / 10)
                );
                const newHeight = Math.max(
                  10,
                  Math.min(100, startHeight + deltaY / 10)
                );

                onUpdate({ width: newWidth, height: newHeight });
              };

              const handleResizeUp = () => {
                document.removeEventListener("mousemove", handleResizeMove);
                document.removeEventListener("mouseup", handleResizeUp);
              };

              document.addEventListener("mousemove", handleResizeMove);
              document.addEventListener("mouseup", handleResizeUp);
            }}
          />

          {/* Corner resize handles */}
          {/* Top-left */}
          <div
            style={{
              position: "absolute",
              top: "-5px",
              left: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "rgba(100,255,100,0.9)",
              cursor: "nw-resize",
              border: "1px solid #333",
              borderRadius: "2px",
            }}
          />

          {/* Top-right */}
          <div
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "rgba(100,255,100,0.9)",
              cursor: "ne-resize",
              border: "1px solid #333",
              borderRadius: "2px",
            }}
          />

          {/* Bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              left: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "rgba(100,255,100,0.9)",
              cursor: "sw-resize",
              border: "1px solid #333",
              borderRadius: "2px",
            }}
          />

          {/* Rotation handle (top-center) */}
          <div
            style={{
              position: "absolute",
              top: "-26px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "20px",
              height: "20px",
              backgroundColor: "rgba(255,255,255,0.95)",
              cursor: "grab",
              border: "1px solid #333",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!onUpdate) return;

              setIsRotating(true);
              const container = e.currentTarget.parentElement as HTMLElement;
              const rect = container.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const startAngle = Math.atan2(
                e.clientY - centerY,
                e.clientX - centerX
              );
              const startRotation = rotation;

              const handleRotateMove = (moveEvent: MouseEvent) => {
                const angle = Math.atan2(
                  moveEvent.clientY - centerY,
                  moveEvent.clientX - centerX
                );
                const delta = (angle - startAngle) * (180 / Math.PI);
                const newRotation = startRotation + delta;
                onUpdate({ rotation: newRotation });
              };

              const handleRotateUp = () => {
                setIsRotating(false);
                document.removeEventListener("mousemove", handleRotateMove);
                document.removeEventListener("mouseup", handleRotateUp);
              };

              document.addEventListener("mousemove", handleRotateMove);
              document.addEventListener("mouseup", handleRotateUp);
            }}
            title={`Rotate (${Math.round(rotation)}°)`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ pointerEvents: "none" }}
            >
              <path
                d="M21 4v6h-6"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 13A9 9 0 1 1 15 3.51"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default ImageOverlayComponent;
