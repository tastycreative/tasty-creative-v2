"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, ChevronDown, ChevronUp, User, Folder, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll } from "framer-motion";

interface CaptionCardProps {
  caption: string;
  creatorName?: string;
  category?: string;
  revenue?: number;
  outcome?: string;
  index?: number;
}

export function CaptionCard({
  caption,
  creatorName,
  category,
  revenue,
  outcome,
  index = 0,
}: CaptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);

  // Check if content exceeds collapsed height threshold (approx 4 lines ~ 112px with relaxed leading)
  useEffect(() => {
    if (contentRef.current) {
      setShouldShowReadMore(contentRef.current.scrollHeight > 112);
    }
  }, [caption]);

  // Format revenue
  const formatRevenue = (value?: number) => {
    if (!value) return null;
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Copy caption to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(caption);
      setIsCopied(true);
      toast.success("Caption copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy caption");
    }
  };

  const formattedRevenue = formatRevenue(revenue);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 }
      }}
      className={cn(
        "group relative mb-6 break-inside-avoid rounded-3xl bg-white/70 dark:bg-gray-800/40 backdrop-blur-md",
        "border border-white/40 dark:border-white/5 shadow-sm hover:shadow-xl dark:shadow-black/20",
        "transition-shadow duration-300 overflow-hidden cursor-pointer w-full"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5 md:p-6">
        {/* Header with Copy Button */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {/* Smooth Height Animation Container */}
            <motion.div 
              className="relative overflow-hidden"
              animate={{ height: isExpanded ? "auto" : "112px" }}
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div ref={contentRef}>
                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words font-medium leading-relaxed font-sans">
                  {caption}
                </p>
              </div>

              {/* Gradient Fade Overlay - Only show when collapsed and content is long enough */}
              <AnimatePresence>
                {!isExpanded && shouldShowReadMore && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-gray-900/40 dark:via-gray-900/80 pointer-events-none" 
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Copy Button */}
          <motion.div layout>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className={cn(
                "flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 z-10",
                isCopied
                  ? "bg-green-500 text-white shadow-green-500/20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-500/30"
              )}
              title="Copy caption"
            >
              <AnimatePresence mode="wait">
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>

        {/* Metadata */}
        <motion.div layout className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
          {creatorName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <User className="h-3 w-3 opacity-70" />
              {creatorName}
            </div>
          )}
          {category && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-[11px] font-medium text-blue-600 dark:text-blue-300">
              <Folder className="h-3 w-3 opacity-70" />
              {category}
            </div>
          )}
          {formattedRevenue && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
              <DollarSign className="h-3 w-3 opacity-70" />
              {formattedRevenue}
            </div>
          )}
          
          <div className="ml-auto"> 
            <motion.span 
              layout
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium transition-colors duration-200",
                isExpanded ? "text-pink-500" : "text-gray-400 group-hover:text-pink-500/70"
              )}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Read More
                </>
              )}
            </motion.span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
