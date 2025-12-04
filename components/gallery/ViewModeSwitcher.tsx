"use client";

import React from "react";
import { Grid3X3, List, LayoutGrid, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ViewMode = "grid" | "list" | "compact";

interface ViewModeSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  density?: number;
  onDensityChange?: (density: number) => void;
  showDensitySlider?: boolean;
  className?: string;
}

const viewModeConfig = {
  grid: {
    icon: Grid3X3,
    label: "Grid View",
    description: "4-column layout for visual browsing",
  },
  list: {
    icon: List,
    label: "List View",
    description: "Horizontal rows for data comparison",
  },
  compact: {
    icon: LayoutGrid,
    label: "Compact View",
    description: "More items, smaller cards",
  },
};

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  currentView,
  onViewChange,
  density = 50,
  onDensityChange,
  showDensitySlider = false,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* View Mode Toggle */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {(Object.keys(viewModeConfig) as ViewMode[]).map((mode) => {
            const config = viewModeConfig[mode];
            const Icon = config.icon;
            const isActive = currentView === mode;

            return (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewChange(mode)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    )}
                    aria-label={config.label}
                    aria-pressed={isActive}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-gray-500">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Density Slider */}
      {showDensitySlider && onDensityChange && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Minus className="w-3 h-3 text-gray-400" />
          <Slider
            value={[density]}
            onValueChange={([value]) => onDensityChange(value)}
            min={0}
            max={100}
            step={25}
            className="w-20"
            aria-label="Content density"
          />
          <Plus className="w-3 h-3 text-gray-400" />
        </div>
      )}
    </div>
  );
};

// Grid configuration based on view mode
export const getGridConfig = (viewMode: ViewMode, density: number = 50) => {
  const densityMultiplier = density / 50; // 0-2 range

  switch (viewMode) {
    case "grid":
      return {
        columns: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        cardHeight: Math.round(380 * (1 + (1 - densityMultiplier) * 0.2)),
        gap: "gap-6",
        imageHeight: "h-48",
      };
    case "list":
      return {
        columns: "grid-cols-1",
        cardHeight: Math.round(140 * (1 + (1 - densityMultiplier) * 0.3)),
        gap: "gap-3",
        imageHeight: "h-full",
      };
    case "compact":
      return {
        columns:
          "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        cardHeight: Math.round(280 * (1 + (1 - densityMultiplier) * 0.15)),
        gap: "gap-4",
        imageHeight: "h-36",
      };
    default:
      return {
        columns: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        cardHeight: 380,
        gap: "gap-6",
        imageHeight: "h-48",
      };
  }
};

export default ViewModeSwitcher;
