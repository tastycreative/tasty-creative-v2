"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  MessageSquare,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";

interface SearchFilters {
  query: string;
  category: string[];
  status: string[];
  author: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: string;
  minReplies: number;
  minViews: number;
  hasAttachments: boolean;
  isWatching: boolean;
}

interface AdvancedSearchProps {
  modelId: string;
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export function AdvancedSearch({
  modelId,
  onSearch,
  initialFilters,
}: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialFilters?.query || searchParams.get("q") || "",
    category: initialFilters?.category || [],
    status: initialFilters?.status || [],
    author: initialFilters?.author || "",
    dateRange: {
      from: initialFilters?.dateRange?.from || null,
      to: initialFilters?.dateRange?.to || null,
    },
    sortBy: initialFilters?.sortBy || "relevance",
    minReplies: initialFilters?.minReplies || 0,
    minViews: initialFilters?.minViews || 0,
    hasAttachments: initialFilters?.hasAttachments || false,
    isWatching: initialFilters?.isWatching || false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = [
    { value: "general", label: "General", icon: MessageSquare },
    { value: "qa", label: "Q&A", icon: HelpCircle },
    { value: "bugs", label: "Bugs", icon: AlertCircle },
    { value: "showcase", label: "Showcase", icon: Sparkles },
    { value: "releases", label: "Releases", icon: Rocket },
  ];

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "solved", label: "Solved" },
    { value: "pinned", label: "Pinned" },
    { value: "locked", label: "Locked" },
  ];

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "most_replies", label: "Most Replies" },
    { value: "most_views", label: "Most Views" },
    { value: "recently_active", label: "Recently Active" },
  ];

  const handleSearch = useCallback(() => {
    // Build URL params
    const params = new URLSearchParams();
    
    if (filters.query) params.set("q", filters.query);
    if (filters.category.length > 0) params.set("category", filters.category.join(","));
    if (filters.status.length > 0) params.set("status", filters.status.join(","));
    if (filters.author) params.set("author", filters.author);
    if (filters.dateRange.from) params.set("from", filters.dateRange.from.toISOString());
    if (filters.dateRange.to) params.set("to", filters.dateRange.to.toISOString());
    if (filters.sortBy !== "relevance") params.set("sort", filters.sortBy);
    if (filters.minReplies > 0) params.set("minReplies", filters.minReplies.toString());
    if (filters.minViews > 0) params.set("minViews", filters.minViews.toString());
    if (filters.hasAttachments) params.set("attachments", "true");
    if (filters.isWatching) params.set("watching", "true");

    // Trigger search callback
    onSearch(filters);

    // Update URL
    router.push(`?${params.toString()}`);
  }, [filters, onSearch, router]);

  const handleReset = () => {
    const defaultFilters: SearchFilters = {
      query: "",
      category: [],
      status: [],
      author: "",
      dateRange: { from: null, to: null },
      sortBy: "relevance",
      minReplies: 0,
      minViews: 0,
      hasAttachments: false,
      isWatching: false,
    };
    setFilters(defaultFilters);
    onSearch(defaultFilters);
    router.push("?");
  };

  const activeFilterCount = [
    filters.category.length > 0,
    filters.status.length > 0,
    filters.author !== "",
    filters.dateRange.from !== null,
    filters.minReplies > 0,
    filters.minViews > 0,
    filters.hasAttachments,
    filters.isWatching,
  ].filter(Boolean).length;

  return (
    <div className="w-full space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search threads, posts, and discussions..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-12 h-12 text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
          />
        </div>
        
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          className="h-12 px-4 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-purple-500 text-white">
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-2" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-2" />
          )}
        </Button>

        <Button
          onClick={handleSearch}
          className="h-12 px-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 space-y-6">
              {/* Categories */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = filters.category.includes(cat.value);
                    return (
                      <Button
                        key={cat.value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            category: isSelected
                              ? filters.category.filter((c) => c !== cat.value)
                              : [...filters.category, cat.value],
                          });
                        }}
                        className={cn(
                          "rounded-full",
                          isSelected &&
                            "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0"
                        )}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {cat.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Thread Status</Label>
                <div className="flex flex-wrap gap-3">
                  {statusOptions.map((status) => (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.status.includes(status.value)}
                        onCheckedChange={(checked) => {
                          setFilters({
                            ...filters,
                            status: checked
                              ? [...filters.status, status.value]
                              : filters.status.filter((s) => s !== status.value),
                          });
                        }}
                      />
                      <span className="text-sm">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Author Filter */}
                <div>
                  <Label htmlFor="author" className="text-sm font-semibold mb-2 block">
                    Author
                  </Label>
                  <Input
                    id="author"
                    placeholder="Username..."
                    value={filters.author}
                    onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                    className="h-10 rounded-lg"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <Label htmlFor="sort" className="text-sm font-semibold mb-2 block">
                    Sort By
                  </Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger id="sort" className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-10 justify-start text-left font-normal rounded-lg"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          filters.dateRange.to ? (
                            <>
                              {format(filters.dateRange.from, "MMM d")} -{" "}
                              {format(filters.dateRange.to, "MMM d, yyyy")}
                            </>
                          ) : (
                            format(filters.dateRange.from, "MMM d, yyyy")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        selected={{
                          from: filters.dateRange.from || undefined,
                          to: filters.dateRange.to || undefined,
                        }}
                        onSelect={(range: any) => {
                          setFilters({
                            ...filters,
                            dateRange: {
                              from: range?.from || null,
                              to: range?.to || null,
                            },
                          });
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Reply and View Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">
                    Minimum Replies: {filters.minReplies}
                  </Label>
                  <Slider
                    value={[filters.minReplies]}
                    onValueChange={([value]) =>
                      setFilters({ ...filters, minReplies: value })
                    }
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-3 block">
                    Minimum Views: {filters.minViews}
                  </Label>
                  <Slider
                    value={[filters.minViews]}
                    onValueChange={([value]) =>
                      setFilters({ ...filters, minViews: value })
                    }
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Additional Filters */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.hasAttachments}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, hasAttachments: !!checked })
                    }
                  />
                  <span className="text-sm">Has Attachments</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.isWatching}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, isWatching: !!checked })
                    }
                  />
                  <span className="text-sm">Threads I'm Watching</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}