"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

// Dynamic import for better performance
const PodAdminDashboard = dynamic(() => import("@/components/pod-new/features/admin/PodAdminDashboard"), {
  loading: () => (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 p-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl backdrop-blur-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 dark:border-pink-400"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Loading admin dashboard...</span>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

export default function AdminPage() {
  const { data: session } = useSession();

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return (
      <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 p-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-red-200/60 dark:border-red-700/60 shadow-xl backdrop-blur-sm p-6 text-center">
          <div className="text-red-600 dark:text-red-400">
            <p>Access denied. Admin or Moderator role required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 p-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl backdrop-blur-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 dark:border-pink-400"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    }>
      <PodAdminDashboard />
    </Suspense>
  );
}