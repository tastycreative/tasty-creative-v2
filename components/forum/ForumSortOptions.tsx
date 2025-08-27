"use client";

import { TrendingUp, Clock, Star } from "lucide-react";

interface ForumSortOptionsProps {
  sortBy: "hot" | "new" | "top";
  onSortChange: (sort: "hot" | "new" | "top") => void;
}

export function ForumSortOptions({ sortBy, onSortChange }: ForumSortOptionsProps) {
  const sortOptions = [
    { id: "hot", label: "Hot", icon: TrendingUp },
    { id: "new", label: "New", icon: Clock },
    { id: "top", label: "Top", icon: Star },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-200 dark:border-gray-600 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Sort By
      </h3>
      <div className="space-y-2">
        {sortOptions.map((sort) => {
          const Icon = sort.icon;
          return (
            <button
              key={sort.id}
              onClick={() => onSortChange(sort.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                sortBy === sort.id
                  ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border border-pink-300 dark:border-pink-600"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-gray-600 border border-pink-200 dark:border-gray-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {sort.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
