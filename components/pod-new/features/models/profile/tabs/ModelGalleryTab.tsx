"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Grid3X3,
  Search,
  RotateCcw,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Package,
  Heart,
  Download,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ModelGalleryContentProps {
  modelName?: string;
}

interface GalleryItem {
  id: string;
  caption: string;
  price: number;
  revenue: number;
  purchases: number;
  engagement_rate: number;
  media_url?: string;
  content_preview_url?: string;
  thumbnail_url?: string;
  created_at?: string;
  media_type: "image" | "video" | "gif";
  message_type?: string;
  content_style?: string;
  outcome?: string;
}

interface GalleryStats {
  total_items: number;
  total_revenue: number;
  total_purchases: number;
  avg_price: string;
}

interface ModelData {
  name: string;
  table: string;
  matchInfo?: {
    used: string;
  };
  alternativeTables?: string[];
}

interface GalleryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface GalleryResponse {
  success: boolean;
  message?: string;
  model: ModelData;
  data: GalleryItem[];
  stats: GalleryStats;
  pagination: GalleryPagination;
}

// Enhanced Content Card Component
const ModelContentCard = ({ item }: { item: GalleryItem }) => {
  const [imageError, setImageError] = useState(false);

  const mediaUrl =
    item.media_url || item.content_preview_url || item.thumbnail_url;

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

  const truncateCaption = (text: string, maxLength: number = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card
      className={cn(
        "group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden",
        "hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]",
        "h-[380px] flex flex-col p-0 gap-0"
      )}
    >
      {/* Media Preview */}
      <div className="relative h-48 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 overflow-hidden">
        {mediaUrl && !imageError ? (
          <img
            src={mediaUrl}
            alt={item.caption || `${item.media_type} content`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60">
            <Grid3X3 className="w-16 h-16" />
          </div>
        )}

        {/* Media Type Indicator */}
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
            {item.media_type === "video" && <Play className="w-3 h-3" />}
            {item.media_type === "gif" && <span>GIF</span>}
            {item.media_type === "image" && <span>IMG</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white"
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      <div className="p-3 space-y-2 flex-1">
        {/* Title and Badges */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 flex-1">
            {item.content_style || item.message_type || "Content"}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {item.outcome && (
              <Badge
                variant={item.outcome === "Good" ? "default" : "destructive"}
                className="text-xs px-1.5 py-0"
              >
                {item.outcome}
              </Badge>
            )}
          </div>
        </div>

        {/* Caption */}
        {item.caption && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
            {truncateCaption(item.caption)}
          </p>
        )}

        {/* Metadata Row */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {item.message_type && (
            <span className="font-medium">{item.message_type}</span>
          )}
          {item.created_at && (
            <>
              <span>•</span>
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800">
          {/* Price */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs">Price</span>
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {formatCurrency(item.price)}
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
                item.revenue > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-900 dark:text-white"
              )}
            >
              {formatCurrency(item.revenue)}
            </span>
          </div>

          {/* Purchases */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Package className="w-3 h-3" />
              <span className="text-xs">Sales</span>
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {formatNumber(item.purchases)}
            </span>
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Engagement: {item.engagement_rate.toFixed(1)}%</span>
          </div>

          {/* High performer badge */}
          {item.revenue > 0 &&
            item.purchases > 0 &&
            item.revenue / item.price > 10 && (
              <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                🔥 High ROI
              </Badge>
            )}
        </div>
      </div>
    </Card>
  );
};

// Modern Empty State Component
const EmptyState = ({ modelName, alternativeTables }: {
  modelName?: string;
  alternativeTables?: string[];
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    {/* Icon Container */}
    <div className="relative mb-8">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 via-pink-50 to-purple-50 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 flex items-center justify-center">
          <Grid3X3 className="w-8 h-8 text-pink-500 dark:text-pink-400" />
        </div>
      </div>
      {/* Floating Elements */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500/20 rounded-full animate-pulse"></div>
      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-500/20 rounded-full animate-pulse delay-300"></div>
    </div>

    {/* Content */}
    <div className="max-w-md mx-auto space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        No gallery data found
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {modelName ? (
          <>We couldn't find any gallery data for <span className="font-medium text-pink-600 dark:text-pink-400">{modelName}</span>. This model might not have a data table set up yet.</>
        ) : (
          "No model data is currently available. Please check back later or contact support."
        )}
      </p>

      {alternativeTables && alternativeTables.length > 0 && (
        <details className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-left">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
            View available models ({alternativeTables.length})
          </summary>
          <div className="mt-3 space-y-1">
            {alternativeTables.slice(0, 10).map((table) => {
              const modelName = table.replace('gs_', '').replace(/_free|_paid/g, '').replace(/_/g, ' ');
              return (
                <div key={table} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {modelName}
                </div>
              );
            })}
            {alternativeTables.length > 10 && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                ...and {alternativeTables.length - 10} more
              </div>
            )}
          </div>
        </details>
      )}
    </div>

    {/* Decorative Background Pattern */}
    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-pink-500 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-3xl"></div>
    </div>
  </div>
);

const ModelGalleryContent = ({
  modelName,
}: ModelGalleryContentProps) => {
  const [data, setData] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [model, setModel] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<
    "all" | "image" | "video" | "gif"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        modelName: modelName || "",
        type: activeType,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: "created_at",
        sortOrder: "desc",
      });

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/gallery-db/model?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result: GalleryResponse = await response.json();
      setData(result.data || []);
      setStats(result.stats);
      setModel(result.model);

      // Update pagination info from API response
      if (result.pagination) {
        console.log('API Pagination:', result.pagination);
        setTotalItems(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        console.log('No pagination in API response');
      }

      // Handle empty data message (not an error, just informational)
      if (result.message && result.data?.length === 0) {
        console.info("API Info:", result.message);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    modelName,
    activeType,
    searchQuery,
    currentPage,
    itemsPerPage,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeType, searchQuery]);

  // Handle refresh
  const handleRefresh = () => {
    fetchData();
    toast.success("Gallery refreshed");
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-red-600 text-lg font-medium mb-2">
          Error loading gallery
        </div>
        <div className="text-gray-500 text-sm mb-4">{error}</div>
        <Button
          onClick={fetchData}
          className="bg-pink-600 hover:bg-pink-700 text-white"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header - Copied from Gallery */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 mb-6 backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Title Section with Enhanced Typography */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                    <Grid3X3 className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                      <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {modelName} Gallery
                      </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-lg font-medium">
                      Browse and manage content library
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Data
                      </span>
                      {model?.matchInfo && (
                        <>
                          <span>•</span>
                          <span>Table: {model.matchInfo.used}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={
                    showFilters
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/25"
                      : "border-gray-200 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/10"
                  }
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search content, captions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-2xl border-gray-200 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400"
            />
          </div>
        </div>

        {/* Type Filter */}
        {showFilters && (
          <div className="mb-6">
            <div className="flex gap-2">
              {(["all", "image", "video", "gif"] as const).map((type) => (
                <Button
                  key={type}
                  variant={activeType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveType(type)}
                  className={
                    activeType === type ? "bg-pink-600 hover:bg-pink-700" : ""
                  }
                >
                  {type === "all"
                    ? "All"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.total_items}
              </div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">
                ${stats.total_revenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {stats.total_purchases}
              </div>
              <div className="text-sm text-gray-500">Total Sales</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                ${stats.avg_price}
              </div>
              <div className="text-sm text-gray-500">Avg Price</div>
            </div>
          </div>
        )}

        {/* Content Grid - Using the exact same layout as Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {data.map((item) => (
            <ModelContentCard key={item.id} item={item} />
          ))}
        </div>

        {/* Empty State */}
        {data.length === 0 && !loading && (
          <EmptyState
            modelName={modelName}
            alternativeTables={model?.alternativeTables}
          />
        )}

        {/* Pagination */}
        {data.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            {/* Pagination Info */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {data.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.min(
                  currentPage * itemsPerPage,
                  totalItems || data.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {totalItems || data.length}
              </span>{" "}
              results
            </div>

            {/* Enhanced Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>

                {/* Previous Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const delta = 2;
                    const range = [];
                    const rangeWithDots = [];

                    for (
                      let i = Math.max(2, currentPage - delta);
                      i <= Math.min(totalPages - 1, currentPage + delta);
                      i++
                    ) {
                      range.push(i);
                    }

                    if (currentPage - delta > 2) {
                      rangeWithDots.push(1, "...");
                    } else {
                      rangeWithDots.push(1);
                    }

                    rangeWithDots.push(...range);

                    if (currentPage + delta < totalPages - 1) {
                      rangeWithDots.push("...", totalPages);
                    } else if (totalPages > 1) {
                      rangeWithDots.push(totalPages);
                    }

                    return rangeWithDots.map((page, index) => {
                      if (page === "...") {
                        return (
                          <Button
                            key={`dots-${index}`}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 cursor-default"
                            disabled
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        );
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === page
                              ? "bg-pink-600 hover:bg-pink-700 text-white"
                              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    });
                  })()}
                </div>

                {/* Next Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Items per page:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000 (All)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ModelGalleryTab() {
  const params = useParams();
  const modelName = params?.modelName ? decodeURIComponent(params.modelName as string) : undefined;

  return <ModelGalleryContent modelName={modelName} />;
}
