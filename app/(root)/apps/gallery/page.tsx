"use client";

import React, { useState, useRef, useCallback } from "react";
import ContentCard from "@/components/gallery/ContentCard";
import ListCard from "@/components/gallery/ContentCard/ListCard";
import CompactCard from "@/components/gallery/ContentCard/CompactCard";
import BulkActionsToolbar from "@/components/gallery/BulkActionsToolbar";
import KeyboardShortcutsModal from "@/components/gallery/KeyboardShortcutsModal";
import {
  SearchBar,
  TabSelector,
  FilterPanel,
} from "@/components/gallery/Filters";
import { StatsCards } from "@/components/gallery/Stats";
import Pagination from "@/components/gallery/Pagination";
import GallerySkeleton from "@/components/gallery/GallerySkeleton";
import ViewModeSwitcher, { ViewMode, getGridConfig } from "@/components/gallery/ViewModeSwitcher";

import FilterPresets from "@/components/gallery/FilterPresets";
import SmartCollections from "@/components/gallery/SmartCollections";
import { GalleryItem, FilterState } from "@/types/gallery";
import { Grid3X3, SlidersHorizontal, RotateCcw, CheckSquare, Table2, Kanban, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGalleryData,
  useToggleFavorite,
  useTogglePTR,
  useMarkPTRAsSent,
  QUERY_KEYS,
} from "@/hooks/useGalleryQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

// Custom Hooks
import { useGalleryFilters } from "@/hooks/gallery/useGalleryFilters";
import { useGallerySelection } from "@/hooks/gallery/useGallerySelection";
import { useGalleryShortcuts } from "@/hooks/gallery/useGalleryShortcuts";

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
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [showCollectionsSidebar, setShowCollectionsSidebar] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // React Query hooks for data management
  const { data: galleryData, isLoading, error } = useGalleryData();
  const toggleFavoriteMutation = useToggleFavorite();
  const togglePTRMutation = useTogglePTR();
  const markPTRAsSentMutation = useMarkPTRAsSent();
  const queryClient = useQueryClient();

  // Get user session for userId
  const { data: session } = useSession();

  // Extract data with fallbacks
  const galleryItems = galleryData?.items || [];
  const categories = galleryData?.categories || [];
  const creators = galleryData?.creators || [];
  const postOrigins = galleryData?.postOrigins || [];
  const breakdown = galleryData?.breakdown || {
    favorites: 0,
    releases: 0,
    library: 0,
  };

  // --- Filtering Logic ---
  const {
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    activeCollection,
    setActiveCollection,
    debouncedSearch,
    filteredContent,
  } = useGalleryFilters({ items: galleryItems });

  // Reset page when filters change (implicit dependency on filteredContent length changing)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, activeCollection]);

  // Calculate total revenue from all gallery items (for stats)
  const totalRevenue = React.useMemo(() => {
    return galleryItems.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  }, [galleryItems]);

  // --- Pagination Logic ---
  const totalItems = filteredContent.length;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContent = filteredContent.slice(startIndex, endIndex);

  const selectionContextItems = paginatedContent;

  const {
    selectionMode,
    setSelectionMode,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    selectedItems,
  } = useGallerySelection({ items: selectionContextItems });

  // --- Actions ---
  const handleToggleFavorite = (item: GalleryItem) => {
    const action = item.isFavorite ? "remove" : "add";
    const userId = session?.user?.id || session?.user?.email || "current-user";
    toggleFavoriteMutation.mutate({ item, action, userId });
  };

  const handleTogglePTR = (item: GalleryItem) => {
    const action = item.isPTR ? "remove" : "add";
    const userId = session?.user?.id || session?.user?.email || "current-user";
    toggleTogglePTRMutation(item, action, userId);
  };
  // Correction: used mutation directly
  const toggleTogglePTRMutation = (item: GalleryItem, action: 'add' | 'remove', userId: string) => {
      togglePTRMutation.mutate({ item, action, userId });
  }


  const handleMarkPTRAsSent = (item: GalleryItem) => {
    const userId = session?.user?.id || session?.user?.email || "current-user";
    markPTRAsSentMutation.mutate({ item, userId });
  };

  const handleClearCache = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery });
      toast.success("Cache cleared successfully");
    } catch (error) {
      toast.error("Failed to clear cache");
    }
  };

  // --- Bulk Actions ---
  const handleBulkFavorite = async () => {
    const userId = session?.user?.id || session?.user?.email || "current-user";
    let successCount = 0;
    let errorCount = 0;

    toast.loading(`Adding ${selectedItems.length} items to favorites...`);

    for (const item of selectedItems) {
      try {
        const action = item.isFavorite ? "remove" : "add";
        await toggleFavoriteMutation.mutateAsync({ item, action, userId });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`Successfully updated ${successCount} items`);
    } else {
      toast.warning(`Updated ${successCount} items, ${errorCount} failed`);
    }

    clearSelection();
  };

  const handleBulkPTR = async () => {
    const userId = session?.user?.id || session?.user?.email || "current-user";
    let successCount = 0;
    let errorCount = 0;

    toast.loading(`Updating ${selectedItems.length} items for PTR...`);

    for (const item of selectedItems) {
      try {
        const action = item.isPTR ? "remove" : "add";
        await togglePTRMutation.mutateAsync({ item, action, userId });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`Successfully updated ${successCount} items`);
    } else {
      toast.warning(`Updated ${successCount} items, ${errorCount} failed`);
    }

    clearSelection();
  };

  const handleBulkExport = () => {
    const headers = ["ID", "Title", "Category", "Creator", "Revenue", "Buys", "Outcome", "Date Added"];
    const rows = selectedItems.map((item) => [
      item.id,
      item.title,
      item.category,
      item.creatorName || "",
      item.totalRevenue,
      item.totalBuys,
      item.outcome || "",
      item.dateAdded,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gallery-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedItems.length} items to CSV`);
    clearSelection();
  };

   // --- Shortcuts ---
  useGalleryShortcuts({
    searchInputRef,
    selectionMode,
    setSelectionMode,
    clearSelection,
    selectAll,
    toggleSelectionMode,
    setShowShortcutsHelp,
    showShortcutsHelp,
    setViewMode,
    viewMode,
    focusedIndex,
    setFocusedIndex,
    paginatedContent: selectionContextItems,
    toggleSelection,
    handleToggleFavorite,
    handleTogglePTR,
    handleClearCache,
  });

  // --- Smart Collections Helpers ---
  const handleSelectCollection = useCallback(
    (collectionId: string, collectionFilters?: Partial<FilterState>) => {
      setActiveCollection(collectionId);
      if (collectionFilters) {
        setFilters((prev) => ({ ...prev, ...collectionFilters }));
      }
      setCurrentPage(1);
    },
    [setActiveCollection, setFilters]
  );

  const handleClearCollection = useCallback(() => {
    setActiveCollection(null);
  }, [setActiveCollection]);

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

  const gridConfig = getGridConfig(viewMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 mb-2 backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Title Section */}
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

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <ViewModeSwitcher
                  currentView={viewMode}
                  onViewChange={setViewMode}
                />

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
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={
                    selectionMode
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                  }
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {selectionMode ? "Exit Selection" : "Select Mode"}
                </Button>

                <Button
                  variant={showCollectionsSidebar ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCollectionsSidebar(!showCollectionsSidebar)}
                  className={
                    showCollectionsSidebar
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10"
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Collections
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
        <div className="mb-4">
          <SearchBar
            ref={searchInputRef}
            searchQuery={filters.search}
            onSearchChange={(value) =>
              setFilters((prev) => ({ ...prev, search: value }))
            }
            placeholder="Search content, captions, creators..."
          />
        </div>

        {/* Filter Presets */}
        <div className="mb-6">
          <FilterPresets
            onApplyPreset={(presetFilters) => {
              setFilters((prev) => ({ ...prev, ...presetFilters }));
              setActiveCollection(null);
              setCurrentPage(1);
            }}
            currentFilters={filters}
          />
        </div>

        {/* Navigation and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            breakdown={breakdown}
            galleryItemsLength={galleryItems.length}
          />

          <div className="flex items-center gap-3">
            {/* Sheet/Board Toggle Switch */}
            <div className="flex items-center h-12 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setFilters(prev => ({ ...prev, dataSource: "SHEET" }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filters.dataSource === "SHEET"
                    ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Table2 className="w-4 h-4" />
                Sheet
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, dataSource: "BOARD" }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filters.dataSource === "BOARD"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Kanban className="w-4 h-4" />
                Board
              </button>
            </div>

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
              postOrigins={postOrigins}
              onClearAll={() =>
                setFilters((prev) => ({
                  search: "",
                  category: "all",
                  creator: "all",
                  messageType: "all",
                  outcome: "all",
                  sortBy: "revenue",
                  revenue: "",
                  dataSource: prev.dataSource,
                  postOrigin: "all",
                }))
              }
            />
          </div>
        )}

        {/* Stats Cards */}
        <StatsCards
          totalContent={breakdown.library}
          totalSales={breakdown.releases}
          totalRevenue={totalRevenue}
        />

        {/* Main Content Area */}
        <div className={cn("flex gap-6", showCollectionsSidebar ? "flex-row" : "flex-col")}>
          {/* Smart Collections Sidebar */}
          {showCollectionsSidebar && (
            <div className="w-72 flex-shrink-0">
              <div className="sticky top-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <SmartCollections
                  items={galleryItems}
                  activeCollection={activeCollection || undefined}
                  onSelectCollection={handleSelectCollection}
                  onClearCollection={handleClearCollection}
                  className="h-[calc(100vh-300px)] max-h-[700px]"
                />
              </div>
            </div>
          )}

          {/* Content Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Active Collection Indicator */}
            {activeCollection && (
              <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-sm text-pink-700 dark:text-pink-300">
                  Viewing: <span className="font-semibold capitalize">{activeCollection.replace(/-/g, " ")}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCollection}
                  className="ml-auto h-6 px-2 text-pink-600 hover:text-pink-700 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Content Grid */}
            {paginatedContent.length > 0 ? (
              <div
                className={cn(
                  "grid mb-8",
                  gridConfig.gap,
                  gridConfig.columns
                )}
              >
                {paginatedContent.map((content, index) => {
                  const isFocused = index === focusedIndex;

                  return (
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
                      <div className={cn(isFocused && "ring-2 ring-pink-500 ring-offset-2 rounded-xl")}>
                        {viewMode === "list" ? (
                          <ListCard
                            content={content}
                            onToggleFavorite={handleToggleFavorite}
                            onTogglePTR={handleTogglePTR}
                            onMarkPTRAsSent={handleMarkPTRAsSent}
                            selectionMode={selectionMode}
                            isSelected={selectedIds.has(content.id)}
                            onToggleSelection={toggleSelection}
                            cardHeight={gridConfig.cardHeight}
                          />
                        ) : viewMode === "compact" ? (
                          <CompactCard
                            content={content}
                            onToggleFavorite={handleToggleFavorite}
                            onTogglePTR={handleTogglePTR}
                            onMarkPTRAsSent={handleMarkPTRAsSent}
                            selectionMode={selectionMode}
                            isSelected={selectedIds.has(content.id)}
                            onToggleSelection={toggleSelection}
                            cardHeight={gridConfig.cardHeight}
                            imageHeight={gridConfig.imageHeight}
                          />
                        ) : (
                          <ContentCard
                            content={content}
                            onToggleFavorite={handleToggleFavorite}
                            onTogglePTR={handleTogglePTR}
                            onMarkPTRAsSent={handleMarkPTRAsSent}
                            selectionMode={selectionMode}
                            isSelected={selectedIds.has(content.id)}
                            onToggleSelection={toggleSelection}
                          />
                        )}
                      </div>
                    </ErrorBoundary>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 mb-8">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mb-6">
                  {filters.dataSource === "BOARD" ? (
                    <Kanban className="w-10 h-10 text-blue-500" />
                  ) : (
                    <Table2 className="w-10 h-10 text-green-500" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No {filters.dataSource === "BOARD" ? "Board" : "Sheet"} Content
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                  {activeCollection
                    ? `No content matches the "${activeCollection.replace(/-/g, " ")}" collection criteria.`
                    : filters.dataSource === "BOARD"
                    ? "No content has been marked as final from the Board yet. Mark tasks as final in the Board to see them here."
                    : "No content from the Sheet data source matches your current filters."
                  }
                </p>
                {activeCollection ? (
                  <Button
                    variant="outline"
                    onClick={handleClearCollection}
                    className="rounded-xl"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Clear Collection Filter
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      dataSource: filters.dataSource === "BOARD" ? "SHEET" : "BOARD"
                    }))}
                    className="rounded-xl"
                  >
                    {filters.dataSource === "BOARD" ? (
                      <>
                        <Table2 className="w-4 h-4 mr-2" />
                        View Sheet Content
                      </>
                    ) : (
                      <>
                        <Kanban className="w-4 h-4 mr-2" />
                        View Board Content
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pagination - show if there are multiple pages */}
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

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedCount={selectedIds.size}
          onBulkFavorite={handleBulkFavorite}
          onBulkPTR={handleBulkPTR}
          onBulkExport={handleBulkExport}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />

        {/* Keyboard Shortcuts Help Modal */}
        <KeyboardShortcutsModal
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
        />
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
