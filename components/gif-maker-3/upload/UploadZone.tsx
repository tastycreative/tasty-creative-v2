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
        <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center">
          <Upload className="w-3 h-3 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Upload Media</h3>
      </div>
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragOver
            ? "border-blue-400 bg-gradient-to-br from-blue-50 via-blue-50 to-purple-50 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-purple-900/20 scale-105 shadow-xl shadow-blue-500/20"
            : "border-gray-300 dark:border-slate-600 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02]"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleClick}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="relative z-10">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragOver 
              ? "bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl shadow-blue-500/30" 
              : "bg-gradient-to-br from-emerald-500 to-blue-500 group-hover:shadow-lg group-hover:shadow-emerald-500/30 group-hover:scale-110"
          }`}>
            <Upload className={`transition-all duration-300 text-white ${
              isDragOver ? "w-7 h-7" : "w-6 h-6"
            }`} />
          </div>
          
          <p className={`font-medium mb-2 transition-colors ${
            isDragOver 
              ? "text-blue-600 dark:text-blue-400 text-base" 
              : "text-gray-700 dark:text-slate-300 text-sm"
          }`}>
            {dragText}
          </p>
          
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-all duration-200 border border-emerald-200 dark:border-emerald-800/50">
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