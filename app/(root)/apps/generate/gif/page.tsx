"use client";

import GifMaker from "@/components/GifMaker";
import { motion } from "framer-motion";
import { Film } from "lucide-react";
import { useState } from "react";

export default function GIFPage() {
  const [startCreating, setStartCreating] = useState(false);
  if (!startCreating) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Make a GIF
          </button>
        </motion.div>
      </div>
    );
  }

  if (startCreating) {
    return (
      <div>
        <GifMaker />
      </div>
    );
  }
}
