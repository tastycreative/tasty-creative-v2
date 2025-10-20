"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActivityHistory, useActivityHistoryActions } from "@/hooks/useActivityHistory";
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  UserCheck,
  Pencil,
  Briefcase,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityHistorySkeleton } from "@/components/ui/skeleton";

// Timezone-aware date formatting
const formatActivityDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Relative time for recent activities
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours}h ago`;
  } else if (diffInHours < 168) { // 7 days
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  }
  
  // Absolute time for older activities
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    timeZone: userTimezone,
    timeZoneName: 'short'
  }).format(date);
};

// Full date/time formatting
const formatFullDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone: userTimezone,
    timeZoneName: 'long'
  }).format(date);
};


interface ActivityHistoryTableProps {
  className?: string;
}

export function ActivityHistoryTable({ className = "" }: ActivityHistoryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { invalidateActivities } = useActivityHistoryActions();
  
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("search") || "");
  const [filterType, setFilterType] = useState(searchParams?.get("actionType") || "ALL");
  const [page, setPage] = useState(parseInt(searchParams?.get("page") || "1"));
  const [pageSize, setPageSize] = useState(searchParams?.get("limit") || "10");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounced search - only reset page when search actually changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Reset to first page when search term or filter changes (but not on initial load)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearchTerm, filterType]);

  // Query parameters for API
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    search: debouncedSearchTerm,
    actionType: filterType,
  }), [page, pageSize, debouncedSearchTerm, filterType]);

  // Use TanStack Query for data fetching
  const { 
    activities, 
    pagination, 
    isLoading, 
    isError, 
    error, 
    isFetching, 
    isRefetching,
    refetch 
  } = useActivityHistory(queryParams);

  // Update URL params
  const updateURL = useCallback((newParams: Partial<typeof queryParams>) => {
    const urlParams = new URLSearchParams(searchParams?.toString() || "");
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "ALL" && value !== "1" && value !== "10") {
        urlParams.set(key, value.toString());
      } else {
        urlParams.delete(key);
      }
    });

    const newURL = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    router.push(newURL, { scroll: false });
  }, [router, searchParams]);

  // Sync URL when individual params change
  useEffect(() => {
    updateURL({
      page: page,
      limit: pageSize,
      search: debouncedSearchTerm,
      actionType: filterType,
    });
  }, [page, pageSize, debouncedSearchTerm, filterType, updateURL]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit: string) => {
    setPageSize(newLimit);
    setPage(1); // Reset to first page
  };

  // Handle manual refresh
  const handleRefresh = () => {
    invalidateActivities();
    refetch();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3" />;
      case "MODERATOR":
        return <UserCheck className="h-3 w-3" />;
      case "SWD":
        return <Pencil className="h-3 w-3" />;
      case "POD":
        return <Briefcase className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500";
      case "MODERATOR":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/30";
      case "SWD":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30";
      case "USER":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-500/30";
      case "POD":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
    }
  };

  const getActivityTypeDisplay = (actionType: string) => {
    switch (actionType) {
      case "ROLE_CHANGED":
        return "Role Changed";
      case "ACCOUNT_CREATED":
        return "Account Created";
      case "ACCOUNT_SUSPENDED":
        return "Account Suspended";
      case "ACCOUNT_REACTIVATED":
        return "Account Reactivated";
      default:
        return actionType.replace("_", " ");
    }
  };


  return (
    <div className={`${className} max-w-full overflow-hidden`}>
      {/* Activity History Table with Integrated Search/Filter */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 max-w-full">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-pink-200 dark:border-pink-500/30 p-4 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
                <History className="h-5 w-5 mr-2 text-pink-500" />
                User Activity History {pagination ? `(${pagination.showing} of ${pagination.totalActivities})` : ''}
                {(isLoading || isFetching) && <RefreshCw className="h-4 w-4 ml-2 animate-spin" />}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track all user role changes and administrative actions
              </p>
            </div>

            {/* Compact Filter Controls - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-56 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm min-w-[140px] disabled:opacity-50"
                >
                  <option value="ALL">All Activities</option>
                  <option value="ROLE_CHANGED">Role Changes</option>
                  <option value="ACCOUNT_CREATED">Account Created</option>
                  <option value="ACCOUNT_SUSPENDED">Account Suspended</option>
                  <option value="ACCOUNT_REACTIVATED">Account Reactivated</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Page Size Selector */}
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 min-w-[100px] disabled:opacity-50 text-sm"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="all">Show All</option>
              </select>

              {/* Refresh Button */}
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center justify-center px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all text-sm font-medium"
                disabled={isRefetching}
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile Filter Controls */}
          <div className="lg:hidden mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-pink-200 dark:border-pink-500/30">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by user, email, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 xs:w-auto w-full">
                <div className="relative flex-1 xs:flex-none">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    disabled={isLoading}
                    className="w-full xs:w-auto appearance-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm sm:text-base disabled:opacity-50"
                  >
                    <option value="ALL">All Activities</option>
                    <option value="ROLE_CHANGED">Role Changes</option>
                    <option value="ACCOUNT_CREATED">Account Created</option>
                    <option value="ACCOUNT_SUSPENDED">Account Suspended</option>
                    <option value="ACCOUNT_REACTIVATED">Account Reactivated</option>
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <button 
                  onClick={handleRefresh}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all text-sm sm:text-base font-medium"
                  disabled={isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Refresh</span>
                  <span className="xs:hidden">↻</span>
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-8 text-center">
              <div className="text-red-500 dark:text-red-400 mb-2">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Error loading activity history</h3>
                <p className="text-sm mt-2">
                  {error?.message || "Failed to load activity history. Please try again."}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <ActivityHistorySkeleton count={pageSize === "all" ? 20 : Math.min(parseInt(pageSize) || 10, 20)} />
          ) : activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No activity history found</h3>
                <p className="text-sm mt-2">
                  {debouncedSearchTerm || filterType !== "ALL" 
                    ? "Try adjusting your search criteria or filters"
                    : "No activity history matches the current filters"}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-pink-200 dark:divide-pink-500/30">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                    >
                      <div className="space-y-3">
                        {/* Header: Action Type + Time */}
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-500/30 text-xs flex-shrink-0"
                          >
                            {getActivityTypeDisplay(activity.actionType)}
                          </Badge>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0" title={formatFullDateTime(activity.createdAt)}>
                            <Clock className="h-3 w-3" />
                            <span className="hidden xs:inline">{formatActivityDate(activity.createdAt)}</span>
                            <span className="xs:hidden">{formatActivityDate(activity.createdAt).replace(' ago', '')}</span>
                          </div>
                        </div>

                        {/* Actor and Target Users */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Actor */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-3">
                            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              Performed by
                            </div>
                            <div className="flex items-center space-x-2">
                              {activity.actor.image ? (
                                <img
                                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover border border-blue-200 dark:border-blue-500/30 flex-shrink-0"
                                  src={`/api/image-proxy?url=${encodeURIComponent(activity.actor.image)}`}
                                  alt={activity.actor.name || ""}
                                />
                              ) : (
                                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-200 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
                                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-300" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {activity.actor.name || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {activity.actor.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Target User */}
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 sm:p-3">
                            <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              Target user
                            </div>
                            <div className="flex items-center space-x-2">
                              {activity.targetUser.image ? (
                                <img
                                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover border border-purple-200 dark:border-purple-500/30 flex-shrink-0"
                                  src={`/api/image-proxy?url=${encodeURIComponent(activity.targetUser.image)}`}
                                  alt={activity.targetUser.name || ""}
                                />
                              ) : (
                                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-purple-200 dark:bg-purple-600 flex items-center justify-center flex-shrink-0">
                                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-300" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {activity.targetUser.name || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {activity.targetUser.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Role Change (if applicable) */}
                        {activity.actionType === 'ROLE_CHANGED' && (
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 sm:p-3">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Role Change
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              {activity.oldRole && (
                                <>
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs font-medium border ${getRoleBadgeStyle(activity.oldRole)} flex items-center gap-1`}
                                  >
                                    {getRoleIcon(activity.oldRole)}
                                    <span className="hidden xs:inline">{activity.oldRole === 'SWD' ? 'Script Writer' : activity.oldRole}</span>
                                    <span className="xs:hidden">{activity.oldRole}</span>
                                  </Badge>
                                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                </>
                              )}
                              <Badge
                                variant="secondary"
                                className={`text-xs font-medium border ${getRoleBadgeStyle(activity.newRole)} flex items-center gap-1`}
                              >
                                {getRoleIcon(activity.newRole)}
                                <span className="hidden xs:inline">{activity.newRole === 'SWD' ? 'Script Writer' : activity.newRole}</span>
                                <span className="xs:hidden">{activity.newRole}</span>
                              </Badge>
                            </div>
                          </div>
                        )}

                        {/* Reason */}
                        {activity.reason && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 sm:p-3">
                            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                              Reason
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic">
                              "{activity.reason}"
                            </p>
                          </div>
                        )}

                        {/* Timezone info for mobile */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 pt-1 border-t border-gray-200 dark:border-gray-600">
                          <Globe className="h-3 w-3" />
                          <span title={formatFullDateTime(activity.createdAt)}>
                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px]">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr className="border-b border-pink-200 dark:border-pink-500/30">
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[90px]">
                        Action
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                        Performed By
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                        Target User
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[150px]">
                        Role Change
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                        Reason
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[130px]">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-200 dark:divide-pink-500/30 bg-white dark:bg-gray-800">
                    {activities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                      >
                        {/* Action Type */}
                        <td className="px-2 py-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-500/30 text-xs"
                          >
                            {getActivityTypeDisplay(activity.actionType)}
                          </Badge>
                        </td>

                        {/* Actor */}
                        <td className="px-2 py-4">
                          <div className="flex items-center min-w-0">
                            {activity.actor.image ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover mr-2 border border-pink-200 dark:border-pink-500/30 flex-shrink-0"
                                src={`/api/image-proxy?url=${encodeURIComponent(activity.actor.image)}`}
                                alt={activity.actor.name || ""}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-2 flex-shrink-0">
                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {activity.actor.name || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {activity.actor.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Target User */}
                        <td className="px-2 py-4">
                          <div className="flex items-center min-w-0">
                            {activity.targetUser.image ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover mr-2 border border-pink-200 dark:border-pink-500/30 flex-shrink-0"
                                src={`/api/image-proxy?url=${encodeURIComponent(activity.targetUser.image)}`}
                                alt={activity.targetUser.name || ""}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-2 flex-shrink-0">
                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {activity.targetUser.name || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {activity.targetUser.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Change */}
                        <td className="px-2 py-4">
                          {activity.actionType === 'ROLE_CHANGED' ? (
                            <div className="flex items-center space-x-1 min-w-0">
                              {activity.oldRole && (
                                <>
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs font-medium border ${getRoleBadgeStyle(activity.oldRole)} flex items-center gap-1 flex-shrink-0`}
                                  >
                                    {getRoleIcon(activity.oldRole)}
                                    <span className="hidden xl:inline">{activity.oldRole === 'SWD' ? 'SWD' : activity.oldRole}</span>
                                  </Badge>
                                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                </>
                              )}
                              <Badge
                                variant="secondary"
                                className={`text-xs font-medium border ${getRoleBadgeStyle(activity.newRole)} flex items-center gap-1 flex-shrink-0`}
                              >
                                {getRoleIcon(activity.newRole)}
                                <span className="hidden xl:inline">{activity.newRole === 'SWD' ? 'SWD' : activity.newRole}</span>
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="px-2 py-4">
                          {activity.reason ? (
                            <div className="text-sm text-gray-900 dark:text-gray-100 max-w-[100px] break-words" title={activity.reason}>
                              <span className="line-clamp-2 truncate">{activity.reason}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1" title={formatFullDateTime(activity.createdAt)}>
                            <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{formatActivityDate(activity.createdAt)}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {activities.length > 0 && pagination && (
                <div className="px-4 py-6 border-t border-pink-200 dark:border-pink-500/30 bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm border border-pink-200 dark:border-pink-500/30 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="all">All</option>
                      </select>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {pagination.showing} of {pagination.totalActivities} activities
                      </span>
                      <button
                        onClick={handleRefresh}
                        disabled={isRefetching}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                        title="Refresh"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Pagination Buttons */}
                    {pageSize !== "all" && pagination.totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={!pagination.hasPrevPage || isLoading}
                          className="flex items-center px-3 py-1 text-sm border border-pink-200 dark:border-pink-500/30 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.totalPages - 2) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isLoading}
                                className={`px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 ${
                                  pageNum === pagination.page
                                    ? "bg-pink-500 text-white"
                                    : "border border-pink-200 dark:border-pink-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={!pagination.hasNextPage || isLoading}
                          className="flex items-center px-3 py-1 text-sm border border-pink-200 dark:border-pink-500/30 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
