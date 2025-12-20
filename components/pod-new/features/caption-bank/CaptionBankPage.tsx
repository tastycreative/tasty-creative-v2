"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useGalleryData } from "@/hooks/useGalleryQuery";
import { CaptionCard } from "./CaptionCard";
import { Search, Filter, FileText, Loader2, Check, ChevronsUpDown, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

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

  // Reset to page 1 to filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCreator, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCaptions.length / ITEMS_PER_PAGE);
  const paginatedCaptions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCaptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCaptions, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Smooth scroll to top of content
    if (contentStartRef.current) {
      contentStartRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-6 flex items-center justify-center">
        <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 shadow-xl">
          <p className="text-red-500 font-medium">Failed to load captions. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 pb-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative z-10 px-6 max-w-[1600px] mx-auto pt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 border border-pink-200/50 dark:border-pink-500/30 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="text-xs font-bold tracking-wider text-pink-600 dark:text-pink-400 uppercase">
                Content Intelligence
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-3 tracking-tight"
            >
              Caption Bank
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed font-medium"
            >
              A curated collection of high-performing captions from your gallery.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent leading-none group-hover:scale-105 transition-transform duration-300">
                {filteredCaptions.length}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
                Captions
              </span>
            </div>
            
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-600/10 dark:from-pink-400/10 dark:to-purple-400/10 flex items-center justify-center border border-pink-100/50 dark:border-pink-500/10 group-hover:rotate-12 transition-transform duration-300">
              <FileText className="h-5 w-5 text-pink-500 dark:text-pink-400 opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Filters Bar */}
        <div className="sticky top-4 z-50 mb-8" ref={contentStartRef}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-2 shadow-sm border border-white/40 dark:border-gray-700/40 ring-1 ring-black/5 dark:ring-white/5"
          >
            <div className="flex flex-col md:flex-row gap-2">
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-pink-500 transition-colors" />
                <Input
                  placeholder="Search by keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-gray-800 transition-all rounded-xl placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div className="w-px bg-gray-200 dark:bg-gray-700 h-8 self-center hidden md:block mx-1" />

              {/* Creator Filter */}
              <Popover open={creatorOpen} onOpenChange={setCreatorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={creatorOpen}
                    className="h-11 min-w-[180px] justify-between text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white rounded-xl"
                  >
                    {selectedCreator === "all"
                      ? "All Creators"
                      : selectedCreator}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search creators..." />
                    <CommandList className="max-h-64">
                      <CommandEmpty>No creator found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedCreator("all");
                            setCreatorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCreator === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
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
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCreator === creator ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {creator}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="w-px bg-gray-200 dark:bg-gray-700 h-8 self-center hidden md:block mx-1" />

              {/* Category Filter */}
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="h-11 min-w-[180px] justify-between text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white rounded-xl"
                  >
                    {selectedCategory === "all"
                      ? "All Categories"
                      : selectedCategory}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList className="max-h-64">
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedCategory("all");
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCategory === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
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
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCategory === category ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
              Curating your captions...
            </p>
          </div>
        ) : filteredCaptions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700"
          >
            <div className="h-20 w-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
              <Search className="h-8 w-8 text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No captions found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              We couldn&apos;t find any captions matching your current filters. Try adjusting your search.
            </p>
            <Button 
              variant="outline" 
              className="mt-8 rounded-xl border-gray-200 hover:bg-white hover:border-pink-200 hover:text-pink-600 transition-all shadow-sm"
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
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {paginatedCaptions.map((item, index) => (
                <CaptionCard
                  key={item.id}
                  index={index}
                  caption={item.captionText || item.caption || ""}
                  creatorName={item.creatorName}
                  category={item.category}
                  revenue={item.totalRevenue}
                  outcome={item.outcome}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-white/20 hover:bg-white/40 hover:text-pink-600 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-white/20 hover:bg-white/40 hover:text-pink-600 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
