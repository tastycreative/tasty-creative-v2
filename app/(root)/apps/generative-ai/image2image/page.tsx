"use client";

import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const AIImage2ImagePage = dynamic(
  () => import("@/components/AIImage2ImagePage"),
  { ssr: false }
);

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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm">
            <RefreshCw className="w-16 h-16 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-100">
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
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
