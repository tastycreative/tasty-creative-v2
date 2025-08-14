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
    <div className="mb-4">
      <h3 className="text-sm font-medium text-slate-300 mb-2">Upload</h3>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
          isDragOver
            ? "border-blue-400 bg-blue-400/10"
            : "border-slate-600 hover:border-slate-500"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleClick}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-400 mb-2">{dragText}</p>
        <button className="text-blue-400 hover:text-blue-300 text-sm underline">
          or browse to choose a file
        </button>
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
