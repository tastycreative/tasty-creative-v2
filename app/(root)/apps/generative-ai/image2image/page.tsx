"use client";

import AIImage2ImagePage from "@/components/AIImage2ImagePage";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function Image2ImagePage() {
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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm">
            <RefreshCw className="w-16 h-16 text-cyan-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            AI Image-2-Image
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Transform and enhance your images using AI. Upload an image and use
            prompts to modify, style-transfer, or completely reimagine your
            content.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Start Transforming
          </button>
        </div>
      </div>
    );
  }

  if (startCreating) {
    return (
      <div>
        <AIImage2ImagePage />
      </div>
    );
  }
}
