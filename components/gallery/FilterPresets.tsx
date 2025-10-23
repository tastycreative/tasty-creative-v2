"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Star, DollarSign } from "lucide-react";
import { FilterState } from "@/types/gallery";

interface FilterPresetsProps {
  onApplyPreset: (filters: Partial<FilterState>) => void;
  className?: string;
}

const FilterPresets: React.FC<FilterPresetsProps> = ({
  onApplyPreset,
  className = "",
}) => {
  const presets = [
    {
      name: "Top Performers",
      description: "High revenue & good outcomes",
      icon: TrendingUp,
      filters: {
        sortBy: "revenue",
        outcome: "Good",
        minRevenue: "50",
      } as Partial<FilterState>,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20",
      textColor: "text-green-700 dark:text-green-300",
    },
    {
      name: "Recent Good",
      description: "Latest successful content",
      icon: Clock,
      filters: {
        sortBy: "newest",
        outcome: "Good",
        messageType: "all",
      } as Partial<FilterState>,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20",
      textColor: "text-blue-700 dark:text-blue-300",
    },
    {
      name: "Premium Content",
      description: "High-priced items",
      icon: DollarSign,
      filters: {
        sortBy: "price-high",
        category: "all",
      } as Partial<FilterState>,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    {
      name: "Best ROI",
      description: "Best return on investment",
      icon: Star,
      filters: {
        sortBy: "roi",
        outcome: "Good",
      } as Partial<FilterState>,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20",
      textColor: "text-purple-700 dark:text-purple-300",
    },
  ];

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {presets.map((preset) => {
        const IconComponent = preset.icon;
        return (
          <Button
            key={preset.name}
            variant="outline"
            onClick={() => onApplyPreset(preset.filters)}
            className={`${preset.bgColor} ${preset.textColor} border-0 transition-all duration-200 hover:scale-105 hover:shadow-md`}
          >
            <IconComponent className="w-4 h-4 mr-2" />
            <div className="flex flex-col items-start">
              <span className="font-semibold text-sm">{preset.name}</span>
              <span className="text-xs opacity-75">{preset.description}</span>
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default FilterPresets;
