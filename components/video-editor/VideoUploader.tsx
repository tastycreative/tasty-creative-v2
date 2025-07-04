"use client";

import React, { useCallback, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Film, Folder, HardDrive } from "lucide-react";
import { generateVideoThumbnail } from "@/lib/videoProcessor";
import { VaultPicker } from "./VaultPicker";

interface GoogleDriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  isFolder: boolean;
}

interface VideoUploaderProps {
  onVideosAdded: (files: File[]) => void;
  isUploading: boolean;
  model?: string; // Add model prop for Google Drive filtering
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideosAdded,
  isUploading,
  model,
}) => {
  // Helper function to check if a file is a video
  const isVideoFile = useCallback(
    (fileName: string, mimeType?: string): boolean => {
      // Check by MIME type first
      if (mimeType && mimeType.startsWith("video/")) {
        return true;
      }

      // Check by file extension
      const videoExtensions = [
        ".mp4",
        ".avi",
        ".mov",
        ".mkv",
        ".wmv",
        ".flv",
        ".webm",
        ".m4v",
        ".3gp",
        ".ogv",
        ".m2v",
        ".asf",
        ".vob",
        ".mts",
        ".m2ts",
      ];

      const extension = fileName
        .toLowerCase()
        .substring(fileName.lastIndexOf("."));
      return videoExtensions.includes(extension);
    },
    []
  );

  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [showVaultPicker, setShowVaultPicker] = useState(false);

  // Google Drive states
  const [showGoogleDrivePicker, setShowGoogleDrivePicker] = useState(false);
  const [googleFiles, setGoogleFiles] = useState<GoogleDriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<GoogleDriveFile | null>(
    null
  );
  const [parentFolder, setParentFolder] = useState<GoogleDriveFile | null>(
    null
  );
  const [isGooglePickerLoading, setIsGooglePickerLoading] = useState(false);
  const [isDownloading, startDownloadTransition] = useTransition();
  const [, startListTransition] = useTransition();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Generate thumbnails for preview (currently not used but kept for future enhancement)
      try {
        await Promise.all(
          files.map(async (file) => {
            try {
              await generateVideoThumbnail(file);
            } catch (error) {
              console.warn(
                "Failed to generate thumbnail for",
                file.name,
                error
              );
            }
          })
        );
      } catch (error) {
        console.warn("Error processing thumbnails:", error);
      }

      onVideosAdded(files);
    },
    [onVideosAdded]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type.startsWith("video/") || isVideoFile(file.name, file.type)
      );

      if (files.length > 0) {
        // Additional validation - remove any files that aren't actually videos
        const validVideoFiles = files.filter((file) =>
          isVideoFile(file.name, file.type)
        );

        if (validVideoFiles.length !== files.length) {
          alert(
            `Some files were not valid video files and were skipped. Only ${validVideoFiles.length} out of ${files.length} files will be processed.`
          );
        }

        if (validVideoFiles.length > 0) {
          setUploadingFiles(validVideoFiles);
          await handleFiles(validVideoFiles);
          setUploadingFiles([]);
        }
      } else {
        alert(
          "Please drop video files only. Supported formats: mp4, avi, mov, mkv, wmv, flv, webm, m4v, 3gp, ogv, etc."
        );
      }
    },
    [handleFiles, isVideoFile]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(
        (file) =>
          file.type.startsWith("video/") || isVideoFile(file.name, file.type)
      );

      if (files.length > 0) {
        // Additional validation - remove any files that aren't actually videos
        const validVideoFiles = files.filter((file) =>
          isVideoFile(file.name, file.type)
        );

        if (validVideoFiles.length !== files.length) {
          alert(
            `Some files were not valid video files and were skipped. Only ${validVideoFiles.length} out of ${files.length} files will be processed.`
          );
        }

        if (validVideoFiles.length > 0) {
          setUploadingFiles(validVideoFiles);
          await handleFiles(validVideoFiles);
          setUploadingFiles([]);
        }
      } else if (e.target.files && e.target.files.length > 0) {
        alert(
          "Please select video files only. Supported formats: mp4, avi, mov, mkv, wmv, flv, webm, m4v, 3gp, ogv, etc."
        );
      }

      // Reset input
      e.target.value = "";
    },
    [handleFiles, isVideoFile]
  );

  const removeUploadingFile = (fileToRemove: File) => {
    setUploadingFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const handleVaultMediaSelected = async (mediaUrls: string[]) => {
    const vaultFiles: File[] = [];

    try {
      for (const url of mediaUrls) {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = `vault-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
        const file = new File([blob], filename, { type: "video/mp4" });
        vaultFiles.push(file);
      }

      if (vaultFiles.length > 0) {
        setUploadingFiles(vaultFiles);
        await handleFiles(vaultFiles);
        setUploadingFiles([]);
      }
    } catch (error) {
      console.error("Error downloading vault media:", error);
      alert("Failed to download some videos from vault. Please try again.");
    }
  };

  const handleGoogleDriveSelect = async () => {
    try {
      startListTransition(async () => {
        try {
          // Start from root or model folder
          let url = "/api/google-drive/list?includeVideos=true";
          if (model) {
            url += `&folderName=${model}`;
          }

          const response = await fetch(url);
          const initialData = await response.json();

          if (initialData.files) {
            setGoogleFiles(initialData.files);
            setCurrentFolder(initialData.currentFolder || null);
            setParentFolder(initialData.parentFolder || null);
            setShowGoogleDrivePicker(true);
            // Reset loading state immediately when modal opens
            setIsGooglePickerLoading(false);
          } else {
            alert("No videos found in Google Drive");
          }
        } catch (error) {
          console.error("Error fetching drive files:", error);
          alert("Failed to load Google Drive files");
          setIsGooglePickerLoading(false);
        }
      });
    } catch (error) {
      console.error("Error selecting from Google Drive:", error);
      alert("Failed to connect to Google Drive");
    }
  };

  const handleOpenFolder = async (folder: GoogleDriveFile) => {
    try {
      setIsGooglePickerLoading(true);
      const response = await fetch(
        `/api/google-drive/list?folderId=${folder.id}&includeVideos=true`
      );

      if (!response.ok) {
        throw new Error("Failed to open folder");
      }

      const data = await response.json();
      setGoogleFiles(data.files);
      setCurrentFolder(data.currentFolder || null);
      setParentFolder(data.parentFolder || null);
      // Reset loading state when folder content is loaded
      setIsGooglePickerLoading(false);
    } catch (error) {
      console.error("Error opening folder:", error);
      alert("Failed to open folder");
      setIsGooglePickerLoading(false);
    }
  };

  const handleNavigateUp = async () => {
    if (parentFolder) {
      try {
        setIsGooglePickerLoading(true);
        const response = await fetch(
          `/api/google-drive/list?folderId=${parentFolder.id}&includeVideos=true`
        );

        if (!response.ok) {
          throw new Error("Failed to navigate up");
        }

        const data = await response.json();
        setGoogleFiles(data.files);
        setCurrentFolder(data.currentFolder || null);
        setParentFolder(data.parentFolder || null);
        // Reset loading state when navigation is complete
        setIsGooglePickerLoading(false);
      } catch (error) {
        console.error("Error navigating up:", error);
        alert("Failed to navigate up");
        setIsGooglePickerLoading(false);
      }
    }
  };

  const handleGoogleDriveFileSelected = async (file: GoogleDriveFile) => {
    if (file.isFolder) {
      handleOpenFolder(file);
      return;
    }

    // Check if the file is a video before attempting to download
    if (!isVideoFile(file.name)) {
      alert(
        `"${file.name}" is not a supported video file. Please select a video file (mp4, avi, mov, etc.)`
      );
      return;
    }

    try {
      startDownloadTransition(async () => {
        const response = await fetch(
          `/api/google-drive/download?id=${file.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to download video");
        }

        const blob = await response.blob();

        // Validate the blob type as well
        if (!isVideoFile(file.name, blob.type)) {
          alert(`"${file.name}" does not appear to be a valid video file.`);
          return;
        }

        // Create a File object from the blob with proper type detection
        const videoFile = new File([blob], file.name, {
          type: blob.type.startsWith("video/") ? blob.type : "video/mp4",
        });

        // Add the video to the sequence
        await onVideosAdded([videoFile]);

        // Close the Google Drive picker
        setShowGoogleDrivePicker(false);
      });
    } catch (error) {
      console.error("Error downloading video:", error);
      alert("Failed to download selected video");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
          ${
            dragActive
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-gray-300 hover:border-green-400 dark:border-gray-600 dark:hover:border-green-500"
          }
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="video/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="text-center">
          <div className="mb-4">
            <Film className="w-12 h-12 text-green-500 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upload Video Files
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Drag and drop your videos here, or click to browse
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Upload className="w-4 h-4" />
            <span>Supports MP4, WebM, MOV files</span>
          </div>
        </div>
      </div>

      {/* Alternative Upload Options */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowVaultPicker(true);
            }}
            disabled={isUploading}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Folder className="w-4 h-4" />
            <span>OnlyFans Vault</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Immediately set loading state for instant feedback
              setIsGooglePickerLoading(true);
              handleGoogleDriveSelect();
            }}
            disabled={isUploading || isGooglePickerLoading || !model}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <HardDrive
              className={`w-4 h-4 ${isGooglePickerLoading ? "animate-pulse" : ""}`}
            />
            <span>
              {!model
                ? "Select Model First"
                : isGooglePickerLoading
                  ? "Opening Drive..."
                  : `Google Drive (${model})`}
            </span>
          </button>
        </div>
      </div>

      {/* Vault Picker Modal */}
      <VaultPicker
        isOpen={showVaultPicker}
        onClose={() => setShowVaultPicker(false)}
        onMediaSelected={handleVaultMediaSelected}
      />

      {/* Google Drive Picker Modal */}
      {showGoogleDrivePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden relative ${isDownloading ? "overflow-hidden" : ""}`}
          >
            {isDownloading && (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/90 z-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
                <span className="text-sm text-gray-300">
                  Downloading Video...
                </span>
              </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <HardDrive className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Videos from Google Drive
                </h3>
              </div>
              <button
                onClick={() => setShowGoogleDrivePicker(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            {(currentFolder || parentFolder) && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-sm">
                  {parentFolder && (
                    <button
                      onClick={handleNavigateUp}
                      disabled={isGooglePickerLoading}
                      className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    >
                      ← Back
                    </button>
                  )}
                  <span className="text-gray-500">
                    {currentFolder ? `Folder: ${currentFolder.name}` : "Root"}
                  </span>
                </div>
              </div>
            )}

            {/* Files Grid */}
            <div className="p-4 overflow-y-auto max-h-96">
              {isGooglePickerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    Loading...
                  </span>
                </div>
              ) : googleFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No videos found in this folder
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {googleFiles.map((file) => {
                    const isVideo = file.isFolder || isVideoFile(file.name);
                    return (
                      <button
                        key={file.id}
                        onClick={() => handleGoogleDriveFileSelected(file)}
                        disabled={isDownloading || (!file.isFolder && !isVideo)}
                        className={`group relative rounded-lg p-3 transition-colors text-left ${
                          isVideo || file.isFolder
                            ? "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                            : "bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed"
                        } disabled:opacity-50`}
                      >
                        <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                          {file.isFolder ? (
                            <Folder className="w-8 h-8 text-gray-400" />
                          ) : file.thumbnailLink ? (
                            <Image
                              src={`/api/image-proxy?url=${encodeURIComponent(file.thumbnailLink)}`}
                              width={120}
                              height={68}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              unoptimized
                            />
                          ) : (
                            <Film
                              className={`w-8 h-8 ${isVideo ? "text-gray-400" : "text-red-400"}`}
                            />
                          )}
                          {!file.isFolder && !isVideo && (
                            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">
                              Not Video
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-sm font-medium truncate ${
                            isVideo || file.isFolder
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {file.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select video files to upload to your sequence
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Files Preview */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Processing Files...
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadingFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <Film className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeUploadingFile(file)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Loading Animation */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-green-500 h-1 rounded-full animate-pulse"
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
