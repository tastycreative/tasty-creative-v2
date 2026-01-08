"use client";

import dynamic from "next/dynamic";
import { Database } from "lucide-react";
import { useState, useEffect } from "react";

const AIDatasetPage = dynamic(
  () => import("@/components/AIDatasetPage"),
  { ssr: false }
);

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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm">
            <Database className="w-16 h-16 text-pink-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!startCreating) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm">
            <Database className="w-16 h-16 text-pink-500" />
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Start Managing
          </button>
        </div>
      </div>
    );
  }

  return <AIDatasetPage />;
}
