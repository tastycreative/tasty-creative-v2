/**
 * Transform handles for resizing and repositioning clips in the Player overlay
 * Provides drag handles for move, scale, and rotate operations
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useShowTransformHandles, useSetTransforming, useSetTransformMode } from '../hooks/useSelectionStore';
import { getTransformBounds, snapToGrid, NUDGE_AMOUNTS } from '../utils/transformUtils';
import { getLayoutCells } from '../utils/contentRect';

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
  
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const bounds = getTransformBounds(canvasWidth, canvasHeight);

  // Get the container dimensions to calculate the actual video display area
  useEffect(() => {
    const updateContainerRect = () => {
      // Find the player container element
      const playerContainer = document.querySelector('[style*="object-fit: contain"]')?.parentElement;
      if (playerContainer) {
        setContainerRect(playerContainer.getBoundingClientRect());
      }
    };

    updateContainerRect();
    
    // Update on resize
    const handleResize = () => updateContainerRect();
    window.addEventListener('resize', handleResize);
    
    // Also use a timeout to catch initial render
    const timer = setTimeout(updateContainerRect, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

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
    if (!dragState.isDragging || !dragState.handleType || !containerRect) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    const { startTransform, handleType } = dragState;

    // Calculate display area
    const containerAspect = containerRect.width / containerRect.height;
    const videoAspect = canvasWidth / canvasHeight;
    let displayWidth, displayHeight;

    if (videoAspect > containerAspect) {
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / videoAspect;
    } else {
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * videoAspect;
    }

    const scaleX = displayWidth / canvasWidth;
    const scaleY = displayHeight / canvasHeight;

    let newTransform: Partial<ClipTransform> = {};

    switch (handleType) {
      case 'move': {
        // Convert screen delta to canvas coordinates
        const canvasDeltaX = deltaX / scaleX;
        const canvasDeltaY = deltaY / scaleY;
        
        const newX = startTransform.positionX + canvasDeltaX;
        const newY = startTransform.positionY + canvasDeltaY;
        
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
        const scaleFactorX = 1 + deltaX / (displayWidth / 2);
        const scaleFactorY = 1 + deltaY / (displayHeight / 2);
        
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
        const scaleFactorX = 1 - deltaX / (displayWidth / 2);
        const scaleFactorY = 1 - deltaY / (displayHeight / 2);
        
        const scaleFactor = e.shiftKey 
          ? Math.min(scaleFactorX, scaleFactorY)
          : Math.sqrt(scaleFactorX * scaleFactorY);
        
        const newScale = Math.max(bounds.minScale, Math.min(bounds.maxScale, startTransform.scale * scaleFactor));
        newTransform = { scale: newScale };
        break;
      }

      case 'rotate': {
        // We'll calculate rotation after we have contentRect
        // For now, just prevent the error
        break;
      }

      default:
        break;
    }

    onTransformChange(clipId, newTransform);
  }, [dragState, clipId, onTransformChange, bounds, containerRect, canvasWidth, canvasHeight]);

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

  // Early return after all hooks are called
  if (!showTransformHandles || !containerRect) return null;

  // Calculate the actual video display area within the container
  // The Player uses objectFit: "contain", so we need to account for letterboxing/pillarboxing
  const containerAspect = containerRect.width / containerRect.height;
  const videoAspect = canvasWidth / canvasHeight;

  let displayWidth, displayHeight, displayX, displayY;

  if (videoAspect > containerAspect) {
    // Video is wider - fit to container width, letterbox top/bottom
    displayWidth = containerRect.width;
    displayHeight = containerRect.width / videoAspect;
    displayX = 0;
    displayY = (containerRect.height - displayHeight) / 2;
  } else {
    // Video is taller - fit to container height, pillarbox left/right  
    displayHeight = containerRect.height;
    displayWidth = containerRect.height * videoAspect;
    displayX = (containerRect.width - displayWidth) / 2;
    displayY = 0;
  }

  // Scale factor from canvas coordinates to display coordinates
  const scaleX = displayWidth / canvasWidth;
  const scaleY = displayHeight / canvasHeight;

  // Get layout cell for this clip if using multi-layer layout
  const layoutCells = getLayoutCells(videoLayout);
  const clipLayer = layerAssignments[clipId] ?? 0;
  const layoutCell = layoutCells[clipLayer] || layoutCells[0];

  // Calculate content rect based on layout mode
  let contentRect;
  
  if (videoLayout !== 'single') {
    // Multi-layer mode - position within layout cell
    const cellPixelWidth = (layoutCell.width / 100) * displayWidth;
    const cellPixelHeight = (layoutCell.height / 100) * displayHeight;
    const cellPixelX = displayX + (layoutCell.x / 100) * displayWidth;
    const cellPixelY = displayY + (layoutCell.y / 100) * displayHeight;
    
    const videoAspectRatio = (intrinsicWidth || 1920) / (intrinsicHeight || 1080);
    const cellAspect = cellPixelWidth / cellPixelHeight;
    
    let videoWidth, videoHeight;
    const fitMode = transform?.fitMode || 'contain';
    
    if (fitMode === 'contain') {
      if (videoAspectRatio > cellAspect) {
        videoWidth = cellPixelWidth;
        videoHeight = cellPixelWidth / videoAspectRatio;
      } else {
        videoHeight = cellPixelHeight;
        videoWidth = cellPixelHeight * videoAspectRatio;
      }
    } else if (fitMode === 'cover') {
      if (videoAspectRatio > cellAspect) {
        videoHeight = cellPixelHeight;
        videoWidth = cellPixelHeight * videoAspectRatio;
      } else {
        videoWidth = cellPixelWidth;
        videoHeight = cellPixelWidth / videoAspectRatio;
      }
    } else {
      videoWidth = cellPixelWidth;
      videoHeight = cellPixelHeight;
    }
    
    const scaledWidth = videoWidth * (transform?.scale || 1);
    const scaledHeight = videoHeight * (transform?.scale || 1);
    
    const centerX = cellPixelX + cellPixelWidth / 2 + (transform?.positionX || 0) * scaleX;
    const centerY = cellPixelY + cellPixelHeight / 2 + (transform?.positionY || 0) * scaleY;
    
    contentRect = {
      x: centerX - scaledWidth / 2,
      y: centerY - scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight,
    };
  } else {
    // Single layout - calculate base video size and position within display area
    const videoAspectRatio = (intrinsicWidth || 1920) / (intrinsicHeight || 1080);
    const displayAspect = displayWidth / displayHeight;
    const fitMode = transform?.fitMode || 'cover';
    
    let baseVideoWidth, baseVideoHeight;
    
    if (fitMode === 'contain') {
      if (videoAspectRatio > displayAspect) {
        baseVideoWidth = displayWidth;
        baseVideoHeight = displayWidth / videoAspectRatio;
      } else {
        baseVideoHeight = displayHeight;
        baseVideoWidth = displayHeight * videoAspectRatio;
      }
    } else if (fitMode === 'cover') {
      if (videoAspectRatio > displayAspect) {
        baseVideoHeight = displayHeight;
        baseVideoWidth = displayHeight * videoAspectRatio;
      } else {
        baseVideoWidth = displayWidth;
        baseVideoHeight = displayWidth / videoAspectRatio;
      }
    } else {
      baseVideoWidth = displayWidth;
      baseVideoHeight = displayHeight;
    }
    
    // Apply user transforms
    const scaledWidth = baseVideoWidth * (transform?.scale || 1);
    const scaledHeight = baseVideoHeight * (transform?.scale || 1);
    
    // Position at display center + user offset (scaled to display coordinates)
    const centerX = displayX + displayWidth / 2 + (transform?.positionX || 0) * scaleX;
    const centerY = displayY + displayHeight / 2 + (transform?.positionY || 0) * scaleY;
    
    contentRect = {
      x: centerX - scaledWidth / 2,
      y: centerY - scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight,
    };
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: contentRect.x,
        top: contentRect.y,
        width: contentRect.width,
        height: contentRect.height,
        transform: `rotate(${transform.rotation}deg)`,
        transformOrigin: 'center center',
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

      {/* Edge handles for scaling */}
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-n-resize pointer-events-auto"
        style={{ left: '50%', top: -6, transform: 'translateX(-50%)' }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-n')}
      />
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-s-resize pointer-events-auto"
        style={{ left: '50%', bottom: -6, transform: 'translateX(-50%)' }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-s')}
      />
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-w-resize pointer-events-auto"
        style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-w')}
      />
      <div
        className="absolute w-3 h-3 bg-blue-500 border border-white cursor-e-resize pointer-events-auto"
        style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
        onMouseDown={(e) => handleMouseDown(e, 'scale-e')}
      />

      {/* Center move handle */}
      <div
        className="absolute w-6 h-6 border-2 border-blue-500 bg-white rounded-full cursor-move pointer-events-auto"
        style={{ 
          left: '50%', 
          top: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full" />
      </div>

      {/* Rotation handle */}
      <div
        className="absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-crosshair pointer-events-auto"
        style={{ left: '50%', top: -24, transform: 'translateX(-50%)' }}
        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
      />
      
      {/* Line connecting rotation handle to top edge */}
      <div
        className="absolute w-0.5 h-4 bg-green-500 pointer-events-none"
        style={{ left: '50%', top: -18, transform: 'translateX(-50%)' }}
      />
    </div>
  );
});

TransformHandles.displayName = 'TransformHandles';
