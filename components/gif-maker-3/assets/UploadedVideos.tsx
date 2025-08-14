"use client";

import React from "react";
import { X } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
          Your Videos
        </h3>
      </div>

      <div className="space-y-3">
        {uploadedVideos.map((video) => (
          <div
            key={video.id}
            className="group relative bg-white dark:bg-slate-800 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:scale-[1.02]"
            onClick={() => handleVideoClick(video)}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                <svg
                  className="w-5 h-5 text-white ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>

                {/* Play indicator on hover */}
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white/50 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {video.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                      Video File
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="w-8 h-8 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveVideo(video.id);
                }}
                title="Remove video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modern progress bar effect */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedVideos;
