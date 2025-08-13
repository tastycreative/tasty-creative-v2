"use client";

import React, { useState } from "react";

interface BlurOverlayComponentProps {
  x?: number; // Position as percentage
  y?: number; // Position as percentage
  width?: number; // Width as percentage
  height?: number; // Height as percentage
  blurIntensity?: number; // Blur intensity in pixels
  rotation?: number; // Rotation in degrees
  blurType?: "gaussian" | "pixelate" | "mosaic";
  shape?: "rectangle" | "circle";
  isInteractive?: boolean; // Whether to show interactive controls
  showHandles?: boolean; // Toggle resize/rotate handles
  allowOverflow?: boolean;
  onUpdate?: (updates: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    blurIntensity?: number;
    rotation?: number;
    blurType?: "gaussian" | "pixelate" | "mosaic";
    shape?: "rectangle" | "circle";
  }) => void;
}

const BlurOverlayComponent: React.FC<BlurOverlayComponentProps> = ({
  x = 50,
  y = 50,
  width = 30,
  height = 30,
  blurIntensity = 10,
  rotation = 0,
  blurType = "gaussian",
  shape = "rectangle",
  isInteractive = false,
  showHandles = true,
  allowOverflow = true,
  onUpdate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Get the appropriate backdrop filter
  const getBackdropFilter = () => {
    switch (blurType) {
      case "gaussian":
        return `blur(${blurIntensity}px)`;
      case "pixelate":
        // More intense blur for pixelate effect, no color manipulation
        return `blur(${Math.max(2, blurIntensity * 1.5)}px)`;
      case "mosaic":
        // Medium blur for mosaic effect, no color manipulation
        return `blur(${Math.max(1, blurIntensity * 1.2)}px)`;
      default:
        return `blur(${blurIntensity}px)`;
    }
  };

  // Get additional CSS for pixelate/mosaic effects - keeping minimal for clean effects
  const getAdditionalStyles = () => {
    // No background patterns - they create artificial colors
    // Let backdrop-filter do all the work for clean effects
    return {};
  };

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
        const halfW = (width ?? 30) / 2;
        const halfH = (height ?? 30) / 2;
        const minX = allowOverflow ? 0 : Math.max(0, halfW);
        const maxX = allowOverflow ? 100 : Math.min(100, 100 - halfW);
        const minY = allowOverflow ? 0 : Math.max(0, halfH);
        const maxY = allowOverflow ? 100 : Math.min(100, 100 - halfH);
        const newX = Math.max(minX, Math.min(maxX, startPosX + percentX));
        const newY = Math.max(minY, Math.min(maxY, startPosY + percentY));
        onUpdate({ x: newX, y: newY });
      } else {
        // Fallback with improved sensitivity
        const halfW = (width ?? 30) / 2;
        const halfH = (height ?? 30) / 2;
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

  // Ensure true circle by forcing square box using the smaller dimension
  const minSide = Math.min(width, height);
  const boxWidth = shape === "circle" ? minSide : width;
  const boxHeight = shape === "circle" ? minSide : height;

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${boxWidth}%`,
        height: `${boxHeight}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        cursor: isInteractive ? (isDragging ? "grabbing" : "grab") : "default",
        userSelect: isInteractive ? "none" : "auto",
        zIndex: isInteractive ? 10 : "auto",
        // Allow handles (rotation/intensity) to render outside the box when editing
        overflow: isInteractive && showHandles ? "visible" : "hidden",
        backdropFilter: getBackdropFilter(),
        WebkitBackdropFilter: getBackdropFilter(),
        ...getAdditionalStyles(),
        border: isInteractive ? "2px dashed rgba(255,255,255,0.8)" : "none",
        borderRadius: shape === "circle" ? "50%" : "8px",
        backgroundColor: "transparent",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Blur indicator for interactive mode */}
      {isInteractive && showHandles && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
            pointerEvents: "none",
          }}
        >
          BLUR
        </div>
      )}

      {/* Resize handles for interactive mode */}
      {isInteractive && showHandles && onUpdate && (
        <>
          {/* Edge markers removed for cleaner look */}
          {/* Controls moved to timeline toolbar */}
          {/* Bottom-right resize handle */}
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              right: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "white",
              cursor: "se-resize",
              border: "1px solid #333",
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
                  Math.min(80, startWidth + deltaX / 10)
                );
                const newHeight = Math.max(
                  10,
                  Math.min(80, startHeight + deltaY / 10)
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

          {/* Blur intensity control handle */}
          <div
            style={{
              position: "absolute",
              top: "-15px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "20px",
              height: "10px",
              backgroundColor: "rgba(255,255,255,0.8)",
              cursor: "ns-resize",
              border: "1px solid #333",
              borderRadius: "2px",
              fontSize: "8px",
              textAlign: "center",
              lineHeight: "8px",
              color: "#333",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();

              const startMouseY = e.clientY;
              const startBlur = blurIntensity;

              const handleBlurMove = (moveEvent: MouseEvent) => {
                const deltaY = moveEvent.clientY - startMouseY;
                const newBlur = Math.max(
                  0,
                  Math.min(50, startBlur - deltaY / 2)
                ); // Inverted for intuitive control

                onUpdate({ blurIntensity: newBlur });
              };

              const handleBlurUp = () => {
                document.removeEventListener("mousemove", handleBlurMove);
                document.removeEventListener("mouseup", handleBlurUp);
              };

              document.addEventListener("mousemove", handleBlurMove);
              document.addEventListener("mouseup", handleBlurUp);
            }}
            title={`Blur: ${blurIntensity}px`}
          >
            {Math.round(blurIntensity)}
          </div>

          {/* Rotation handle (top-center) - match text/image styling */}
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
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
              const startRotation = rotation;

              const handleRotateMove = (moveEvent: MouseEvent) => {
                const angle = Math.atan2(
                  moveEvent.clientY - cy,
                  moveEvent.clientX - cx
                );
                const delta = (angle - startAngle) * (180 / Math.PI);
                onUpdate({ rotation: startRotation + delta });
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

export default BlurOverlayComponent;
