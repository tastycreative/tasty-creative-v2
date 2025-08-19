import { useState, useCallback, useRef, useEffect } from "react";
import { PlayerRef } from "@remotion/player";
import { 
  useSelectionStore, 
  useSetSelectedClip,
  useSetSelectedTextOverlay,
  useSetSelectedBlurOverlay,
  useClearAllSelections
} from "./useSelectionStore";
import { createDefaultTransform, validateTransform } from "../utils/transformUtils";
import { calculateAutoFitTransform, getLayoutCells } from "../utils/contentRect";

// Layout types for multi-layer video support
export type VideoLayout = 
  | "single" 
  | "2-layer" 
  | "v-triptych" 
  | "h-triptych" 
  | "2x2-grid";

export const useTimeline = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [blurOverlays, setBlurOverlays] = useState<BlurOverlay[]>([]);
  const [contentDuration, setContentDuration] = useState(1);
  const [totalDuration, setTotalDuration] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [timelineZoom, setTimelineZoom] = useState(1);
  
  // Use selection store instead of local state to prevent flicker
  const { selectedClipId, selectedTextOverlayId, selectedBlurOverlayId } = useSelectionStore();
  const setSelectedClip = useSetSelectedClip();
  const setSelectedTextOverlay = useSetSelectedTextOverlay();
  const setSelectedBlurOverlay = useSetSelectedBlurOverlay();
  const clearAllSelections = useClearAllSelections();
  
  // New layout state
  const [videoLayout, setVideoLayout] = useState<VideoLayout>("single");
  const [layerAssignments, setLayerAssignments] = useState<Record<string, number>>({});

  const playerRef = useRef<PlayerRef>(null);

  // Get next available row
  const getNextAvailableRow = useCallback((): number => {
    const allItems = [...clips, ...textOverlays, ...blurOverlays];
    const usedRows = allItems
      .map((item) => item.row)
      .filter((row) => typeof row === "number");

    let row = 0;
    while (usedRows.includes(row)) {
      row++;
    }
    return row;
  }, [clips, textOverlays, blurOverlays]);

  // Update total duration - FIXED: Allow both expanding and shrinking based on actual content
  const updateTotalDuration = useCallback(() => {
    const lastClipEnd = clips.reduce(
      (max, clip) => Math.max(max, clip.start + clip.duration),
      0
    );
    const lastTextOverlayEnd = textOverlays.reduce(
      (max, overlay) => Math.max(max, overlay.start + overlay.duration),
      0
    );
    const lastBlurOverlayEnd = blurOverlays.reduce(
      (max, overlay) => Math.max(max, overlay.start + overlay.duration),
      0
    );

    const actualContentDuration = Math.max(
      lastClipEnd,
      lastTextOverlayEnd,
      lastBlurOverlayEnd,
      30 // Minimum 1 second (30 frames)
    );

    // Always update to actual duration - allows both expanding and shrinking
    setContentDuration(actualContentDuration);
    setTotalDuration(actualContentDuration);
  }, [clips, textOverlays, blurOverlays]);

  // Update duration when content changes
  useEffect(() => {
    updateTotalDuration();
  }, [clips, textOverlays, blurOverlays]); // Removed updateTotalDuration from dependencies

  // Clip operations
  const addClip = useCallback((clip: Clip) => {
    setClips((prev) => [...prev, clip]);
  }, []);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    setClips((prev) =>
      prev.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip))
    );
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  // Text overlay operations
  const addTextOverlay = useCallback(() => {
    const lastItem = [...clips, ...textOverlays, ...blurOverlays].reduce(
      (latest, item) =>
        item.start + item.duration > latest.start + latest.duration
          ? item
          : latest,
      { start: 0, duration: 0 }
    );

    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`, // Use timestamp for unique ID
      start: lastItem.start + lastItem.duration,
      duration: 100,
      text: `Welcome to GIF Maker 3`,
      row: getNextAvailableRow(),
      x: 50,
      y: 50,
      width: 80,
      height: 20,
      fontSize: 5,
    };

    setTextOverlays((prev) => [...prev, newOverlay]);
  }, [clips, textOverlays, blurOverlays, getNextAvailableRow]);

  const updateTextOverlay = useCallback(
    (overlayId: string, updates: Partial<TextOverlay>) => {
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, ...updates } : overlay
        )
      );
    },
    []
  );

  // Blur overlay operations
  const addBlurOverlay = useCallback(() => {
    const lastItem = [...clips, ...textOverlays, ...blurOverlays].reduce(
      (latest, item) =>
        item.start + item.duration > latest.start + latest.duration
          ? item
          : latest,
      { start: 0, duration: 0 }
    );

    const newOverlay: BlurOverlay = {
      id: `blur-${Date.now()}`, // Use timestamp for unique ID
      start: lastItem.start + lastItem.duration,
      duration: 100,
      row: getNextAvailableRow(),
      x: 30,
      y: 30,
      width: 30,
      height: 30,
      blurIntensity: 10,
      rotation: 0,
    };

    setBlurOverlays((prev) => [...prev, newOverlay]);
    // Auto-select the newly added blur overlay to expose contextual controls
    setSelectedBlurOverlay(newOverlay.id);
    setSelectedClip(null);
  }, [clips, textOverlays, blurOverlays, getNextAvailableRow]);

  const updateBlurOverlay = useCallback(
    (overlayId: string, updates: Partial<BlurOverlay>) => {
      setBlurOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, ...updates } : overlay
        )
      );
    },
    []
  );

  const removeBlurOverlay = useCallback((overlayId: string) => {
    setBlurOverlays((prev) => prev.filter((b) => b.id !== overlayId));
    setSelectedBlurOverlay(null);
  }, [setSelectedBlurOverlay]);

  const cloneBlurOverlay = useCallback((overlayId: string) => {
    setBlurOverlays((prev) => {
      const blur = prev.find((b) => b.id === overlayId);
      if (!blur) return prev;
      const clone: BlurOverlay = {
        ...blur,
        id: `blur-${Date.now()}`,
        start: blur.start + blur.duration,
      };
      return [...prev, clone];
    });
  }, []);

  // Selection management
  const handleSelectionChange = useCallback(
    (itemId: string | null) => {
      const isBlurOverlay = blurOverlays.some(
        (overlay) => overlay.id === itemId
      );
      const isTextOverlay = textOverlays.some(
        (overlay) => overlay.id === itemId
      );

      if (isBlurOverlay) {
        setSelectedBlurOverlay(itemId);
      } else if (isTextOverlay) {
        setSelectedTextOverlay(itemId);
      } else {
        setSelectedClip(itemId);
      }
    },
    [blurOverlays, textOverlays, setSelectedBlurOverlay, setSelectedTextOverlay, setSelectedClip]
  );

  // Timeline controls
  const handleCanvasTimelineClick = useCallback(
    (time: number) => {
      const newFrame = Math.max(
        0,
        Math.min(contentDuration - 1, Math.round(time))
      );
      if (playerRef.current) {
        // Avoid redundant seeks which can cause a brief remount/loading feeling
        const current = playerRef.current.getCurrentFrame?.();
        if (typeof current === "number" && Math.abs(current - newFrame) < 1) {
          setCurrentFrame(newFrame);
          return;
        }
        playerRef.current.seekTo(newFrame);
        setCurrentFrame(newFrame);
      }
    },
    [contentDuration]
  );

  const handleZoomIn = useCallback(() => {
    setTimelineZoom((prev) => Math.min(prev + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTimelineZoom((prev) => Math.max(prev - 0.5, 1));
  }, []);

  // Layout management functions
  const assignClipToLayer = useCallback((clipId: string, layer: number) => {
    setLayerAssignments(prev => ({ ...prev, [clipId]: layer }));
  }, []);

  const getClipLayer = useCallback((clipId: string): number => {
    return layerAssignments[clipId] ?? 0; // Default to layer 0
  }, [layerAssignments]);

  const getMaxLayers = useCallback((): number => {
    switch (videoLayout) {
      case "single": return 1;
      case "2-layer": return 2;
      case "v-triptych": 
      case "h-triptych": return 3;
      case "2x2-grid": return 4;
      default: return 1;
    }
  }, [videoLayout]);

  const getLayerClips = useCallback((layer: number): Clip[] => {
    return clips.filter(clip => 
      clip.type === "video" && getClipLayer(clip.id) === layer
    );
  }, [clips, getClipLayer]);

  // Transform management functions
  const updateClipTransform = useCallback((clipId: string, transform: Partial<ClipTransform>) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const currentTransform = clip.transform || createDefaultTransform();
    const validatedTransform = validateTransform({ ...currentTransform, ...transform });
    const newTransform = { ...currentTransform, ...validatedTransform };

    updateClip(clipId, { transform: newTransform });
  }, [clips, updateClip]);

  const resetClipTransform = useCallback((clipId: string) => {
    updateClip(clipId, { transform: createDefaultTransform() });
  }, [updateClip]);

  const getClipTransform = useCallback((clipId: string): ClipTransform => {
    const clip = clips.find(c => c.id === clipId);
    return clip?.transform || createDefaultTransform();
  }, [clips]);

  // Auto-fit functionality
  const autoFitClip = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip || clip.type !== "video") return;

    // For multi-layer layouts, the video container already handles sizing
    // We just need to reset position and keep scale at 1.0
    // For single layout, we might need to calculate scale for non-standard aspect ratios
    
    const currentTransform = getClipTransform(clipId);
    
    if (videoLayout === 'single') {
      // Single layout - calculate auto-fit if video doesn't match canvas aspect ratio
      const canvasWidth = 1920;
      const canvasHeight = 1080;
      const intrinsicWidth = clip.intrinsicWidth || 1920;
      const intrinsicHeight = clip.intrinsicHeight || 1080;
      
      const autoFitTransform = calculateAutoFitTransform(
        { width: intrinsicWidth, height: intrinsicHeight },
        { width: canvasWidth, height: canvasHeight },
        8 // 8px gutter
      );
      
      updateClipTransform(clipId, {
        scale: autoFitTransform.scale,
        positionX: 0,
        positionY: 0,
        rotation: currentTransform.rotation,
        fitMode: "contain",
      });
    } else {
      // Multi-layer layouts - the cell container handles sizing
      // Just reset position and keep scale at 1.0
      updateClipTransform(clipId, {
        scale: 1.0, // Keep at 1.0 - the cell container handles actual sizing
        positionX: 0, // Center in cell
        positionY: 0, // Center in cell
        rotation: currentTransform.rotation,
        fitMode: "contain", // Object-fit handles aspect ratio
      });
    }
  }, [clips, videoLayout, getClipTransform, updateClipTransform]);

  const setAutoFit = useCallback((clipId: string, autoFit: boolean) => {
    updateClip(clipId, { autoFit });
  }, [updateClip]);

  const getAutoFit = useCallback((clipId: string): boolean => {
    const clip = clips.find(c => c.id === clipId);
    return clip?.autoFit ?? true; // Default to true
  }, [clips]);

  // Auto-fit clips when layout changes (only if layout actually changes)
  const previousLayoutRef = useRef(videoLayout);
  useEffect(() => {
    // Only auto-fit if layout actually changed
    if (previousLayoutRef.current !== videoLayout) {
      previousLayoutRef.current = videoLayout;
      
      clips.forEach(clip => {
        if (clip.type === "video" && (clip.autoFit ?? true)) {
          autoFitClip(clip.id);
        }
      });
    }
  }, [videoLayout, clips, autoFitClip]); // Include proper dependencies

  // Auto-fit specific clip when it's assigned to a new layer
  const assignClipToLayerWithAutoFit = useCallback((clipId: string, layer: number) => {
    const previousLayer = layerAssignments[clipId] ?? 0;
    assignClipToLayer(clipId, layer);
    
    // Auto-fit if enabled and layer actually changed
    const clip = clips.find(c => c.id === clipId);
    if (clip && (clip.autoFit ?? true) && layer !== previousLayer) {
      // Use setTimeout to ensure state is updated first
      setTimeout(() => autoFitClip(clipId), 0);
    }
  }, [layerAssignments, assignClipToLayer, clips, autoFitClip]);

  return {
    // State
    clips,
    textOverlays,
    blurOverlays,
    contentDuration,
    totalDuration,
    currentFrame,
    timelineZoom,
    selectedClipId,
    selectedBlurOverlayId,
    playerRef,

    // Layout state
    videoLayout,
    layerAssignments,

    // Setters
    setClips,
    setTextOverlays,
    setBlurOverlays,
    setCurrentFrame,
    setVideoLayout,
    setLayerAssignments,
    
    // Selection actions (from store)
    setSelectedClip,
    setSelectedTextOverlay,
    setSelectedBlurOverlay,
    clearAllSelections,

    // Operations
    getNextAvailableRow,
    updateTotalDuration,
    addClip,
    updateClip,
    removeClip,
    addTextOverlay,
    updateTextOverlay,
    addBlurOverlay,
    updateBlurOverlay,
    removeBlurOverlay,
    cloneBlurOverlay,
    handleSelectionChange,
    handleCanvasTimelineClick,
    handleZoomIn,
    handleZoomOut,

    // Layout operations
    assignClipToLayer,
    assignClipToLayerWithAutoFit,
    getClipLayer,
    getMaxLayers,
    getLayerClips,
    
    // Transform operations
    updateClipTransform,
    resetClipTransform,
    getClipTransform,
    
    // Auto-fit operations
    autoFitClip,
    setAutoFit,
    getAutoFit,
  };
};
