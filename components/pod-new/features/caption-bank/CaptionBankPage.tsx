"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useGalleryData } from "@/hooks/useGalleryQuery";
import { CaptionCard } from "./CaptionCard";
import { Search, Loader2, Check, ChevronsUpDown, Plus, PenLine, ChevronDown, Users, LayoutGrid, CalendarDays, SlidersHorizontal, Diamond, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 12;

export function CaptionBankPage() {
  const { data, isLoading, error } = useGalleryData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const contentStartRef = React.useRef<HTMLDivElement>(null);

  // Extract items with captions
  const captionItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter(
      (item) => item.captionText || item.caption
    );
  }, [data?.items]);

  // Get unique creators and categories for filters
  const { creators, categories } = useMemo(() => {
    const creatorSet = new Set<string>();
    const categorySet = new Set<string>();

    captionItems.forEach((item) => {
      if (item.creatorName) creatorSet.add(item.creatorName);
      if (item.category) categorySet.add(item.category);
    });

    return {
      creators: Array.from(creatorSet).sort(),
      categories: Array.from(categorySet).sort(),
    };
  }, [captionItems]);

  // Filter captions based on search and filters
  const filteredCaptions = useMemo(() => {
    return captionItems.filter((item) => {
      const caption = item.captionText || item.caption || "";
      const matchesSearch =
        searchQuery === "" ||
        caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCreator =
        selectedCreator === "all" || item.creatorName === selectedCreator;

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCreator && matchesCategory;
    });
  }, [captionItems, searchQuery, selectedCreator, selectedCategory]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCreator, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCaptions.length / ITEMS_PER_PAGE);
  const paginatedCaptions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCaptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCaptions, currentPage]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Team avatars data
  const teamAvatars = useMemo(() => {
    const uniqueCreators = creators.slice(0, 2);
    const remainingCount = Math.max(0, creators.length - 2);
    return { displayed: uniqueCreators, remaining: remainingCount };
  }, [creators]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCreator !== "all") count++;
    if (selectedCategory !== "all") count++;
    return count;
  }, [searchQuery, selectedCreator, selectedCategory]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1115] p-6 flex items-center justify-center">
        <div className="text-center py-12 glass-card rounded-3xl p-8">
          <p className="text-red-400 font-medium">Failed to load captions. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-300 font-sans selection:bg-pink-500/30 pb-20"
      style={{
        backgroundColor: '#0f1115',
        backgroundImage: `
          radial-gradient(circle at 0% 0%, rgba(236, 72, 153, 0.03) 0%, transparent 40%),
          radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.03) 0%, transparent 40%)
        `
      }}
    >
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="space-y-2 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center md:justify-start gap-2 text-pink-500 mb-1"
            >
              <Diamond className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Premium Repository</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-semibold text-white tracking-tight flex items-center gap-4"
            >
              Caption Bank
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]" />
              <span className="text-lg font-normal text-slate-500 tracking-normal">
                {filteredCaptions.length.toLocaleString()} assets
              </span>
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 h-auto rounded-full text-sm font-semibold shadow-lg shadow-pink-500/20 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Caption
            </Button>

            <div className="h-10 w-[1px] bg-white/10 mx-2" />

            <div className="flex -space-x-2">
              {teamAvatars.displayed.map((creator, idx) => (
                <div
                  key={creator}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 border-[#0f1115] flex items-center justify-center text-[10px] font-bold",
                    idx === 0 ? "bg-slate-800" : "bg-pink-500/20 text-pink-500"
                  )}
                >
                  {creator.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {teamAvatars.remaining > 0 && (
                <div className="w-9 h-9 rounded-full border-2 border-[#0f1115] bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                  +{teamAvatars.remaining}
                </div>
              )}
            </div>
          </motion.div>
        </header>

        {/* Search & Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          ref={contentStartRef}
          className="rounded-2xl p-2 mb-16 backdrop-blur-md"
          style={{
            background: 'rgba(18, 20, 24, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className={cn(
              "relative flex-1 min-w-0 rounded-xl transition-all duration-200",
              searchQuery && "bg-blue-500/10 ring-1 ring-blue-500/30"
            )}>
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                searchQuery ? "text-blue-400" : "text-slate-500"
              )} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full bg-transparent border-none focus-visible:ring-0 py-3 h-auto pl-11 pr-10 text-sm placeholder:text-slate-600 transition-colors duration-200",
                  searchQuery ? "text-blue-400" : "text-white"
                )}
                placeholder="Search captions, tags, or creators..."
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Creator Filter */}
              <Popover open={creatorOpen} onOpenChange={setCreatorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 h-auto rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200",
                      selectedCreator !== "all"
                        ? "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 ring-1 ring-pink-500/30"
                        : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{selectedCreator === "all" ? "Creators" : selectedCreator}</span>
                    {selectedCreator !== "all" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white">
                        1
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 bg-[#1a1c21] border-white/10" align="end">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search creators..." className="text-white" />
                    <CommandList className="max-h-64">
                      <CommandEmpty className="text-slate-500">No creator found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedCreator("all");
                            setCreatorOpen(false);
                          }}
                          className="text-slate-300 hover:text-white"
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedCreator === "all" ? "opacity-100" : "opacity-0")} />
                          All Creators
                        </CommandItem>
                        {creators.map((creator) => (
                          <CommandItem
                            key={creator}
                            value={creator}
                            onSelect={() => {
                              setSelectedCreator(creator);
                              setCreatorOpen(false);
                            }}
                            className="text-slate-300 hover:text-white"
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedCreator === creator ? "opacity-100" : "opacity-0")} />
                            {creator}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Category Filter */}
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 h-auto rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200",
                      selectedCategory !== "all"
                        ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 ring-1 ring-purple-500/30"
                        : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{selectedCategory === "all" ? "Category" : selectedCategory}</span>
                    {selectedCategory !== "all" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold text-white">
                        1
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 bg-[#1a1c21] border-white/10" align="end">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search categories..." className="text-white" />
                    <CommandList className="max-h-64">
                      <CommandEmpty className="text-slate-500">No category found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedCategory("all");
                            setCategoryOpen(false);
                          }}
                          className="text-slate-300 hover:text-white"
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedCategory === "all" ? "opacity-100" : "opacity-0")} />
                          All Categories
                        </CommandItem>
                        {categories.map((category) => (
                          <CommandItem
                            key={category}
                            value={category}
                            onSelect={() => {
                              setSelectedCategory(category);
                              setCategoryOpen(false);
                            }}
                            className="text-slate-300 hover:text-white"
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedCategory === category ? "opacity-100" : "opacity-0")} />
                            {category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                className="flex items-center gap-1.5 px-3 py-2 h-auto rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium whitespace-nowrap"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Date</span>
              </Button>

              <div className="w-[1px] h-5 bg-white/10" />

              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 h-auto rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200",
                  activeFilterCount > 0
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                )}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCreator("all");
                  setSelectedCategory("all");
                }}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{activeFilterCount > 0 ? "Clear" : "Filters"}</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">
              Curating your captions...
            </p>
          </div>
        ) : filteredCaptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center glass-card rounded-[32px]"
            style={{
              background: 'rgba(24, 26, 31, 0.4)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <Search className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No captions found</h3>
            <p className="text-slate-500 max-w-sm">
              We couldn&apos;t find any captions matching your current filters. Try adjusting your search.
            </p>
            <Button
              className="mt-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              onClick={() => {
                setSearchQuery("");
                setSelectedCreator("all");
                setSelectedCategory("all");
              }}
            >
              Clear all filters
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Caption Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {paginatedCaptions.map((item, index) => (
                <CaptionCard
                  key={item.id}
                  index={index}
                  caption={item.captionText || item.caption || ""}
                  creatorName={item.creatorName}
                  category={item.category}
                  revenue={item.totalRevenue}
                  outcome={item.outcome}
                  isFeatured={index === 0 && currentPage === 1}
                />
              ))}
            </div>

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="mt-24 flex flex-col items-center gap-8">
                <button
                  onClick={handleLoadMore}
                  className="flex flex-col items-center gap-4 group"
                >
                  <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-slate-500 group-hover:border-pink-500 group-hover:text-pink-500 transition-all duration-500">
                    <ChevronDown className="h-8 w-8 group-hover:translate-y-1 transition-transform duration-500" />
                  </div>
                  <span className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
                    Load Older Captions
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-10 right-10 h-16 w-16 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white flex items-center justify-center shadow-2xl shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all z-50 p-0"
      >
        <PenLine className="h-7 w-7" />
      </Button>
    </div>
  );
}
