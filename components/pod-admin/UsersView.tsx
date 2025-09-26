"use client";

import React from "react";
import { Users, Search, X } from "lucide-react";
import { UserRoleCard } from "./UserRoleCard";

interface SystemUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
}

interface UsersViewProps {
  users: SystemUser[];
  isUsersLoading: boolean;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  userRoleFilter: "all" | "POD" | "USER" | "GUEST";
  setUserRoleFilter: (filter: "all" | "POD" | "USER" | "GUEST") => void;
  fetchUsers: () => void;
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
  setUsers: React.Dispatch<React.SetStateAction<SystemUser[]>>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  isUsersLoading,
  userSearchQuery,
  setUserSearchQuery,
  userRoleFilter,
  setUserRoleFilter,
  fetchUsers,
  onRoleUpdate,
  setUsers,
}) => {
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      userSearchQuery === "" ||
      user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(userSearchQuery.toLowerCase());

    const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    await onRoleUpdate(userId, newRole);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          User Management
        </h3>
        <button
          onClick={fetchUsers}
          disabled={isUsersLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <Users className="h-4 w-4" />
          <span>{isUsersLoading ? "Loading..." : "Refresh Users"}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Filter by role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) =>
                  setUserRoleFilter(e.target.value as "all" | "POD" | "USER" | "GUEST")
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">All Roles</option>
                <option value="POD">POD</option>
                <option value="USER">USER</option>
                <option value="GUEST">GUEST</option>
              </select>
            </div>
            {(userSearchQuery || userRoleFilter !== "all") && (
              <button
                onClick={() => {
                  setUserSearchQuery("");
                  setUserRoleFilter("all");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {!isUsersLoading && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredUsers.length} of {users.length} users
              {(userSearchQuery || userRoleFilter !== "all") && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">(filtered)</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isUsersLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Users Grid */}
      {!isUsersLoading && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserRoleCard
              key={user.id}
              user={user}
              onRoleUpdate={handleRoleUpdate}
            />
          ))}
        </div>
      )}

      {/* No Results State */}
      {!isUsersLoading &&
        filteredUsers.length === 0 &&
        (userSearchQuery || userRoleFilter !== "all") && (
          <div className="text-center py-12">
            <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No users match your search
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => {
                setUserSearchQuery("");
                setUserRoleFilter("all");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

      {/* Empty State */}
      {!isUsersLoading && users.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No users found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try refreshing to load users.
          </p>
        </div>
      )}
    </div>
  );
};