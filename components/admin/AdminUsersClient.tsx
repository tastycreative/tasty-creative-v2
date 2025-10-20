"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRoleForm } from "@/components/admin/UserRoleForm";
import { BulkRoleEditor } from "@/components/admin/BulkRoleEditor";
import { ActivityHistoryTable } from "@/components/admin/ActivityHistoryTable";
import { formatForDisplay } from "@/lib/dateUtils";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Filter,
  Download,
  Shield,
  UserCheck,
  User,
  Calendar,
  Eye,
  MoreHorizontal,
  Clock,
  Pencil,
  History,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

type User = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
  emailVerified: Date | null;
};

interface PaginationInfo {
  page: number;
  limit: string;
  totalUsers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  showing: number;
}

interface AdminUsersClientProps {
  initialUsers: User[];
  initialPagination: PaginationInfo;
  initialSearch: string;
  initialRoleFilter: string;
  totalUsers: number;
  adminCount: number;
  moderatorCount: number;
  userCount: number;
  swdCount: number;
  guestCount: number;
  growthRate: number;
  sessionUserId: string;
}

export function AdminUsersClient({
  initialUsers,
  initialPagination,
  initialSearch,
  initialRoleFilter,
  totalUsers,
  adminCount,
  moderatorCount,
  userCount,
  swdCount,
  guestCount,
  growthRate,
  sessionUserId,
}: AdminUsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<"users" | "history">("users");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedRole, setSelectedRole] = useState(initialRoleFilter || "all");
  const [pageSize, setPageSize] = useState(initialPagination.limit);
  const [loading, setLoading] = useState(false);

  // Fetch users from API
  const fetchUsers = useCallback(async (
    page: number = 1,
    limit: string = "10",
    search: string = "",
    role: string = "all"
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit,
        ...(search && { search }),
        ...(role !== "all" && { role }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update URL params
  const updateURL = useCallback((params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "1" && value !== "10") {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    const newURL = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    router.push(newURL, { scroll: false });
  }, [router, searchParams]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, pageSize, searchTerm, selectedRole);
      updateURL({
        page: "1",
        limit: pageSize,
        search: searchTerm,
        role: selectedRole,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRole, pageSize, fetchUsers, updateURL]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, pageSize, searchTerm, selectedRole);
    updateURL({
      page: newPage.toString(),
      limit: pageSize,
      search: searchTerm,
      role: selectedRole,
    });
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit: string) => {
    setPageSize(newLimit);
    fetchUsers(1, newLimit, searchTerm, selectedRole);
    updateURL({
      page: "1",
      limit: newLimit,
      search: searchTerm,
      role: selectedRole,
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "users"
                  ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              User Management ({totalUsers})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "history"
                  ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <History className="h-4 w-4 mr-2" />
              Activity History
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === "users" ? (
        <>
          {/* Enhanced Search and Filter Bar */}
          <Card className="border border-pink-200 dark:border-pink-500/30 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="inline-flex items-center px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 min-w-[140px]"
                  >
                    <option value="all">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="SWD">Script Writer</option>
                    <option value="USER">User</option>
                    <option value="GUEST">Guest</option>
                  </select>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    className="inline-flex items-center px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 min-w-[100px]"
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                    <option value="all">Show All</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Users Table */}
          <Card className="border border-pink-200 dark:border-pink-500/30 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800">
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-pink-200 dark:border-pink-500/30 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-pink-500" />
                  All Users ({pagination.showing} of {pagination.totalUsers})
                  {loading && <RefreshCw className="h-4 w-4 ml-2 animate-spin" />}
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Last updated: </span>
                  <span>Just now</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-sm mt-2">
                      {searchTerm || selectedRole !== "all" 
                        ? "Try adjusting your search criteria or filters"
                        : "No users match the current filters"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block lg:hidden">
                    <div className="divide-y divide-pink-200 dark:divide-pink-500/30">
                      {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                    >
                      <div className="flex items-start space-x-4">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="h-12 w-12 rounded-full object-cover border-2 border-pink-200 dark:border-pink-500/30 flex-shrink-0"
                            src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                            alt={user.name || ""}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {user.name || "No name"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {user.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Joined {formatForDisplay(user.createdAt, 'date')}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2 ml-2">
                              <Badge
                                variant="secondary"
                                className={`
                                  font-medium border text-xs
                                  ${
                                    user.role === "ADMIN"
                                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500"
                                      : user.role === "MODERATOR"
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/30"
                                        : user.role === "SWD"
                                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30"
                                          : user.role === "USER"
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-500/30"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-500/30"
                                  }
                                `}
                              >
                                {user.role === "SWD" ? "Script Writer" : user.role}
                              </Badge>
                              <UserRoleForm
                                userId={user.id}
                                currentRole={user.role as Role}
                                userName={user.name || user.email || "User"}
                                isCurrentUser={user.id === sessionUserId}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr className="border-b border-pink-200 dark:border-pink-500/30">
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[200px]">
                          User Details
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[180px]">
                          Contact
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                          Role & Permissions
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                          Account Info
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[160px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-pink-200 dark:divide-pink-500/30 bg-white dark:bg-gray-800">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-pink-200 dark:border-pink-500/30 group-hover:border-pink-300 dark:group-hover:border-pink-400 transition-all duration-300 flex-shrink-0"
                                src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                                alt={user.name || ""}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3 group-hover:bg-pink-100 dark:group-hover:bg-pink-500/20 transition-all duration-300 flex-shrink-0">
                                <User className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-pink-500" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors truncate">
                                {user.name || "No name"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="min-w-0">
                            <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors truncate">
                              {user.email}
                            </div>
                            <div className={`text-xs truncate ${user.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {user.emailVerified ? 'Verified' : 'Unverified'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`
                              font-medium border transition-all duration-300 hover:scale-105 text-xs
                              ${
                                user.role === "ADMIN"
                                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 hover:from-pink-600 hover:to-rose-600"
                                  : user.role === "MODERATOR"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                                    : user.role === "SWD"
                                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                                      : user.role === "USER"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-500/30 hover:bg-green-200 dark:hover:bg-green-900/50"
                                        : user.role === "GUEST"
                                          ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-500/30 hover:bg-gray-200 dark:hover:bg-gray-600"
                                          : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }
                            `}
                          >
                            {user.role === "ADMIN" && (
                              <Shield className="h-3 w-3 mr-1 inline" />
                            )}
                            {user.role === "MODERATOR" && (
                              <UserCheck className="h-3 w-3 mr-1 inline" />
                            )}
                            {user.role === "SWD" && (
                              <Pencil className="h-3 w-3 mr-1 inline" />
                            )}
                            {(user.role === "USER" || user.role === "GUEST") && (
                              <User className="h-3 w-3 mr-1 inline" />
                            )}
                            <span className="truncate">
                              {user.role === "SWD" ? "SWD" : user.role}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="min-w-0">
                            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                              {formatForDisplay(user.createdAt, 'date')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {formatForDisplay(user.createdAt, 'EEEE')}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1 min-w-0">
                            <UserRoleForm
                              userId={user.id}
                              currentRole={user.role as Role}
                              userName={user.name || user.email || "User"}
                              isCurrentUser={user.id === sessionUserId}
                            />
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 hover:scale-110 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

                  {/* Pagination Controls */}
                  {users.length > 0 && (
                    <div className="px-4 py-6 border-t border-pink-200 dark:border-pink-500/30 bg-gray-50 dark:bg-gray-900">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
                          <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(e.target.value)}
                            className="px-3 py-1 text-sm border border-pink-200 dark:border-pink-500/30 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="all">All</option>
                          </select>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {pagination.showing} of {pagination.totalUsers} users
                          </span>
                        </div>

                        {/* Pagination Buttons */}
                        {pageSize !== "all" && pagination.totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePageChange(pagination.page - 1)}
                              disabled={!pagination.hasPrevPage || loading}
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
                                    disabled={loading}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${
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
                              disabled={!pagination.hasNextPage || loading}
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
        </>
      ) : (
        <ActivityHistoryTable />
      )}
    </div>
  );
}
