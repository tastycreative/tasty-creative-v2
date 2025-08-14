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
import ProgressModal from "./ui/ProgressModal";
import PlayerComponent from "./PlayerComponent";
import PlayerControls from "./PlayerControls";

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
    setSelectedClipId,
    setSelectedBlurOverlayId,
    setTextOverlays,
    getNextAvailableRow,
    addClip,
    updateClip,
    removeClip,
    addTextOverlay,
    updateTextOverlay,
    addBlurOverlay,
    updateBlurOverlay,
    handleSelectionChange,
    handleCanvasTimelineClick,
    handleZoomIn,
    handleZoomOut,
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
      handleSelectionChange(null);
    }
  }, [selectedClipId, removeClip, handleSelectionChange]);

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
      setSelectedClipId(clone.id);
    },
    [textOverlays, setTextOverlays, setSelectedClipId]
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
      if (selectedClipId === id) setSelectedClipId(null);
    },
    [textOverlays, setTextOverlays, selectedClipId, setSelectedClipId]
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
        contentDuration
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
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-4">
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
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Left Sidebar - Asset Library */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header with Tabs */}
        <div className="border-b border-slate-700">
          <div className="p-4 pb-0">
            <h2 className="text-lg font-semibold text-white mb-3">
              Media Library
            </h2>
          </div>
          <div className="flex border-b border-slate-600">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeMediaTab === "videos"
                  ? "bg-slate-700 text-white border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveMediaTab("videos")}
            >
              Videos
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeMediaTab === "images"
                  ? "bg-slate-700 text-white border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveMediaTab("images")}
            >
              Images
            </button>
          </div>
        </div>

        {/* Asset Categories */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
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
        <div className="flex-1 bg-slate-900 relative overflow-hidden">
          {/* Full-screen player container */}
          <div className="absolute inset-0">
            {/* Optimized Player Component */}
            <div ref={previewContainerRef} className="w-full h-full">
              <PlayerComponent
                playerRef={playerRef}
                compositionInputProps={compositionInputProps}
                contentDuration={contentDuration}
                previewQuality={previewQuality}
                onPlayerClick={(e) => {
                  // Only deselect if clicking on the container itself, not on interactive overlays
                  if (
                    e.target === e.currentTarget ||
                    (e.target as HTMLElement).tagName === "VIDEO"
                  ) {
                    setSelectedClipId(null);
                    setSelectedBlurOverlayId(null);
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
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
                  <div className="text-center text-slate-400">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
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
        <div className="bg-slate-900 border-t border-slate-700 flex flex-col max-h-[45vh] min-h-[20rem] overflow-y-auto">
          <TimelineToolbar
            selectedClipId={selectedClipId}
            selectedBlurOverlayId={selectedBlurOverlayId}
            clips={clips}
            textOverlays={textOverlays}
            blurOverlays={blurOverlays}
            currentFrame={currentFrame}
            totalDuration={totalDuration}
            playerRef={playerRef}
            onDeleteSelectedClip={deleteSelectedClip}
            onCloneClip={handleCloneClip}
            onAddTextOverlay={addTextOverlay}
            onAddBlurOverlay={addBlurOverlay}
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
          />
          {/* Preview quality toggle */}
          <div className="px-3 py-2 border-t border-slate-700 flex items-center gap-2 text-xs text-slate-300">
            <span>Preview quality:</span>
            <button
              className={`px-2 py-1 rounded ${
                previewQuality === "LOW"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800"
              }`}
              onClick={() => setPreviewQuality("LOW")}
            >
              Low
            </button>
            <button
              className={`px-2 py-1 rounded ${
                previewQuality === "MED"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800"
              }`}
              onClick={() => setPreviewQuality("MED")}
            >
              Med
            </button>
            <button
              className={`px-2 py-1 rounded ${
                previewQuality === "HIGH"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800"
              }`}
              onClick={() => setPreviewQuality("HIGH")}
            >
              High
            </button>
          </div>

          {/* Timeline */}
          <div className="flex-1">
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
