"use client";

import VIPFlyer from "@/components/VIPFlyer";
import { Crown } from "lucide-react";
import { useState } from "react";

export default function VIPPage() {
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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 dark:from-yellow-500/10 dark:to-amber-500/10 backdrop-blur-sm">
            <Crown className="w-16 h-16 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            VIP Flyers
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Design premium content for your model&apos;s VIP members and
            exclusive events.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium hover:shadow-lg dark:hover:shadow-yellow-500/20 transform hover:scale-105 transition-all duration-200"
          >
            Create VIP Flyer
          </button>
        </div>
      </div>
    );
  }

  if (startCreating) {
    return (
      <div>
        <VIPFlyer />
      </div>
    );
  }
}
