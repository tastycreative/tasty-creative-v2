"use client";

import AIVideoPage from "@/components/AIVideoPage";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { useState } from "react";

export default function VideoPage() {
  const [startCreating, setStartCreating] = useState(false);

  if (!startCreating) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div
          //initial={{ scale: 0.9, opacity: 0 }}
          //animate={{ scale: 1, opacity: 1 }}
          //transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-rose-600/20 to-pink-600/20 backdrop-blur-sm">
            <Video className="w-16 h-16 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-700">
            AI Video
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Create stunning AI-generated videos for your projects, marketing
            campaigns, and creative content.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Start Creating
          </button>
        </div>
      </div>
    );
  }

  if (startCreating) {
    return (
      <div>
        <AIVideoPage />
      </div>
    );
  }
}
