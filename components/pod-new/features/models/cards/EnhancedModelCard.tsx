import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { isOptimizable } from "@/lib/image-optimization";
import {
  Calendar,
  Instagram,
  Twitter,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  ExternalLink,
  Heart,
  Star,
  Clock,
  Zap,
  AlertCircle,
  Sparkles,
  PieChart,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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

// Personality type color mapping
const getPersonalityTypeConfig = (type: string | undefined | null): { bg: string; text: string; icon: string } => {
  if (!type) return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", icon: "text-gray-500" };
  
  const typeLower = type.toLowerCase().trim();
  
  // Map common personality types to colors
  if (typeLower.includes("expressive") || typeLower.includes("outgoing")) {
    return { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-700 dark:text-pink-300", icon: "text-pink-500" };
  }
  if (typeLower.includes("analytical") || typeLower.includes("logical")) {
    return { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", icon: "text-blue-500" };
  }
  if (typeLower.includes("driver") || typeLower.includes("ambitious")) {
    return { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-300", icon: "text-orange-500" };
  }
  if (typeLower.includes("amiable") || typeLower.includes("friendly")) {
    return { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", icon: "text-green-500" };
  }
  if (typeLower.includes("creative") || typeLower.includes("artistic")) {
    return { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", icon: "text-purple-500" };
  }
  
  // Default fallback
  return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", icon: "text-gray-500" };
};

type ModelStatus = "active" | "dropped";

// Performance score calculation utility
const calculatePerformanceScore = (stats?: ModelDetails["stats"]): number => {
  if (!stats) return 0;
  const revenue = stats.monthlyRevenue || 0;
  const subscribers = stats.subscribers || 0;
  // Weighted scoring algorithm (0-100)
  const revenueScore = Math.min(100, (revenue / 50000) * 100);
  const subscriberScore = Math.min(100, (subscribers / 10000) * 100);
  return Math.round(revenueScore * 0.4 + subscriberScore * 0.6);
};

// Format large numbers with K/M/B suffix
const formatCompactNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Format guaranteed amount with safe parsing (without $ prefix since we show dollar icon)
const formatGuaranteedAmount = (guaranteedStr?: string): string => {
  if (!guaranteedStr || guaranteedStr.trim() === "" || guaranteedStr.trim() === "-") {
    return "0";
  }
  
  // Remove $ symbol and any other non-numeric characters except decimal point
  const cleanValue = guaranteedStr.replace(/[^0-9.-]/g, "");
  const guaranteed = parseFloat(cleanValue);
  
  // Only show if it's a valid positive number
  if (!isNaN(guaranteed) && guaranteed > 0) {
    return formatCompactNumber(guaranteed);
  }
  
  return "0";
};

// Enhanced image component with skeleton loading
const OptimizedModelImage = memo(({ model, priority }: { model: ModelDetails; priority?: boolean }) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const imageUrl = useMemo(() => {
    const url = model.profileImage || "";
    if (!url) return null;

    // Google Drive handling
    if (url.includes("drive.google.com")) {
      try {
        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        let driveId: string | null = null;
        if (fileMatch && fileMatch[1]) {
          driveId = fileMatch[1];
        } else {
          const urlObj = new URL(url);
          driveId = urlObj.searchParams.get("id");
        }
        if (driveId) {
          return `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
        }
      } catch (e) {
        // fall through
      }
    }
    return url;
  }, [model.profileImage]);

  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleImageError = useCallback(() => {
    setImageState('error');
  }, []);

  // Elegant fallback avatar
  const FallbackAvatar = useMemo(
    () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-200">
              {model.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="absolute inset-0 rounded-full ring-2 ring-white/20 ring-offset-2 ring-offset-transparent" />
        </div>
      </div>
    ),
    [model.name]
  );

  if (imageState === 'error' || !imageUrl) {
    return FallbackAvatar;
  }

  return (
    <div ref={imageRef} className="relative w-full h-full">
      {/* Skeleton loader */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
      )}
      
      {/* Main image */}
      {isIntersecting && (
        <Image
          src={imageUrl}
          alt={model.name}
          fill
          className={cn(
            "object-cover transition-opacity duration-300",
            imageState === 'loaded' ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={priority}
          unoptimized={!isOptimizable(imageUrl)}
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      )}

      {/* Gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    </div>
  );
});

OptimizedModelImage.displayName = "OptimizedModelImage";

// Stat card component for consistent styling
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  compact?: boolean;
}

const StatCard = memo(({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'default',
  compact = false 
}: StatCardProps) => {
  const colorClasses = {
    default: "text-gray-600 dark:text-gray-400",
    success: "text-success-600 dark:text-success-400",
    warning: "text-warning-600 dark:text-warning-400",
    error: "text-error-600 dark:text-error-400",
    info: "text-info-600 dark:text-info-400",
  };

  return (
    <div className={cn(
      "flex flex-col",
      compact ? "space-y-0.5" : "space-y-1"
    )}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn("w-3.5 h-3.5", colorClasses[color])} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium",
            trend > 0 
              ? "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300"
              : "bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-300"
          )}>
            {trend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className={cn(
        "font-semibold text-gray-900 dark:text-gray-100",
        compact ? "text-sm" : "text-base"
      )}>
        {value}
      </p>
    </div>
  );
});

StatCard.displayName = "StatCard";

// Social link button component
interface SocialLinkProps {
  platform: 'instagram' | 'twitter' | 'tiktok';
  username?: string;
  onStopPropagation: (e: React.MouseEvent) => void;
}

const SocialLinkButton = memo(({ platform, username, onStopPropagation }: SocialLinkProps) => {
  if (!username) return null;

  const configs = {
    instagram: {
      url: `https://instagram.com/${username.replace("@", "")}`,
      icon: Instagram,
      label: "Instagram",
      className: "hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/20 dark:hover:text-pink-400",
    },
    twitter: {
      url: `https://twitter.com/${username.replace("@", "")}`,
      icon: Twitter,
      label: "Twitter", 
      className: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400",
    },
    tiktok: {
      url: `https://tiktok.com/@${username.replace("@", "")}`,
      icon: Activity,
      label: "TikTok",
      className: "hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100",
    },
  };

  const config = configs[platform];
  const Icon = config.icon;

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onStopPropagation}
      className={cn(
        "relative p-2 rounded-lg transition-all duration-200",
        "text-gray-500 dark:text-gray-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        config.className
      )}
      aria-label={`View on ${config.label}`}
    >
      <Icon className="w-4 h-4" />
      <ExternalLink className="w-2 h-2 opacity-0 hover:opacity-50 transition-opacity duration-200 absolute top-1 right-1" />
    </a>
  );
});

SocialLinkButton.displayName = "SocialLinkButton";

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
    const animationDelay = useMemo(() => Math.min(index * 50, 300), [index]);
    
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

    // Generate stable mock trends (would come from API in production)
    const trends = useMemo(() => ({
      revenue: isActive ? 12 : -8,
      subscribers: isActive ? 18 : -5,
    }), [isActive]);

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