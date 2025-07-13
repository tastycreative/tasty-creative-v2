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
    <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
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
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                  : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
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
