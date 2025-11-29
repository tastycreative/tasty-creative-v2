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
import {
  X,
  Filter,
  Search,
  ChevronDown,
  Check,
  ArrowDownWideNarrow,
  TrendingUp,
  Flame,
  CheckCircle2,
  FolderOpen,
  User,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Clock,
  Gem,
  FileText,
  Mail,
  Smartphone,
  MessageSquare,
  Phone,
  MessagesSquare,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Layers,
} from "lucide-react";
import { FilterState } from "@/types/gallery";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  categories: { name: string; count: number }[];
  creators: { name: string; count: number }[];
  postOrigins?: { name: string; count: number }[];
  onClearAll: () => void;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  categories,
  creators,
  postOrigins = [],
  onClearAll,
  className = "",
}) => {
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorPopoverOpen, setCreatorPopoverOpen] = useState(false);
  const [originSearch, setOriginSearch] = useState("");
  const [originPopoverOpen, setOriginPopoverOpen] = useState(false);

  // Filter creators based on search
  const filteredCreators = useMemo(() => {
    if (!creatorSearch.trim()) return creators;
    const searchLower = creatorSearch.toLowerCase();
    return creators.filter((creator) =>
      creator.name.toLowerCase().includes(searchLower)
    );
  }, [creators, creatorSearch]);

  // Filter origins based on search
  const filteredOrigins = useMemo(() => {
    if (!originSearch.trim()) return postOrigins;
    const searchLower = originSearch.toLowerCase();
    return postOrigins.filter((origin) =>
      origin.name.toLowerCase().includes(searchLower)
    );
  }, [postOrigins, originSearch]);

  // Get selected creator display name
  const selectedCreatorDisplay = useMemo(() => {
    if (filters.creator === "all") return "All Creators";
    const found = creators.find((c) => c.name === filters.creator);
    return found ? `${found.name} (${found.count})` : filters.creator;
  }, [filters.creator, creators]);

  // Get selected origin display name
  const selectedOriginDisplay = useMemo(() => {
    if (!filters.postOrigin || filters.postOrigin === "all") return "All Origins";
    const found = postOrigins.find((o) => o.name === filters.postOrigin);
    return found ? `${found.name} (${found.count})` : filters.postOrigin;
  }, [filters.postOrigin, postOrigins]);

  // Calculate active filters count for badge (dataSource excluded - moved to header switch)
  // Only count filters relevant to the current dataSource
  const activeFiltersCount = [
    filters.category !== "all" ? 1 : 0,
    filters.creator !== "all" ? 1 : 0,
    // Board-only filters
    filters.dataSource === "BOARD" && filters.messageType !== "all" ? 1 : 0,
    filters.dataSource === "BOARD" && filters.outcome !== "all" ? 1 : 0,
    filters.dataSource === "BOARD" && filters.contentTypeFilter && filters.contentTypeFilter !== "all" ? 1 : 0,
    filters.dataSource === "BOARD" && filters.revenue ? 1 : 0,
    // Sheet-only filters
    filters.dataSource === "SHEET" && filters.postOrigin && filters.postOrigin !== "all" ? 1 : 0,
  ].reduce((sum, val) => sum + val, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  // Helper component for select items with icons
  const SelectItemWithIcon = ({
    value,
    icon: Icon,
    children,
    iconClassName,
  }: {
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    iconClassName?: string;
  }) => (
    <SelectItem value={value} className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconClassName)} />
        <span>{children}</span>
      </div>
    </SelectItem>
  );

  return (
    <div
      className={cn(
        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm transition-all duration-300",
        hasActiveFilters &&
          "ring-2 ring-purple-500/20 border-purple-300/60 dark:border-purple-600/60",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20">
            <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
            {hasActiveFilters && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""}{" "}
                applied
              </p>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-3 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-5 space-y-5">
        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sort By */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              <ArrowDownWideNarrow className="w-3.5 h-3.5" />
              Sort By
            </label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => onFiltersChange({ sortBy: value })}
            >
              <SelectTrigger className="h-10 bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 focus:ring-purple-500/20 transition-colors rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span>Most Revenue</span>
                  </div>
                </SelectItem>
                <SelectItem value="popularity">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>Most Popular</span>
                  </div>
                </SelectItem>
                <SelectItem value="success-rate">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Best Success Rate</span>
                  </div>
                </SelectItem>
                <SelectItem value="content-type">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                    <span>By Content Type</span>
                  </div>
                </SelectItem>
                <SelectItem value="creator">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span>By Creator</span>
                  </div>
                </SelectItem>
                <SelectItem value="price-high">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-emerald-500" />
                    <span>Highest Price</span>
                  </div>
                </SelectItem>
                <SelectItem value="price-low">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-amber-500" />
                    <span>Lowest Price</span>
                  </div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-500" />
                    <span>Newest First</span>
                  </div>
                </SelectItem>
                <SelectItem value="roi">
                  <div className="flex items-center gap-2">
                    <Gem className="h-4 w-4 text-violet-500" />
                    <span>Best ROI</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              <Layers className="w-3.5 h-3.5" />
              Category
            </label>
            <Select
              value={filters.category}
              onValueChange={(value) => onFiltersChange({ category: value })}
            >
              <SelectTrigger
                className={cn(
                  "h-10 bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 focus:ring-purple-500/20 transition-colors rounded-lg",
                  filters.category !== "all" &&
                    "ring-2 ring-purple-500/20 border-purple-300 dark:border-purple-500"
                )}
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}{" "}
                    <span className="text-gray-400 ml-1">({cat.count})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Creator */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              <User className="w-3.5 h-3.5" />
              Creator
            </label>
            <Popover
              open={creatorPopoverOpen}
              onOpenChange={setCreatorPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={creatorPopoverOpen}
                  className={cn(
                    "w-full h-10 justify-between bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors font-normal rounded-lg",
                    filters.creator !== "all" &&
                      "ring-2 ring-purple-500/20 border-purple-300 dark:border-purple-500"
                  )}
                >
                  <span className="truncate">{selectedCreatorDisplay}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search creators..."
                      value={creatorSearch}
                      onChange={(e) => setCreatorSearch(e.target.value)}
                      className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[280px]">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        onFiltersChange({ creator: "all" });
                        setCreatorPopoverOpen(false);
                        setCreatorSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                        filters.creator === "all" &&
                          "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                      )}
                    >
                      <span>All Creators</span>
                      {filters.creator === "all" && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>

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
                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                            filters.creator === creator.name &&
                              "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                          )}
                        >
                          <span className="truncate">
                            {creator.name}{" "}
                            <span className="text-gray-400">
                              ({creator.count})
                            </span>
                          </span>
                          {filters.creator === creator.name && (
                            <Check className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No creators found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Secondary Filters Row - Conditional based on dataSource */}
        {filters.dataSource === "BOARD" ? (
          /* Board filters: Type, Message, Outcome, Min Revenue */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            {/* Content Type */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <FileText className="w-3 h-3" />
                Type
              </label>
              <Select
                value={filters.contentTypeFilter || "all"}
                onValueChange={(value) =>
                  onFiltersChange({ contentTypeFilter: value })
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-9 text-sm bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors rounded-lg",
                    filters.contentTypeFilter &&
                      filters.contentTypeFilter !== "all" &&
                      "ring-2 ring-purple-500/20 border-purple-300 dark:border-purple-500"
                  )}
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-gray-500" />
                      <span>All Types</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MM">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Mass Message</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Post">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-pink-500" />
                      <span>Wall Post</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message Type */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-3 h-3" />
                Message
              </label>
              <Select
                value={filters.messageType}
                onValueChange={(value) => onFiltersChange({ messageType: value })}
              >
                <SelectTrigger
                  className={cn(
                    "h-9 text-sm bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors rounded-lg",
                    filters.messageType !== "all" &&
                      "ring-2 ring-purple-500/20 border-purple-300 dark:border-purple-500"
                  )}
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                      <span>All PPV</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PPV">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                      <span>PPV Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PPV Follow Up">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-blue-500" />
                      <span>Follow Up</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Sexting Set Bump">
                    <div className="flex items-center gap-2">
                      <MessagesSquare className="h-3.5 w-3.5 text-pink-500" />
                      <span>Sexting Bump</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Outcome */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="w-3 h-3" />
                Outcome
              </label>
              <Select
                value={filters.outcome}
                onValueChange={(value) => onFiltersChange({ outcome: value })}
              >
                <SelectTrigger
                  className={cn(
                    "h-9 text-sm bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors rounded-lg",
                    filters.outcome !== "all" &&
                      "ring-2 ring-purple-500/20 border-purple-300 dark:border-purple-500"
                  )}
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="Good">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                      <span>Good</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Bad">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      <span>Bad</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Revenue */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <DollarSign className="w-3 h-3" />
                Min Revenue
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.revenue}
                  onChange={(e) => onFiltersChange({ revenue: e.target.value })}
                  className={cn(
                    "h-9 text-sm pl-7 bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors rounded-lg",
                    filters.revenue &&
                      "ring-2 ring-purple-500/20 border-purple-300 dark:border-purple-500"
                  )}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Sheet filters: Origin only */
          postOrigins.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
              {/* Post Origin with Search */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  Origin
                </label>
                <Popover
                  open={originPopoverOpen}
                  onOpenChange={setOriginPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={originPopoverOpen}
                      className={cn(
                        "w-full h-9 justify-between text-sm bg-gray-50/80 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors font-normal rounded-lg",
                        filters.postOrigin &&
                          filters.postOrigin !== "all" &&
                          "ring-2 ring-purple-500/20 border-purple-300 dark:border-purple-500"
                      )}
                    >
                      <span className="truncate">{selectedOriginDisplay}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 rounded-xl" align="start">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search origins..."
                          value={originSearch}
                          onChange={(e) => setOriginSearch(e.target.value)}
                          className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg"
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[280px]">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            onFiltersChange({ postOrigin: "all" });
                            setOriginPopoverOpen(false);
                            setOriginSearch("");
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                            (!filters.postOrigin || filters.postOrigin === "all") &&
                              "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                            <span>All Origins</span>
                          </div>
                          {(!filters.postOrigin || filters.postOrigin === "all") && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>

                        {filteredOrigins.length > 0 ? (
                          filteredOrigins.map((origin) => (
                            <button
                              key={origin.name}
                              onClick={() => {
                                onFiltersChange({ postOrigin: origin.name });
                                setOriginPopoverOpen(false);
                                setOriginSearch("");
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                filters.postOrigin === origin.name &&
                                  "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                              )}
                            >
                              <span className="truncate">
                                {origin.name}{" "}
                                <span className="text-gray-400">
                                  ({origin.count})
                                </span>
                              </span>
                              {filters.postOrigin === origin.name && (
                                <Check className="h-4 w-4 shrink-0" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No origins found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )
        )}

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
                Active:
              </span>

              {/* Common filters - always shown */}
              {filters.category !== "all" && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer transition-colors rounded-full px-2.5 py-0.5"
                  onClick={() => onFiltersChange({ category: "all" })}
                >
                  <Layers className="w-3 h-3 mr-1" />
                  {filters.category}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

              {filters.creator !== "all" && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 cursor-pointer transition-colors rounded-full px-2.5 py-0.5"
                  onClick={() => onFiltersChange({ creator: "all" })}
                >
                  <User className="w-3 h-3 mr-1" />
                  {filters.creator}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

              {/* Board-only filter tags */}
              {filters.dataSource === "BOARD" && filters.contentTypeFilter &&
                filters.contentTypeFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors rounded-full px-2.5 py-0.5"
                    onClick={() => onFiltersChange({ contentTypeFilter: "all" })}
                  >
                    {filters.contentTypeFilter === "MM" ? (
                      <Mail className="w-3 h-3 mr-1" />
                    ) : (
                      <Smartphone className="w-3 h-3 mr-1" />
                    )}
                    {filters.contentTypeFilter === "MM"
                      ? "Mass Message"
                      : "Wall Post"}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}

              {filters.dataSource === "BOARD" && filters.messageType !== "all" && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 cursor-pointer transition-colors rounded-full px-2.5 py-0.5"
                  onClick={() => onFiltersChange({ messageType: "all" })}
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  {filters.messageType}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

              {filters.dataSource === "BOARD" && filters.outcome !== "all" && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "cursor-pointer transition-colors rounded-full px-2.5 py-0.5",
                    filters.outcome === "Good"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                  )}
                  onClick={() => onFiltersChange({ outcome: "all" })}
                >
                  {filters.outcome === "Good" ? (
                    <ThumbsUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ThumbsDown className="w-3 h-3 mr-1" />
                  )}
                  {filters.outcome}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

              {filters.dataSource === "BOARD" && filters.revenue && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer transition-colors rounded-full px-2.5 py-0.5"
                  onClick={() => onFiltersChange({ revenue: "" })}
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Min ${filters.revenue}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

              {/* Sheet-only filter tags */}
              {filters.dataSource === "SHEET" && filters.postOrigin && filters.postOrigin !== "all" && (
                <Badge
                  variant="secondary"
                  className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 cursor-pointer transition-colors rounded-full px-2.5 py-0.5"
                  onClick={() => onFiltersChange({ postOrigin: "all" })}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {filters.postOrigin}
                  <X className="w-3 h-3 ml-1" />
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
