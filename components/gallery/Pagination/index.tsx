"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { PaginationState, PaginationProps } from "@/types/gallery";

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onItemsPerPageChange,
  className = "",
  showItemsPerPageSelector = true,
  itemsPerPageOptions = [20, 40, 60],
}) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage = currentPage < totalPages,
    hasPreviousPage = currentPage > 1,
    startIndex = (currentPage - 1) * itemsPerPage + 1,
    endIndex = Math.min(currentPage * itemsPerPage, totalItems),
  } = pagination;

  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Smart pagination logic
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= maxVisiblePages; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Show current page in center
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }

    return pageNumbers.map((pageNum) => (
      <Button
        key={pageNum}
        variant={currentPage === pageNum ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(pageNum)}
        className={`w-10 h-8 ${
          currentPage === pageNum
            ? "bg-pink-600 hover:bg-pink-700 text-white"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {pageNum}
      </Button>
    ));
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Pagination Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          {startIndex}
        </span>{" "}
        to{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          {endIndex}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          {totalItems.toLocaleString()}
        </span>{" "}
        results
      </div>

      {/* Items per page selector */}
      {showItemsPerPageSelector && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Items per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              onItemsPerPageChange(parseInt(value));
            }}
          >
            <SelectTrigger className="w-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
          className="border-gray-300 dark:border-gray-600"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="border-gray-300 dark:border-gray-600"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {renderPageNumbers()}
          
          {/* Show ellipsis and last page if needed */}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-gray-400 px-2">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="w-10 h-8 border-gray-300 dark:border-gray-600"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="border-gray-300 dark:border-gray-600"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          className="border-gray-300 dark:border-gray-600"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;