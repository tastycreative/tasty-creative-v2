"use client";

import { Filter, X, Tag, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import ModelsDropdownList from "@/components/ModelsDropdownList";

interface FilterControlsProps {
  filters: {
    creator: string;
    eventType: string;
    status: string;
    flyerLink: string;
    tags: string[];
  };
  onFiltersChange: (filters: any) => void;
  creators: string[];
  tags: string[];
}

export default function FilterControls({
  filters,
  onFiltersChange,
  creators,
  tags,
}: FilterControlsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close tags dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setShowTagsDropdown(false);
      }
    };

    if (showTagsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTagsDropdown]);

  const hasActiveFilters =
    filters.creator !== "all" ||
    filters.eventType !== "all" ||
    filters.status !== "all" ||
    filters.flyerLink !== "all" ||
    filters.tags.length > 0;

  const clearAllFilters = () => {
    onFiltersChange({
      creator: "all",
      eventType: "all",
      status: "all",
      flyerLink: "all",
      tags: [],
    });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Filters
            </h2>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors lg:hidden"
            >
              {showFilters ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${showFilters ? 'block' : 'hidden lg:grid'}`}>
          {/* Creator Filter */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              <span>Creator</span>
              {filters.creator !== "all" && (
                <button
                  onClick={() => onFiltersChange({ ...filters, creator: "all" })}
                  className="text-[10px] normal-case text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </label>
            <ModelsDropdownList
              value={filters.creator === "all" ? "" : filters.creator}
              onValueChange={(value) => onFiltersChange({ ...filters, creator: value || "all" })}
              placeholder="All Creators"
              className="w-full text-sm [&>button]:px-3 [&>button]:py-2 [&>button]:bg-white/50 dark:[&>button]:bg-gray-700/50 [&>button]:border [&>button]:border-gray-200/50 dark:[&>button]:border-gray-600/50 [&>button]:rounded-lg [&>button]:focus:outline-none [&>button]:focus:ring-2 [&>button]:focus:ring-pink-500 [&>button]:text-gray-900 dark:[&>button]:text-gray-100"
            />
          </div>

          {/* Event Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Event Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => onFiltersChange({ ...filters, eventType: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Types</option>
              <option value="PPV">PPV</option>
              <option value="LIVESTREAM">Livestream</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Flyer Link Filter */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              <span>Flyer Link</span>
              {filters.flyerLink !== "all" && (
                <button
                  onClick={() => onFiltersChange({ ...filters, flyerLink: "all" })}
                  className="text-[10px] normal-case text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </label>
            <select
              value={filters.flyerLink}
              onChange={(e) => onFiltersChange({ ...filters, flyerLink: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Flyers</option>
              <option value="has">Has Flyers</option>
              <option value="no">No Flyers</option>
            </select>
          </div>

          {/* Tags Filter - Inline with "View More" button */}
          <div className="relative" ref={tagsDropdownRef}>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              <span>Tags</span>
              {filters.tags.length > 0 && (
                <button
                  onClick={() => onFiltersChange({ ...filters, tags: [] })}
                  className="text-[10px] normal-case text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.length > 0 ? (
                <>
                  {tags.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                        filters.tags.includes(tag)
                          ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md"
                          : "bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {tags.length > 5 && (
                    <button
                      onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                      className="px-2.5 py-1 text-xs rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all font-medium"
                    >
                      {showTagsDropdown ? "Show less" : `+${tags.length - 5} more`}
                    </button>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400 italic">No tags available</span>
              )}
            </div>

            {/* Expanded Tags Popup - Using Portal */}
            {isMounted && showTagsDropdown && tags.length > 5 && createPortal(
              <div
                className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 max-h-64 overflow-y-auto"
                style={{
                  top: tagsDropdownRef.current ? `${tagsDropdownRef.current.getBoundingClientRect().bottom + 4}px` : '0',
                  left: tagsDropdownRef.current ? `${tagsDropdownRef.current.getBoundingClientRect().left}px` : '0',
                  width: tagsDropdownRef.current ? `${tagsDropdownRef.current.offsetWidth}px` : 'auto',
                }}
              >
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(5).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1.5 text-xs rounded-full transition-all ${
                        filters.tags.includes(tag)
                          ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Active:</span>
              {filters.creator !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-500/30">
                  Creator: {filters.creator}
                  <button onClick={() => onFiltersChange({ ...filters, creator: "all" })}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.eventType !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs rounded-full border border-purple-500/30">
                  Type: {filters.eventType}
                  <button onClick={() => onFiltersChange({ ...filters, eventType: "all" })}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.status !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full border border-green-500/30">
                  Status: {filters.status}
                  <button onClick={() => onFiltersChange({ ...filters, status: "all" })}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.flyerLink !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs rounded-full border border-orange-500/30">
                  Flyer: {filters.flyerLink === "has" ? "Has Flyers" : "No Flyers"}
                  <button onClick={() => onFiltersChange({ ...filters, flyerLink: "all" })}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-600 dark:text-pink-400 text-xs rounded-full border border-pink-500/30">
                  Tag: {tag}
                  <button onClick={() => toggleTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
