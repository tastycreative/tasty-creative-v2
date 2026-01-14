"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CaptionCardProps {
  caption: string;
  creatorName?: string;
  category?: string;
  revenue?: number;
  outcome?: string;
  index?: number;
  isFeatured?: boolean;
}

// Get tag color based on category or index
const getTagStyle = (category?: string, index?: number) => {
  const styles = [
    { bg: "bg-pink-500/10", text: "text-pink-500", label: "Top Performer" },
    { bg: "bg-blue-500/10", text: "text-blue-400", label: "Interactive" },
    { bg: "bg-purple-500/10", text: "text-purple-400", label: "Story Exclusive" },
    { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "POV" },
    { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Seasonal" },
  ];

  if (category) {
    const hash = category.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return styles[hash % styles.length];
  }
  return styles[(index || 0) % styles.length];
};

export function CaptionCard({
  caption,
  creatorName,
  category,
  revenue,
  outcome,
  index = 0,
  isFeatured = false,
}: CaptionCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);

  // Check if content exceeds collapsed height threshold
  useEffect(() => {
    if (contentRef.current) {
      const threshold = isFeatured ? 200 : 120;
      setShouldShowReadMore(contentRef.current.scrollHeight > threshold);
    }
  }, [caption, isFeatured]);

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

  const tagStyle = getTagStyle(category, index);
  const creatorInitial = creatorName ? creatorName.charAt(0).toUpperCase() : "?";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4, delay: index * 0.05 }
      }}
      className={cn(
        "group relative rounded-[32px] flex flex-col justify-between cursor-pointer",
        "transition-all duration-300 overflow-hidden",
        isFeatured && "lg:col-span-2"
      )}
      style={{
        background: 'rgba(24, 26, 31, 0.4)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)';
        e.currentTarget.style.background = 'rgba(24, 26, 31, 0.6)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.background = 'rgba(24, 26, 31, 0.4)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className={cn("p-8", isFeatured && "p-10")}>
        {/* Header with Tags and Copy Button */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-2 flex-wrap">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              tagStyle.bg, tagStyle.text
            )}>
              {tagStyle.label}
            </span>
            {isFeatured && (
              <span className="px-4 py-1.5 rounded-full bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                High Conversion
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-pink-400 transition-colors group/copy"
          >
            <AnimatePresence mode="wait">
              {isCopied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-emerald-400"
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Copy className="h-5 w-5 group-hover/copy:scale-110 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="hidden sm:inline">COPY</span>
          </button>
        </div>

        {/* Caption Content */}
        <div className={cn("mb-8", isFeatured && "mb-12")}>
          <div
            ref={contentRef}
            className={cn(
              "relative overflow-hidden",
              !isFeatured && "max-h-[120px]",
              isFeatured && "max-h-none"
            )}
          >
            <p className={cn(
              "text-slate-200 whitespace-pre-wrap break-words font-light leading-relaxed",
              isFeatured ? "text-2xl" : "text-base",
              !isFeatured && shouldShowReadMore && "line-clamp-6"
            )}>
              {caption}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "flex items-center justify-between pt-6 border-t border-white/5",
          isFeatured && "pt-8"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-2xl flex items-center justify-center text-sm font-bold border",
              "bg-gradient-to-br",
              tagStyle.bg.replace('/10', '/20'),
              tagStyle.text,
              tagStyle.bg.replace('bg-', 'border-').replace('/10', '/20'),
              isFeatured ? "w-12 h-12" : "w-8 h-8 rounded-xl text-[10px]"
            )}>
              {creatorInitial}
            </div>
            <div>
              <div className={cn(
                "font-semibold text-white",
                isFeatured ? "text-sm" : "text-xs"
              )}>
                {creatorName || "Unknown"}
              </div>
              {isFeatured && (
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Creator
                </div>
              )}
            </div>
          </div>

          <button className={cn(
            "font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors",
            isFeatured
              ? "text-xs bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full"
              : "text-[10px]"
          )}>
            {isFeatured ? "View Details" : "More"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
