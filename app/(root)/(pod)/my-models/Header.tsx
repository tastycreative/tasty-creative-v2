"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { RefreshButton } from "@/components/pod-new/shared/ui/LoadingStates";

export function MyModelsHeader() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh(); // Triggers a server-side re-render
    
    // Minimal delay to show visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="relative overflow-hidden bg-white/40 dark:bg-gray-900/40 rounded-3xl border border-white/20 dark:border-white/5 backdrop-blur-xl mb-8 shadow-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-5 mb-1">
              <div className="p-3.5 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/10 dark:to-purple-400/10 rounded-2xl border border-pink-100/50 dark:border-pink-500/20 backdrop-blur-sm shadow-sm ring-1 ring-white/50">
                <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
                    My Models
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium tracking-wide">
                  Manage and monitor your creator profiles
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RefreshButton
              onClick={handleRefresh}
              isLoading={isRefreshing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
