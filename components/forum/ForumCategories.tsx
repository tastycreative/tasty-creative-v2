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
      <div className="bg-gray-100/80 rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100/80 rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Categories
      </h3>
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange("All")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
            selectedCategory === "All"
              ? "bg-pink-100 text-pink-700 border border-pink-300"
              : "bg-white text-gray-600 hover:bg-pink-50 border border-pink-200"
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
                  ? "bg-pink-100 text-pink-700 border border-pink-300"
                  : category.color === "green"
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : category.color === "blue"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : category.color === "purple"
                        ? "bg-pink-100 text-pink-700 border border-pink-300"
                        : category.color === "red"
                          ? "bg-red-100 text-red-700 border border-red-300"
                          : category.color === "orange"
                            ? "bg-orange-100 text-orange-700 border border-orange-300"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                : "bg-white text-gray-600 hover:bg-pink-50 border border-pink-200"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
