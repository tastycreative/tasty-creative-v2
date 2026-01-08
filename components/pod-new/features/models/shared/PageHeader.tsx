"use client";

import { Plus, Download } from "lucide-react";
import { RefreshButton } from "@/components/pod-new/shared/ui/LoadingStates";

export interface PageHeaderProps {
  onAddModel?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function PageHeader({
  onAddModel,
  onExport,
  isLoading,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        {onRefresh && (
          <RefreshButton isLoading={isLoading} onClick={onRefresh} size="md" />
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors duration-200 touch-target"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}

        {onAddModel && (
          <button
            onClick={onAddModel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-lg shadow-primary-500/25 transition-all duration-200 touch-target"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        )}
      </div>
    </div>
  );
}
