"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useVideoSequence } from "@/hooks/useVideoSequence";
import { VideoUploader } from "./VideoUploader";
import { Timeline } from "./Timeline";
import { VideoPreview } from "./VideoPreview";
import { EffectsPanel } from "./EffectsPanel";
import { ExportModal } from "./ExportModal";
import { BlurEditorPanel } from "./BlurEditorPanel";
import { TrimmerPanel } from "./TrimmerPanel";
import ModelsDropdown from "../ModelsDropdown";
import {
  Play,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  User,
  DollarSign,
  Grid3x3,
  Square,
} from "lucide-react";

export type VideoLayout = "single" | "side-by-side" | "vertical-triptych" | "horizontal-triptych" | "grid-2x2";


interface VideoEditorProps {
  modelName?: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ modelName }) => {
  const searchParams = useSearchParams();
  const folderId = searchParams?.get("folderid") || undefined;
  const fileId = searchParams?.get("fileid") || undefined;

  // Model selection state compatible with ModelsDropdown
  const [formData, setFormData] = useState<{ model?: string }>({
    model: modelName || "",
  });
  const [modelType, setModelType] = useState<"FREE" | "PAID">("FREE");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    videos,
    selectedVideoId,
    currentTime,
    isPlaying,
    addVideos,
    removeVideo,
    reorderVideos,
    updateVideoEffects,
    updateVideoTrim,
    addSelectiveBlurRegion,
    updateSelectiveBlurRegion,
    removeSelectiveBlurRegion,
    setSelectedVideoId,
    getTotalDuration,
    getCurrentVideo,
    play,
    pause,
    seek,
    setVideos, // <-- add this from useVideoSequence
  } = useVideoSequence();

  const [isUploading, setIsUploading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingBlur, setEditingBlur] = useState<{
    videoId: string;
    regionId: string;
  } | null>(null);
  const [trimmingVideo, setTrimmingVideo] = useState<{
    videoId: string;
  } | null>(null);
  const [googlePermissionsLoaded, setGooglePermissionsLoaded] = useState(false);
  const [hasAttemptedAutoDownload, setHasAttemptedAutoDownload] =
    useState(false);
  const [isAutoDownloading, setIsAutoDownloading] = useState(false);
  const [autoDownloadProgress, setAutoDownloadProgress] = useState<{
    fileName: string;
    progress: number;
    isDownloading: boolean;
    bytesDownloaded?: string;
    totalBytes?: number;
    downloadedBytes?: number;
  } | null>(null);

  // Layout state
  const [currentLayout, setCurrentLayout] = useState<VideoLayout>("single");
  const [activeGridId, setActiveGridId] = useState<string>("grid-1");

  // When switching to multi-grid layouts, assign gridId: 'grid-1' to videos without gridId
  useEffect(() => {
    if (currentLayout === "side-by-side" || currentLayout === "vertical-triptych" || currentLayout === "horizontal-triptych" || currentLayout === "grid-2x2") {
      // Only update if there are videos without gridId
      const needsUpdate = videos.some((v) => !v.gridId);
      if (needsUpdate) {
        setVideos((prev) =>
          prev.map((v) =>
            !v.gridId ? { ...v, gridId: "grid-1" } : v
          )
        );
      }
    }
  }, [currentLayout, videos, setVideos]);
  const gridFileInputRef = useRef<HTMLInputElement>(null);

  // Update formData when modelName prop changes
  useEffect(() => {
    if (modelName && modelName !== formData.model) {
      setFormData({ model: modelName });
    }
  }, [modelName, formData.model]);

  // Helper function to format bytes into human-readable sizes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Get the final formatted model value
  const getFinalModelValue = React.useCallback(() => {
    if (!formData.model || formData.model.trim() === "") return "";
    return `${formData.model.toUpperCase()}_${modelType}`;
  }, [formData.model, modelType]);

  const handleVideosAdded = React.useCallback(async (files: File[]) => {
    setIsUploading(true);
    try {
      console.log("Final model value:", getFinalModelValue());
      const gridId =
        currentLayout === "side-by-side" || currentLayout === "vertical-triptych" || currentLayout === "horizontal-triptych" || currentLayout === "grid-2x2" ? activeGridId : undefined;
      await addVideos(files, gridId);
    } catch (error) {
      console.error("Error adding videos:", error);
      alert("Failed to add some videos. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [addVideos, currentLayout, activeGridId, getFinalModelValue]);

  // Auto-download Google Drive file when fileId param exists and permissions are loaded
  useEffect(() => {
    const attemptAutoDownload = async () => {
      console.log("Auto-download check:", {
        fileId,
        googlePermissionsLoaded,
        hasAttemptedAutoDownload,
      });
      if (!fileId || !googlePermissionsLoaded || hasAttemptedAutoDownload) {
        return;
      }

      setHasAttemptedAutoDownload(true);
      setIsAutoDownloading(true);

      try {
        // First, get file metadata to know the total size and filename
        const metadataResponse = await fetch(
          `/api/google-drive/metadata?id=${fileId}`
        );
        if (!metadataResponse.ok) {
          throw new Error(
            `Failed to fetch file metadata: ${metadataResponse.statusText}`
          );
        }

        const metadata = await metadataResponse.json();
        const filename = metadata.name || "auto-download.mp4";
        const total = metadata.size || 0;

        console.log(`Auto-downloading file: ${filename}, Size: ${total} bytes`);

        // Now download the file
        const response = await fetch(`/api/google-drive/download?id=${fileId}`);

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        // Initialize progress tracking with known total size
        setAutoDownloadProgress({
          fileName: filename,
          progress: 0,
          isDownloading: true,
          totalBytes: total,
          downloadedBytes: 0,
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          // Update progress with real percentage based on known total size
          if (total > 0) {
            const progress = Math.round((receivedLength / total) * 100);
            setAutoDownloadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    progress,
                    downloadedBytes: receivedLength,
                  }
                : null
            );
          } else {
            // Fallback to bytes downloaded if metadata didn't provide size
            const mbDownloaded = (receivedLength / (1024 * 1024)).toFixed(1);
            setAutoDownloadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    progress: -1,
                    bytesDownloaded: mbDownloaded,
                    downloadedBytes: receivedLength,
                  }
                : null
            );
          }
        }

        // Combine all chunks into a single Uint8Array
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }

        // Create a blob and file
        const blob = new Blob([chunksAll]);

        const videoFile = new File([blob], filename, {
          type: blob.type.startsWith("video/") ? blob.type : "video/mp4",
        });

        // Add the video to the sequence
        await handleVideosAdded([videoFile]);

        console.log(`Auto-downloaded Google Drive file: ${filename}`);
      } catch (error) {
        console.error("Error auto-downloading Google Drive file:", error);
        // Don't show an alert for auto-download failures, just log it
      } finally {
        setIsAutoDownloading(false);
        setAutoDownloadProgress(null);
      }
    };

    attemptAutoDownload();
  }, [
    fileId,
    googlePermissionsLoaded,
    hasAttemptedAutoDownload,
    handleVideosAdded,
  ]);

  const handleRemoveVideo = (id: string) => {
    removeVideo(id);
  };

  const handleVideoSelect = (id: string) => {
    console.log("handleVideoSelect called with id:", id);
    console.log("Current selectedVideoId:", selectedVideoId);
    setSelectedVideoId(id);
    console.log("Set selectedVideoId to:", id);
  };

  const clearAllVideos = () => {
    if (
      videos.length > 0 &&
      confirm("Are you sure you want to remove all videos?")
    ) {
      videos.forEach((video) => removeVideo(video.id));
    }
  };

  const resetToStart = () => {
    seek(0);
    pause();
  };

  const handleBlurRegionClick = (videoId: string, regionId: string) => {
    setEditingBlur({ videoId, regionId });
  };

  const handleCloseBlurEditor = () => {
    setEditingBlur(null);
  };

  const handleTrimVideo = (videoId: string) => {
    setTrimmingVideo({ videoId });
  };

  const handleCloseTrimmer = () => {
    setTrimmingVideo(null);
  };

  const handleGridClick = (gridId: string) => {
    setActiveGridId(gridId);
    // Trigger file input for the selected grid
    if (gridFileInputRef.current) {
      gridFileInputRef.current.dataset.gridId = gridId;
      gridFileInputRef.current.click();
    }
  };

  const handleAddSequence = (gridId?: string) => {
    const targetGridId =
      gridId || (currentLayout === "side-by-side" || currentLayout === "vertical-triptych" || currentLayout === "horizontal-triptych" || currentLayout === "grid-2x2" ? activeGridId : undefined);
    setActiveGridId(targetGridId || "grid-1");
    // Trigger file input for the selected grid
    if (gridFileInputRef.current) {
      gridFileInputRef.current.dataset.gridId = targetGridId;
      gridFileInputRef.current.click();
    }
  };

  const handleGridFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    const gridId = event.target.dataset.gridId;

    if (files && files.length > 0 && gridId) {
      const fileArray = Array.from(files);
      setIsUploading(true);
      try {
        await addVideos(fileArray, gridId);
      } catch (error) {
        console.error("Error adding videos to grid:", error);
        alert("Failed to add some videos. Please try again.");
      } finally {
        setIsUploading(false);
        // Clear the input so the same file can be selected again
        event.target.value = "";
      }
    }
  };

  const handleTrimSave = (trimStart: number, trimEnd: number) => {
    if (trimmingVideo) {
      updateVideoTrim(trimmingVideo.videoId, trimStart, trimEnd);
      setTrimmingVideo(null);
    }
  };


  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || null;
  console.log(
    "selectedVideoId:",
    selectedVideoId,
    "selectedVideo:",
    selectedVideo?.file?.name || "null"
  );
  const totalDuration = getTotalDuration();
  const currentVideo = getCurrentVideo();

  // Get the currently editing blur region
  const editingBlurRegion = editingBlur
    ? videos
        .find((v) => v.id === editingBlur.videoId)
        ?.effects.selectiveBlur?.find((r) => r.id === editingBlur.regionId)
    : null;

  return (
    <div className="min-h-screen bg-white/60 backdrop-blur-sm">
      {/* Header */}
      <div className="bg-white/80 border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-700">
                  Video Editor
                </h1>
              </div>

              {videos.length > 0 && (
                <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    {videos.length} video{videos.length !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span>
                    {Math.floor(totalDuration / 60)}:
                    {Math.floor(totalDuration % 60)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                  {currentVideo && (
                    <>
                      <span>•</span>
                      <span className="text-pink-600">
                        Playing: {currentVideo.file.name}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {videos.length > 0 && (
                <>
                  <button
                    onClick={resetToStart}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-pink-50 rounded-lg transition-colors"
                    title="Reset to start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={clearAllVideos}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear all videos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-px h-6 bg-pink-200" />

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-md hover:shadow-pink-500/20 transform hover:-translate-y-0.5"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Layout Selector - Only show when videos are loaded */}
        {videos.length > 0 && (
          <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Video Layout
                </h3>
                <p className="text-sm text-gray-600">
                  Choose how videos are arranged in the preview
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* Layout Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentLayout("single")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      currentLayout === "single"
                        ? "bg-pink-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span>Single</span>
                  </button>
                  <button
                    onClick={() => setCurrentLayout("side-by-side")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      currentLayout === "side-by-side"
                        ? "bg-pink-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="12" height="12" rx="1"/>
                      <line x1="8" y1="2" x2="8" y2="14"/>
                    </svg>
                    <span>Side-by-Side</span>
                  </button>
                  <button
                    onClick={() => setCurrentLayout("vertical-triptych")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      currentLayout === "vertical-triptych"
                        ? "bg-pink-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="1" width="12" height="4" rx="0.5"/>
                      <rect x="2" y="6" width="12" height="4" rx="0.5"/>
                      <rect x="2" y="11" width="12" height="4" rx="0.5"/>
                    </svg>
                    <span>V-Triptych</span>
                  </button>
                  <button
                    onClick={() => setCurrentLayout("horizontal-triptych")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      currentLayout === "horizontal-triptych"
                        ? "bg-pink-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="2" width="4" height="12" rx="0.5"/>
                      <rect x="6" y="2" width="4" height="12" rx="0.5"/>
                      <rect x="11" y="2" width="4" height="12" rx="0.5"/>
                    </svg>
                    <span>H-Triptych</span>
                  </button>
                  <button
                    onClick={() => setCurrentLayout("grid-2x2")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      currentLayout === "grid-2x2"
                        ? "bg-pink-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span>2×2 Grid</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {videos.length === 0 ? (
          /* Upload State */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Create Your Video Sequence
                {modelName && (
                  <span className="block text-lg text-pink-600 font-normal mt-1">
                    for {modelName}
                  </span>
                )}
              </h2>
              <p className="text-gray-600">
                {modelName
                  ? "Upload multiple videos to create a custom sequence with effects and export as GIF"
                  : "Select a model and upload multiple videos to create a custom sequence with effects and export as GIF"}
                {folderId && (
                  <span className="block text-sm text-pink-600 mt-1">
                    📁 Auto-opening Google Drive folder (ID:{" "}
                    {folderId.substring(0, 8)}...) when model is selected
                  </span>
                )}
                {fileId && (
                  <div className="block mt-1">
                    {autoDownloadProgress ? (
                      <div className="space-y-2">
                        <span className="text-sm text-pink-600">
                          🔄 Auto-downloading: {autoDownloadProgress.fileName}
                        </span>
                        {autoDownloadProgress.progress >= 0 ? (
                          // Show percentage progress bar when total size is known
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-pink-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{
                                  width: `${autoDownloadProgress.progress}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">
                                {autoDownloadProgress.progress}% completed
                              </span>
                              {autoDownloadProgress.downloadedBytes !==
                                undefined &&
                                autoDownloadProgress.totalBytes && (
                                  <span className="text-xs text-gray-600">
                                    {formatBytes(
                                      autoDownloadProgress.downloadedBytes
                                    )}{" "}
                                    /{" "}
                                    {formatBytes(
                                      autoDownloadProgress.totalBytes
                                    )}
                                  </span>
                                )}
                            </div>
                          </>
                        ) : (
                          // Show bytes downloaded when total size is unknown
                          <div className="flex items-center space-x-2">
                            <div className="animate-pulse w-3 h-3 bg-pink-600 rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              Downloaded:{" "}
                              {autoDownloadProgress.downloadedBytes !==
                              undefined
                                ? formatBytes(
                                    autoDownloadProgress.downloadedBytes
                                  )
                                : autoDownloadProgress.bytesDownloaded + " MB"}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-pink-600">
                        {isAutoDownloading ? (
                          <>
                            🔄 Preparing auto-download for Google Drive file
                            (ID: {fileId.substring(0, 8)}...)...
                          </>
                        ) : hasAttemptedAutoDownload ? (
                          <>✅ Google Drive file auto-download completed</>
                        ) : (
                          <>
                            🎬 Auto-download: Google Drive file (ID:{" "}
                            {fileId.substring(0, 8)}...) will download
                            automatically when permissions are ready
                          </>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </p>
            </div>

            {/* Model Selection */}
            <div className="bg-white/80 rounded-xl border border-pink-200 p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-pink-600 mb-2">
                    Select Model
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose a model and type before uploading videos
                  </p>
                </div>

                {/* Model Type Toggle */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Model Type:
                  </span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setModelType("FREE")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        modelType === "FREE"
                          ? "bg-pink-600 text-white"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>FREE</span>
                    </button>
                    <button
                      onClick={() => setModelType("PAID")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        modelType === "PAID"
                          ? "bg-rose-600 text-white"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>PAID</span>
                    </button>
                  </div>
                </div>

                {/* Model Dropdown */}
                <div className="space-y-4">
                  <ModelsDropdown
                    formData={formData}
                    setFormData={setFormData}
                    error={fieldErrors.model}
                    setFieldErrors={setFieldErrors}
                    onPermissionsLoaded={() => setGooglePermissionsLoaded(true)}
                  />
                </div>
              </div>
            </div>

            {/* Video Upload - Only show if model is selected */}
            {formData.model && formData.model.trim() !== "" ? (
              <VideoUploader
                onVideosAdded={handleVideosAdded}
                isUploading={isUploading}
                model={formData.model}
                modelType={modelType}
                folderId={folderId}
              />
            ) : (
              <div className="bg-pink-50 border-2 border-dashed border-pink-200 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Select a Model First
                </h3>
                <p className="text-gray-600">
                  Please select a model and type before you can upload videos
                </p>
              </div>
            )}

            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Videos</span>
                </div>
                <div className="w-8 h-px bg-pink-200" />
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Arrange & Edit</span>
                </div>
                <div className="w-8 h-px bg-pink-200" />
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Editor State */
          <div className="space-y-3">
            {/* Top Row: Preview and Effects/Blur Editor */}
            <div
              className={`grid gap-3 ${
                editingBlur
                  ? "grid-cols-1 xl:grid-cols-2"
                  : "grid-cols-1 lg:grid-cols-5"
              }`}
            >
              <div className={editingBlur ? "" : "lg:col-span-3"}>
                <div className="w-full h-full bg-gradient-to-br from-gray-50 via-white to-pink-50 backdrop-blur-sm rounded-xl border border-pink-300 shadow-lg ">
                  <VideoPreview
                    videos={videos}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTimeUpdate={seek}
                    layout={currentLayout}
                    activeGridId={activeGridId}
                    onGridClick={handleGridClick}
                  />
                </div>
              </div>

              {/* Blur Editor Panel - appears beside video preview */}
              {editingBlur && editingBlurRegion && (
                <div className="transition-all duration-300 ease-in-out">
                  <BlurEditorPanel
                    region={editingBlurRegion}
                    onUpdate={(updates) =>
                      updateSelectiveBlurRegion(
                        editingBlur.videoId,
                        editingBlur.regionId,
                        updates
                      )
                    }
                    onDelete={() => {
                      removeSelectiveBlurRegion(
                        editingBlur.videoId,
                        editingBlur.regionId
                      );
                      handleCloseBlurEditor();
                    }}
                    onClose={handleCloseBlurEditor}
                    videoElement={null}
                  />
                </div>
              )}

              {!editingBlur && (
                <div className="lg:col-span-2">
                  <EffectsPanel
                    selectedVideo={selectedVideo}
                    onEffectsChange={updateVideoEffects}
                    onRemoveVideo={handleRemoveVideo}
                    onTrimVideo={handleTrimVideo}
                    onAddSelectiveBlurRegion={addSelectiveBlurRegion}
                    onUpdateSelectiveBlurRegion={updateSelectiveBlurRegion}
                    onRemoveSelectiveBlurRegion={removeSelectiveBlurRegion}
                    videoElement={null}
                    currentTime={currentTime}
                  />
                </div>
              )}
            </div>

            {/* Bottom Row: Timeline */}
            <div>
              <Timeline
                videos={videos}
                currentTime={currentTime}
                totalDuration={totalDuration}
                selectedVideoId={selectedVideoId}
                isPlaying={isPlaying}
                onSeek={seek}
                onVideoSelect={handleVideoSelect}
                onVideoReorder={reorderVideos}
                onPlay={play}
                onPause={pause}
                onBlurRegionClick={handleBlurRegionClick}
                editingBlur={editingBlur}
                layout={currentLayout}
                onAddSequence={handleAddSequence}
              />
            </div>

            {/* Upload More Videos */}
            <div className="border-2 border-dashed border-pink-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-700 mb-1">
                    Add More Videos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload additional videos to extend your sequence
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <VideoUploader
                    onVideosAdded={handleVideosAdded}
                    isUploading={isUploading}
                    model={formData.model}
                    folderId={folderId}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        videos={videos}
        onClose={() => setShowExportModal(false)}
        totalDuration={totalDuration}
      />

      {/* Trimmer Panel */}
      {trimmingVideo && (
        <TrimmerPanel
          video={videos.find((v) => v.id === trimmingVideo.videoId)!}
          onSave={handleTrimSave}
          onClose={handleCloseTrimmer}
        />
      )}

      {/* Hidden file input for grid uploads */}
      <input
        ref={gridFileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleGridFileSelect}
        className="hidden"
      />
    </div>
  );
};
