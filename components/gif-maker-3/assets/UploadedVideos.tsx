"use client";

import React from "react";
import { X } from "lucide-react";
import { Clip, TextOverlay } from "@/types/types";

interface UploadedVideo {
  id: string;
  name: string;
  url: string;
  file: File;
}

interface UploadedVideosProps {
  uploadedVideos: UploadedVideo[];
  clips: Clip[];
  textOverlays: TextOverlay[];
  getNextAvailableRow: () => number;
  onRemoveVideo: (id: string) => void;
  onAddToTimeline: (newClip: Clip) => void;
}

const UploadedVideos: React.FC<UploadedVideosProps> = ({
  uploadedVideos,
  clips,
  textOverlays,
  getNextAvailableRow,
  onRemoveVideo,
  onAddToTimeline,
}) => {
  const handleVideoClick = (video: UploadedVideo) => {
    const newClip: Clip = {
      id: `upload-${Date.now()}`,
      start:
        clips.length > 0
          ? Math.max(...clips.map((c) => c.start + c.duration))
          : 0,
      duration: 200,
      src: video.url,
      row: getNextAvailableRow(),
      type: "video",
    };
    onAddToTimeline(newClip);
  };

  if (uploadedVideos.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        Your Videos
      </h3>
      <div className="space-y-3">
        {uploadedVideos.map((video) => (
          <div
            key={video.id}
            className="group relative bg-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-600 transition-colors"
            onClick={() => handleVideoClick(video)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">▶</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate font-medium">
                  {video.name}
                </p>
                <p className="text-xs text-slate-400">Video</p>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-500 rounded transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveVideo(video.id);
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

export default UploadedVideos;