"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, Film } from "lucide-react";
import { generateVideoThumbnail } from "@/lib/videoProcessor";

interface VideoUploaderProps {
  onVideosAdded: (files: File[]) => void;
  isUploading: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideosAdded,
  isUploading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

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

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("video/")
      );

      if (files.length > 0) {
        setUploadingFiles(files);
        await handleFiles(files);
        setUploadingFiles([]);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith("video/")
      );

      if (files.length > 0) {
        setUploadingFiles(files);
        await handleFiles(files);
        setUploadingFiles([]);
      }

      // Reset input
      e.target.value = "";
    },
    [handleFiles]
  );

  const removeUploadingFile = (fileToRemove: File) => {
    setUploadingFiles((prev) => prev.filter((file) => file !== fileToRemove));
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
