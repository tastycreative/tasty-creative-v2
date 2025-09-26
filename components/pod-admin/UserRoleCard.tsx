"use client";

import React, { useState } from "react";
import { Settings, User, Shield, UserCheck } from "lucide-react";
import { formatForDisplay } from "@/lib/dateUtils";

interface SystemUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
}

interface UserRoleCardProps {
  user: SystemUser;
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
}

export const UserRoleCard: React.FC<UserRoleCardProps> = ({ user, onRoleUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "POD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-500/30";
      case "USER":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-500/30";
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-500/30";
      case "GUEST":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "POD":
        return <Settings className="h-4 w-4" />;
      case "USER":
        return <User className="h-4 w-4" />;
      case "ADMIN":
        return <Shield className="h-4 w-4" />;
      case "GUEST":
        return <User className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const handleRoleUpdate = async (newRole: string) => {
    if (newRole === user.role) return;

    setIsUpdating(true);
    try {
      await onRoleUpdate(user.id, newRole);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update user role");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
      {/* User Info */}
      <div className="flex items-center space-x-4 mb-4">
        {user.image ? (
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
            alt={user.name || ""}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
            {(user.name || user.email || "U").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {user.name || "No Name"}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-4">
        <div
          className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getRoleColor(user.role)}`}
        >
          {getRoleIcon(user.role)}
          <span className="font-medium">{user.role}</span>
          {showSuccess && (
            <span className="text-green-600 dark:text-green-400">✓</span>
          )}
        </div>
      </div>

      {/* Role Toggle Buttons */}
      {(user.role === "USER" ||
        user.role === "POD" ||
        user.role === "GUEST") && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRoleUpdate("USER")}
              disabled={isUpdating || user.role === "USER"}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                user.role === "USER"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-500/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300"
              }`}
            >
              <User className="h-4 w-4" />
              <span>USER</span>
            </button>

            <button
              onClick={() => handleRoleUpdate("POD")}
              disabled={isUpdating || user.role === "POD"}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                user.role === "POD"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>POD</span>
            </button>
          </div>

          {isUpdating && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Updating...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Role Notice */}
      {user.role === "ADMIN" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">
              Admin role cannot be changed
            </span>
          </div>
        </div>
      )}

      {/* User Details */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Joined {formatForDisplay(user.createdAt, 'short')}</span>
          <span>ID: {user.id.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
};