"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface VideoEditorProps {
  modelName?: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ modelName }) => {
  const searchParams = useSearchParams();
  const folderId = searchParams?.get('folderid') || undefined;
  const fileId = searchParams?.get('fileid') || undefined;

  // Model selection state compatible with ModelsDropdown
  const [formData, setFormData] = useState<{ model?: string }>({
    model: modelName || ""
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
  const [isLoadingDriveFile, setIsLoadingDriveFile] = useState(false);
  const [driveFileError, setDriveFileError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGooglePermissionReady, setIsGooglePermissionReady] = useState(false);

  // Update formData when modelName prop changes
  useEffect(() => {
    if (modelName && modelName !== formData.model) {
      setFormData({ model: modelName });
    }
  }, [modelName, formData.model]);

  // Check if Google permissions are ready by testing the models API
  useEffect(() => {
    const checkGooglePermission = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          setIsGooglePermissionReady(true);
        }
      } catch (error) {
        // Retry after a delay if permission check fails
        setTimeout(checkGooglePermission, 2000);
      }
    };
    
    checkGooglePermission();
  }, []);

  // Auto-download Google Drive file if fileid is provided (using exact VideoUploader pattern)
  useEffect(() => {
    const downloadDriveFile = async () => {
      if (!fileId || !formData.model || formData.model.trim() === "" || !isGooglePermissionReady) return;
      
      setIsLoadingDriveFile(true);
      setDriveFileError(null);
      setDownloadProgress(0);
      
      try {
        const response = await fetch(`/api/google-drive/download?id=${fileId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please sign in to Google Drive.');
          } else if (response.status === 403) {
            throw new Error('Permission denied. Please check your Google Drive access.');
          }
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) {
          throw new Error('Response body is null');
        }
        
        // Create a readable stream to track download progress
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;
        let progressInterval: NodeJS.Timeout | null = null;

        // If we don't have content-length, use a simulated progress
        if (total === 0) {
          let simulatedProgress = 0;
          progressInterval = setInterval(() => {
            simulatedProgress += Math.random() * 15; // Increment by 0-15%
            if (simulatedProgress > 90) simulatedProgress = 90; // Cap at 90% until complete
            setDownloadProgress(Math.min(simulatedProgress, 90));
          }, 500);
        }

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          // Update progress only if we have content-length
          if (total > 0) {
            const progress = Math.round((receivedLength / total) * 100);
            setDownloadProgress(progress);
          }
        }

        // Clear the simulated progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        // Set to 100% when download is complete
        setDownloadProgress(100);
        
        // Brief delay to show 100% completion
        await new Promise(resolve => setTimeout(resolve, 500));

        // Combine all chunks into a single Uint8Array
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }

        // Create blob from combined data
        const blob = new Blob([chunksAll]);
        const fileName = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || `file-${fileId}`;
        const mimeType = response.headers.get('content-type') || blob.type;


        // Helper function to check if a file is a video (same as VideoUploader)
        const isVideoFile = (fileName: string, mimeType?: string): boolean => {
          // Check by MIME type first
          if (mimeType && mimeType.startsWith("video/")) {
            return true;
          }

          // Check by file extension
          const videoExtensions = [
            ".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".m4v",
            ".3gp", ".ogv", ".m2v", ".asf", ".vob", ".mts", ".m2ts",
          ];

          const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
          return videoExtensions.includes(extension);
        };

        // Validate the file is a video
        if (!isVideoFile(fileName, mimeType)) {
          throw new Error(`"${fileName}" does not appear to be a valid video file. MIME type: ${mimeType}`);
        }

        // Determine the correct MIME type for the file
        let finalMimeType = mimeType;
        if (!finalMimeType || finalMimeType === 'application/octet-stream') {
          // Fallback based on file extension for .mov files
          if (fileName.toLowerCase().endsWith('.mov')) {
            finalMimeType = 'video/quicktime';
          } else if (fileName.toLowerCase().endsWith('.mp4')) {
            finalMimeType = 'video/mp4';
          } else {
            finalMimeType = 'video/mp4'; // Default fallback
          }
        }


        // Create a File object from the blob with proper type detection
        const file = new File([blob], fileName, {
          type: finalMimeType,
        });
        
        // Add the file to the video sequence
        await addVideos([file]);
        
      } catch (error) {
        console.error('Error downloading Google Drive file:', error);
        setDriveFileError(error instanceof Error ? error.message : 'Failed to download file');
      } finally {
        setIsLoadingDriveFile(false);
        setDownloadProgress(0);
      }
    };
    
    downloadDriveFile();
  }, [fileId, formData.model, addVideos, isGooglePermissionReady]);

  const handleVideosAdded = async (files: File[]) => {
    setIsUploading(true);
    try {
      console.log("Final model value:", getFinalModelValue());
      await addVideos(files);
    } catch (error) {
      console.error("Error adding videos:", error);
      alert("Failed to add some videos. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = (id: string) => {
    removeVideo(id);
  };

  const handleVideoSelect = (id: string) => {
    setSelectedVideoId(id);
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

  const handleTrimSave = (trimStart: number, trimEnd: number) => {
    if (trimmingVideo) {
      updateVideoTrim(trimmingVideo.videoId, trimStart, trimEnd);
      setTrimmingVideo(null);
    }
  };

  // Get the final formatted model value
  const getFinalModelValue = () => {
    if (!formData.model || formData.model.trim() === "") return "";
    return `${formData.model.toUpperCase()}_${modelType}`;
  };

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || null;
  const totalDuration = getTotalDuration();
  const currentVideo = getCurrentVideo();

  // Get the currently editing blur region
  const editingBlurRegion = editingBlur
    ? videos
        .find((v) => v.id === editingBlur.videoId)
        ?.effects.selectiveBlur?.find((r) => r.id === editingBlur.regionId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Video Editor
                </h1>
              </div>

              {videos.length > 0 && (
                <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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
                      <span className="text-green-600 dark:text-green-400">
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
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Reset to start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={clearAllVideos}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Clear all videos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
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
        {videos.length === 0 ? (
          /* Upload State */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Your Video Sequence
                {modelName && (
                  <span className="block text-lg text-purple-600 dark:text-purple-400 font-normal mt-1">
                    for {modelName}
                  </span>
                )}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {modelName 
                  ? "Upload multiple videos to create a custom sequence with effects and export as GIF"
                  : "Select a model and upload multiple videos to create a custom sequence with effects and export as GIF"
                }
                {folderId && (
                  <span className="block text-sm text-blue-600 dark:text-blue-400 mt-1">
                    📁 Folder shortcut available (ID: {folderId.substring(0, 8)}...) - You can also paste any Google Drive folder link below
                  </span>
                )}
                {fileId && (
                  <span className="block text-sm text-green-600 dark:text-green-400 mt-1">
                    📎 File will be auto-loaded (ID: {fileId.substring(0, 8)}...)
                    {!isGooglePermissionReady && " - Waiting for Google permissions..."}
                  </span>
                )}
              </p>
            </div>

            {/* Model Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select Model
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose a model and type before uploading videos
                  </p>
                </div>

                {/* Model Type Toggle */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Model Type:
                  </span>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setModelType("FREE")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        modelType === "FREE"
                          ? "bg-green-600 text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>FREE</span>
                    </button>
                    <button
                      onClick={() => setModelType("PAID")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        modelType === "PAID"
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                  />
                  
                  {fileId && formData.model && formData.model.trim() !== "" && !isGooglePermissionReady && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-yellow-800 dark:text-yellow-200 text-sm">Waiting for Google Drive permissions to load file...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Loading Google Drive File State */}
            {isLoadingDriveFile && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800 dark:text-blue-200 font-medium">Downloading file from Google Drive...</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Progress</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drive File Error State */}
            {driveFileError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-red-600 dark:text-red-400">⚠️</div>
                  <div>
                    <h4 className="text-red-800 dark:text-red-200 font-medium">Failed to load Google Drive file</h4>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{driveFileError}</p>
                  </div>
                </div>
              </div>
            )}

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
              <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Model First
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please select a model and type before you can upload videos
                </p>
              </div>
            )}

            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Videos</span>
                </div>
                <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Arrange & Edit</span>
                </div>
                <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Editor State */
          <div className="space-y-4">
            {/* Top Row: Preview and Effects/Blur Editor */}
            <div
              className={`grid gap-4 ${
                editingBlur
                  ? "grid-cols-1 xl:grid-cols-2"
                  : "grid-cols-1 lg:grid-cols-3"
              }`}
            >
              <div className={editingBlur ? "" : "lg:col-span-2"}>
                <VideoPreview
                  videos={videos}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                />
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
                <div>
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
              />
            </div>

            {/* Upload More Videos */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    Add More Videos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
    </div>
  );
};
