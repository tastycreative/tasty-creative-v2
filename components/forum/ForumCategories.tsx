"use client";

import { ForumCategory } from "../../lib/forum-api";

interface ForumCategoriesProps {
  categories: ForumCategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  loading?: boolean;
}

export function ForumCategories({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  loading = false 
}: ForumCategoriesProps) {
  if (loading) {
    return (
      <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Categories
      </h3>
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange("All")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
            selectedCategory === "All"
              ? "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
              : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.name)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              selectedCategory === category.name
                ? category.color === "gray"
                  ? "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                  : category.color === "green"
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                    : category.color === "blue"
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      : category.color === "purple"
                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                        : category.color === "red"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                          : category.color === "orange"
                            ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
