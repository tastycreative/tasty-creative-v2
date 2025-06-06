"use client";

import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";

export default function GamePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-sm">
          <Gamepad2 className="w-16 h-16 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Gaming Graphics
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Create gaming-themed graphics and overlays for your streams and videos
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Design Game Graphics
        </button>
      </motion.div>
    </div>
  );
}