"use client";

import AIVaultPage from "@/components/AIVaultPage";
import { motion } from "framer-motion";
import { Archive } from "lucide-react";
import { useState } from "react";

export default function VaultPage() {
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
          <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-emerald-500/20 to-lime-500/20 backdrop-blur-sm">
            <Archive className="w-16 h-16 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            AI Vault
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Securely store, organize, and manage your AI-generated content,
            files, and creative assets in one centralized vault.
          </p>
          <button
            onClick={() => {
              setStartCreating(true);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Access Vault
          </button>
        </div>
      </div>
    );
  }

  if (startCreating) {
    return (
      <div>
        <AIVaultPage />
      </div>
    );
  }
}
