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
    <div className="mb-4">
      <h3 className="text-sm font-medium text-slate-300 mb-2">Your Images</h3>
      <div className="grid grid-cols-2 gap-2">
        {uploadedImages.map((img) => (
          <div
            key={img.id}
            className="group relative bg-slate-700 rounded-lg p-2 cursor-pointer hover:bg-slate-600 transition-colors"
            onClick={() => handleImageClick(img)}
          >
            <div className="aspect-video bg-slate-600 rounded mb-1 overflow-hidden">
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-300 truncate flex-1 pr-2">
                {img.name}
              </p>
              <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-500 rounded transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(img.id);
                }}
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedImages;
