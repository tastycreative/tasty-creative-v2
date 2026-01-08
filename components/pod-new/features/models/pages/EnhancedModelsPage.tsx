"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Users, DollarSign, TrendingUp } from "lucide-react";

// Modular components
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
  EmptyState,
} from "../../../shared/ui/LoadingStates";

// Shared components
import { StatsCard } from "../shared/StatsCard";
import { PageHeader } from "../shared/PageHeader";

// Utilities
import {
  formatCompactNumber,
  parseGuaranteedAmount,
  isRecentModel,
  isHighRevenueModel,
} from "../utils";

// Hooks and stores
import { useOptimizedModelsData } from "@/hooks/useOptimizedModels";
import { useGlobalModelsStats } from "@/hooks/usePodNewModels";
import useSelectedModelStore from "@/store/useSelectedModelStore";

// Types
type ModelStatus = "active" | "dropped" | "all";

// Use 'any' for model type since the processed models have dynamic properties
type ProcessedModel = {
  id: string;
  name: string;
  status: string;
  launchDate?: string;
  guaranteed?: string | number | null;
  [key: string]: any;
};

export interface EnhancedModelsPageProps {
  userRole?: string;
  assignedCreators?: string[];
  showHeader?: boolean;
}

export default function EnhancedModelsPage({
  userRole = "USER",
  assignedCreators = [],
  showHeader = true,
}: EnhancedModelsPageProps) {
  const router = useRouter();
  const setSelectedModel = useSelectedModelStore((state) => state.setSelectedModel);

  // Filter and view state
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);

  // Map UI filters to query-safe values
  const effectiveStatus = useMemo<ModelStatus | undefined>(() => {
    if (quickFilter === "all") return "all";
    if (quickFilter === "active") return "active";
    if (quickFilter === "dropped") return "dropped";
    return undefined;
  }, [quickFilter]);

  // Data fetching
  const isPrivilegedUser = userRole === "ADMIN" || userRole === "MODERATOR";
  const {
    models: rawModels,
    isLoading,
    isError,
    error,
    performance,
    handlers,
  } = useOptimizedModelsData({
    search: searchQuery,
    status: effectiveStatus,
    sort: sortBy,
    creators: isPrivilegedUser ? [] : assignedCreators,
  });

  const { data: globalStats } = useGlobalModelsStats();

  // Apply client-side filtering for non-status filters
  const models = useMemo(() => {
    // Cast to any[] since rawModels may have additional properties from the API
    const typedModels = rawModels as ProcessedModel[];

    if (["all", "active", "dropped"].includes(quickFilter)) {
      return typedModels;
    }

    if (quickFilter === "recent") {
      return typedModels.filter((model) => isRecentModel(model.launchDate));
    }

    if (quickFilter === "high-revenue") {
      return typedModels
        .filter((model) => isHighRevenueModel(model.guaranteed))
        .sort((a, b) => {
          const aVal = parseGuaranteedAmount(a.guaranteed);
          const bVal = parseGuaranteedAmount(b.guaranteed);
          return bVal - aVal;
        });
    }

    return typedModels;
  }, [rawModels, quickFilter]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, quickFilter, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(models.length / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(models.length, startIndex + itemsPerPage);
  const paginatedModels = useMemo(
    () => models.slice(startIndex, endIndex),
    [models, startIndex, endIndex]
  );

  // Stats for quick filters
  const modelStats = useMemo(() => ({
    total: rawModels.length,
    active: rawModels.filter((m) => m.status.toLowerCase() === "active").length,
    dropped: rawModels.filter((m) => m.status.toLowerCase() !== "active").length,
    highRevenue: rawModels.filter((m) => isHighRevenueModel(m.guaranteed)).length,
    recent: rawModels.filter((m) => isRecentModel(m.launchDate)).length,
  }), [rawModels]);

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    const assignedGuaranteed = models.reduce(
      (sum, model) => sum + parseGuaranteedAmount(model.guaranteed),
      0
    );
    const avgGuaranteed = models.length > 0 ? assignedGuaranteed / models.length : 0;

    return {
      totalModels: globalStats?.totalModels || 0,
      activeModels: globalStats?.activeModels || 0,
      totalRevenue: globalStats?.totalRevenue || 0,
      avgRevenue: avgGuaranteed,
      assignedToMe: models.length,
      activePercentage: globalStats?.activePercentage || 0,
    };
  }, [models, globalStats]);

  // Handlers
  const handleModelClick = useCallback(
    (model: ProcessedModel) => {
      setSelectedModel(model as any);
      router.push(`/my-models/${encodeURIComponent(model.name)}`);
    },
    [setSelectedModel, router]
  );

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

  // Loading state
  if (isLoading && models.length === 0) {
    return (
      <div className="space-y-6">
        <ModelsGridSkeleton count={12} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader onRefresh={handleRefresh} isLoading={false} />
        <EmptyState
          title="Error loading models"
          description={error?.message || "Something went wrong while loading your models"}
          icon={<BarChart3 className="w-12 h-12" />}
          action={
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
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
      {showHeader && (
        <PageHeader onRefresh={handleRefresh} isLoading={isLoading} />
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Models"
          value={dashboardStats.totalModels}
          change={{ value: 12, type: "increase" }}
          icon={Users}
          color="primary"
          progressPercent={Math.round(
            (dashboardStats.activeModels / Math.max(1, dashboardStats.totalModels)) * 100
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
              ? Math.round(
                  (dashboardStats.avgRevenue / Math.max(1, dashboardStats.totalRevenue)) * 100
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
              ? Math.round((dashboardStats.assignedToMe / dashboardStats.totalModels) * 100)
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
              !isPrivilegedUser && assignedCreators.length === 0
                ? "No models assigned to you"
                : "No models found"
            }
            description={
              !isPrivilegedUser && assignedCreators.length === 0
                ? "You don't have any creators assigned to your team yet."
                : "Try adjusting your search criteria or add your first model"
            }
            icon={<Users className="w-12 h-12" />}
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
                priority={index < 8}
                variant="default"
                showPerformanceIndicator
              />
            ))}
          </ModelsGrid>
        )}

        {/* Pagination */}
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
                const windowStart = Math.max(1, Math.min(clampedPage - 2, totalPages - 4));
                const pageNumber = windowStart + i;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      pageNumber === clampedPage
                        ? "bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-500 dark:to-purple-500 text-gray-800 dark:text-white border-pink-300 dark:border-pink-500 shadow-lg"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
}
