/**
 *
 * A simplified video editing interface built with React and Remotion.
 * Allows users to:
 * - Add and arrange video clips on a timeline
 * - Add text overlays with animations
 * - Preview the composition in real-time
 */

"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from "react";
import { Film } from "lucide-react";

import { VaultPicker } from "../video-editor/VaultPicker";
import { CanvasTimeline } from "./canvas-timeline";
import { TextOverlayComponent } from "./text-overlay";
import { BlurOverlayComponent } from "./blur-overlay";
import { ImageOverlayComponent } from "./image-overlay";
import { TemplateImages, UploadedVideos, UploadedImages } from "./assets";
import { UploadZone } from "./upload";
import { VaultSection } from "./vault";
import { KeyboardShortcutsModal, TimelineToolbar, SearchBar } from "./ui";
import Timeline from "./timeline/Timeline";
import ProgressModal from "./ui/ProgressModal";
import PlayerComponent from "./PlayerComponent";
import PlayerControls from "./PlayerControls";
import { ThemeToggle } from "../admin/ThemeToggle";

// Custom hooks for performance optimization
import { useTimeline } from "./hooks/useTimeline";
import { useFileUpload } from "./hooks/useFileUpload";
import { useGifExport } from "./hooks/useGifExport";

/**
 * Main Free Video Editor Component
 */
const GifVideoEditor: React.FC = memo(() => {
  // Custom hooks for optimized state management
  const timeline = useTimeline();
  const fileUpload = useFileUpload();
  const gifExport = useGifExport();

  // Extract timeline state for easier access
  const {
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
    setCurrentFrame,
    setSelectedClip,
    setSelectedBlurOverlay,
    setTextOverlays,
    getNextAvailableRow,
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
    // New layout state and functions
    videoLayout,
    layerAssignments,
    setVideoLayout,
    assignClipToLayer,
    assignClipToLayerWithAutoFit,
    getClipLayer,
    getMaxLayers,
    getLayerClips,
    // Transform functions
    updateClipTransform,
    resetClipTransform,
    getClipTransform,
    // Auto-fit functions
    autoFitClip,
    setAutoFit,
    getAutoFit,
    // Selection actions
    clearAllSelections,
  } = timeline;

  const {
    uploadedVideos,
    uploadedImages,
    isDragOver,
    handleFileUpload,
    removeUploadedVideo,
    removeUploadedImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = fileUpload;

  const { isExporting, exportToGif } = gifExport;

  // Local UI state
  const [isMobile, setIsMobile] = useState(false);
  const [previewQuality, setPreviewQuality] = useState<"LOW" | "MED" | "HIGH">(
    "HIGH"
  );
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Model selection state (like in VideoEditor)
  const [formData, setFormData] = useState<{ model?: string }>({
    model: "",
  });
  const [modelType, setModelType] = useState<"FREE" | "PAID">("FREE");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<"videos" | "images">(
    "videos"
  );

  // Effects state (could be moved to a hook later)
  const [clipEffects] = useState<Record<string, Record<string, number>>>({});

  // Additional refs
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Video duration calculation is now handled by useFileUpload hook

  // File upload handlers are now provided by useFileUpload hook
  const handleFileUploadWrapper = useCallback(
    (files: FileList | File[]) => {
      handleFileUpload(files, clips, getNextAvailableRow, addClip);
    },
    [handleFileUpload, clips, getNextAvailableRow, addClip]
  );

  const handleDropWrapper = useCallback(
    (e: React.DragEvent) => {
      handleDrop(e, clips, getNextAvailableRow, addClip);
    },
    [handleDrop, clips, getNextAvailableRow, addClip]
  );

  // Memoized file input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) {
        handleFileUploadWrapper(files);
      }
    },
    [handleFileUploadWrapper]
  );

  // Remove functions are now provided by useFileUpload hook

  /**
   * Open vault to select model assets
   */
  const handleOpenVault = () => {
    if (!formData.model) {
      alert("Please select a model first");
      return;
    }
    setIsVaultOpen(true);
  };

  // Memoized vault media selection handler
  const handleVaultMediaSelected = useCallback(
    (files: File[]) => {
      handleFileUploadWrapper(files);
    },
    [handleFileUploadWrapper]
  );

  /**
   * Get formatted model value for VaultPicker
   */
  const getFinalModelValue = () => {
    if (!formData.model || formData.model.trim() === "") return "";
    return `${formData.model.toUpperCase()}_${modelType}`;
  };

  // Timeline manipulation functions are now handled by useTimeline hook

  // Split clip functionality (simplified wrapper)
  const splitClip = useCallback(
    (clipId: string, splitTime: number, trimSide?: "left" | "right") => {
      // Implementation moved to useTimeline hook
      console.log("Split clip:", clipId, splitTime, trimSide);
    },
    []
  );

  // Delete functionality using hook functions
  const deleteSelectedClip = useCallback(() => {
    if (selectedClipId) {
      removeClip(selectedClipId);
      setSelectedClip(null);
    }
  }, [selectedClipId, removeClip, setSelectedClip]);

  // Clone clip functionality using hooks
  const handleCloneClip = useCallback(() => {
    if (selectedClipId) {
      const selectedClip = clips.find((c) => c.id === selectedClipId);
      if (selectedClip) {
        const newClip = {
          ...selectedClip,
          id: `clone-${Date.now()}`,
          start: selectedClip.start + selectedClip.duration,
        };
        addClip(newClip);
      }
    }
  }, [selectedClipId, clips, addClip]);

  // Text clone/delete and settings handlers
  const selectedTextOverlay = useMemo(
    () => textOverlays.find((t) => t.id === selectedClipId) || null,
    [textOverlays, selectedClipId]
  );

  const handleCloneText = useCallback(
    (id: string) => {
      const t = textOverlays.find((x) => x.id === id);
      if (!t) return;
      const clone = {
        ...t,
        id: `text-${Date.now()}`,
        start: t.start + t.duration,
      };
      setTextOverlays([...textOverlays, clone]);
      setSelectedClip(clone.id);
    },
    [textOverlays, setTextOverlays, setSelectedClip]
  );

  const handleDeleteText = useCallback(
    (id: string) => {
      // Remove by filtering state
      const next = textOverlays.filter((t) => t.id !== id);
      // Replace state directly via setter
      // Note: useTimeline exposes setTextOverlays; using update function
      // If not exposed, fallback to updateTextOverlay for no-op
      // We have setTextOverlays in the hook return
      setTextOverlays(next);
      if (selectedClipId === id) setSelectedClip(null);
    },
    [textOverlays, setTextOverlays, selectedClipId, setSelectedClip]
  );

  const handleUpdateTextSettings = useCallback(
    (id: string, updates: Partial<TextOverlay>) => {
      updateTextOverlay(id, updates);
    },
    [updateTextOverlay]
  );

  // UI handlers
  const handleShowShortcuts = useCallback(() => {
    setShowShortcuts(!showShortcuts);
  }, [showShortcuts]);

  // Memoized keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelectedClip();
      }
    },
    [deleteSelectedClip]
  );

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Helper functions are now provided by useTimeline hook

  // Initialize component
  useEffect(() => {
    // Component initialization if needed
  }, []);

  // Performance optimized GIF export handler
  const handleExportToGif = useCallback(async () => {
    try {
      await exportToGif(
        clips,
        textOverlays,
        blurOverlays,
        clipEffects,
        contentDuration,
        { playbackSpeed }
      );
    } catch (error: unknown) {
      console.error("Export failed:", error);
      alert((error as Error)?.message || "Export failed");
    }
  }, [
    exportToGif,
    clips,
    textOverlays,
    blurOverlays,
    clipEffects,
    contentDuration,
  ]);

  // Stable inputProps for Remotion Player to avoid component remounts
  const compositionInputProps = useMemo(
    () => ({
      clips,
      textOverlays,
      blurOverlays,
      clipEffects,
      selectedTextOverlayId: selectedClipId,
      selectedBlurOverlayId,
    }),
    [
      clips,
      textOverlays,
      blurOverlays,
      clipEffects,
      selectedClipId,
      selectedBlurOverlayId,
    ]
  );

  // Effect for checking mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Frame updates now handled by PlayerControls component

  // Cleanup uploaded video URLs on unmount
  useEffect(() => {
    return () => {
      uploadedVideos.forEach((video) => {
        URL.revokeObjectURL(video.url);
      });
    };
  }, [uploadedVideos]);

  // Render mobile view message if on a mobile device
  if (isMobile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Mobile View Not Supported</h2>
          <p className="text-md">
            This video editor is only available on desktop or laptop devices.
          </p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-white overflow-hidden">
      {/* Left Sidebar - Modern Media Library */}
      <div className="w-80 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 border-r border-gray-200/60 dark:border-slate-600/50 flex flex-col shadow-xl">
        {/* Modern Header with Glass Morphism */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/30 dark:border-slate-700/30">
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-purple-50/20 to-emerald-50/20 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-emerald-900/10"></div>

          {/* Header Content */}
          <div className="relative p-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Media Library
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 -mt-0.5">
                    Manage your assets
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Modern Tab System */}
          <div className="relative px-5 pb-3">
            <div className="relative bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-inner flex gap-1">
              <button
                className={`relative flex-1 px-4 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg ${
                  activeMediaTab === "videos"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/20 dark:shadow-blue-400/20"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
                onClick={() => setActiveMediaTab("videos")}
              >
                <span className="flex items-center justify-center gap-2">
                  <Film className="w-4 h-4" />
                  Videos
                </span>
                {activeMediaTab === "videos" && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                )}
              </button>
              <button
                className={`relative flex-1 px-4 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg ${
                  activeMediaTab === "images"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-400/20"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
                onClick={() => setActiveMediaTab("images")}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Images
                </span>
                {activeMediaTab === "images" && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modern Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
          <div className="p-6 space-y-6">
            {activeMediaTab === "videos" && (
              <>
                <SearchBar placeholder="Search videos..." />

                {/* <VaultSection
                  formData={formData}
                  setFormData={setFormData}
                  modelType={modelType}
                  setModelType={setModelType}
                  fieldErrors={fieldErrors}
                  setFieldErrors={setFieldErrors}
                  onOpenVault={handleOpenVault}
                /> */}

                <UploadZone
                  isDragOver={isDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropWrapper}
                  onFileInputChange={handleFileInputChange}
                  accept="video/*"
                  dragText="Drag and drop videos"
                />

                <UploadedVideos
                  uploadedVideos={uploadedVideos}
                  clips={clips}
                  textOverlays={textOverlays}
                  onRemoveVideo={removeUploadedVideo}
                  getNextAvailableRow={getNextAvailableRow}
                  onAddToTimeline={addClip}
                />
              </>
            )}

            {activeMediaTab === "images" && (
              <>
                <UploadZone
                  isDragOver={isDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropWrapper}
                  onFileInputChange={handleFileInputChange}
                  accept="image/*"
                  dragText="Drag and drop images"
                />

                <UploadedImages
                  uploadedImages={uploadedImages}
                  clips={clips}
                  getNextAvailableRow={getNextAvailableRow}
                  onRemoveImage={removeUploadedImage}
                  onAddToTimeline={addClip}
                />

                <TemplateImages
                  clips={clips}
                  getNextAvailableRow={getNextAvailableRow}
                  onAddTemplate={addClip}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Preview Area */}
        <div className="flex-1 bg-gray-200 dark:bg-slate-900 relative overflow-hidden">
          {/* Full-screen player container */}
          <div className="absolute inset-0">
            {/* Optimized Player Component */}
            <div ref={previewContainerRef} className="w-full h-full">
              <PlayerComponent
                playerRef={playerRef}
                compositionInputProps={compositionInputProps}
                contentDuration={contentDuration}
                previewQuality={previewQuality}
                playbackSpeed={playbackSpeed}
                videoLayout={videoLayout}
                layerAssignments={layerAssignments}
                getClipLayer={getClipLayer}
                clips={clips}
                onTransformChange={updateClipTransform}
                getClipTransform={getClipTransform}
                onPlayerClick={(e) => {
                  // Only deselect if clicking on the container itself, not on interactive overlays
                  if (
                    e.target === e.currentTarget ||
                    (e.target as HTMLElement).tagName === "VIDEO"
                  ) {
                    clearAllSelections();
                  }
                }}
              />
            </div>

            {/* Interactive Overlay Layer for drag/resize functionality */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              {/* Show interactive controls for selected text overlay (always editable) */}
              {selectedClipId &&
                textOverlays.find((t) => t.id === selectedClipId) && (
                  <div className="pointer-events-auto">
                    {(() => {
                      const overlay = textOverlays.find(
                        (t) => t.id === selectedClipId
                      )!;
                      return (
                        <TextOverlayComponent
                          text={overlay.text}
                          x={overlay.x}
                          y={overlay.y}
                          width={overlay.width}
                          height={overlay.height}
                          fontSize={overlay.fontSize}
                          rotation={overlay.rotation || 0}
                          isInteractive={true}
                          animate={false}
                          color={overlay.color}
                          fontWeight={overlay.fontWeight as "normal" | "bold"}
                          textAlign={
                            overlay.textAlign as "left" | "center" | "right"
                          }
                          onUpdate={(updates) =>
                            updateTextOverlay(overlay.id, updates)
                          }
                        />
                      );
                    })()}
                  </div>
                )}

              {/* Show interactive controls for selected blur overlay (always editable) */}
              {selectedBlurOverlayId &&
                blurOverlays.find((b) => b.id === selectedBlurOverlayId) && (
                  <div className="pointer-events-auto">
                    {(() => {
                      const overlay = blurOverlays.find(
                        (b) => b.id === selectedBlurOverlayId
                      )!;
                      return (
                        <BlurOverlayComponent
                          x={overlay.x}
                          y={overlay.y}
                          width={overlay.width}
                          height={overlay.height}
                          blurIntensity={overlay.blurIntensity}
                          rotation={overlay.rotation || 0}
                          blurType={overlay.blurType}
                          shape={overlay.shape}
                          isInteractive={true}
                          onUpdate={(updates) =>
                            updateBlurOverlay(overlay.id, updates)
                          }
                        />
                      );
                    })()}
                  </div>
                )}

              {/* Show interactive controls for selected image clips */}
              {selectedClipId &&
                (() => {
                  const selectedClip = clips.find(
                    (c) => c.id === selectedClipId
                  );
                  return selectedClip && selectedClip.type === "image";
                })() && (
                  <div className="pointer-events-auto">
                    {(() => {
                      const clip = clips.find((c) => c.id === selectedClipId)!;
                      // Always show interactive controls for selected image clip, regardless of timeline visibility
                      return (
                        <ImageOverlayComponent
                          src={clip.src}
                          x={clip.x || 50}
                          y={clip.y || 50}
                          width={clip.width || 50}
                          height={clip.height || 50}
                          rotation={clip.rotation || 0}
                          isInteractive={true}
                          showPreview={false}
                          onUpdate={(updates) => updateClip(clip.id, updates)}
                        />
                      );
                    })()}
                  </div>
                )}
            </div>

            {/* Optimized Player Controls */}
            <PlayerControls
              playerRef={playerRef}
              currentFrame={currentFrame}
              contentDuration={contentDuration}
              onFrameChange={setCurrentFrame}
            />

            {/* Empty state */}
            {clips.length === 0 &&
              textOverlays.length === 0 &&
              blurOverlays.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-slate-800/50">
                  <div className="text-center text-gray-600 dark:text-slate-400">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                      <Film className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium mb-2">No content yet</p>
                    <p className="text-sm">
                      Add videos, images, or text to get started
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex flex-col max-h-[45vh] min-h-[20rem]">
          {/* Sticky Timeline Toolbar */}
          <div className="sticky top-0 z-10 bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <TimelineToolbar
            selectedClipId={selectedClipId}
            selectedBlurOverlayId={selectedBlurOverlayId}
            clips={clips}
            textOverlays={textOverlays}
            blurOverlays={blurOverlays}
            currentFrame={currentFrame}
            totalDuration={totalDuration}
            playerRef={playerRef}
            onClipUpdate={updateClip}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={setPlaybackSpeed}
            onDeleteSelectedClip={deleteSelectedClip}
            onCloneClip={handleCloneClip}
            onAddTextOverlay={addTextOverlay}
            onAddBlurOverlay={addBlurOverlay}
            onDeleteBlurOverlay={removeBlurOverlay}
            onCloneBlurOverlay={cloneBlurOverlay}
            onShowShortcuts={handleShowShortcuts}
            onFrameChange={setCurrentFrame}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            timelineZoom={timelineZoom}
            onExportGif={handleExportToGif}
            onBlurOverlayUpdate={updateBlurOverlay}
            onCloneText={handleCloneText}
            onDeleteText={handleDeleteText}
            selectedTextOverlay={selectedTextOverlay}
            onUpdateTextSettings={handleUpdateTextSettings}
            videoLayout={videoLayout}
            onVideoLayoutChange={setVideoLayout}
            layerAssignments={layerAssignments}
            onAssignClipToLayer={assignClipToLayerWithAutoFit}
            getMaxLayers={getMaxLayers}
            getAutoFit={getAutoFit}
            setAutoFit={setAutoFit}
            />
            
            {/* Preview quality toggle */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-slate-700 flex items-center gap-3 text-xs text-gray-600 dark:text-slate-300">
            <span>Preview quality:</span>
            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-md p-1 gap-1">
              <button
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  previewQuality === "LOW"
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300"
                }`}
                onClick={() => setPreviewQuality("LOW")}
              >
                Low
              </button>
              <button
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  previewQuality === "MED"
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300"
                }`}
                onClick={() => setPreviewQuality("MED")}
              >
                Med
              </button>
              <button
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  previewQuality === "HIGH"
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300"
                }`}
                onClick={() => setPreviewQuality("HIGH")}
              >
                High
              </button>
            </div>
            </div>
          </div>

          {/* Scrollable Timeline Container */}
          <div className="flex-1 overflow-y-auto">
            <CanvasTimeline
              clips={clips}
              textOverlays={textOverlays}
              blurOverlays={blurOverlays}
              totalDuration={totalDuration}
              timelineZoom={timelineZoom}
              currentFrame={currentFrame}
              selectedClipId={selectedClipId}
              selectedBlurOverlayId={selectedBlurOverlayId}
              onClipUpdate={updateClip}
              onTextOverlayUpdate={updateTextOverlay}
              onBlurOverlayUpdate={updateBlurOverlay}
              onSelectionChange={handleSelectionChange}
              onTimelineClick={handleCanvasTimelineClick}
              onSplitClip={splitClip}
            />
          </div>
        </div>
      </div>

      <VaultPicker
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onMediaSelected={handleVaultMediaSelected}
        combinedModel={getFinalModelValue()}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <ProgressModal
        open={isExporting}
        text="Rendering GIF… This may take a moment."
      />
    </div>
  );
});

GifVideoEditor.displayName = "GifVideoEditor";

export default GifVideoEditor;
