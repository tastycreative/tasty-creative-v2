// components/models/ModelsHeader.tsx
"use client";

import { motion } from "framer-motion";
import { Search, Users, UserCheck, UserX, Plus } from "lucide-react";

interface ModelsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: ModelStatus | "all";
  setStatusFilter: (status: ModelStatus | "all") => void;
  totalModels: number;
  activeModels: number;
}

export default function ModelsHeader({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalModels,
  activeModels,
}: ModelsHeaderProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            Models Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your OnlyFans models and their content
          </p>
        </div>

        <button
          //whileHover={{ scale: 1.05 }}
          //whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Model
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          //initial={{ opacity: 0, y: 20 }}
          //animate={{ opacity: 1, y: 0 }}
          //transition={{ delay: 0.1 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Models
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {totalModels}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div
          //initial={{ opacity: 0, y: 20 }}
          //animate={{ opacity: 1, y: 0 }}
          //transition={{ delay: 0.2 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Active Models
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {activeModels}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div
          //initial={{ opacity: 0, y: 20 }}
          //animate={{ opacity: 1, y: 0 }}
          //transition={{ delay: 0.3 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-xl border border-white/20 dark:border-gray-700/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Dropped Models
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {totalModels - activeModels}
              </p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <UserX className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search models by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-800 dark:text-gray-200 placeholder-gray-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              statusFilter === "all"
                ? "bg-purple-500 text-white"
                : "bg-white/10 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:bg-white/20"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              statusFilter === "active"
                ? "bg-green-500 text-white"
                : "bg-white/10 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:bg-white/20"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("dropped")}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              statusFilter === "dropped"
                ? "bg-red-500 text-white"
                : "bg-white/10 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:bg-white/20"
            }`}
          >
            Dropped
          </button>
        </div>
      </div>
    </div>
  );
}
