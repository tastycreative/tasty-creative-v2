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
      <div className="bg-gray-100/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-600 p-6 animate-pulse">
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
    <div className="bg-gray-100/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Categories
      </h3>
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange("All")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
            selectedCategory === "All"
              ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border border-pink-300 dark:border-pink-600"
              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600 border border-pink-200 dark:border-gray-600"
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
                  ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border border-pink-300 dark:border-pink-600"
                  : category.color === "green"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-600"
                    : category.color === "blue"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-600"
                      : category.color === "purple"
                        ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border border-pink-300 dark:border-pink-600"
                        : category.color === "red"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-600"
                          : category.color === "orange"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-600"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600 border border-pink-200 dark:border-gray-600"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
