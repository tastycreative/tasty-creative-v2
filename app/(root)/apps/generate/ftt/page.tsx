"use client";

import FTTFlyer from "@/components/FTTPage";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useState } from "react";

export default function FTTPage() {
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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
            <Zap className="w-16 h-16 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            FTT Flyers
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            First to Tip flyers are designed to help you promote your
            model&apos;s content and encourage fans to be the first to tip.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Create Flyer
          </button>
        </div>
      </div>
    );
  }

  if (startCreating) {
    return (
      <div>
        <FTTFlyer />
      </div>
    );
  }
}
