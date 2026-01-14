"use client";

import React, { useRef } from "react";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string; // e.g., "video/*" or "image/*"
  dragText?: string; // UI text e.g., "Drag and drop a video"
}

const UploadZone: React.FC<UploadZoneProps> = ({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  accept = "video/*",
  dragText = "Drag and drop a video",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-6 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 border border-pink-300/50 dark:border-pink-500/30 flex items-center justify-center">
          <Upload className="w-3 h-3 text-pink-500 dark:text-pink-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Upload Media</h3>
      </div>
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragOver
            ? "border-pink-400 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 scale-105 shadow-xl shadow-pink-500/20"
            : "border-pink-200 dark:border-pink-500/30 bg-gradient-to-br from-white to-pink-50/30 dark:from-[#1a1a1f] dark:to-purple-900/10 hover:border-pink-400 dark:hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/10 hover:scale-[1.02]"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleClick}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>

        <div className="relative z-10">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
            isDragOver
              ? "bg-pink-500/20 dark:bg-pink-500/10 border-pink-400 shadow-xl shadow-pink-500/20"
              : "bg-pink-500/10 dark:bg-pink-500/5 border-pink-300/50 dark:border-pink-500/20 group-hover:shadow-lg group-hover:shadow-pink-500/10 group-hover:scale-110 group-hover:border-pink-400"
          }`}>
            <Upload className={`transition-all duration-300 text-pink-500 dark:text-pink-400 ${
              isDragOver ? "w-7 h-7" : "w-6 h-6"
            }`} />
          </div>

          <p className={`font-medium mb-2 transition-colors ${
            isDragOver
              ? "text-pink-600 dark:text-pink-400 text-base"
              : "text-gray-700 dark:text-gray-300 text-sm"
          }`}>
            {dragText}
          </p>

          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 bg-pink-50 dark:bg-pink-900/20 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-800/30 transition-all duration-200 border border-pink-200 dark:border-pink-500/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Browse files
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={onFileInputChange}
      />
    </div>
  );
};

export default UploadZone;
