"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Rocket, Share2, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarStatsProps {
  dbCreator: any;
  isLoading: boolean;
}

const formatDateDistanceSafely = (dateValue?: string | null) => {
  if (!dateValue || dateValue.trim() === "") return "Recently";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "Recently";
  return formatDistanceToNow(date, { addSuffix: true });
};

export function SidebarStats({ dbCreator, isLoading }: SidebarStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-6 mt-10">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm"
          >
            <div className="relative p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-20" />
              <div className="flex items-center gap-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3 sm:space-y-4 mt-6 sm:mt-10"
    >
      {/* Launch Date Card */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.02 }}
        className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
      >
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-0">
          <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full -translate-y-4 translate-x-4"></div>
        </div>
        <div className="relative p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Launched
            </span>
          </div>
          <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white break-words">
            {formatDateDistanceSafely(dbCreator?.launchDate)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium mt-1">
            <Rocket className="w-3 h-3" />
            Launch date
          </p>
        </div>
      </motion.div>

      {/* Social Platforms Card */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.02 }}
        className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
      >
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-0">
          <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full -translate-y-4 translate-x-4"></div>
        </div>
        <div className="relative p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
              <Share2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Platforms
            </span>
          </div>
          <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white break-words">
            {[dbCreator?.instagram, dbCreator?.twitter, dbCreator?.tiktok].filter(
              Boolean
            ).length || 0}{" "}
            Connected
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium mt-1">
            <Globe className="w-3 h-3" />
            Social presence
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
