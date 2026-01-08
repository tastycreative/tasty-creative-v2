"use client";

import { Grid3x3, Activity, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickFilterType = "all" | "active" | "dropped" | "high-revenue" | "recent";

interface QuickFilterChip {
  id: QuickFilterType;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface QuickFiltersProps {
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

export function QuickFilters({
  activeFilter,
  onFilterChange,
  modelStats,
}: QuickFiltersProps) {
  const filters: QuickFilterChip[] = [
    { id: "all", label: "All Models", count: modelStats.total, icon: Grid3x3 },
    { id: "active", label: "Active", count: modelStats.active, icon: Activity },
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
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 touch-target border",
              isActive
                ? "bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 border-transparent shadow-lg shadow-gray-900/20 dark:shadow-white/20 transform scale-[1.02]"
                : "bg-white/40 dark:bg-black/20 backdrop-blur-md text-gray-600 dark:text-gray-300 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive
                    ? "text-white dark:text-gray-900"
                    : "text-gray-500 dark:text-gray-400"
                )}
              />
            )}
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-bold ml-1",
                  isActive
                    ? "bg-white/20 text-white dark:bg-black/10 dark:text-gray-900"
                    : "bg-gray-100/50 dark:bg-white/10 text-gray-500 dark:text-gray-400"
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
}
