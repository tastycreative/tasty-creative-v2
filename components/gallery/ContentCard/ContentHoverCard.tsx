"use client";

import React, { useState, useMemo } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { GalleryItem } from "@/types/gallery";
import { cn } from "@/lib/utils";
import {
  Heart,
  Send,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  Calendar,
  ExternalLink,
  Eye,
  Copy,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ContentHoverCardProps {
  content: GalleryItem;
  children: React.ReactNode;
  onToggleFavorite?: () => void;
  onTogglePTR?: () => void;
  onMarkPTRAsSent?: () => void;
  onViewDetails?: () => void;
  disabled?: boolean;
}

const ContentHoverCard: React.FC<ContentHoverCardProps> = ({
  content,
  children,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent,
  onViewDetails,
  disabled = false,
}) => {
  const [useProxy, setUseProxy] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get the appropriate media URL
  const mediaUrl = useMemo(() => {
    const rawUrl =
      content.gifUrl ||
      content.previewUrl ||
      content.mediaUrl ||
      content.thumbnailUrl ||
      "";

    if (!rawUrl) return null;

    if (useProxy) {
      const isGif = rawUrl.toLowerCase().includes(".gif");
      const encodedUrl = encodeURIComponent(rawUrl);
      return isGif
        ? `/api/proxy-image?url=${encodedUrl}`
        : `/api/media-proxy?url=${encodedUrl}`;
    }

    return rawUrl;
  }, [
    content.gifUrl,
    content.previewUrl,
    content.mediaUrl,
    content.thumbnailUrl,
    useProxy,
  ]);

  const handleMediaError = () => {
    if (!useProxy) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  };

  // Calculate ROI
  const roi = useMemo(() => {
    if (content.price && content.price > 0 && content.totalBuys > 0) {
      return ((content.totalRevenue / content.price) * 100).toFixed(0);
    }
    return null;
  }, [content.price, content.totalBuys, content.totalRevenue]);

  // Outcome styling
  const outcomeStyle = useMemo(() => {
    if (!content.outcome) return null;
    const outcome = content.outcome.toLowerCase();
    if (outcome.includes("good") || outcome.includes("success")) {
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        icon: "text-green-500",
      };
    }
    if (outcome.includes("bad") || outcome.includes("poor")) {
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: "text-red-500",
      };
    }
    return {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      icon: "text-yellow-500",
    };
  }, [content.outcome]);

  const handleCopyCaption = () => {
    const caption = content.captionText || content.caption || "";
    if (caption) {
      navigator.clipboard.writeText(caption);
      toast.success("Caption copied to clipboard");
    }
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={10}
        className="w-80 p-0 overflow-hidden border-gray-200 dark:border-gray-700 shadow-xl"
      >
        {/* Media Preview */}
        <div className="relative h-40 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
          {mediaUrl && !imageError ? (
            <Image
              src={mediaUrl}
              alt={content.title}
              fill
              className="object-cover"
              onError={handleMediaError}
              sizes="320px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/70 text-sm">No Preview</div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {content.category && (
              <span className="bg-green-500/90 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {content.category}
              </span>
            )}
            {content.dataSource && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  content.dataSource === "BOARD"
                    ? "bg-blue-500/90 text-white"
                    : "bg-gray-500/80 text-white"
                )}
              >
                {content.dataSource === "BOARD" ? "Board" : "Sheet"}
              </span>
            )}
          </div>

          {/* Status Indicators */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {content.isFavorite && (
              <div className="bg-pink-500/90 text-white p-1.5 rounded-full">
                <Heart className="w-3 h-3 fill-current" />
              </div>
            )}
            {content.isPTR && (
              <div
                className={cn(
                  "p-1.5 rounded-full",
                  content.ptrSent
                    ? "bg-green-500/90 text-white"
                    : "bg-purple-500/90 text-white"
                )}
              >
                {content.ptrSent ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and Creator */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {content.title}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {content.creatorName || "Unknown Creator"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <DollarSign className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
              <div className="font-bold text-gray-900 dark:text-white">
                ${content.totalRevenue?.toFixed(0) || "0"}
              </div>
              <div className="text-[10px] text-gray-500">Revenue</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <ShoppingCart className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <div className="font-bold text-gray-900 dark:text-white">
                {content.totalBuys || 0}
              </div>
              <div className="text-[10px] text-gray-500">Buys</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {roi ? (
                <>
                  <TrendingUp className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                  <div className="font-bold text-gray-900 dark:text-white">
                    {roi}%
                  </div>
                  <div className="text-[10px] text-gray-500">ROI</div>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                  <div className="font-bold text-gray-900 dark:text-white text-xs">
                    {content.dateAdded
                      ? new Date(content.dateAdded).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </div>
                  <div className="text-[10px] text-gray-500">Added</div>
                </>
              )}
            </div>
          </div>

          {/* Outcome Badge */}
          {content.outcome && outcomeStyle && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                outcomeStyle.bg
              )}
            >
              <CheckCircle2 className={cn("w-4 h-4", outcomeStyle.icon)} />
              <span className={cn("text-sm font-medium capitalize", outcomeStyle.text)}>
                {content.outcome}
              </span>
            </div>
          )}

          {/* Caption Preview */}
          {(content.captionText || content.caption) && (
            <div className="relative group/caption">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 pr-8">
                {content.captionText || content.caption}
              </p>
              <button
                onClick={handleCopyCaption}
                className="absolute top-0 right-0 p-1 opacity-0 group-hover/caption:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={onViewDetails}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                View
              </Button>
            )}
            {onToggleFavorite && (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8",
                  content.isFavorite
                    ? "text-pink-500 hover:text-pink-600"
                    : "text-gray-400 hover:text-pink-500"
                )}
                onClick={onToggleFavorite}
              >
                <Heart
                  className={cn("w-4 h-4", content.isFavorite && "fill-current")}
                />
              </Button>
            )}
            {onTogglePTR && (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8",
                  content.isPTR
                    ? "text-purple-500 hover:text-purple-600"
                    : "text-gray-400 hover:text-purple-500"
                )}
                onClick={onTogglePTR}
              >
                <Send
                  className={cn("w-4 h-4", content.isPTR && "fill-current")}
                />
              </Button>
            )}
            {content.isPTR && !content.ptrSent && onMarkPTRAsSent && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-green-500"
                onClick={onMarkPTRAsSent}
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            {content.driveLink && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-blue-500"
                asChild
              >
                <a
                  href={content.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ContentHoverCard;
