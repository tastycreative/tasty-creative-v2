"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = "Search content, captions, creators...",
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-4 py-3 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            title="Clear search"
          >
            <Search className="w-4 h-4 rotate-45" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
