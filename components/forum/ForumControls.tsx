"use client";

import { Search, ChevronDown } from "lucide-react";

interface ModelOption {
  name: string;
  id?: string;
}

interface ForumControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  showModelDropdown: boolean;
  onToggleModelDropdown: () => void;
  models: ModelOption[];
  onCreatePost: () => void;
  showModelSelector?: boolean;
}

export function ForumControls({
  searchQuery,
  onSearchChange,
  selectedModel,
  onModelChange,
  showModelDropdown,
  onToggleModelDropdown,
  models,
  onCreatePost,
  showModelSelector = true,
}: ForumControlsProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      {/* Model Selector */}
      {showModelSelector && (
        <div className="relative">
          <button
            onClick={onToggleModelDropdown}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all"
          >
            <span className="font-medium">
              {selectedModel === "All Forums"
                ? "🔥 All Forums"
                : selectedModel === "General"
                ? "🌍 General Forum"
                : `👤 ${selectedModel} Forum`}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showModelDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-gray-100/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto backdrop-blur-sm">
              {/* All Forums Option */}
              <button
                onClick={() => {
                  onModelChange("All Forums");
                  onToggleModelDropdown();
                }}
                className={`w-full text-left px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg ${
                  selectedModel === "All Forums"
                    ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
                    : ""
                }`}
              >
                🔥 All Forums
              </button>
              
              {models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => {
                    onModelChange(model.name);
                    onToggleModelDropdown();
                  }}
                  className={`w-full text-left px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors last:rounded-b-lg ${
                    selectedModel === model.name
                      ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
                      : ""
                  }`}
                >
                  {model.name === "General"
                    ? "🌍 General Forum"
                    : `👤 ${model.name} Forum`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search posts..."
          className="w-full pl-10 pr-4 py-2 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
        />
      </div>

      {/* Create Post Button */}
      <button
        onClick={onCreatePost}
        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
      >
        Create Post
      </button>
    </div>
  );
}
