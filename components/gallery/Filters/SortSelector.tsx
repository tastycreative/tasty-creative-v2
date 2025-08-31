"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SortSelectorProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

const SortSelector: React.FC<SortSelectorProps> = ({
  sortBy,
  onSortChange,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Sort By
      </label>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="revenue">💰 Most Revenue</SelectItem>
          <SelectItem value="popularity">🔥 Most Popular</SelectItem>
          <SelectItem value="success-rate">✅ Best Success Rate</SelectItem>
          <SelectItem value="content-type">📂 By Content Type</SelectItem>
          <SelectItem value="creator">👤 By Creator</SelectItem>
          <SelectItem value="price-high">💸 Highest Price</SelectItem>
          <SelectItem value="price-low">💵 Lowest Price</SelectItem>
          <SelectItem value="newest">🕒 Newest First</SelectItem>
          <SelectItem value="roi">💎 Best ROI</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortSelector;