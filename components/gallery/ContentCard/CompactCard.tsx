"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import ContentDetailModal from "./ContentDetailModal";
import { ContentCardProps } from "@/types/gallery";
import { cn } from "@/lib/utils";
import { Heart, Send, DollarSign } from "lucide-react";
import Image from "next/image";

interface CompactCardProps extends ContentCardProps {
  cardHeight?: number;
  imageHeight?: string;
}

const CompactCard: React.FC<CompactCardProps> = ({
  content,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
  cardHeight = 280,
  imageHeight = "h-36",
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
          "hover:shadow-lg dark:hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]",
          "flex flex-col cursor-pointer p-0 gap-0",
          content.isPTR && "ring-2 ring-purple-500/20",
          content.ptrSent && "ring-2 ring-green-500/20",
          isSelected && "ring-4 ring-blue-500 ring-offset-2"
        )}
      >
        {/* Media Preview */}
        <div
          className={cn(
            "relative bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 overflow-hidden",
            imageHeight
          )}
        >
          {!imageError && mediaUrl ? (
            <Image
              src={mediaUrl}
              alt={content.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleMediaError}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/50 text-xs">No Preview</div>
            </div>
          )}

          {/* Selection Checkbox */}
          {selectionMode && onToggleSelection && (
            <div
              className="absolute top-1.5 left-1.5 z-20"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(content.id);
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-md p-1 shadow-lg">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(content.id)}
                  className="w-4 h-4"
                />
              </div>
            </div>
          )}

          {/* Quick Actions Overlay */}
          {!selectionMode && (
            <div
              className="absolute top-1.5 right-1.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  "p-1.5 rounded-md backdrop-blur-sm transition-colors",
                  content.isFavorite
                    ? "bg-pink-500/90 text-white"
                    : "bg-black/40 text-white hover:bg-pink-500/90"
                )}
              >
                <Heart
                  className={cn("w-3.5 h-3.5", content.isFavorite && "fill-current")}
                />
              </button>
              <button
                onClick={handleTogglePTR}
                className={cn(
                  "p-1.5 rounded-md backdrop-blur-sm transition-colors",
                  content.isPTR
                    ? "bg-purple-500/90 text-white"
                    : "bg-black/40 text-white hover:bg-purple-500/90"
                )}
              >
                <Send
                  className={cn("w-3.5 h-3.5", content.isPTR && "fill-current")}
                />
              </button>
            </div>
          )}

          {/* Category Badge */}
          {content.category && (
            <div className="absolute bottom-1.5 left-1.5 z-10">
              <span className="bg-green-500/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {content.category}
              </span>
            </div>
          )}

          {/* Data Source Badge */}
          {content.dataSource && (
            <div className="absolute bottom-1.5 right-1.5 z-10">
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  content.dataSource === "BOARD"
                    ? "bg-blue-500/90 text-white"
                    : "bg-gray-500/80 text-white"
                )}
              >
                {content.dataSource === "BOARD" ? "B" : "S"}
              </span>
            </div>
          )}
        </div>

        {/* Compact Metadata */}
        <div className="flex-1 flex flex-col p-3 min-h-0">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate mb-1">
            {content.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
            {content.creatorName || "Unknown"}
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                ${content.totalRevenue?.toFixed(0) || "0"}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {content.totalBuys || 0} buys
            </span>
          </div>

          {/* Outcome Indicator */}
          {content.outcome && (
            <div className="mt-1.5">
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize",
                  content.outcome.toLowerCase().includes("good")
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : content.outcome.toLowerCase().includes("bad")
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                )}
              >
                {content.outcome}
              </span>
            </div>
          )}
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

export default React.memo(CompactCard, (prevProps, nextProps) => {
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
