"use client";

import React from "react";
import { X } from "lucide-react";

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file: File;
}

interface UploadedImagesProps {
  uploadedImages: UploadedImage[];
  clips: Clip[];
  getNextAvailableRow: () => number;
  onRemoveImage: (id: string) => void;
  onAddToTimeline: (newClip: Clip) => void;
}

const UploadedImages: React.FC<UploadedImagesProps> = ({
  uploadedImages,
  clips,
  getNextAvailableRow,
  onRemoveImage,
  onAddToTimeline,
}) => {
  const handleImageClick = (image: UploadedImage) => {
    const newClip: Clip = {
      id: `upload-img-${Date.now()}`,
      start:
        clips.length > 0
          ? Math.max(...clips.map((c) => c.start + c.duration))
          : 0,
      duration: 150, // 5s default for images
      src: image.url,
      row: getNextAvailableRow(),
      type: "image",
      x: 50,
      y: 50,
      width: 50,
      height: 50,
    };
    onAddToTimeline(newClip);
  };

  if (uploadedImages.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Your Images</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {uploadedImages.map((img) => (
          <div
            key={img.id}
            className="group relative bg-white dark:bg-slate-800 rounded-xl p-3 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 transition-all duration-300 border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:scale-105"
            onClick={() => handleImageClick(img)}
          >
            <div className="aspect-video bg-gray-100 dark:bg-slate-700 rounded-lg mb-2 overflow-hidden relative group-hover:shadow-md transition-shadow">
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Modern overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              
              {/* Add to timeline indicator */}
              <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              
              {/* Delete button */}
              <button
                className="absolute top-2 left-2 w-6 h-6 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(img.id);
                }}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate flex-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {img.name}
              </p>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedImages;
