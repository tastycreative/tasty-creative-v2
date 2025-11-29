"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Filter, Search, ChevronDown, Check } from "lucide-react";
import SortSelector from "./SortSelector";
import { FilterState } from "@/types/gallery";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  categories: { name: string; count: number }[];
  creators: { name: string; count: number }[];
  onClearAll: () => void;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  categories,
  creators,
  onClearAll,
  className = "",
}) => {
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorPopoverOpen, setCreatorPopoverOpen] = useState(false);

  // Filter creators based on search
  const filteredCreators = useMemo(() => {
    if (!creatorSearch.trim()) return creators;
    const searchLower = creatorSearch.toLowerCase();
    return creators.filter((creator) =>
      creator.name.toLowerCase().includes(searchLower)
    );
  }, [creators, creatorSearch]);

  // Get selected creator display name
  const selectedCreatorDisplay = useMemo(() => {
    if (filters.creator === "all") return "All Creators";
    const found = creators.find((c) => c.name === filters.creator);
    return found ? `${found.name} (${found.count})` : filters.creator;
  }, [filters.creator, creators]);

  // Calculate active filters count for badge
  const activeFiltersCount = [
    filters.category !== "all" ? 1 : 0,
    filters.creator !== "all" ? 1 : 0,
    filters.messageType !== "all" ? 1 : 0,
    filters.outcome !== "all" ? 1 : 0,
    filters.contentTypeFilter && filters.contentTypeFilter !== "all" ? 1 : 0,
    filters.revenue ? 1 : 0,
  ].reduce((sum, val) => sum + val, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200",
      hasActiveFilters && "ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-600",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
          </div>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 h-8 px-2"
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-4 space-y-4">
        {/* Primary Filters - Most Important */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sort - Most Important */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Sort By
            </label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => onFiltersChange({ sortBy: value })}
            >
              <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">💰 Most Revenue</SelectItem>
                <SelectItem value="popularity">🔥 Most Popular</SelectItem>
                <SelectItem value="success-rate">✅ Best Success Rate</SelectItem>
                <SelectItem value="content-type">📂 By Content Type</SelectItem>
                <SelectItem value="creator">👤 By Creator</SelectItem>
                <SelectItem value="price-high">💸 Highest Price</SelectItem>
                <SelectItem value="price-low">💵 Lowest Price</SelectItem>
                <SelectItem value="newest">🕒 Newest First</SelectItem>
                <SelectItem value="roi">💎 Best ROI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category - High importance */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Category
            </label>
            <Select
              value={filters.category}
              onValueChange={(value) => onFiltersChange({ category: value })}
            >
              <SelectTrigger className={cn(
                "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors",
                filters.category !== "all" && "ring-1 ring-blue-500/20 border-blue-300 dark:border-blue-600"
              )}>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name} <span className="text-gray-400">({cat.count})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Creator - High importance with search */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Creator
            </label>
            <Popover open={creatorPopoverOpen} onOpenChange={setCreatorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={creatorPopoverOpen}
                  className={cn(
                    "w-full justify-between bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors font-normal",
                    filters.creator !== "all" && "ring-1 ring-blue-500/20 border-blue-300 dark:border-blue-600"
                  )}
                >
                  <span className="truncate">{selectedCreatorDisplay}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search creators..."
                      value={creatorSearch}
                      onChange={(e) => setCreatorSearch(e.target.value)}
                      className="pl-8 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>
                {/* Scrollable Creator List */}
                <ScrollArea className="h-[250px]">
                  <div className="p-1">
                    {/* All Creators Option */}
                    <button
                      onClick={() => {
                        onFiltersChange({ creator: "all" });
                        setCreatorPopoverOpen(false);
                        setCreatorSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                        filters.creator === "all" && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      )}
                    >
                      <span>All Creators</span>
                      {filters.creator === "all" && <Check className="h-4 w-4" />}
                    </button>

                    {/* Filtered Creator Options */}
                    {filteredCreators.length > 0 ? (
                      filteredCreators.map((creator) => (
                        <button
                          key={creator.name}
                          onClick={() => {
                            onFiltersChange({ creator: creator.name });
                            setCreatorPopoverOpen(false);
                            setCreatorSearch("");
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                            filters.creator === creator.name && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          )}
                        >
                          <span className="truncate">
                            {creator.name}{" "}
                            <span className="text-gray-400">({creator.count})</span>
                          </span>
                          {filters.creator === creator.name && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No creators found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Secondary Filters - Less Important */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Type (MM/Post) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Content Type
            </label>
            <Select
              value={filters.contentTypeFilter || "all"}
              onValueChange={(value) => onFiltersChange({ contentTypeFilter: value })}
            >
              <SelectTrigger className={cn(
                "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors",
                filters.contentTypeFilter && filters.contentTypeFilter !== "all" && "ring-1 ring-blue-500/20 border-blue-300 dark:border-blue-600"
              )}>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📋 All Types</SelectItem>
                <SelectItem value="MM">📧 Mass Message</SelectItem>
                <SelectItem value="Post">📱 Wall Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Message Type
            </label>
            <Select
              value={filters.messageType}
              onValueChange={(value) => onFiltersChange({ messageType: value })}
            >
              <SelectTrigger className={cn(
                "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors",
                filters.messageType !== "all" && "ring-1 ring-blue-500/20 border-blue-300 dark:border-blue-600"
              )}>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">💰 All PPV Content</SelectItem>
                <SelectItem value="PPV">💵 PPV Only</SelectItem>
                <SelectItem value="PPV Follow Up">📞 PPV Follow Up</SelectItem>
                <SelectItem value="Sexting Set Bump">💬 Sexting Set Bump</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Outcome
            </label>
            <Select
              value={filters.outcome}
              onValueChange={(value) => onFiltersChange({ outcome: value })}
            >
              <SelectTrigger className={cn(
                "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors",
                filters.outcome !== "all" && "ring-1 ring-blue-500/20 border-blue-300 dark:border-blue-600"
              )}>
                <SelectValue placeholder="All Outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="Good">✅ Good</SelectItem>
                <SelectItem value="Bad">❌ Bad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Revenue */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Min Revenue
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="$0"
                value={filters.revenue}
                onChange={(e) => onFiltersChange({ revenue: e.target.value })}
                className={cn(
                  "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors pl-6",
                  filters.revenue && "ring-1 ring-blue-500/20 border-blue-300 dark:border-blue-600"
                )}
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active:</span>
              
              {filters.category !== "all" && (
                <Badge 
                  variant="outline" 
                  className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                >
                  {filters.category}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100" 
                    onClick={() => onFiltersChange({ category: "all" })}
                  />
                </Badge>
              )}
              
              {filters.creator !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300"
                >
                  👤 {filters.creator}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-purple-900 dark:hover:text-purple-100"
                    onClick={() => onFiltersChange({ creator: "all" })}
                  />
                </Badge>
              )}

              {filters.contentTypeFilter && filters.contentTypeFilter !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300"
                >
                  {filters.contentTypeFilter === "MM" ? "📧 Mass Message" : "📱 Wall Post"}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-indigo-900 dark:hover:text-indigo-100"
                    onClick={() => onFiltersChange({ contentTypeFilter: "all" })}
                  />
                </Badge>
              )}

              {filters.messageType !== "all" && (
                <Badge 
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                >
                  {filters.messageType}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-green-900 dark:hover:text-green-100" 
                    onClick={() => onFiltersChange({ messageType: "all" })}
                  />
                </Badge>
              )}
              
              {filters.outcome !== "all" && (
                <Badge 
                  variant="outline"
                  className="bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
                >
                  {filters.outcome}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-yellow-900 dark:hover:text-yellow-100" 
                    onClick={() => onFiltersChange({ outcome: "all" })}
                  />
                </Badge>
              )}
              
              {filters.revenue && (
                <Badge 
                  variant="outline"
                  className="bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300"
                >
                  Min ${filters.revenue}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-orange-900 dark:hover:text-orange-100" 
                    onClick={() => onFiltersChange({ revenue: "" })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;