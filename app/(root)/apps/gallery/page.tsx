"use client";

import React, { useState, useMemo } from "react";
import ContentCard from "@/components/gallery/ContentCard";
import {
  SearchBar,
  TabSelector,
  FilterPanel,
} from "@/components/gallery/Filters";
import { StatsCards } from "@/components/gallery/Stats";
import Pagination from "@/components/gallery/Pagination";
import GallerySkeleton from "@/components/gallery/GallerySkeleton";
import { GalleryItem, FilterState } from "@/types/gallery";
import { Grid3X3, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGalleryData,
  useToggleFavorite,
  useTogglePTR,
  QUERY_KEYS,
} from "@/hooks/useGalleryQuery";
import { useQueryClient } from "@tanstack/react-query";

// Error Boundary Component for robust error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Error logged in production monitoring
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
              Something went wrong
            </div>
            <div className="text-red-500 dark:text-red-300 text-sm mb-4">
              Please refresh the page to try again
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Refresh Page
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const GalleryContent = () => {
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "releases">(
    "all"
  );
  const [showFilters, setShowFilters] = useState(false);

  // Consolidated filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    creator: "all",
    messageType: "all",
    outcome: "all",
    sortBy: "revenue",
    revenue: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // React Query hooks for data management
  const { data: galleryData, isLoading, error } = useGalleryData();
  const toggleFavoriteMutation = useToggleFavorite();
  const togglePTRMutation = useTogglePTR();
  const queryClient = useQueryClient();

  // Extract data with fallbacks
  const galleryItems = galleryData?.items || [];
  const categories = galleryData?.categories || [];
  const creators = galleryData?.creators || [];
  const breakdown = galleryData?.breakdown || {
    favorites: 0,
    releases: 0,
    library: 0,
  };

  // Pure client-side filtering function
  const applyFiltersToItems = (items: GalleryItem[]): GalleryItem[] => {
    let filteredItems = [...items];

    // Apply category filter
    if (filters.category && filters.category !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Apply creator filter
    if (filters.creator && filters.creator !== "all") {
      filteredItems = filteredItems.filter(
        (item) =>
          item.creatorName &&
          item.creatorName.toLowerCase().includes(filters.creator.toLowerCase())
      );
    }

    // Apply revenue filter
    if (filters.revenue) {
      const min = parseFloat(filters.revenue);
      filteredItems = filteredItems.filter((item) => item.totalRevenue >= min);
    }

    // Apply message type filter
    if (filters.messageType && filters.messageType !== "all") {
      filteredItems = filteredItems.filter(
        (item) =>
          item.messageType &&
          item.messageType.toLowerCase() === filters.messageType.toLowerCase()
      );
    }

    // Apply outcome filter
    if (filters.outcome && filters.outcome !== "all") {
      filteredItems = filteredItems.filter(
        (item) =>
          item.outcome &&
          item.outcome.toLowerCase() === filters.outcome.toLowerCase()
      );
    }

    // Apply search filter
    if (filters.search) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.captionText
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          item.category.toLowerCase().includes(filters.search.toLowerCase()) ||
          (item.contentStyle || "")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    return filteredItems;
  };

  // Apply filters to gallery data using useMemo for performance
  const allFilteredItems = useMemo(() => {
    const filtered = applyFiltersToItems(galleryItems);
    return filtered;
  }, [
    galleryItems,
    filters.search,
    filters.category,
    filters.creator,
    filters.revenue,
    filters.messageType,
    filters.outcome,
  ]);

  // Apply client-side sorting using useMemo for performance
  const sortedItems = useMemo(() => {
    return [...allFilteredItems].sort((a, b) => {
      switch (filters.sortBy) {
        case "revenue":
          return b.totalRevenue - a.totalRevenue;
        case "popularity":
          return b.totalBuys - a.totalBuys;
        case "success-rate":
          const outcomeValue = (outcome: string | undefined) => {
            if (!outcome) return 0;
            const lower = outcome.toLowerCase();
            if (lower.includes("good") || lower.includes("success")) return 3;
            if (lower.includes("ok") || lower.includes("decent")) return 2;
            if (lower.includes("bad") || lower.includes("poor")) return 1;
            return 0;
          };
          const outcomeValueDiff =
            outcomeValue(b.outcome) - outcomeValue(a.outcome);
          if (outcomeValueDiff !== 0) return outcomeValueDiff;
          return b.totalRevenue - a.totalRevenue;
        case "recent":
          return (
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          );
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [allFilteredItems, filters.sortBy]);

  // Filter items based on active tab
  const filteredContent = useMemo(() => {
    switch (activeTab) {
      case "favorites":
        return sortedItems.filter((item) => item.isFavorite);
      case "releases":
        return sortedItems.filter((item) => item.isPTR);
      default:
        return sortedItems;
    }
  }, [sortedItems, activeTab]);

  // Pagination logic
  const totalItems = filteredContent.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContent = filteredContent.slice(startIndex, endIndex);

  // Handle favorite toggle with React Query
  const handleToggleFavorite = (item: GalleryItem) => {
    const action = item.isFavorite ? "remove" : "add";
    toggleFavoriteMutation.mutate({ item, action });
  };

  // Handle PTR toggle with React Query
  const handleTogglePTR = (item: GalleryItem) => {
    const action = item.isPTR ? "remove" : "add";
    togglePTRMutation.mutate({ item, action });
  };

  // Handle clear cache
  const handleClearCache = async () => {
    try {
      // Clear React Query cache
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery });
      toast.success("Cache cleared successfully");
    } catch (error) {
      toast.error("Failed to clear cache");
    }
  };

  // Handle loading state
  if (isLoading) {
    return <GallerySkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg font-medium mb-2">
          Failed to load gallery data
        </div>
        <div className="text-gray-500 text-sm mb-4">{error.message}</div>
        <Button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery })
          }
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
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 mb-2 backdrop-blur-sm">
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
                        Content Gallery
                      </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-lg font-medium">
                      Discover and manage your high-performing content library
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Data
                      </span>
                      <span>•</span>
                      <span>Last updated: just now</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCache}
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
          <SearchBar
            searchQuery={filters.search}
            onSearchChange={(value) =>
              setFilters((prev) => ({ ...prev, search: value }))
            }
            placeholder="Search content, captions, creators..."
          />
        </div>

        {/* Navigation and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Tab Navigation */}
          <TabSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            breakdown={breakdown}
            galleryItemsLength={galleryItems.length}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="h-12 px-4 rounded-2xl border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 px-4 rounded-2xl transition-all duration-200 ${
                showFilters
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6">
            <FilterPanel
              filters={filters}
              onFiltersChange={(newFilters) =>
                setFilters((prev) => ({ ...prev, ...newFilters }))
              }
              categories={categories}
              creators={creators}
              onClearAll={() =>
                setFilters({
                  search: "",
                  category: "all",
                  creator: "all",
                  messageType: "all",
                  outcome: "all",
                  sortBy: "revenue",
                  revenue: "",
                })
              }
            />
          </div>
        )}

        {/* Stats Cards */}
        <StatsCards
          totalContent={breakdown.library}
          totalSales={breakdown.releases}
          totalRevenue={2957.54} // TODO: Calculate from data
        />

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedContent.map((content, index) => (
            <ErrorBoundary
              key={`${content.tableName || "default"}-${content.id}-${content.sheetRowId || index}`}
              fallback={
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    Error loading content: {content.title || content.id}
                  </div>
                </div>
              }
            >
              <ContentCard
                content={content}
                onToggleFavorite={handleToggleFavorite}
                onTogglePTR={handleTogglePTR}
                onMarkPTRAsSent={() => {
                  // TODO: Implement PTR sent functionality
                  toast.info("PTR sent functionality coming soon");
                }}
              />
            </ErrorBoundary>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage,
              hasNextPage: currentPage < totalPages,
              hasPreviousPage: currentPage > 1,
              startIndex: (currentPage - 1) * itemsPerPage + 1,
              endIndex: Math.min(currentPage * itemsPerPage, totalItems),
            }}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
    </div>
  );
};

export default function GalleryPage() {
  return (
    <ErrorBoundary>
      <GalleryContent />
    </ErrorBoundary>
  );
}
