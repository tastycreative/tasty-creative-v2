"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import MediaDisplay from "./MediaDisplay";
import CardActions from "./CardActions";
import CardMetadata from "./CardMetadata";
import ContentDetailModal from "./ContentDetailModal";
import { ContentCardProps } from "@/types/gallery";
import { cn } from "@/lib/utils";

// Image load cache to prevent re-fetching
const imageLoadCache = new Set<string>();

const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
}) => {
  const [useProxy, setUseProxy] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Determine if media is a GIF
  const isGif = useMemo(() => {
    const url =
      content.gifUrl ||
      content.previewUrl ||
      content.mediaUrl ||
      content.thumbnailUrl ||
      "";
    return url.toLowerCase().includes(".gif");
  }, [
    content.gifUrl,
    content.previewUrl,
    content.mediaUrl,
    content.thumbnailUrl,
  ]);

  // List of domains that often have CORS issues
  const corsProblematicDomains = [
    "i.imgur.com",
    "media.giphy.com",
    "thumbs.gfycat.com",
  ];

  // Check if we need proxy based on domain
  const needsProxy = useMemo(() => {
    const url =
      content.gifUrl ||
      content.previewUrl ||
      content.mediaUrl ||
      content.thumbnailUrl ||
      "";
    return corsProblematicDomains.some((domain) => url.includes(domain));
  }, [
    content.gifUrl,
    content.previewUrl,
    content.mediaUrl,
    content.thumbnailUrl,
  ]);

  // Get the appropriate media URL
  const getMediaUrl = useCallback(() => {
    const rawUrl =
      content.gifUrl ||
      content.previewUrl ||
      content.mediaUrl ||
      content.thumbnailUrl ||
      "/api/placeholder-image";

    // If we need proxy or have had an error, use proxy
    if (useProxy || needsProxy) {
      const encodedUrl = encodeURIComponent(rawUrl);
      return isGif
        ? `/api/proxy-image?url=${encodedUrl}`
        : `/api/media-proxy?url=${encodedUrl}`;
    }

    return rawUrl;
  }, [content.mediaUrl, content.thumbnailUrl, useProxy, needsProxy, isGif]);

  const mediaUrl = useMemo(() => getMediaUrl(), [getMediaUrl]);
  const cacheKey = `${content.id}_${content.tableName || "default"}`;

  // Handle media load success
  const handleMediaLoad = useCallback(() => {
    imageLoadCache.add(cacheKey);
  }, [cacheKey]);

  // Handle media load error
  const handleMediaError = useCallback(() => {
    if (!useProxy) {
      setUseProxy(true);
    }
  }, [useProxy, mediaUrl]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(async () => {
    if (onToggleFavorite) {
      try {
        await onToggleFavorite(content);
      } catch (error) {
      }
    }
  }, [content, onToggleFavorite]);

  // Handle PTR toggle
  const handleTogglePTR = useCallback(async () => {
    if (onTogglePTR) {
      try {
        await onTogglePTR(content);
      } catch (error) {
      }
    }
  }, [content, onTogglePTR]);

  // Handle marking PTR as sent
  const handleMarkPTRAsSent = useCallback(async () => {
    if (onMarkPTRAsSent) {
      try {
        await onMarkPTRAsSent(content);
      } catch (error) {
      }
    }
  }, [content, onMarkPTRAsSent]);

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
        className={cn(
          "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden",
          "hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]",
          "h-[380px] flex flex-col cursor-pointer",
          // Override default Card padding and gap
          "p-0 gap-0",
          content.isPTR && "ring-2 ring-purple-500/20",
          content.ptrSent && "ring-2 ring-green-500/20",
          isSelected && "ring-4 ring-blue-500 ring-offset-2"
        )}
      >
      {/* Media Preview */}
      <div className="relative h-48 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 overflow-hidden">
        <MediaDisplay
          content={content}
          mediaUrl={mediaUrl}
          isGif={isGif}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
        />

        {/* Selection Checkbox - Top Left (in selection mode) */}
        {selectionMode && onToggleSelection && (
          <div className="absolute top-2 left-2 z-20">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(content.id);
              }}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(content.id)}
                className="w-5 h-5"
              />
            </div>
          </div>
        )}

        {/* Category Badge & Source Badge - Top Left (when not in selection mode) */}
        {!selectionMode && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
            {content.category && (
              <div className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                {content.category}
              </div>
            )}
            {content.dataSource && (
              <div
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  content.dataSource === "BOARD"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-500/80 text-white"
                )}
              >
                {content.dataSource === "BOARD" ? "Board" : "Sheet"}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Positioned over media (hidden in selection mode) */}
        {!selectionMode && (
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking action buttons
          >
            <CardActions
              content={content}
              onToggleFavorite={handleToggleFavorite}
              onTogglePTR={handleTogglePTR}
              onMarkPTRAsSent={handleMarkPTRAsSent}
            />
          </div>
        )}
      </div>

      {/* Metadata Section */}
      <CardMetadata content={content} />
    </Card>

      {/* Detail Modal */}
      <ContentDetailModal
        content={content}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onToggleFavorite={handleToggleFavorite}
        onTogglePTR={handleTogglePTR}
        onMarkPTRAsSent={handleMarkPTRAsSent}
      />
    </>
  );
};

export default React.memo(ContentCard, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if content actually changed
  return (
    prevProps.content.id === nextProps.content.id &&
    prevProps.content.isFavorite === nextProps.content.isFavorite &&
    prevProps.content.isPTR === nextProps.content.isPTR &&
    prevProps.content.ptrSent === nextProps.content.ptrSent &&
    prevProps.content.outcome === nextProps.content.outcome &&
    prevProps.content.dataSource === nextProps.content.dataSource &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.isSelected === nextProps.isSelected
  );
});
