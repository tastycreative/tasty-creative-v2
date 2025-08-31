"use client";

import React from "react";
import { DollarSign, TrendingUp, Package, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardMetadataProps } from "@/types/gallery";
import { cn } from "@/lib/utils";

const CardMetadata: React.FC<CardMetadataProps> = ({ content }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const truncateCaption = (
    text: string | undefined,
    maxLength: number = 80
  ) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="p-3 space-y-2 flex-1">
      {/* Title and Badges */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 flex-1">
          {content.contentStyle || content.messageType || content.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {content.outcome && (
            <Badge
              variant={content.outcome === "Good" ? "default" : "destructive"}
              className="text-xs px-1.5 py-0"
            >
              {content.outcome}
            </Badge>
          )}
          {content.isPTR && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            >
              PTR
            </Badge>
          )}
          {content.ptrSent && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              Sent
            </Badge>
          )}
        </div>
      </div>

      {/* Caption - More compact */}
      {(content.captionText || content.caption) && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
          {truncateCaption(content.captionText || content.caption)}
        </p>
      )}

      {/* Metadata Row - More compact */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        {content.creatorName && (
          <>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="font-medium truncate max-w-[80px]">
                {content.creatorName}
              </span>
            </div>
            {(content.type || content.messageType) && <span>•</span>}
          </>
        )}
        {content.type && (
          <>
            <span className="font-medium">{content.type}</span>
            {content.messageType && <span>•</span>}
          </>
        )}
        {content.messageType && (
          <span className="truncate">{content.messageType}</span>
        )}
      </div>

      {/* Performance Metrics - More compact */}
      <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800">
        {/* Price */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs">Price</span>
          </div>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {content.price ? formatCurrency(content.price) : "$0"}
          </span>
        </div>

        {/* Revenue */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">Revenue</span>
          </div>
          <span
            className={cn(
              "font-semibold text-sm",
              (content.totalRevenue || content.revenue || 0) > 0
                ? "text-green-600 dark:text-green-400"
                : "text-gray-900 dark:text-white"
            )}
          >
            {formatCurrency(content.totalRevenue || content.revenue || 0)}
          </span>
        </div>

        {/* Purchases */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Package className="w-3 h-3" />
            <span className="text-xs">Buys</span>
          </div>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {formatNumber(content.totalBuys || content.purchases || 0)}
          </span>
        </div>
      </div>

      {/* Bottom section with category and badges - More compact */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
        {/* Category */}
        {content.category && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              content.category === "PTR" &&
                "border-purple-500 text-purple-600 dark:text-purple-400",
              content.category === "Solo" &&
                "border-blue-500 text-blue-600 dark:text-blue-400",
              content.category === "Group" &&
                "border-green-500 text-green-600 dark:text-green-400",
              content.category === "BJ" &&
                "border-pink-500 text-pink-600 dark:text-pink-400",
              content.category === "Tease" &&
                "border-orange-500 text-orange-600 dark:text-orange-400"
            )}
          >
            {content.category}
          </Badge>
        )}

        {/* ROI indicator for high performers */}
        {(content.totalRevenue || content.revenue) &&
          content.price &&
          (content.totalBuys || content.purchases) &&
          (content.totalBuys || content.purchases || 0) > 0 &&
          (content.totalRevenue || content.revenue || 0) / content.price >
            10 && (
            <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              🔥 High ROI
            </Badge>
          )}
      </div>

      {/* Additional Info - Only show if present and compact */}
      {(content.scheduledDate || content.captionStyle) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {content.scheduledDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(content.scheduledDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {content.captionStyle && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {content.captionStyle}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default CardMetadata;