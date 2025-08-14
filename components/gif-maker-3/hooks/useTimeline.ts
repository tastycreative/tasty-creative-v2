import { useState, useCallback, useRef, useEffect } from "react";
import { PlayerRef } from "@remotion/player";

export const useTimeline = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [blurOverlays, setBlurOverlays] = useState<BlurOverlay[]>([]);
  const [contentDuration, setContentDuration] = useState(1);
  const [totalDuration, setTotalDuration] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedBlurOverlayId, setSelectedBlurOverlayId] = useState<
    string | null
  >(null);

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
    setSelectedBlurOverlayId(newOverlay.id);
    setSelectedClipId(null);
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
    setSelectedBlurOverlayId((prev) => (prev === overlayId ? null : prev));
  }, []);

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
        setSelectedBlurOverlayId(itemId);
        setSelectedClipId(null);
      } else if (isTextOverlay) {
        setSelectedClipId(itemId);
        setSelectedBlurOverlayId(null);
      } else {
        setSelectedClipId(itemId);
        setSelectedBlurOverlayId(null);
      }
    },
    [blurOverlays, textOverlays]
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

    // Setters
    setClips,
    setTextOverlays,
    setBlurOverlays,
    setCurrentFrame,
    setSelectedClipId,
    setSelectedBlurOverlayId,

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
  };
};
