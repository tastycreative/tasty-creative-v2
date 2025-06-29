"use client";

import React, { useState } from "react";
import { useVideoSequence } from "@/hooks/useVideoSequence";
import { VideoUploader } from "./VideoUploader";
import { Timeline } from "./Timeline";
import { VideoPreview } from "./VideoPreview";
import { EffectsPanel } from "./EffectsPanel";
import { ExportModal } from "./ExportModal";
import { BlurEditorPanel } from "./BlurEditorPanel";
import { Play, Upload, Download, Trash2, RotateCcw } from "lucide-react";

export const VideoEditor: React.FC = () => {
  const {
    videos,
    selectedVideoId,
    currentTime,
    isPlaying,
    addVideos,
    removeVideo,
    reorderVideos,
    updateVideoEffects,
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

  const handleVideosAdded = async (files: File[]) => {
    setIsUploading(true);
    try {
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
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Upload multiple videos to create a custom sequence with effects
                and export as GIF
              </p>
            </div>

            <VideoUploader
              onVideosAdded={handleVideosAdded}
              isUploading={isUploading}
            />

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
    </div>
  );
};
