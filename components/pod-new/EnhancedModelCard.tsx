"use client";

import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  Instagram,
  Twitter,
  MoreVertical,
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
  stats?: {
    totalRevenue: number;
    monthlyRevenue: number;
    subscribers: number;
    avgResponseTime: string;
  };
}

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

// Format large numbers with K/M suffix
const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
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
    if (!url) return "/placeholder-image.jpg";

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

  if (imageState === 'error') {
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
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative group cursor-pointer select-none",
          "transition-all duration-300 ease-out",
          "transform-gpu will-change-transform",
          "animate-in fade-in-0 slide-in-from-bottom-4",
          cardVariantClasses[variant],
          isHovered && "scale-[1.02] -translate-y-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        )}
        style={{
          animationDelay: `${animationDelay}ms`,
          animationFillMode: 'backwards',
        }}
        tabIndex={0}
        role="article"
        aria-label={`Model card for ${model.name}`}
      >
        {/* Performance badge */}
        {showPerformanceIndicator && performanceScore > 70 && (
          <div className="absolute -top-2 -right-2 z-20">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
              "bg-gradient-to-r shadow-lg",
              performanceScore >= 90
                ? "from-yellow-400 to-yellow-500 text-yellow-900"
                : performanceScore >= 80
                  ? "from-success-400 to-success-500 text-white"
                  : "from-info-400 to-info-500 text-white"
            )}>
              <Star className="w-3 h-3 fill-current" />
              {performanceScore}
            </div>
          </div>
        )}

        {/* Main card */}
        <div className={cn(
          "relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden",
          "border border-gray-200 dark:border-gray-700",
          "shadow-sm hover:shadow-xl transition-shadow duration-300",
          isHovered && "border-primary-300 dark:border-primary-600"
        )}>
          {/* Header with image */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <OptimizedModelImage model={model} priority={priority} />
            
            {/* Floating status badge */}
            <div className="absolute top-3 left-3 z-10">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                "backdrop-blur-md border",
                statusConfig.className
              )}>
                <statusConfig.icon className="w-3 h-3" />
                <span>{statusConfig.text}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                onClick={handleFavoriteClick}
                className={cn(
                  "p-2 rounded-full backdrop-blur-md transition-all duration-200",
                  "bg-white/80 dark:bg-gray-800/80 border border-white/20",
                  "hover:bg-white dark:hover:bg-gray-700",
                  isFavorited && "text-red-500"
                )}
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
              </button>
            </div>

            {/* Model name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <h3 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
                {model.name}
              </h3>
              {model.referrerName && (
                <p className="text-sm text-white/90 mt-1">
                  via {model.referrerName}
                </p>
              )}
            </div>
          </div>

          {/* Content section */}
          <div className="p-4 space-y-4">
            {/* Quick info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              {model.personalityType && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                  {model.personalityType}
                </span>
              )}
            </div>

            {/* Performance metrics */}
            {model.stats && (
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={DollarSign}
                  label="Monthly"
                  value={formatCompactNumber(model.stats.monthlyRevenue)}
                  trend={trends.revenue}
                  color="success"
                  compact
                />
                <StatCard
                  icon={Users}
                  label="Subs"
                  value={formatCompactNumber(model.stats.subscribers)}
                  trend={trends.subscribers}
                  color="info"
                  compact
                />
                <StatCard
                  icon={Clock}
                  label="Response"
                  value={model.stats.avgResponseTime || "—"}
                  color="default"
                  compact
                />
              </div>
            )}

            {/* Social links and actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <SocialLinkButton
                  platform="instagram"
                  username={model.instagram}
                  onStopPropagation={handleStopPropagation}
                />
                <SocialLinkButton
                  platform="twitter"
                  username={model.twitter}
                  onStopPropagation={handleStopPropagation}
                />
                <SocialLinkButton
                  platform="tiktok"
                  username={model.tiktok}
                  onStopPropagation={handleStopPropagation}
                />
              </div>

              <button
                onClick={handleStopPropagation}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
                  "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                )}
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Tags */}
            {model.commonTerms && model.commonTerms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {model.commonTerms.slice(0, 3).map((term, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {term}
                  </span>
                ))}
                {model.commonTerms.length > 3 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    +{model.commonTerms.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EnhancedModelCard.displayName = "EnhancedModelCard";

export default EnhancedModelCard;
export type { EnhancedModelCardProps, ModelDetails, ModelStatus };