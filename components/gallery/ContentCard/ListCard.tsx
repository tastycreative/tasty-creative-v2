"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import ContentDetailModal from "./ContentDetailModal";
import { ContentCardProps, GalleryItem } from "@/types/gallery";
import { cn } from "@/lib/utils";
import {
  Heart,
  Send,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  Calendar,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListCardProps extends ContentCardProps {
  cardHeight?: number;
}

const ListCard: React.FC<ListCardProps> = ({
  content,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
  cardHeight = 140,
}) => {
  const [useProxy, setUseProxy] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get the appropriate media URL
  const mediaUrl = useMemo(() => {
    const rawUrl =
      content.gifUrl ||
      content.previewUrl ||
      content.mediaUrl ||
      content.thumbnailUrl ||
      "";

    if (!rawUrl) return "/api/placeholder-image";

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

  const handleMediaError = useCallback(() => {
    if (!useProxy) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  }, [useProxy]);

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleFavorite) {
        await onToggleFavorite(content);
      }
    },
    [content, onToggleFavorite]
  );

  const handleTogglePTR = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onTogglePTR) {
        await onTogglePTR(content);
      }
    },
    [content, onTogglePTR]
  );

  const handleMarkPTRAsSent = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onMarkPTRAsSent) {
        await onMarkPTRAsSent(content);
      }
    },
    [content, onMarkPTRAsSent]
  );

  const outcomeColor = useMemo(() => {
    if (!content.outcome) return "text-gray-400";
    const outcome = content.outcome.toLowerCase();
    if (outcome.includes("good") || outcome.includes("success"))
      return "text-green-600 dark:text-green-400";
    if (outcome.includes("bad") || outcome.includes("poor"))
      return "text-red-600 dark:text-red-400";
    return "text-yellow-600 dark:text-yellow-400";
  }, [content.outcome]);

  return (
    <>
      <Card
        onClick={() => {
          if (selectionMode && onToggleSelection) {
            onToggleSelection(content.id);
          } else {
            setIsDetailModalOpen(true);
          }
        }}
        style={{ height: cardHeight }}
        className={cn(
          "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden",
          "hover:shadow-lg dark:hover:shadow-2xl transition-all duration-200 hover:border-pink-200 dark:hover:border-pink-800",
          "flex flex-row cursor-pointer p-0 gap-0",
          content.isPTR && "ring-2 ring-purple-500/20",
          content.ptrSent && "ring-2 ring-green-500/20",
          isSelected && "ring-4 ring-blue-500 ring-offset-2"
        )}
      >
        {/* Thumbnail Section */}
        <div className="relative w-40 min-w-[160px] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex-shrink-0">
          {!imageError && mediaUrl ? (
            <Image
              src={mediaUrl}
              alt={content.title}
              fill
              className="object-cover"
              onError={handleMediaError}
              sizes="160px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/50 text-xs">No Preview</div>
            </div>
          )}

          {/* Selection Checkbox */}
          {selectionMode && onToggleSelection && (
            <div
              className="absolute top-2 left-2 z-20"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(content.id);
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-1.5 shadow-lg">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(content.id)}
                  className="w-4 h-4"
                />
              </div>
            </div>
          )}

          {/* Category Badge */}
          {!selectionMode && content.category && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {content.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between p-4 min-w-0">
          {/* Top Row: Title and Actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {content.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {content.creatorName || "Unknown Creator"}
                {content.dataSource && (
                  <span
                    className={cn(
                      "ml-2 text-xs px-1.5 py-0.5 rounded",
                      content.dataSource === "BOARD"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    )}
                  >
                    {content.dataSource === "BOARD" ? "Board" : "Sheet"}
                  </span>
                )}
              </p>
            </div>

            {/* Quick Actions */}
            {!selectionMode && (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8",
                    content.isFavorite
                      ? "text-pink-500 hover:text-pink-600"
                      : "text-gray-400 hover:text-pink-500"
                  )}
                  onClick={handleToggleFavorite}
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      content.isFavorite && "fill-current"
                    )}
                  />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8",
                    content.isPTR
                      ? "text-purple-500 hover:text-purple-600"
                      : "text-gray-400 hover:text-purple-500"
                  )}
                  onClick={handleTogglePTR}
                >
                  <Send
                    className={cn(
                      "w-4 h-4",
                      content.isPTR && "fill-current"
                    )}
                  />
                </Button>

                {content.isPTR && !content.ptrSent && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-green-500"
                    onClick={handleMarkPTRAsSent}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsDetailModalOpen(true)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {content.driveLink && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a
                            href={content.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open in Drive
                          </a>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Caption Preview */}
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 my-2">
            {content.captionText || content.caption || "No caption"}
          </p>

          {/* Bottom Row: Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                ${content.totalRevenue?.toFixed(2) || "0.00"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {content.totalBuys || 0} buys
              </span>
            </div>

            {content.outcome && (
              <div className={cn("flex items-center gap-1.5", outcomeColor)}>
                <CheckCircle2 className="w-4 h-4" />
                <span className="capitalize">{content.outcome}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">
                {content.dateAdded
                  ? new Date(content.dateAdded).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <ContentDetailModal
        content={content}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onToggleFavorite={
          onToggleFavorite ? () => onToggleFavorite(content) : undefined
        }
        onTogglePTR={onTogglePTR ? () => onTogglePTR(content) : undefined}
        onMarkPTRAsSent={
          onMarkPTRAsSent ? () => onMarkPTRAsSent(content) : undefined
        }
      />
    </>
  );
};

export default React.memo(ListCard, (prevProps, nextProps) => {
  return (
    prevProps.content.id === nextProps.content.id &&
    prevProps.content.isFavorite === nextProps.content.isFavorite &&
    prevProps.content.isPTR === nextProps.content.isPTR &&
    prevProps.content.ptrSent === nextProps.content.ptrSent &&
    prevProps.content.outcome === nextProps.content.outcome &&
    prevProps.content.dataSource === nextProps.content.dataSource &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.cardHeight === nextProps.cardHeight
  );
});
