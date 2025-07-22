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
    <div className="bg-white rounded-xl border border-pink-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                  ? "bg-pink-100 text-pink-700 border border-pink-300"
                  : "bg-white text-gray-600 hover:bg-pink-50 border border-pink-200"
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
