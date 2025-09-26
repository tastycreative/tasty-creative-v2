"use client";

import React from "react";
import { Settings } from "lucide-react";

type ViewType = "overview" | "teams" | "users";

interface AdminHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  fetchUsers?: () => void;
  users?: any[];
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  activeView, 
  setActiveView, 
  fetchUsers, 
  users 
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h2>
        </div>
        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium self-start sm:self-auto">
          Admin Only
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
        <button
          onClick={() => setActiveView("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
            activeView === "overview"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveView("teams")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
            activeView === "teams"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <span className="hidden sm:inline">Team Management</span>
          <span className="sm:hidden">Teams</span>
        </button>
        {/* User Management temporarily disabled */}
        {/*
        <button
          onClick={() => {
            setActiveView("users");
            if (users && users.length === 0 && fetchUsers) fetchUsers();
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
            activeView === "users"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <span className="hidden sm:inline">User Management</span>
          <span className="sm:hidden">Users</span>
        </button>
        */}
      </div>
    </div>
  );
};