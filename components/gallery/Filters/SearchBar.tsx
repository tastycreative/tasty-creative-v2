"use client";

import React, { forwardRef, useState, useEffect } from "react";
import { Search, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  className?: string;
  showHistory?: boolean;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
  searchQuery,
  onSearchChange,
  placeholder = "Search content, captions, creators...",
  className = "",
  showHistory = true,
}, ref) => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    if (showHistory) {
      const saved = localStorage.getItem("gallery-search-history");
      if (saved) {
        try {
          setSearchHistory(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to load search history:", error);
        }
      }
    }
  }, [showHistory]);

  // Save to history when search is performed
  const addToHistory = (query: string) => {
    if (!query.trim() || !showHistory) return;

    const newHistory = [
      query,
      ...searchHistory.filter((h) => h !== query),
    ].slice(0, 10); // Keep last 10 searches

    setSearchHistory(newHistory);
    localStorage.setItem("gallery-search-history", JSON.stringify(newHistory));
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      addToHistory(query);
      onSearchChange(query);
      setShowHistoryDropdown(false);
    }
  };

  const handleHistoryClick = (query: string) => {
    onSearchChange(query);
    setShowHistoryDropdown(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("gallery-search-history");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
        <Input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearchSubmit(searchQuery);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            if (showHistory && searchHistory.length > 0) {
              setShowHistoryDropdown(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay to allow click on history items
            setTimeout(() => setShowHistoryDropdown(false), 200);
          }}
          className="pl-12 pr-4 py-3 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search History Dropdown */}
      {showHistory && showHistoryDropdown && searchHistory.length > 0 && !searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent Searches
              </span>
              <button
                onClick={clearHistory}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear All
              </button>
            </div>
            {searchHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(query)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
              >
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {query}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";

export default SearchBar;
