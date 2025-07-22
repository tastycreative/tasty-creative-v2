"use client";

import React, { useCallback, useState, useTransition, useEffect } from "react";
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
  modelType?: string; // Add modelType prop for display
  folderId?: string; // Add folderId prop for starting in specific folder
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideosAdded,
  isUploading,
  model,
  modelType,
  folderId,
}) => {
  // Get the final formatted model value
  const getFinalModelValue = () => {
    if (!model || model.trim() === "") return "";
    return `${model.toUpperCase()}_${modelType || "FREE"}`;
  };
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
  
  // State for controlling whether to use the folderId parameter
  const [useFolderId, setUseFolderId] = useState(!!folderId);
  const [customFolderId, setCustomFolderId] = useState("");
  const [folderInputValue, setFolderInputValue] = useState("");
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  
  // Download progress state
  const [downloadProgress, setDownloadProgress] = useState<{
    fileName: string;
    progress: number;
    isDownloading: boolean;
  } | null>(null);

  // Update useFolderId when folderId prop changes
  useEffect(() => {
    setUseFolderId(!!folderId);
  }, [folderId]);

  // Auto-open Google Drive picker when folderId is provided and model is selected
  useEffect(() => {
    if (folderId && model && !showGoogleDrivePicker && !hasAutoOpened) {
      console.log('Auto-opening Google Drive picker with folderId:', folderId);
      setHasAutoOpened(true);
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        handleGoogleDriveSelect();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, model, showGoogleDrivePicker, hasAutoOpened]);

  // Function to extract folder ID from Google Drive URL
  const extractFolderIdFromUrl = (url: string): string => {
    const patterns = [
      /\/folders\/([a-zA-Z0-9-_]+)/,  // Standard folder URL
      /[?&]id=([a-zA-Z0-9-_]+)/,      // Alternative format
      /^([a-zA-Z0-9-_]+)$/            // Raw folder ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return "";
  };

  // Handle folder input change
  const handleFolderInputChange = (value: string) => {
    setFolderInputValue(value);
    const extractedId = extractFolderIdFromUrl(value);
    setCustomFolderId(extractedId);
    
    // Auto-enable toggle if valid folder ID is extracted
    if (extractedId) {
      setUseFolderId(true);
    }
  };
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

  const handleVaultMediaSelected = async (files: File[]) => {
    if (files.length > 0) {
      setUploadingFiles(files);
      await handleFiles(files);
      setUploadingFiles([]);
    }
  };

  const handleGoogleDriveSelect = async () => {
    try {
      startListTransition(async () => {
        try {
          // Priority: customFolderId > URL folderId > model folder
          let url = "/api/google-drive/list?includeVideos=true";
          
          if (customFolderId && useFolderId) {
            // If custom folder ID is provided and toggle is enabled, use it
            url += `&folderId=${customFolderId}`;
            console.log(`Starting Google Drive picker in custom folder: ${customFolderId}`);
          } else if (folderId && useFolderId) {
            // If folderId is provided via URL parameter and toggle is enabled, use it directly
            url += `&folderId=${folderId}`;
            console.log(`Starting Google Drive picker in URL folder: ${folderId}`);
          } else if (model) {
            // Otherwise, try to find folder by model name
            url += `&folderName=${model}`;
            console.log(`Looking for Google Drive folder with name: ${model}`);
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
      // Initialize download progress
      setDownloadProgress({
        fileName: file.name,
        progress: 0,
        isDownloading: true
      });

      startDownloadTransition(async () => {
        const response = await fetch(
          `/api/google-drive/download?id=${file.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to download video");
        }

        // Get content length for progress calculation
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) {
          throw new Error("Response body is null");
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
            setDownloadProgress(prev => prev ? { ...prev, progress: Math.min(simulatedProgress, 90) } : null);
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
            setDownloadProgress(prev => prev ? { ...prev, progress } : null);
          }
        }

        // Clear the simulated progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        // Set to 100% when download is complete
        setDownloadProgress(prev => prev ? { ...prev, progress: 100 } : null);
        
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
        
        // Clear download progress
        setDownloadProgress(null);
      });
    } catch (error) {
      console.error("Error downloading video:", error);
      alert("Failed to download selected video");
      setDownloadProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Model Info */}
      {model && (
        <div className="bg-pink-50  border border-pink-200  rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${(modelType || "FREE") === "FREE" ? "bg-pink-500" : "bg-rose-500"}`}
            />
            <span className="text-sm font-medium text-pink-700">
              Selected: {getFinalModelValue()}
            </span>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
          ${
            dragActive
              ? "border-pink-500 bg-pink-50 "
              : "border-gray-300 hover:border-pink-400"
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
            <Film className="w-12 h-12 text-pink-500 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Upload Video Files
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your videos here, or click to browse
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Upload className="w-4 h-4" />
            <span>Supports MP4, WebM, MOV files</span>
          </div>
        </div>
      </div>

      {/* Alternative Upload Options */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">or</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowVaultPicker(true);
            }}
            disabled={isUploading}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
          
          {/* Folder ID Toggle Switch - Show if URL folderId exists OR custom folder is entered */}
          {(folderId || customFolderId) && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">📁</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUseFolderId(!useFolderId);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                  useFolderId ? "bg-pink-600" : "bg-gray-300"
                }`}
                title={useFolderId ? "Disable folder shortcut" : "Enable folder shortcut"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useFolderId ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs text-gray-600">
                {useFolderId ? "ON" : "OFF"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Folder Input */}
      <div className="border-t border-pink-200 pt-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-pink-600" />
            <label className="text-sm font-medium text-gray-700">
              Google Drive Folder (Optional)
            </label>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={folderInputValue}
              onChange={(e) => handleFolderInputChange(e.target.value)}
              placeholder="Paste Google Drive folder link or ID..."
              className="flex-1 px-3 py-2 border border-pink-200 rounded-lg text-sm bg-white text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
            {customFolderId && (
              <button
                onClick={() => {
                  setFolderInputValue("");
                  setCustomFolderId("");
                  setUseFolderId(!!folderId);
                }}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                title="Clear folder"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {customFolderId && (
            <div className="text-xs text-pink-600">
              ✓ Folder ID extracted: {customFolderId}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Paste a Google Drive folder URL like: https://drive.google.com/drive/folders/1GYJ...
          </p>
        </div>
      </div>

      {/* Vault Picker Modal */}
      <VaultPicker
        isOpen={showVaultPicker}
        onClose={() => setShowVaultPicker(false)}
        onMediaSelected={handleVaultMediaSelected}
        combinedModel={getFinalModelValue()}
      />

      {/* Google Drive Picker Modal */}
      {showGoogleDrivePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden relative ${(isDownloading || downloadProgress?.isDownloading) ? "overflow-hidden" : ""}`}
          >
            {(isDownloading || downloadProgress?.isDownloading) && (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/90 z-50 p-8">
                {downloadProgress?.isDownloading ? (
                  <div className="w-full max-w-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-6"></div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-300 mb-1">Downloading:</p>
                        <p className="text-white font-medium text-base break-words px-2">
                          {downloadProgress.fileName}
                        </p>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-pink-400 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${downloadProgress.progress}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                          {downloadProgress.progress < 100 ? 'Downloading...' : 'Processing...'}
                        </span>
                        <span className="text-pink-400 font-medium">
                          {downloadProgress.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-2"></div>
                    <span className="text-sm text-gray-300">
                      Downloading Video...
                    </span>
                  </>
                )}
              </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-pink-200">
              <div className="flex items-center space-x-3">
                <HardDrive className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Select Videos from Google Drive
                </h3>
              </div>
              <button
                onClick={() => setShowGoogleDrivePicker(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            {(currentFolder || parentFolder) && (
              <div className="px-4 py-2 bg-gray-50 border-b border-pink-200">
                <div className="flex items-center space-x-2 text-sm">
                  {parentFolder && (
                    <button
                      onClick={handleNavigateUp}
                      disabled={isGooglePickerLoading || downloadProgress?.isDownloading}
                      className="text-pink-600 hover:text-pink-700 disabled:text-gray-400"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <span className="ml-3 text-gray-600">
                    Loading...
                  </span>
                </div>
              ) : googleFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
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
                        disabled={isDownloading || downloadProgress?.isDownloading || (!file.isFolder && !isVideo)}
                        className={`group relative rounded-lg p-3 transition-colors text-left ${
                          isVideo || file.isFolder
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-gray-100 opacity-50 cursor-not-allowed"
                        } disabled:opacity-50`}
                      >
                        <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
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
                              ? "text-gray-700"
                              : "text-gray-500"
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
            <div className="px-4 py-3 bg-gray-50 border-t border-pink-200">
              <p className="text-xs text-gray-500">
                Select video files to upload to your sequence
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Files Preview */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Processing Files...
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadingFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative bg-white rounded-lg border border-pink-200 p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <Film className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeUploadingFile(file)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Loading Animation */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-pink-500 h-1 rounded-full animate-pulse"
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
