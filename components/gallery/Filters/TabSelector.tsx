"use client";

import React from "react";
import { Heart, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabSelectorProps {
  activeTab: "all" | "favorites" | "releases";
  onTabChange: (tab: "all" | "favorites" | "releases") => void;
  breakdown: {
    favorites: number;
    releases: number;
    library: number;
  };
  galleryItemsLength: number;
  className?: string;
}

const TabSelector: React.FC<TabSelectorProps> = ({
  activeTab,
  onTabChange,
  breakdown,
  galleryItemsLength,
  className = "",
}) => {
  const tabs = [
    {
      value: "all",
      label: "All Content",
      count: galleryItemsLength,
      icon: null,
      gradient: "from-gray-500 to-gray-600",
      bgGradient: "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700",
    },
    {
      value: "favorites",
      label: "Saved",
      count: breakdown.favorites,
      icon: Heart,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-100 dark:from-pink-900/30 dark:to-rose-800/30",
    },
    {
      value: "releases",
      label: "Released",
      count: breakdown.releases,
      icon: Star,
      gradient: "from-amber-500 to-yellow-500",
      bgGradient: "from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-800/30",
    },
  ];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.value;
        
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value as "all" | "favorites" | "releases")}
            className={`
              flex items-center gap-2 px-4 py-3 h-12 rounded-2xl text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${isActive 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            {IconComponent && (
              <IconComponent className={`w-4 h-4 ${
                isActive ? 'text-current' : 'text-gray-400 dark:text-gray-500'
              }`} />
            )}
            <span className="font-medium">
              {tab.label}
            </span>
            <span className={`
              inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
              ${isActive 
                ? 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }
            `}>
              {tab.count > 999 ? `${Math.floor(tab.count / 1000)}k` : tab.count.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TabSelector;