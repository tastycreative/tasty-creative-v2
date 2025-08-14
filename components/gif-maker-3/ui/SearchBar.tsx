"use client";

import React from "react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search videos...",
  className = "",
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
      />
    </div>
  );
};

export default SearchBar;
