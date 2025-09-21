"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus,
  Download,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import our new components
import { ModelsGrid, GridSection, GridEmptyState } from "../grids/ModelsGrid";
import EnhancedModelCard from "../cards/EnhancedModelCard";
import ModelsSearchAndFilter, {
  type QuickFilterType,
  type SortOption,
  type SortDirection,
  type ViewMode,
} from "../grids/ModelsSearchAndFilter";
import {
  ModelsGridSkeleton,
  SearchSkeleton,
  LoadingSpinner,
  RefreshButton,
  EmptyState,
} from "../../../shared/ui/LoadingStates";
import { useOptimizedModelsData } from "@/hooks/useOptimizedModels";
import useSelectedModelStore from "@/store/useSelectedModelStore";

// Stats dashboard component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "success" | "warning" | "info";
  progressPercent?: number; // 0-100
  progressLabel?: string;
}

const StatsCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  progressPercent,
  progressLabel,
}: StatsCardProps) => {
  const colorClasses = {
    primary: {
      bg: "bg-gradient-to-br from-pink-100/70 to-purple-100/70 dark:from-white/5 dark:to-white/5",
      border: "border-pink-200 dark:border-purple-500/30",
      icon: "text-pink-600 dark:text-pink-400",
      text: "text-gray-900 dark:text-white",
      bar: "bg-pink-500",
    },
    success: {
      bg: "bg-gradient-to-br from-emerald-100/70 to-teal-100/70 dark:from-white/5 dark:to-white/5",
      border: "border-emerald-200 dark:border-emerald-500/30",
      icon: "text-emerald-600 dark:text-emerald-400",
      text: "text-gray-900 dark:text-white",
      bar: "bg-emerald-500",
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-100/70 to-orange-100/70 dark:from-white/5 dark:to-white/5",
      border: "border-amber-200 dark:border-orange-500/30",
      icon: "text-orange-600 dark:text-orange-400",
      text: "text-gray-900 dark:text-white",
      bar: "bg-orange-500",
    },
    info: {
      bg: "bg-gradient-to-br from-sky-100/70 to-blue-100/70 dark:from-white/5 dark:to-white/5",
      border: "border-sky-200 dark:border-sky-500/30",
      icon: "text-sky-600 dark:text-sky-400",
      text: "text-gray-900 dark:text-white",
      bar: "bg-sky-500",
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-200 hover:shadow-xl",
        classes.bg,
        classes.border
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-200">
              {title}
            </p>
            <p className={cn("text-3xl font-bold", classes.text)}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div
            className={cn(
              "p-3 rounded-xl bg-white/80 dark:bg-white/10 border",
              classes.border
            )}
          >
            <Icon className={cn("w-6 h-6", classes.icon)} />
          </div>
        </div>

        {change && (
          <div className="flex items-center gap-1 mt-4">
            <TrendingUp
              className={cn(
                "w-4 h-4",
                change.type === "increase"
                  ? "text-success-500"
                  : "text-error-500 rotate-180"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                change.type === "increase"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {change.value > 0 ? "+" : ""}
              {change.value}%
            </span>
            <span className="text-sm text-gray-400">vs last month</span>
          </div>
        )}

        {typeof (progressPercent ?? -1) === "number" &&
          progressPercent !== undefined && (
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", classes.bar)}
                  style={{
                    width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                  }}
                />
              </div>
              {progressLabel && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  {progressLabel}
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

// Page header component
interface PageHeaderProps {
  onAddModel?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const PageHeader = ({
  onAddModel,
  onExport,
  isLoading,
  onRefresh,
}: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          My Models
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and track your model performance
        </p>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <RefreshButton isLoading={isLoading} onClick={onRefresh} size="md" />
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors duration-200 touch-target"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}

        {onAddModel && (
          <button
            onClick={onAddModel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-lg shadow-primary-500/25 transition-all duration-200 touch-target"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        )}
      </div>
    </div>
  );
};

// Main enhanced models page component
interface EnhancedModelsPageProps {
  userRole?: string;
  assignedCreators?: string[];
  showHeader?: boolean;
}

const EnhancedModelsPage = ({
  userRole = "USER",
  assignedCreators = [],
  showHeader = true,
}: EnhancedModelsPageProps) => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Map UI filters to query-safe values
  const effectiveStatus = useMemo<ModelStatus | "all" | undefined>(() => {
    if (quickFilter === "all") return "all";
    if (quickFilter === "active") return "active";
    if (quickFilter === "dropped") return "dropped";
    return undefined; // non-status quick filters shouldn't constrain query
  }, [quickFilter]);

  const effectiveSort = useMemo<"name" | "date" | "revenue">(() => {
    if (sortBy === "subscribers") return "revenue";
    return sortBy;
  }, [sortBy]);

  // Optimized data fetching
  const {
    models,
    stats,
    isLoading,
    isError,
    error,
    performance,
    handlers,
    pagination,
  } = useOptimizedModelsData({
    search: searchQuery,
    status: effectiveStatus,
    sort: effectiveSort,
    creators: userRole !== "ADMIN" ? assignedCreators : [],
  });

  // Reset to page 1 on new queries
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, quickFilter, sortBy, sortDirection]);

  // Derived pagination values
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(models.length / itemsPerPage));
  }, [models.length, itemsPerPage]);

  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(models.length, startIndex + itemsPerPage);
  const paginatedModels = useMemo(
    () => models.slice(startIndex, endIndex),
    [models, startIndex, endIndex]
  );

  // Get the store setter
  const setSelectedModel = useSelectedModelStore((state) => state.setSelectedModel);

  // Memoized event handlers
  const handleModelClick = useCallback((model: ModelDetails) => {
    // Save the model data to Zustand store before navigation
    setSelectedModel(model);
    
    // Navigate using display name so the detail page can normalize
    const encoded = encodeURIComponent(model.name);
    window.location.href = `/apps/pod-new/my-models/${encoded}`;
  }, [setSelectedModel]);

  const handleAddModel = useCallback(() => {
    // Add model logic would go here
  }, []);

  const handleExport = useCallback(() => {
    // Export logic would go here
  }, []);

  const handleRefresh = useCallback(() => {
    handlers.refetchModels();
  }, [handlers]);

  const handleSortChange = useCallback(
    (newSortBy: SortOption, direction: SortDirection) => {
      setSortBy(newSortBy);
      setSortDirection(direction);
    },
    []
  );

  // Memoized stats for quick filters
  const modelStats = useMemo(() => {
    const total = models.length;
    const active = models.filter(
      (m) => m.status.toLowerCase() === "active"
    ).length;
    const dropped = total - active;
    const highRevenue = models.filter(
      (m) => (m.stats?.monthlyRevenue || 0) > 10000
    ).length;
    const recent = models.filter((m) => {
      if (!m.launchDate) return false;
      const launchDate = new Date(m.launchDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return launchDate >= thirtyDaysAgo;
    }).length;

    return { total, active, dropped, highRevenue, recent };
  }, [models]);

  // Memoized dashboard stats
  const dashboardStats = useMemo(() => {
    const totalRevenue = models.reduce(
      (sum, model) => sum + (model.stats?.monthlyRevenue || 0),
      0
    );
    const avgRevenue = models.length > 0 ? totalRevenue / models.length : 0;
    const totalSubscribers = models.reduce(
      (sum, model) => sum + (model.stats?.subscribers || 0),
      0
    );

    return {
      totalModels: models.length,
      activeModels: modelStats.active,
      totalRevenue,
      avgRevenue,
      totalSubscribers,
      activePercentage:
        models.length > 0 ? (modelStats.active / models.length) * 100 : 0,
    };
  }, [models, modelStats]);

  // Loading state
  if (isLoading && models.length === 0) {
    return (
      <div className="space-y-6">
        {/* Intentionally no header/search skeletons to avoid duplicate top loaders */}

        <ModelsGridSkeleton count={12} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          onAddModel={handleAddModel}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isLoading={false}
        />

        <EmptyState
          title="Error loading models"
          description={
            error?.message || "Something went wrong while loading your models"
          }
          icon={<BarChart3 className="w-12 h-12" />}
          action={
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      {showHeader && (
        <PageHeader
          onAddModel={handleAddModel}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Models"
          value={dashboardStats.totalModels}
          change={{ value: 12, type: "increase" }}
          icon={Users}
          color="primary"
          progressPercent={Math.min(
            100,
            Math.round(
              (dashboardStats.activeModels /
                Math.max(1, dashboardStats.totalModels)) *
                100
            )
          )}
          progressLabel="Active utilization"
        />
        <StatsCard
          title="Active Models"
          value={dashboardStats.activeModels}
          change={{ value: 8, type: "increase" }}
          icon={TrendingUp}
          color="success"
          progressPercent={Math.round(dashboardStats.activePercentage)}
          progressLabel="Active percentage"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${dashboardStats.totalRevenue.toLocaleString()}`}
          change={{ value: 23, type: "increase" }}
          icon={DollarSign}
          color="warning"
          progressPercent={
            dashboardStats.totalModels > 0
              ? Math.min(
                  100,
                  Math.round(
                    (dashboardStats.avgRevenue /
                      Math.max(1, dashboardStats.totalRevenue)) *
                      100
                  )
                )
              : 0
          }
          progressLabel="Average share"
        />
        <StatsCard
          title="Total Subscribers"
          value={dashboardStats.totalSubscribers.toLocaleString()}
          change={{ value: 15, type: "increase" }}
          icon={BarChart3}
          color="info"
          progressPercent={Math.min(
            100,
            Math.round(
              (dashboardStats.totalSubscribers /
                Math.max(1, dashboardStats.totalSubscribers)) *
                100
            )
          )}
          progressLabel="Subscribers"
        />
      </div>

      {/* Search and Filters */}
      <ModelsSearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        view={viewMode}
        onViewChange={setViewMode}
        modelStats={modelStats}
      />

      {/* Models Grid */}
      <GridSection>
        {models.length === 0 ? (
          <GridEmptyState
            title="No models found"
            description="Try adjusting your search criteria or add your first model"
            icon={<Users className="w-12 h-12" />}
            action={
              <button
                onClick={handleAddModel}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
              >
                Add Your First Model
              </button>
            }
          />
        ) : (
          <ModelsGrid
            density="standard"
            className={cn(
              viewMode === "list" ? "grid-cols-1 lg:grid-cols-2" : ""
            )}
          >
            {paginatedModels.map((model, index) => (
              <EnhancedModelCard
                key={model.id}
                model={model}
                index={startIndex + index}
                onClick={() => handleModelClick(model)}
                priority={index < 8} // First 8 are priority
                variant={viewMode === "list" ? "compact" : "default"}
                showPerformanceIndicator={true}
              />
            ))}
          </ModelsGrid>
        )}

        {/* Numeric pagination */}
        {models.length > 0 && (
          <div className="flex items-center justify-between pt-8 gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1}-{endIndex} of {models.length} models
              {performance && (
                <span className="ml-2 text-xs">
                  • Efficiency {(performance.filterRatio * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const windowStart = Math.max(
                  1,
                  Math.min(clampedPage - 2, totalPages - 4)
                );
                const pageNumber = windowStart + i;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm border transition-colors",
                      pageNumber === clampedPage
                        ? "bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-500 dark:to-purple-500 text-gray-800 dark:text-white border-pink-300 dark:border-pink-500 shadow-lg shadow-pink-300/25 dark:shadow-pink-500/25"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={clampedPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GridSection>
    </div>
  );
};

export default EnhancedModelsPage;
export type { EnhancedModelsPageProps };
