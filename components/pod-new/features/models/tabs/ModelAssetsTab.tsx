"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Folder,
  HardDrive,
  Film,
  FileImage,
  Download,
  X,
  ChevronRight,
  Grid3x3,
  List,
  RefreshCw,
  Filter,
  Eye,
} from "lucide-react";

interface GoogleDriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  isFolder: boolean;
  mimeType?: string;
}

interface ModelAssetsTabProps {
  modelName: string;
}

type ViewMode = "grid" | "list";
type FilterType = "all" | "images" | "videos";

export const ModelAssetsTab: React.FC<ModelAssetsTabProps> = ({ modelName }) => {
  // State management
  const [googleFiles, setGoogleFiles] = useState<GoogleDriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<GoogleDriveFile | null>(null);
  const [parentFolder, setParentFolder] = useState<GoogleDriveFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [previewFile, setPreviewFile] = useState<GoogleDriveFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper functions
  const isImageFile = (fileName: string, mimeType?: string): boolean => {
    if (mimeType && mimeType.startsWith("image/")) {
      return true;
    }
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
    return imageExtensions.includes(extension);
  };

  const isVideoFile = (fileName: string, mimeType?: string): boolean => {
    if (mimeType && mimeType.startsWith("video/")) {
      return true;
    }
    const videoExtensions = [
      ".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv",
      ".webm", ".m4v", ".3gp", ".ogv"
    ];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
    return videoExtensions.includes(extension);
  };

  const filterFiles = useCallback((files: GoogleDriveFile[]) => {
    if (filterType === "all") return files;
    return files.filter((file) => {
      if (file.isFolder) return true; // Always show folders
      if (filterType === "images") return isImageFile(file.name, file.mimeType);
      if (filterType === "videos") return isVideoFile(file.name, file.mimeType);
      return false;
    });
  }, [filterType]);

  // Load initial Google Drive folder
  const loadGoogleDrive = useCallback(async (folderId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = "/api/google-drive/list?includeVideos=true";

      if (folderId) {
        url += `&folderId=${folderId}`;
      } else if (modelName) {
        url += `&folderName=${modelName}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch Google Drive files: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.files) {
        setGoogleFiles(data.files);
        setCurrentFolder(data.currentFolder || null);
        setParentFolder(data.parentFolder || null);
      } else {
        setError("No files found in Google Drive");
      }
    } catch (err) {
      console.error("Error fetching drive files:", err);
      setError(err instanceof Error ? err.message : "Failed to load Google Drive files");
    } finally {
      setIsLoading(false);
    }
  }, [modelName]);

  // Initial load
  useEffect(() => {
    loadGoogleDrive();
  }, [loadGoogleDrive]);

  // Handle folder navigation
  const handleOpenFolder = async (folder: GoogleDriveFile) => {
    await loadGoogleDrive(folder.id);
  };

  const handleNavigateUp = async () => {
    if (parentFolder) {
      await loadGoogleDrive(parentFolder.id);
    }
  };

  // Handle file preview
  const handleFileClick = (file: GoogleDriveFile) => {
    if (file.isFolder) {
      handleOpenFolder(file);
    } else if (isImageFile(file.name, file.mimeType) || isVideoFile(file.name, file.mimeType)) {
      setPreviewFile(file);
    }
  };

  // Handle file download
  const handleDownload = async (file: GoogleDriveFile) => {
    try {
      const response = await fetch(`/api/google-drive/download?id=${file.id}`);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download file");
    }
  };

  // Filtered files
  const filteredFiles = filterFiles(googleFiles);

  // Stats
  const stats = {
    total: googleFiles.length,
    images: googleFiles.filter(f => !f.isFolder && isImageFile(f.name, f.mimeType)).length,
    videos: googleFiles.filter(f => !f.isFolder && isVideoFile(f.name, f.mimeType)).length,
    folders: googleFiles.filter(f => f.isFolder).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                    <HardDrive className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                      <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Assets
                      </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                      Google Drive assets for {modelName}
                    </p>
                  </div>
                </div>

                {/* Breadcrumb */}
                {currentFolder && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
                    <HardDrive className="w-4 h-4" />
                    {parentFolder && (
                      <button
                        onClick={handleNavigateUp}
                        className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                      >
                        ...
                      </button>
                    )}
                    {parentFolder && <ChevronRight className="w-4 h-4" />}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {currentFolder.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Filter Buttons */}
                <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50 dark:border-gray-600/50">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      filterType === "all"
                        ? "bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-500 dark:to-purple-500 text-gray-800 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilterType("images")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      filterType === "images"
                        ? "bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-500 dark:to-purple-500 text-gray-800 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <FileImage className="w-4 h-4 inline mr-1" />
                    Images ({stats.images})
                  </button>
                  <button
                    onClick={() => setFilterType("videos")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      filterType === "videos"
                        ? "bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-500 dark:to-purple-500 text-gray-800 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Film className="w-4 h-4 inline mr-1" />
                    Videos ({stats.videos})
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50 dark:border-gray-600/50">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-700 shadow-sm"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title="Grid view"
                  >
                    <Grid3x3 className={`w-4 h-4 ${viewMode === "grid" ? "text-pink-600" : "text-gray-500"}`} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-700 shadow-sm"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title="List view"
                  >
                    <List className={`w-4 h-4 ${viewMode === "list" ? "text-pink-600" : "text-gray-500"}`} />
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => loadGoogleDrive(currentFolder?.id)}
                  disabled={isLoading}
                  className="p-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-600/50 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors backdrop-blur-sm disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Files Grid/List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading assets...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HardDrive className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error Loading Assets</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => loadGoogleDrive()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No {filterType !== "all" ? filterType : "files"} found
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredFiles.map((file) => {
                const isImage = isImageFile(file.name, file.mimeType);
                const isVideo = isVideoFile(file.name, file.mimeType);

                return (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className="group relative rounded-xl p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer hover:scale-105 hover:shadow-lg"
                  >
                    <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {file.isFolder ? (
                        <Folder className="w-10 h-10 text-gray-400" />
                      ) : isImage && file.thumbnailLink ? (
                        <Image
                          src={`/api/image-proxy?url=${encodeURIComponent(file.thumbnailLink)}`}
                          width={200}
                          height={200}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          unoptimized
                        />
                      ) : isVideo ? (
                        <Film className="w-10 h-10 text-gray-400" />
                      ) : isImage ? (
                        <FileImage className="w-10 h-10 text-gray-400" />
                      ) : (
                        <FileImage className="w-10 h-10 text-gray-400" />
                      )}

                      {/* Hover overlay */}
                      {!file.isFolder && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => {
                const isImage = isImageFile(file.name, file.mimeType);
                const isVideo = isVideoFile(file.name, file.mimeType);

                return (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      {file.isFolder ? (
                        <Folder className="w-6 h-6 text-gray-400" />
                      ) : isVideo ? (
                        <Film className="w-6 h-6 text-gray-400" />
                      ) : isImage ? (
                        <FileImage className="w-6 h-6 text-gray-400" />
                      ) : (
                        <FileImage className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.isFolder ? "Folder" : isImage ? "Image" : isVideo ? "Video" : "File"}
                      </p>
                    </div>
                    {!file.isFolder && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-md">
                {previewFile.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
              {isImageFile(previewFile.name, previewFile.mimeType) ? (
                previewFile.thumbnailLink ? (
                  <Image
                    src={`/api/image-proxy?url=${encodeURIComponent(previewFile.thumbnailLink)}`}
                    width={800}
                    height={600}
                    alt={previewFile.name}
                    className="w-full h-auto rounded-lg"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <FileImage className="w-24 h-24 text-gray-400" />
                  </div>
                )
              ) : isVideoFile(previewFile.name, previewFile.mimeType) ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Film className="w-24 h-24 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Video preview not available. Click download to view the video.
                  </p>
                  <button
                    onClick={() => handleDownload(previewFile)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Video
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <FileImage className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
