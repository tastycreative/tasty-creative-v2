"use client";

import React, { useState } from "react";
import { spring } from "remotion";

interface TextOverlayComponentProps {
  text: string;
  x?: number; // Position as percentage
  y?: number; // Position as percentage
  width?: number; // Width as percentage
  height?: number; // Height as percentage
  fontSize?: number; // Font size
  rotation?: number; // Rotation in degrees
  isInteractive?: boolean; // Whether to show interactive controls
  // Optional animation inputs (avoid remotion hooks so this can render outside <Player>)
  frame?: number;
  fps?: number;
  animate?: boolean;
  // Visual properties
  color?: string;
  fontWeight?: "normal" | "bold" | number;
  textAlign?: "left" | "center" | "right";
  allowOverflow?: boolean; // if true, center can go 0..100 even if box extends out
  containerRef?: React.RefObject<HTMLElement>;
  onUpdate?: (updates: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    rotation?: number;
    color?: string;
    fontWeight?: "normal" | "bold" | number;
    textAlign?: "left" | "center" | "right";
  }) => void;
}

const TextOverlayComponent: React.FC<TextOverlayComponentProps> = ({
  text,
  x = 50,
  y = 50,
  width = 80,
  height = 20,
  fontSize = 5,
  rotation = 0,
  isInteractive = false,
  frame,
  fps,
  animate = false,
  color = "#ffffff",
  fontWeight = "bold",
  textAlign = "center",
  allowOverflow = true,
  containerRef,
  onUpdate,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const opacity =
    animate && typeof frame === "number" && typeof fps === "number"
      ? spring({ frame, fps, from: 0, to: 1, durationInFrames: 30 })
      : 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive || !onUpdate) return;

    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    // Use an explicit overlay root container if provided
    const rect =
      containerRef?.current?.getBoundingClientRect() ||
      e.currentTarget.parentElement?.parentElement?.getBoundingClientRect?.();
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
        const halfW = (width ?? 80) / 2;
        const halfH = (height ?? 20) / 2;
        const minX = allowOverflow ? 0 : Math.max(0, halfW);
        const maxX = allowOverflow ? 100 : Math.min(100, 100 - halfW);
        const minY = allowOverflow ? 0 : Math.max(0, halfH);
        const maxY = allowOverflow ? 100 : Math.min(100, 100 - halfH);
        const newX = Math.max(minX, Math.min(maxX, startPosX + percentX));
        const newY = Math.max(minY, Math.min(maxY, startPosY + percentY));
        onUpdate({ x: newX, y: newY });
      } else {
        // Fallback with improved sensitivity
        const halfW = (width ?? 80) / 2;
        const halfH = (height ?? 20) / 2;
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
        textAlign,
        cursor: isInteractive ? (isDragging ? "grabbing" : "grab") : "default",
        userSelect: isInteractive ? "none" : "auto",
        zIndex: isInteractive ? 10 : "auto",
      }}
      onMouseDown={handleMouseDown}
    >
      <h1
        style={{
          opacity,
          color,
          fontSize: `${fontSize}rem`,
          fontWeight,
          margin: 0,
          padding: "10px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
          border: isInteractive ? "2px dashed rgba(255,255,255,0.8)" : "none",
          backgroundColor: isInteractive
            ? "rgba(255,255,255,0.1)"
            : "transparent",
        }}
      >
        {text}
      </h1>

      {/* Resize handles for interactive mode */}
      {isInteractive && onUpdate && (
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
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();

            const startMouseX = e.clientX;
            const startMouseY = e.clientY;
            const startWidth = width;
            const startHeight = height;
            const startFontSize = fontSize;

            const handleResizeMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startMouseX;
              const deltaY = moveEvent.clientY - startMouseY;

              const newWidth = Math.max(
                20,
                Math.min(100, startWidth + deltaX / 10)
              );
              const newHeight = Math.max(
                10,
                Math.min(50, startHeight + deltaY / 10)
              );
              const newFontSize = Math.max(
                1,
                Math.min(10, startFontSize + deltaX / 50)
              );

              onUpdate({
                width: newWidth,
                height: newHeight,
                fontSize: newFontSize,
              });
            };

            const handleResizeUp = () => {
              document.removeEventListener("mousemove", handleResizeMove);
              document.removeEventListener("mouseup", handleResizeUp);
            };

            document.addEventListener("mousemove", handleResizeMove);
            document.addEventListener("mouseup", handleResizeUp);
          }}
        />
      )}

      {/* Rotation handle */}
      {isInteractive && onUpdate && (
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
      )}
    </div>
  );
};

export default TextOverlayComponent;
