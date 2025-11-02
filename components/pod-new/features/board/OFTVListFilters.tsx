"use client";

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import ModelsDropdownList from '@/components/ModelsDropdownList';

interface OFTVListFiltersProps {
  onFilterChange: (filters: OFTVFilters) => void;
}

export interface OFTVFilters {
  weeklyDeadlines: boolean;
  completed: boolean;
  published: boolean;
  onHold: boolean;
  selectedModel: string;
}

export default function OFTVListFilters({ onFilterChange }: OFTVListFiltersProps) {
  const [filters, setFilters] = useState<OFTVFilters>({
    weeklyDeadlines: false,
    completed: false,
    published: false,
    onHold: false,
    selectedModel: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof OFTVFilters, value: boolean | string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: OFTVFilters = {
      weeklyDeadlines: false,
      completed: false,
      published: false,
      onHold: false,
      selectedModel: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'selectedModel') return value !== '';
    return value === true;
  }).length;

  return (
    <div className="mb-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filters */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status Filters
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.weeklyDeadlines}
                  onChange={(e) => updateFilter('weeklyDeadlines', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Weekly Deadlines
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.completed}
                  onChange={(e) => updateFilter('completed', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Completed
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.published}
                  onChange={(e) => updateFilter('published', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Published
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onHold}
                  onChange={(e) => updateFilter('onHold', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  On Hold
                </span>
              </label>
            </div>

            {/* Model Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Filter by Model
              </label>
              <ModelsDropdownList
                value={filters.selectedModel}
                onValueChange={(value) => updateFilter('selectedModel', value)}
                placeholder="Select model..."
                className="w-full"
              />
              {filters.selectedModel && (
                <button
                  onClick={() => updateFilter('selectedModel', '')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear model filter
                </button>
              )}
            </div>

            {/* Filter Descriptions */}
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-700 dark:text-gray-300">Filter Definitions:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Weekly Deadlines:</strong> Tasks due this week</li>
                <li><strong>Completed:</strong> Video & Thumbnail are Approved or Sent</li>
                <li><strong>Published:</strong> Both statuses are Published</li>
                <li><strong>On Hold:</strong> Either status is Hold or Waiting for VO</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
