"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  Users,
  Activity,
  SortAsc,
  SortDesc,
  Grid3x3,
  List,
  Settings,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Search input component with debouncing
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search models, referrers, or tags...",
  className,
  debounceMs = 300,
}: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce the onChange call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]); // Don't include localValue to avoid infinite loop

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className={cn("relative transition-all duration-200", className)}>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
            "w-4 h-4",
            isFocused ? "text-primary-500" : "text-gray-400"
          )}
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-200",
            "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
            "border-gray-200 dark:border-gray-700",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "focus:outline-none focus:border-primary-300 dark:focus:border-primary-600",
            "hover:border-gray-300 dark:hover:border-gray-600"
          )}
          autoComplete="off"
          spellCheck="false"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
};

// Quick filter chips
type QuickFilterType = "all" | "active" | "dropped" | "high-revenue" | "recent";

interface QuickFilterChip {
  id: QuickFilterType;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface QuickFiltersProps {
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  modelStats: {
    total: number;
    active: number;
    dropped: number;
    highRevenue: number;
    recent: number;
  };
}

const QuickFilters = ({
  activeFilter,
  onFilterChange,
  modelStats,
}: QuickFiltersProps) => {
  const filters: QuickFilterChip[] = [
    { id: "all", label: "All Models", count: modelStats.total, icon: Grid3x3 },
    { id: "active", label: "Active", count: modelStats.active, icon: Activity },
    { id: "dropped", label: "Dropped", count: modelStats.dropped },
    {
      id: "high-revenue",
      label: "Top Performers",
      count: modelStats.highRevenue,
      icon: TrendingUp,
    },
    { id: "recent", label: "Recent", count: modelStats.recent, icon: Calendar },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-target",
              isActive
                ? "bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-500 dark:to-purple-500 text-gray-800 dark:text-white shadow-lg shadow-pink-300/25 dark:shadow-pink-500/25"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10"
            )}
          >
            {Icon && (
              <Icon className={cn(
                "w-4 h-4",
                isActive ? "text-gray-800 dark:text-white" : "text-gray-700 dark:text-gray-300"
              )} />
            )}
            <span className={cn(
              isActive ? "text-gray-800 dark:text-white" : "text-gray-700 dark:text-gray-300"
            )}>
              {filter.label}
            </span>
            {filter.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs font-bold",
                  isActive
                    ? "bg-white/30 text-gray-800 dark:bg-white/20 dark:text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400"
                )}
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Sort options
type SortOption = "name" | "date" | "revenue" | "subscribers";
type SortDirection = "asc" | "desc";

interface SortControlProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
}

const SortControl = ({
  sortBy,
  sortDirection,
  onSortChange,
}: SortControlProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: {
    id: SortOption;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "name", label: "Name", icon: SortAsc },
    { id: "date", label: "Launch Date", icon: Calendar },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "subscribers", label: "Subscribers", icon: Users },
  ];

  const currentOption = sortOptions.find((opt) => opt.id === sortBy);
  const SortIcon = sortDirection === "asc" ? SortAsc : SortDesc;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors duration-200 touch-target"
      >
        {currentOption && (
          <currentOption.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentOption?.label || "Sort by"}
        </span>
        <SortIcon className="w-4 h-4 text-gray-500" />
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full mt-2 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px] py-1">
            {sortOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <div key={option.id}>
                  <button
                    onClick={() => {
                      onSortChange(option.id, "asc");
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150",
                      sortBy === option.id && sortDirection === "asc"
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <OptionIcon className="w-4 h-4" />
                    <span className="text-sm">{option.label} (A-Z)</span>
                    <SortAsc className="w-3 h-3 ml-auto opacity-60" />
                  </button>
                  <button
                    onClick={() => {
                      onSortChange(option.id, "desc");
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150",
                      sortBy === option.id && sortDirection === "desc"
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <OptionIcon className="w-4 h-4" />
                    <span className="text-sm">{option.label} (Z-A)</span>
                    <SortDesc className="w-3 h-3 ml-auto opacity-60" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// Advanced filters panel
interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    statusFilter: string[];
    revenueRange: [number, number];
    dateRange: [Date | null, Date | null];
    referrerFilter: string[];
    socialFilter: {
      hasInstagram: boolean;
      hasTwitter: boolean;
      hasTiktok: boolean;
    };
  };
  onFiltersChange: (filters: any) => void;
}

const AdvancedFilters = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: AdvancedFiltersProps) => {
  if (!isOpen) return null;

  const statusOptions = ["active", "dropped", "pending"];
  const referrerOptions = ["Instagram", "TikTok", "Direct", "Twitter", "Other"];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-96 max-w-full relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Filter className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            Advanced Filters
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors touch-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Content */}
        <div className="relative p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Status Filter */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              Model Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.statusFilter.includes(status)}
                    onChange={(e) => {
                      const newStatusFilter = e.target.checked
                        ? [...filters.statusFilter, status]
                        : filters.statusFilter.filter((s) => s !== status);
                      onFiltersChange({
                        ...filters,
                        statusFilter: newStatusFilter,
                      });
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Revenue Range */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              Monthly Revenue Range
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={filters.revenueRange[1]}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    revenueRange: [
                      filters.revenueRange[0],
                      parseInt(e.target.value),
                    ],
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>$0</span>
                <span>${filters.revenueRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Social Media Filter */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              Social Media Presence
            </label>
            <div className="space-y-2">
              {Object.entries(filters.socialFilter).map(
                ([platform, enabled]) => (
                  <label
                    key={platform}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          socialFilter: {
                            ...filters.socialFilter,
                            [platform]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {platform.replace("has", "")}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative flex items-center gap-3 p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => {
              onFiltersChange({
                statusFilter: [],
                revenueRange: [0, 50000],
                dateRange: [null, null],
                referrerFilter: [],
                socialFilter: {
                  hasInstagram: false,
                  hasTwitter: false,
                  hasTiktok: false,
                },
              });
            }}
            className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// View toggle control
type ViewMode = "grid" | "list";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => onViewChange("grid")}
        className={cn(
          "p-2 rounded-md transition-all duration-200 touch-target",
          view === "grid"
            ? "bg-white dark:bg-gray-700 shadow-sm"
            : "hover:bg-gray-50 dark:hover:bg-gray-700"
        )}
        aria-label="Grid view"
      >
        <Grid3x3
          className={cn(
            "w-4 h-4",
            view === "grid" ? "text-primary-500" : "text-gray-500"
          )}
        />
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={cn(
          "p-2 rounded-md transition-all duration-200 touch-target",
          view === "list"
            ? "bg-white dark:bg-gray-700 shadow-sm"
            : "hover:bg-gray-50 dark:hover:bg-gray-700"
        )}
        aria-label="List view"
      >
        <List
          className={cn(
            "w-4 h-4",
            view === "list" ? "text-primary-500" : "text-gray-500"
          )}
        />
      </button>
    </div>
  );
};

// Main component
interface ModelsSearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  quickFilter: QuickFilterType;
  onQuickFilterChange: (filter: QuickFilterType) => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  modelStats: {
    total: number;
    active: number;
    dropped: number;
    highRevenue: number;
    recent: number;
  };
  className?: string;
}

const ModelsSearchAndFilter = ({
  searchQuery,
  onSearchChange,
  quickFilter,
  onQuickFilterChange,
  sortBy,
  sortDirection,
  onSortChange,
  view,
  onViewChange,
  modelStats,
  className,
}: ModelsSearchAndFilterProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    statusFilter: [],
    revenueRange: [0, 50000] as [number, number],
    dateRange: [null, null] as [Date | null, Date | null],
    referrerFilter: [],
    socialFilter: {
      hasInstagram: false,
      hasTwitter: false,
      hasTiktok: false,
    },
  });

  const hasActiveAdvancedFilters = useMemo(() => {
    return (
      advancedFilters.statusFilter.length > 0 ||
      advancedFilters.revenueRange[1] < 50000 ||
      advancedFilters.referrerFilter.length > 0 ||
      Object.values(advancedFilters.socialFilter).some(Boolean)
    );
  }, [advancedFilters]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and primary controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 touch-target",
              hasActiveAdvancedFilters
                ? "border-primary-300 bg-primary-50 text-primary-600 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
            )}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveAdvancedFilters && (
              <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300 rounded-full text-xs font-bold">
                •
              </span>
            )}
          </button>

          <SortControl
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
          />

          <ViewToggle view={view} onViewChange={onViewChange} />
        </div>
      </div>

      {/* Quick filters */}
      <QuickFilters
        activeFilter={quickFilter}
        onFilterChange={onQuickFilterChange}
        modelStats={modelStats}
      />

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {modelStats.total} models
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        <div className="flex items-center gap-2">
          <span>Updated just now</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Advanced filters modal */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
      />
    </div>
  );
};

export default ModelsSearchAndFilter;
export type {
  ModelsSearchAndFilterProps,
  QuickFilterType,
  SortOption,
  SortDirection,
  ViewMode,
};
