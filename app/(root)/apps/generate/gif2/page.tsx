"use client";

import dynamic from "next/dynamic";
import { Film } from "lucide-react";
import { useState } from "react";

const VideoEditor = dynamic(
  () => import("@/components/video-editor/VideoEditor").then(mod => ({ default: mod.VideoEditor })),
  { ssr: false }
);

export default function GIFPage() {
  const [startCreating, setStartCreating] = useState(false);

  if (!startCreating) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/10 dark:to-emerald-500/10 backdrop-blur-sm">
            <Film className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            GIF Maker
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Create engaging GIFs from videos or images with custom effects and
            text overlays
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg dark:hover:shadow-green-500/20 transform hover:scale-105 transition-all duration-200"
          >
            Make a GIF
          </button>
        </div>
      </div>
    );
  }

  return <VideoEditor />;
}
