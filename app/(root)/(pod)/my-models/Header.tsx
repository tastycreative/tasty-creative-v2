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
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 mb-8 backdrop-blur-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    My Models
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
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
