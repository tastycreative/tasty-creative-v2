"use client";

import AIImagePage from "@/components/AIImagePage";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

export default function ImagePage() {
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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-sm">
            <ImageIcon className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            AI Image Generation
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Create stunning AI-generated images, artwork, and visual content
            using powerful diffusion models and creative prompts.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
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
        <AIImagePage />
      </div>
    );
  }
}
