"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, Zap, Download, X, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkFavorite: () => void;
  onBulkPTR: () => void;
  onBulkExport: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  className?: string;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onBulkFavorite,
  onBulkPTR,
  onBulkExport,
  onSelectAll,
  onClearSelection,
  className = "",
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50",
        "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700",
        "px-6 py-4 flex items-center gap-4",
        "animate-in slide-in-from-bottom-4 duration-300",
        className
      )}
    >
      {/* Selection Count */}
      <div className="flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
          {selectedCount}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount === 1 ? "item selected" : "items selected"}
        </span>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkFavorite}
          className="h-10 px-4 border-pink-200 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          title="Add to favorites"
        >
          <Heart className="w-4 h-4 mr-2" />
          Favorite
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkPTR}
          className="h-10 px-4 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          title="Add to PTR rotation"
        >
          <Zap className="w-4 h-4 mr-2" />
          PTR
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkExport}
          className="h-10 px-4 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
          title="Export selected items"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="h-10 px-4 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Select all visible items"
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Select All
        </Button>
      </div>

      {/* Clear Selection */}
      <div className="pl-4 border-l border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-10 px-4 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Clear selection"
        >
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
