"use client";

import { useState } from "react";
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

interface AdminUsersClientProps {
  users: User[];
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
  users,
  totalUsers,
  adminCount,
  moderatorCount,
  userCount,
  swdCount,
  guestCount,
  growthRate,
  sessionUserId,
}: AdminUsersClientProps) {
  const [activeTab, setActiveTab] = useState<"users" | "history">("users");

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
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button className="inline-flex items-center px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter by Role
                  </button>
                  <button className="inline-flex items-center px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-pink-200 dark:border-pink-500/30 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Range
                  </button>
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
                  All Users ({totalUsers})
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Last updated: </span>
                  <span>Just now</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr className="border-b border-pink-200 dark:border-pink-500/30">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        User Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Role & Permissions
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Account Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="h-12 w-12 rounded-full object-cover mr-4 border-2 border-pink-200 dark:border-pink-500/30 group-hover:border-pink-300 dark:group-hover:border-pink-400 transition-all duration-300"
                                src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                                alt={user.name || ""}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-4 group-hover:bg-pink-100 dark:group-hover:bg-pink-500/20 transition-all duration-300">
                                <User className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-pink-500" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                {user.name || "No name"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                            {user.email}
                          </div>
                          <div className={`text-xs ${user.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {user.emailVerified ? 'Verified Account' : 'Unverified Account'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`
                              font-medium border transition-all duration-300 hover:scale-105
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
                            {user.role === "SWD" ? "Script Writer" : user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {formatForDisplay(user.createdAt, 'date')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatForDisplay(user.createdAt, 'EEEE')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <UserRoleForm
                              userId={user.id}
                              currentRole={user.role as Role}
                              userName={user.name || user.email || "User"}
                              isCurrentUser={user.id === sessionUserId}
                            />
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 hover:scale-110">
                              <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <ActivityHistoryTable />
      )}
    </div>
  );
}
