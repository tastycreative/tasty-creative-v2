"use client";

import React from "react";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  User,
  X,
  Settings,
} from "lucide-react";

type PriorityFilter = "ALL" | "URGENT" | "HIGH" | "MEDIUM" | "LOW";
type AssigneeFilter = "ALL" | "MY_TASKS" | "ASSIGNED" | "UNASSIGNED";
type DueDateFilter = "ALL" | "OVERDUE" | "TODAY" | "WEEK";
type WorkflowFilter = "ALL" | "NORMAL" | "GAME" | "POLL" | "LIVESTREAM" | "LEGACY";
type SortBy = "title" | "priority" | "dueDate" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

interface BoardFiltersProps {
  searchTerm: string;
  priorityFilter: PriorityFilter;
  assigneeFilter: AssigneeFilter;
  dueDateFilter: DueDateFilter;
  workflowFilter: WorkflowFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;
  showFilters: boolean;
  filteredTasksCount: number;
  totalTasks: number;
  setSearchTerm: (term: string) => void;
  setPriorityFilter: (filter: PriorityFilter) => void;
  setAssigneeFilter: (filter: AssigneeFilter) => void;
  setDueDateFilter: (filter: DueDateFilter) => void;
  setWorkflowFilter: (filter: WorkflowFilter) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setShowFilters: (show: boolean) => void;
  setShowColumnSettings: (show: boolean) => void;
}

export default function BoardFilters({
  searchTerm,
  priorityFilter,
  assigneeFilter,
  dueDateFilter,
  workflowFilter,
  sortBy,
  sortOrder,
  showFilters,
  filteredTasksCount,
  totalTasks,
  setSearchTerm,
  setPriorityFilter,
  setAssigneeFilter,
  setDueDateFilter,
  setWorkflowFilter,
  setSortBy,
  setSortOrder,
  setShowFilters,
  setShowColumnSettings,
}: BoardFiltersProps) {
  const hasActiveFilters =
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL" ||
    dueDateFilter !== "ALL" ||
    workflowFilter !== "ALL";

  const clearAllFilters = () => {
    setSearchTerm("");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setDueDateFilter("ALL");
    setWorkflowFilter("ALL");
  };

  return (
    <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border border-gray-200/60 dark:border-gray-700/60 rounded-xl backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="p-6 space-y-6">
      {/* Search Bar and Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 h-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 dark:focus:border-pink-500 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2.5 h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 dark:focus:border-pink-500 text-sm transition-all duration-200"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Created Date</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2.5 h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-200"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Toggle and Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick My Tasks Filter */}
          <button
            onClick={() =>
              setAssigneeFilter(
                assigneeFilter === "MY_TASKS" ? "ALL" : "MY_TASKS"
              )
            }
            className={`flex items-center space-x-2 px-4 py-3 h-12 border rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              assigneeFilter === "MY_TASKS"
                ? "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700"
                : "text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 border-gray-200 dark:border-gray-700"
            }`}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">My Tasks</span>
          </button>

          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
            {filteredTasksCount} of {totalTasks} tasks
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-3 h-12 border rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              showFilters || hasActiveFilters
                ? "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full">
                <span className="sm:hidden">!</span>
                <span className="hidden sm:inline">Active</span>
              </span>
            )}
          </button>

          {/* Column Settings Button */}
          <button
            onClick={() => setShowColumnSettings(true)}
            className="flex items-center space-x-2 px-4 py-3 h-12 border rounded-xl text-sm font-medium border-gray-200 text-gray-600 bg-white dark:border-gray-700 dark:text-gray-400 dark:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Columns</span>
          </button>

          {(searchTerm || hasActiveFilters) && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="sm:hidden">Clear</span>
              <span className="hidden sm:inline">Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as PriorityFilter)
                }
                className="w-full px-3 py-2.5 h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 dark:focus:border-pink-500 text-sm transition-all duration-200"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignment
              </label>
              <select
                value={assigneeFilter}
                onChange={(e) =>
                  setAssigneeFilter(e.target.value as AssigneeFilter)
                }
                className="w-full px-3 py-2.5 h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 dark:focus:border-pink-500 text-sm transition-all duration-200"
              >
                <option value="ALL">All Tasks</option>
                <option value="MY_TASKS">My Tasks</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <select
                value={dueDateFilter}
                onChange={(e) =>
                  setDueDateFilter(e.target.value as DueDateFilter)
                }
                className="w-full px-3 py-2.5 h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 dark:focus:border-pink-500 text-sm transition-all duration-200"
              >
                <option value="ALL">All Dates</option>
                <option value="OVERDUE">Overdue</option>
                <option value="TODAY">Due Today</option>
                <option value="WEEK">Due This Week</option>
              </select>
            </div>

            {/* Workflow Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Workflow Type
              </label>
              <select
                value={workflowFilter}
                onChange={(e) =>
                  setWorkflowFilter(e.target.value as WorkflowFilter)
                }
                className="w-full px-3 py-2.5 h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 dark:focus:border-pink-500 text-sm transition-all duration-200"
              >
                <option value="ALL">All Workflows</option>
                <option value="NORMAL">🗒️ Normal Content</option>
                <option value="GAME">🎮 Games</option>
                <option value="POLL">📊 Polls</option>
                <option value="LIVESTREAM">📺 Livestreams</option>
                <option value="LEGACY">🏷️ Legacy OTP/PTR</option>
              </select>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
