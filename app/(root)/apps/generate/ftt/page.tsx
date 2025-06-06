"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function FTTPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
          <Zap className="w-16 h-16 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          FTT Templates
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Fast-track your content creation with pre-made templates and quick edits
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Browse Templates
        </button>
      </motion.div>
    </div>
  );
}