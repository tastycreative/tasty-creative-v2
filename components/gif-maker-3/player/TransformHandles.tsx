/**
 * Transform handles for resizing and repositioning clips in the Player overlay
 * Provides drag handles for move, scale, and rotate operations
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useShowTransformHandles, useSetTransforming, useSetTransformMode } from '../hooks/useSelectionStore';
import { getTransformBounds, snapToGrid, NUDGE_AMOUNTS } from '../utils/transformUtils';
import { computeContentRect, getLayoutCells } from '../utils/contentRect';

interface TransformHandlesProps {
  clipId: string;
  transform: ClipTransform;
  onTransformChange: (clipId: string, transform: Partial<ClipTransform>) => void;
  canvasWidth: number;
  canvasHeight: number;
  // Optional: Clip intrinsic dimensions for accurate positioning
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  // Optional: Zoom level for screen coordinate conversion
  zoom?: number;
  // Layout system integration
  videoLayout?: string;
  layerAssignments?: Record<string, number>;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startTransform: ClipTransform;
  handleType: 'move' | 'scale-nw' | 'scale-ne' | 'scale-sw' | 'scale-se' | 'scale-n' | 'scale-s' | 'scale-e' | 'scale-w' | 'rotate' | null;
}

export const TransformHandles: React.FC<TransformHandlesProps> = React.memo(({
  clipId,
  transform,
  onTransformChange,
  canvasWidth,
  canvasHeight,
  intrinsicWidth,
  intrinsicHeight,
  zoom = 1,
  videoLayout = 'single',
  layerAssignments = {},
}) => {
  const showTransformHandles = useShowTransformHandles();
  const setTransforming = useSetTransforming();
  const setTransformMode = useSetTransformMode();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startTransform: transform,
    handleType: null,
  });

  const bounds = getTransformBounds(canvasWidth, canvasHeight);

  // Get layout cell for this clip if using multi-layer layout
  const layoutCells = getLayoutCells(videoLayout);
  const clipLayer = layerAssignments[clipId] ?? 0;
  const layoutCell = layoutCells[clipLayer] || layoutCells[0];

  // Calculate content rect based on layout mode
  let contentRect;
  
  if (videoLayout !== 'single') {
    // In multi-layer mode, the video is in a cell container
    // The cell container is positioned and sized by CSS
    const cellPixelWidth = (layoutCell.width / 100) * canvasWidth;
    const cellPixelHeight = (layoutCell.height / 100) * canvasHeight;
    const cellPixelX = (layoutCell.x / 100) * canvasWidth;
    const cellPixelY = (layoutCell.y / 100) * canvasHeight;
    
    // Get the actual video dimensions after object-fit within the cell
    const videoAspect = (intrinsicWidth || 1920) / (intrinsicHeight || 1080);
    const cellAspect = cellPixelWidth / cellPixelHeight;
    
    let videoWidth, videoHeight;
    const fitMode = transform?.fitMode || 'contain';
    
    if (fitMode === 'contain') {
      // Video is scaled to fit entirely within cell
      if (videoAspect > cellAspect) {
        // Video is wider - fit to width
        videoWidth = cellPixelWidth;
        videoHeight = cellPixelWidth / videoAspect;
      } else {
        // Video is taller - fit to height
        videoHeight = cellPixelHeight;
        videoWidth = cellPixelHeight * videoAspect;
      }
    } else if (fitMode === 'cover') {
      // Video is scaled to cover entire cell
      if (videoAspect > cellAspect) {
        // Video is wider - fit to height
        videoHeight = cellPixelHeight;
        videoWidth = cellPixelHeight * videoAspect;
      } else {
        // Video is taller - fit to width
        videoWidth = cellPixelWidth;
        videoHeight = cellPixelWidth / videoAspect;
      }
    } else {
      // fill - stretch to cell dimensions
      videoWidth = cellPixelWidth;
      videoHeight = cellPixelHeight;
    }
    
    // Apply user transform scale
    const scaledWidth = videoWidth * (transform?.scale || 1);
    const scaledHeight = videoHeight * (transform?.scale || 1);
    
    // Calculate position (cell center + user offset)
    const centerX = cellPixelX + cellPixelWidth / 2 + (transform?.positionX || 0);
    const centerY = cellPixelY + cellPixelHeight / 2 + (transform?.positionY || 0);
    
    contentRect = {
      x: centerX - scaledWidth / 2,
      y: centerY - scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight,
    };
  } else {
    // Single layout - use standard calculation
    contentRect = computeContentRect({
      clip: {
        transform,
        intrinsicWidth,
        intrinsicHeight,
      },
      canvas: { width: canvasWidth, height: canvasHeight },
      zoom,
      devicePixelRatio: 1,
    });
  }

  // Convert to element bounds format for compatibility with existing drag logic
  const elementBounds = {
    x: contentRect.x,
    y: contentRect.y,
    width: contentRect.width,
    height: contentRect.height,
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, handleType: DragState['handleType']) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startTransform: { ...transform },
      handleType,
    });

    setTransforming(true);
    setTransformMode(handleType === 'move' ? 'move' : handleType?.startsWith('scale') ? 'scale' : 'rotate');
  }, [transform, setTransforming, setTransformMode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.handleType) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    const { startTransform, handleType } = dragState;

    let newTransform: Partial<ClipTransform> = {};

    switch (handleType) {
      case 'move': {
        const newX = startTransform.positionX + deltaX;
        const newY = startTransform.positionY + deltaY;
        
        // Optional snapping (hold Shift to disable)
        const snapX = e.shiftKey ? newX : snapToGrid(newX, 10);
        const snapY = e.shiftKey ? newY : snapToGrid(newY, 10);
        
        newTransform = {
          positionX: Math.max(bounds.minX, Math.min(bounds.maxX, snapX)),
          positionY: Math.max(bounds.minY, Math.min(bounds.maxY, snapY)),
        };
        break;
      }

      case 'scale-se': {
        // Scale from bottom-right corner
        const scaleFactorX = 1 + deltaX / (canvasWidth / 2);
        const scaleFactorY = 1 + deltaY / (canvasHeight / 2);
        
        // Lock aspect ratio if Shift is held
        const scaleFactor = e.shiftKey 
          ? Math.min(scaleFactorX, scaleFactorY)
          : Math.sqrt(scaleFactorX * scaleFactorY);
        
        const newScale = Math.max(bounds.minScale, Math.min(bounds.maxScale, startTransform.scale * scaleFactor));
        newTransform = { scale: newScale };
        break;
      }

      case 'scale-nw': {
        // Scale from top-left corner (inverse)
        const scaleFactorX = 1 - deltaX / (canvasWidth / 2);
        const scaleFactorY = 1 - deltaY / (canvasHeight / 2);
        
        const scaleFactor = e.shiftKey 
          ? Math.min(scaleFactorX, scaleFactorY)
          : Math.sqrt(scaleFactorX * scaleFactorY);
        
        const newScale = Math.max(bounds.minScale, Math.min(bounds.maxScale, startTransform.scale * scaleFactor));
        newTransform = { scale: newScale };
        break;
      }

      case 'rotate': {
        // Calculate rotation based on mouse position relative to center
        const centerX = elementBounds.x + elementBounds.width / 2;
        const centerY = elementBounds.y + elementBounds.height / 2;
        
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const degrees = (angle * 180 / Math.PI + 90) % 360;
        
        // Snap to 15-degree increments if Shift is held
        const snapAngle = e.shiftKey ? Math.round(degrees / 15) * 15 : degrees;
        
        newTransform = { rotation: snapAngle };
        break;
      }

      // Add other scale handles as needed
      default:
        break;
    }

    onTransformChange(clipId, newTransform);
  }, [dragState, clipId, onTransformChange, canvasWidth, canvasHeight, bounds, elementBounds]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false, handleType: null }));
      setTransforming(false);
      setTransformMode(null);
    }
  }, [dragState.isDragging, setTransforming, setTransformMode]);

  // Keyboard nudging
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showTransformHandles) return;

    const amount = e.altKey ? NUDGE_AMOUNTS.fine : 
                  e.ctrlKey || e.metaKey ? NUDGE_AMOUNTS.coarse : 
                  NUDGE_AMOUNTS.normal;

    let deltaX = 0;
    let deltaY = 0;

    switch (e.key) {
      case 'ArrowLeft':
        deltaX = -amount;
        break;
      case 'ArrowRight':
        deltaX = amount;
        break;
      case 'ArrowUp':
        deltaY = -amount;
        break;
      case 'ArrowDown':
        deltaY = amount;
        break;
      default:
        return;
    }

    e.preventDefault();
    onTransformChange(clipId, {
      positionX: transform.positionX + deltaX,
      positionY: transform.positionY + deltaY,
    });
  }, [showTransformHandles, clipId, transform, onTransformChange]);

  // Event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (showTransformHandles) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showTransformHandles, handleKeyDown]);

  if (!showTransformHandles) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: elementBounds.x,
        top: elementBounds.y,
        width: elementBounds.width,
        height: elementBounds.height,
        transform: `rotate(${transform.rotation}deg)`,
        transformOrigin: 'center',
      }}
    >
      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

      {/* Corner handles for scaling */}
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-nw-resize pointer-events-auto"
        style={{ left: -6, top: -6 }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-nw')}
      />
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-ne-resize pointer-events-auto"
        style={{ right: -6, top: -6 }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-ne')}
      />
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-sw-resize pointer-events-auto"
        style={{ left: -6, bottom: -6 }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-sw')}
      />
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-se-resize pointer-events-auto"
        style={{ right: -6, bottom: -6 }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-se')}
      />

      {/* Center handle for moving */}
      <div
        className="absolute inset-0 cursor-move pointer-events-auto"
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      />

      {/* Rotation handle */}
      <div
        className="absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-crosshair pointer-events-auto"
        style={{ 
          left: '50%', 
          top: -25, 
          transform: 'translateX(-50%)'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
      />

      {/* Transform info tooltip */}
      {dragState.isDragging && (
        <div className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none"
             style={{ left: '50%', bottom: -35, transform: 'translateX(-50%)' }}>
          {dragState.handleType === 'move' && `X: ${Math.round(transform.positionX)}, Y: ${Math.round(transform.positionY)}`}
          {dragState.handleType?.startsWith('scale') && `Scale: ${Math.round(transform.scale * 100)}%`}
          {dragState.handleType === 'rotate' && `Rotation: ${Math.round(transform.rotation)}°`}
        </div>
      )}
    </div>
  );
});

TransformHandles.displayName = 'TransformHandles';