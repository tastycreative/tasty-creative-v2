"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, Inbox } from "lucide-react";

interface EmptyStateProps {
  type?: "no-results" | "no-data" | "filtered";
  onClearFilters?: () => void;
  message?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = "no-results",
  onClearFilters,
  message,
  description,
}) => {
  const getIcon = () => {
    switch (type) {
      case "filtered":
        return <Filter className="w-16 h-16 text-gray-300 dark:text-gray-600" />;
      case "no-data":
        return <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600" />;
      default:
        return <Search className="w-16 h-16 text-gray-300 dark:text-gray-600" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case "filtered":
        return "No content matches your filters";
      case "no-data":
        return "No content available";
      default:
        return "No results found";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "filtered":
        return "Try adjusting your filters or search terms to find what you're looking for";
      case "no-data":
        return "Content will appear here once it's added to the gallery";
      default:
        return "We couldn't find any content matching your search";
    }
  };

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-full">
        {getIcon()}
      </div>

      {/* Message */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
        {message || getDefaultMessage()}
      </h3>

      {/* Description */}
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        {description || getDefaultDescription()}
      </p>

      {/* Actions */}
      {type === "filtered" && onClearFilters && (
        <Button
          onClick={onClearFilters}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
        >
          Clear All Filters
        </Button>
      )}

      {type === "no-results" && onClearFilters && (
        <div className="flex gap-3">
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="border-gray-300 dark:border-gray-600"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
