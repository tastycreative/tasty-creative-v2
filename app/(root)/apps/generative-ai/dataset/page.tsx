"use client";

import AIDatasetPage from "@/components/AIDatasetPage";
import { motion } from "framer-motion";
import { Database } from "lucide-react";
import { useState, useEffect } from "react";

export default function DatasetPage() {
  const [startCreating, setStartCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem("google_access_token");

    // Check for URL parameters (coming from auth flow)
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has("code") || urlParams.has("error");

    // Check if user has been here before (has dataset items)
    const hasDatasetItems = localStorage.getItem("ai_dataset_items");

    // Auto-proceed if any of these conditions are met:
    // 1. User is authenticated
    // 2. Coming from auth flow
    // 3. User has existing dataset items
    if (token || hasAuthParams || hasDatasetItems) {
      setStartCreating(true);
    }

    setLoading(false);
  }, []);

  // Show loading state briefly to avoid flash
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-pulse">
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm">
            <Database className="w-16 h-16 text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!startCreating) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm">
            <Database className="w-16 h-16 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            AI Dataset
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Manage and organize your AI training datasets, upload files, and
            prepare data for machine learning models.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Start Managing
          </button>
        </motion.div>
      </div>
    );
  }

  if (startCreating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AIDatasetPage />
      </motion.div>
    );
  }
}
