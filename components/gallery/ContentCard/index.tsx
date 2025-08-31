"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import MediaDisplay from "./MediaDisplay";
import CardActions from "./CardActions";
import CardMetadata from "./CardMetadata";
import { ContentCardProps } from "@/types/gallery";
import { cn } from "@/lib/utils";

// Image load cache to prevent re-fetching
const imageLoadCache = new Set<string>();

const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent,
}) => {
  const [useProxy, setUseProxy] = useState(false);

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
    <Card
      className={cn(
        "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden",
        "hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]",
        "h-[380px] flex flex-col",
        // Override default Card padding and gap
        "p-0 gap-0",
        content.isPTR && "ring-2 ring-purple-500/20",
        content.ptrSent && "ring-2 ring-green-500/20"
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

        {/* Category Badge - Top Left */}
        {content.category && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              {content.category}
            </div>
          </div>
        )}

        {/* Action Buttons - Positioned over media */}
        <div className="absolute top-2 right-2 z-10">
          <CardActions
            content={content}
            onToggleFavorite={handleToggleFavorite}
            onTogglePTR={handleTogglePTR}
            onMarkPTRAsSent={handleMarkPTRAsSent}
          />
        </div>
      </div>

      {/* Metadata Section */}
      <CardMetadata content={content} />
    </Card>
  );
};

export default React.memo(ContentCard, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if content actually changed
  return (
    prevProps.content.id === nextProps.content.id &&
    prevProps.content.isFavorite === nextProps.content.isFavorite &&
    prevProps.content.isPTR === nextProps.content.isPTR &&
    prevProps.content.ptrSent === nextProps.content.ptrSent &&
    prevProps.content.outcome === nextProps.content.outcome
  );
});
