"use client";

import React from "react";
import { Session } from "next-auth";
import {
  Search,
  Filter,
  SortAsc,
  User,
  Calendar,
  ChevronDown,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BoardFiltersProps {
  searchTerm: string;
  priorityFilter: string;
  assigneeFilter: string;
  dueDateFilter: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  showFilters: boolean;
  onSearchTermChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onAssigneeFilterChange: (value: string) => void;
  onDueDateFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  onShowFiltersChange: (value: boolean) => void;
  session: Session | null;
}

export default function BoardFilters({
  searchTerm,
  priorityFilter,
  assigneeFilter,
  dueDateFilter,
  sortBy,
  sortOrder,
  showFilters,
  onSearchTermChange,
  onPriorityFilterChange,
  onAssigneeFilterChange,
  onDueDateFilterChange,
  onSortByChange,
  onSortOrderChange,
  onShowFiltersChange,
  session
}: BoardFiltersProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <button
          onClick={() => onShowFiltersChange(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters
              ? "bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-600 text-pink-700 dark:text-pink-400"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          } hover:bg-pink-50 dark:hover:bg-pink-900/20`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {showFilters && (
            <X className="h-3 w-3 ml-1" />
          )}
        </button>
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Assignee Filter */}
          <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tasks</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              {session?.user && (
                <SelectItem value="MY_TASKS">My Tasks</SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Due Date Filter */}
          <Select value={dueDateFilter} onValueChange={onDueDateFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Dates</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="WEEK">This Week</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="updatedAt">Updated Date</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <button
            onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <SortAsc className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""} transition-transform`} />
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </button>

          {/* My Tasks Quick Filter */}
          {session?.user && (
            <button
              onClick={() =>
                onAssigneeFilterChange(
                  assigneeFilter === "MY_TASKS" ? "ALL" : "MY_TASKS"
                )
              }
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                assigneeFilter === "MY_TASKS"
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              } hover:bg-blue-50 dark:hover:bg-blue-900/20`}
            >
              <User className="h-4 w-4" />
              My Tasks
            </button>
          )}
        </div>
      )}
    </div>
  );
}