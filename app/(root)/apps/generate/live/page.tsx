"use client";

import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { useState } from "react";

const LiveFlyer = dynamic(
  () => import("@/components/LiveFlyer"),
  { ssr: false }
);

export default function GeneratePage() {
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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 dark:from-pink-500/10 dark:to-rose-500/10 backdrop-blur-sm">
            <Sparkles className="w-16 h-16 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
            Live Flyers
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Create eye-catching graphics for your model&apos;s live streams and
            events.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
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
        <LiveFlyer />
      </div>
    );
  }
}
