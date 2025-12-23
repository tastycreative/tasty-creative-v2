"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ModelsTable } from "../tables/ModelsTable";
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
import { useGlobalModelsStats } from "@/hooks/usePodNewModels";
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
  const colorConfigs = {
    primary: {
      gradient: "from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    success: {
      gradient: "from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
      gradient: "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    info: {
      gradient: "from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
  };

  const config = colorConfigs[color];

  return (
    <div className="relative group p-6 rounded-3xl bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110", config.iconBg)}>
          <Icon className={cn("w-6 h-6", config.iconColor)} />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
            change.type === "increase"
              ? "bg-emerald-50/50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              : "bg-red-50/50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
          )}>
            <TrendingUp className={cn("w-3 h-3", change.type === "decrease" && "rotate-180")} />
            {change.value}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
          {title}
        </h3>
        <p className={cn(
          "text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent drop-shadow-sm",
          config.gradient
        )}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>

      {typeof (progressPercent ?? -1) === "number" && progressPercent !== undefined && (
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
            <span>{progressLabel}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden backdrop-blur-sm">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", config.gradient)}
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
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

// Format large numbers with K/M/B suffix
const formatCompactNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

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
    return sortBy;
  }, [sortBy]);

  // Optimized data fetching
  const {
    models: rawModels,
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
    creators: (userRole !== "ADMIN" && userRole !== "MODERATOR") ? assignedCreators : [],
  });

  // Apply client-side filtering for non-status filters
  const models = useMemo(() => {
    if (quickFilter === "all" || quickFilter === "active" || quickFilter === "dropped") {
      return rawModels; // Already filtered by status in the hook
    }

    if (quickFilter === "recent") {
      return rawModels.filter((model) => {
        if (!model.launchDate) return false;
        const launchDate = new Date(model.launchDate);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return launchDate >= thirtyDaysAgo;
      });
    }

    if (quickFilter === "high-revenue") {
      // Filter for models with guaranteed > $10,000
      const filtered = rawModels.filter((model) => {
        const guaranteedStr = (model as any).guaranteed;
        if (!guaranteedStr || guaranteedStr.trim() === "" || guaranteedStr.trim() === "-") {
          return false;
        }
        const cleanValue = guaranteedStr.replace(/[^0-9.-]/g, "");
        const guaranteed = parseFloat(cleanValue);
        return !isNaN(guaranteed) && guaranteed > 10000;
      });

      // Sort by guaranteed amount (highest to lowest)
      return filtered.sort((a, b) => {
        const getGuaranteed = (m: any) => {
          const str = m.guaranteed;
          if (!str || str.trim() === "" || str.trim() === "-") return 0;
          const val = parseFloat(str.replace(/[^0-9.-]/g, ""));
          return isNaN(val) ? 0 : val;
        };
        return getGuaranteed(b) - getGuaranteed(a);
      });
    }

    return rawModels;
  }, [rawModels, quickFilter]);

  // Fetch global stats (all models, not filtered by user assignments)
  const { data: globalStats } = useGlobalModelsStats();

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
  const setSelectedModel = useSelectedModelStore(
    (state) => state.setSelectedModel
  );

  // Get the router
  const router = useRouter();

  // Memoized event handlers
  const handleModelClick = useCallback(
    (model: ModelDetails) => {
      // Save the model data to Zustand store before navigation
      setSelectedModel(model);

      // Navigate using display name so the detail page can normalize
      const encoded = encodeURIComponent(model.name);
      router.push(`/my-models/${encoded}`);
    },
    [setSelectedModel, router]
  );

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

  // Memoized stats for quick filters (based on all models, not filtered)
  const modelStats = useMemo(() => {
    const total = rawModels.length;
    const active = rawModels.filter(
      (m) => m.status.toLowerCase() === "active"
    ).length;
    const dropped = total - active;
    const highRevenue = rawModels.filter((model) => {
      const guaranteedStr = (model as any).guaranteed;
      if (!guaranteedStr || guaranteedStr.trim() === "" || guaranteedStr.trim() === "-") {
        return false;
      }
      const cleanValue = guaranteedStr.replace(/[^0-9.-]/g, "");
      const guaranteed = parseFloat(cleanValue);
      return !isNaN(guaranteed) && guaranteed > 10000;
    }).length;
    const recent = rawModels.filter((m) => {
      if (!m.launchDate) return false;
      const launchDate = new Date(m.launchDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return launchDate >= thirtyDaysAgo;
    }).length;

    return { total, active, dropped, highRevenue, recent };
  }, [rawModels]);

  // Memoized dashboard stats
  const dashboardStats = useMemo(() => {
    // Use user's assigned models guaranteed amounts for their personal stats
    const assignedGuaranteed = models.reduce(
      (sum, model) => {
        const guaranteedStr = (model as any).guaranteed;
        if (!guaranteedStr || guaranteedStr.trim() === "" || guaranteedStr.trim() === "-") {
          return sum;
        }
        
        // Remove $ symbol and any other non-numeric characters except decimal point
        const cleanValue = guaranteedStr.replace(/[^0-9.-]/g, "");
        const guaranteed = parseFloat(cleanValue);
        
        // Only add if it's a valid positive number
        if (!isNaN(guaranteed) && guaranteed > 0) {
          return sum + guaranteed;
        }
        
        return sum;
      },
      0
    );
    const avgGuaranteed = models.length > 0 ? assignedGuaranteed / models.length : 0;

    return {
      totalModels: globalStats?.totalModels || 0, // Global count of all models
      activeModels: globalStats?.activeModels || 0, // Global count of active models
      totalRevenue: globalStats?.totalRevenue || 0, // Global guaranteed revenue (sum of all guaranteed amounts)
      avgRevenue: avgGuaranteed, // Average guaranteed for user's assigned models
      assignedToMe: models.length, // Show assigned models count
      activePercentage: globalStats?.activePercentage || 0, // Global active percentage
    };
  }, [models, globalStats]);

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
          title="Guaranteed Revenue"
          value={`$${formatCompactNumber(dashboardStats.totalRevenue)}`}
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
          title="Assigned to Me"
          value={dashboardStats.assignedToMe.toLocaleString()}
          change={{ value: 0, type: "increase" }}
          icon={Users}
          color="info"
          progressPercent={
            dashboardStats.totalModels > 0
              ? Math.round(
                  (dashboardStats.assignedToMe / dashboardStats.totalModels) * 100
                )
              : 0
          }
          progressLabel="Of total models"
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
            title={
              (userRole !== "ADMIN" && userRole !== "MODERATOR") && assignedCreators.length === 0
                ? "No models assigned to you"
                : "No models found"
            }
            description={
              (userRole !== "ADMIN" && userRole !== "MODERATOR") && assignedCreators.length === 0
                ? "You don't have any creators assigned to your team yet. Contact your administrator to get assigned to models."
                : "Try adjusting your search criteria or add your first model"
            }
            icon={<Users className="w-12 h-12" />}
            action={
              (userRole === "ADMIN" || userRole === "MODERATOR") ? (
                <button
                  onClick={handleAddModel}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
                >
                  Add Your First Model
                </button>
              ) : null
            }
          />
        ) : viewMode === "list" ? (
          <ModelsTable
            models={paginatedModels}
            onModelClick={handleModelClick}
            startIndex={startIndex}
          />
        ) : (
          <ModelsGrid density="standard">
            {paginatedModels.map((model, index) => (
              <EnhancedModelCard
                key={model.id}
                model={model}
                index={startIndex + index}
                onClick={() => handleModelClick(model)}
                priority={index < 8} // First 8 are priority
                variant="default"
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
