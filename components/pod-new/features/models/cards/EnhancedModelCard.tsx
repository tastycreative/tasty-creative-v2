"use client";

import { useState, memo, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Heart,
  Star,
  Zap,
  AlertCircle,
  Sparkles,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Shared utilities and components
import {
  formatGuaranteedAmount,
  calculatePerformanceScore,
  getPersonalityTypeConfig,
} from "../utils";
import { OptimizedModelImage } from "../shared/OptimizedModelImage";
import { SocialLinkButton } from "../shared/SocialLinkButton";

// Types for better type safety
interface ModelDetails {
  id: string;
  name: string;
  status: "active" | "dropped";
  launchDate: string;
  referrerName: string;
  personalityType: string;
  commonTerms: string[];
  commonEmojis: string[];
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  chattingManagers: string[];
  profileImage?: string;
  percentTaken?: number | null;
  guaranteed?: number | string | null;
  notes?: string | null;
  stats?: {
    totalRevenue: number;
    monthlyRevenue: number;
    subscribers: number;
    avgResponseTime: string;
  };
}

type ModelStatus = "active" | "dropped";

// Main enhanced model card component
interface EnhancedModelCardProps {
  model: ModelDetails;
  index: number;
  onClick: () => void;
  priority?: boolean;
  variant?: "default" | "compact" | "featured";
  showPerformanceIndicator?: boolean;
}

const EnhancedModelCard = memo(
  ({
    model,
    index,
    onClick,
    priority = false,
    variant = "default",
    showPerformanceIndicator = true,
  }: EnhancedModelCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Memoized event handlers
    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);
    
    const handleStopPropagation = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsFavorited(prev => !prev);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    // Memoized computed values
    const performanceScore = useMemo(
      () => calculatePerformanceScore(model.stats),
      [model.stats]
    );

    const isActive = model.status.toLowerCase() === "active";

    const statusConfig = useMemo(() => ({
      className: isActive
        ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-300 dark:border-success-800"
        : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800",
      icon: isActive ? Zap : AlertCircle,
      text: isActive ? "Active" : "Dropped",
    }), [isActive]);

    const formattedDate = useMemo(() => {
      if (!model.launchDate) return "No date";
      return new Date(model.launchDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }, [model.launchDate]);

    const cardVariantClasses = {
      default: "",
      compact: "max-h-80",
      featured: "md:col-span-2 lg:col-span-2",
    };

    return (
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        whileHover={{ y: -8, scale: 1.01 }}
        className={cn(
          "relative group cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
          cardVariantClasses[variant]
        )}
        tabIndex={0}
        role="article"
        aria-label={`Model card for ${model.name}`}
      >
        {/* Performance badge */}
        {showPerformanceIndicator && performanceScore > 70 && (
          <div className="absolute -top-3 -right-2 z-30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xl backdrop-blur-md border border-white/20",
              performanceScore >= 90
                ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white"
                : performanceScore >= 80
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
                  : "bg-gradient-to-r from-blue-400 to-cyan-500 text-white"
            )}>
              <Star className="w-3.5 h-3.5 fill-current" />
              {performanceScore}
            </div>
          </div>
        )}

        {/* Main card */}
        <div className={cn(
          "relative rounded-3xl overflow-hidden transition-all duration-500",
          "bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl",
          "border border-white/40 dark:border-white/10",
          "shadow-sm hover:shadow-2xl hover:shadow-pink-500/10 dark:hover:shadow-purple-900/20",
          isHovered && "border-white/60 dark:border-white/20"
        )}>
          {/* Header with image */}
          <div className="relative h-64 overflow-hidden">
            <OptimizedModelImage model={model} priority={priority} />
            
            {/* Floating status badge */}
            <div className="absolute top-4 left-4 z-20">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border transition-all duration-300",
                statusConfig.className,
                isHovered && "scale-105"
              )}>
                <statusConfig.icon className="w-3.5 h-3.5" />
                <span>{statusConfig.text}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={handleFavoriteClick}
                className={cn(
                  "p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg",
                  "bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-110",
                  isFavorited && "bg-red-500/80 border-red-400 text-white hover:bg-red-500"
                )}
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
              </button>
            </div>

            {/* Model name overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md mb-1">
                {model.name}
              </h3>
              <div className="flex items-center gap-2 text-gray-200 text-sm font-medium mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                 {model.referrerName && (
                  <>
                    <span className="opacity-60">by</span>
                    <span className="text-white border-b border-white/30">{model.referrerName}</span>
                  </>
                 )}
              </div>

               {/* Metrics Row (Always Visible) */}
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm tracking-wide">
                        {formatGuaranteedAmount((model as any).guaranteed)}
                    </span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white/90">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    <span className="text-xs font-semibold">{formattedDate}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Expanded Content section */}
          <div className="p-5 space-y-4">
            {/* Tags Row */}
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {model.personalityType && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                  getPersonalityTypeConfig(model.personalityType).bg,
                  getPersonalityTypeConfig(model.personalityType).text
                )}>
                  <Sparkles className={cn("w-3 h-3", getPersonalityTypeConfig(model.personalityType).icon)} />
                  {model.personalityType}
                </div>
              )}
              
               {model.percentTaken && model.percentTaken > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wider">
                  <PieChart className="w-3 h-3" />
                  {model.percentTaken}% Taken
                </div>
              )}
            </div>

            {/* Hidden details revealed on hover/focus (optional, keeping visible for now but styled) */}
             <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center ml-1">
                   {model.chattingManagers && model.chattingManagers.length > 0 ? (
                      <div className="flex -space-x-2">
                        {model.chattingManagers.map((m, i) => (
                           <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[8px] text-white font-bold uppercase">
                              {m.charAt(0)}
                           </div>
                        ))}
                      </div>
                   ) : (
                     <span className="text-xs text-gray-400 italic">No managers</span>
                   )}
                </div>

                <div className="flex items-center gap-1">
                    <SocialLinkButton platform="instagram" username={model.instagram} onStopPropagation={handleStopPropagation} />
                    <SocialLinkButton platform="twitter" username={model.twitter} onStopPropagation={handleStopPropagation} />
                    <SocialLinkButton platform="tiktok" username={model.tiktok} onStopPropagation={handleStopPropagation} />
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

EnhancedModelCard.displayName = "EnhancedModelCard";

export default EnhancedModelCard;
export type { EnhancedModelCardProps, ModelDetails, ModelStatus };