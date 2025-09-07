"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

// Dynamic import for better performance  
const PodAdminDashboard = dynamic(() => import("@/components/PodAdminDashboard"), {
  loading: () => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
        <span className="text-gray-700 dark:text-gray-300">Loading admin dashboard...</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function AdminPage() {
  const { data: session } = useSession();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-red-200 dark:border-red-500/30 rounded-lg p-6 text-center">
        <div className="text-red-600 dark:text-red-400">
          <p>Access denied. Admin role required.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Loading admin dashboard...</span>
        </div>
      </div>
    }>
      <PodAdminDashboard />
    </Suspense>
  );
}