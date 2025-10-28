"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload as UploadIcon, Folder, FolderPlus, Image as ImageIcon, Video } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/instagram-staging/files");
      const data = await response.json();
      
      if (data.success) {
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/instagram-staging/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderName: newFolderName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setFolders((prev) => [...prev, data.folderName]);
        setSelectedFolder(data.folderName);
        setNewFolderName("");
        setIsCreatingFolder(false);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder");
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      
      if (selectedFolder) {
        formData.append("folder", selectedFolder);
      }

      const response = await fetch("/api/instagram-staging/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          onUploadComplete();
          handleClose();
        }, 500);
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setSelectedFolder("");
    setNewFolderName("");
    setIsCreatingFolder(false);
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-pink-100/30 via-purple-100/30 to-blue-100/30 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <UploadIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Content</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload images or videos for Instagram staging</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Folder Selection */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Select Folder (Optional)</p>
            
            {isCreatingFolder ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">No Folder (Root)</option>
                  {folders.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="px-5 py-2.5 flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
                >
                  <FolderPlus className="w-4 h-4" />
                  New
                </button>
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Select Files</p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 text-center hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-900/10 transition-all cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                  <UploadIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-gray-900 dark:text-gray-100 font-semibold mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Images and videos supported
                </p>
              </label>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                Selected Files ({files.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      file.type.startsWith("image/")
                        ? "bg-pink-100 dark:bg-pink-900/30"
                        : "bg-purple-100 dark:bg-purple-900/30"
                    }`}>
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      ) : (
                        <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="w-8 h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Uploading files...</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-300 shadow-lg"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? "Uploading..." : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
