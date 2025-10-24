"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import EnhancedModelsPage from "@/components/pod-new/features/models/pages/EnhancedModelsPage";
import { RefreshButton } from "@/components/pod-new/shared/ui/LoadingStates";
import { Download, Users } from "lucide-react";
import { PageLoadingState } from "@/components/pod-new/shared/ui/LoadingStates";
// import { useAvailableTeams, usePodStore } from "@/lib/stores/podStore";

export default function PodNewMyModelsPage() {
  const { data: session } = useSession();
  // const { teams, fetchAvailableTeams } = useAvailableTeams();
  // const { fetchPodData } = usePodStore();

  const [userAssignedCreators, setUserAssignedCreators] = useState<string[]>(
    []
  );
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Fetch user assignments for non-admin users
  useEffect(() => {
    const fetchUserAssignments = async () => {
      if (!session?.user?.email || session.user.role === "ADMIN" || session.user.role === "MODERATOR") {
        setIsLoadingAssignments(false);
        return;
      }

      setIsLoadingAssignments(true);
      try {
        const response = await fetch(`/api/pod/user-assigned-creators?userId=${session?.user?.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserAssignedCreators(data.assignedCreators || []);
        } else {
          console.error("Failed to fetch user assigned creators, status:", response.status);
          setUserAssignedCreators([]);
        }
      } catch (error) {
        console.error("Error fetching user assignments:", error);
        setUserAssignedCreators([]);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchUserAssignments();
  }, [session?.user?.email, session?.user?.role, session?.user?.id]);

  const handleRefresh = useCallback(async () => {
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      // Re-fetch assignments for non-admin/moderator users
      setIsLoadingAssignments(true);
      try {
        const response = await fetch(`/api/pod/user-assigned-creators?userId=${session?.user?.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserAssignedCreators(data.assignedCreators || []);
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    }
  }, [session?.user?.role, session?.user?.id]);

  const handleExport = useCallback(() => {
    // Export functionality can be implemented here
    console.log("Export models data");
  }, []);


  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <PageLoadingState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
                  isLoading={isLoadingAssignments}
                />
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-600/50 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors backdrop-blur-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Models Page */}
        <EnhancedModelsPage
          assignedCreators={userAssignedCreators}
          userRole={session?.user?.role}
          showHeader={false}
        />
      </div>
    </div>
  );
}