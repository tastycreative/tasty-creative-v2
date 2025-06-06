"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export default function VIPPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm">
          <Crown className="w-16 h-16 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          VIP Exclusive Content
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Design premium content for your VIP members with exclusive templates and effects
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Create VIP Content
        </button>
      </motion.div>
    </div>
  );
}