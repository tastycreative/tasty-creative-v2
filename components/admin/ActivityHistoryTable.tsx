"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  ChevronDown,
  User,
  Shield,
  UserCheck,
  Pencil,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface UserActivityData {
  id: string;
  actionType: string;
  oldRole: string | null;
  newRole: string;
  reason: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  targetUser: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface ActivityHistoryTableProps {
  className?: string;
}

export function ActivityHistoryTable({ className = "" }: ActivityHistoryTableProps) {
  const [activities, setActivities] = useState<UserActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchActivities = async (pageNum: number = 1, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "50"
      });

      if (filterType !== "ALL") {
        params.append("actionType", filterType);
      }

      const response = await fetch(`/api/admin/user-activity-history?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch activity history");
      }

      const data = await response.json();
      
      if (isLoadMore) {
        setActivities(prev => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }
      
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, false);
  }, [filterType]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3" />;
      case "MODERATOR":
        return <UserCheck className="h-3 w-3" />;
      case "SWD":
        return <Pencil className="h-3 w-3" />;
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

  const filteredActivities = activities.filter(activity => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.actor.name?.toLowerCase().includes(searchLower) ||
      activity.actor.email.toLowerCase().includes(searchLower) ||
      activity.targetUser.name?.toLowerCase().includes(searchLower) ||
      activity.targetUser.email.toLowerCase().includes(searchLower) ||
      activity.reason?.toLowerCase().includes(searchLower)
    );
  });

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-500/30">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            Error loading activity history
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => fetchActivities(1, false)}
            className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${className} max-w-full overflow-hidden`}>
      {/* Activity History Table with Integrated Search/Filter */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 max-w-full">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-pink-200 dark:border-pink-500/30 p-4 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
                <History className="h-5 w-5 mr-2 text-pink-500" />
                User Activity History ({filteredActivities.length})
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
                  className="appearance-none px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm min-w-[140px]"
                >
                  <option value="ALL">All Activities</option>
                  <option value="ROLE_CHANGED">Role Changes</option>
                  <option value="ACCOUNT_CREATED">Account Created</option>
                  <option value="ACCOUNT_SUSPENDED">Account Suspended</option>
                  <option value="ACCOUNT_REACTIVATED">Account Reactivated</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Refresh Button */}
              <button 
                onClick={() => fetchActivities(1, false)}
                className="inline-flex items-center justify-center px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all text-sm font-medium"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                    className="w-full xs:w-auto appearance-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm sm:text-base"
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
                  onClick={() => fetchActivities(1, false)}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all text-sm sm:text-base font-medium"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Refresh</span>
                  <span className="xs:hidden">↻</span>
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-pink-500 mr-2" />
                Loading activity history...
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No activity history found.
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-pink-200 dark:divide-pink-500/30">
                  {filteredActivities.map((activity) => (
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
                    {filteredActivities.map((activity) => (
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

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 sm:p-6 text-center border-t border-pink-200 dark:border-pink-500/30">
                  <button
                    onClick={() => fetchActivities(page + 1, true)}
                    disabled={loading}
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    <span>{loading ? "Loading..." : "Load More Activities"}</span>
                  </button>
                  
                  {/* Activity count info */}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Showing {filteredActivities.length} of many activities
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
