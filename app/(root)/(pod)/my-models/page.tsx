"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EnhancedModelsPage from "@/components/pod-new/features/models/pages/EnhancedModelsPage";
import { RefreshButton } from "@/components/pod-new/shared/ui/LoadingStates";
import { Plus, Download } from "lucide-react";
import { PageLoadingState } from "@/components/pod-new/shared/ui/LoadingStates";
import { useAvailableTeams, usePodStore } from "@/lib/stores/podStore";

export default function PodNewMyModelsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { teams, fetchAvailableTeams } = useAvailableTeams();
  const { fetchPodData } = usePodStore();

  const [userAssignedCreators, setUserAssignedCreators] = useState<string[]>(
    []
  );
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Fetch user assignments for non-admin users
  useEffect(() => {
    const fetchUserAssignments = async () => {
      if (!session?.user?.email || session.user.role === "ADMIN") {
        setIsLoadingAssignments(false);
        return;
      }

      setIsLoadingAssignments(true);
      try {
        await fetchAvailableTeams();
        const allUserCreators: string[] = [];

        if (teams && teams.length > 0) {
          for (const team of teams) {
            try {
              await fetchPodData(team.id);
              const teamPodResponse = await fetch("/api/pod/fetch-db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ row: team.id }),
              });

              if (teamPodResponse.ok) {
                const teamData = await teamPodResponse.json();
                if (teamData.data && teamData.data.length > 0) {
                  const teamCreators = teamData.data
                    .map((item: any) => item.name)
                    .filter((name: string) => name && name.trim() !== "");
                  allUserCreators.push(...teamCreators);
                }
              }
            } catch (error) {
              console.error(`Error fetching data for team ${team.name}:`, error);
            }
          }
        }

        // Remove duplicates
        const uniqueCreators = [...new Set(allUserCreators)];
        setUserAssignedCreators(uniqueCreators);
      } catch (error) {
        console.error("Error fetching user assignments:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchUserAssignments();
  }, [session?.user?.email, session?.user?.role, teams, fetchAvailableTeams, fetchPodData]);

  const handleRefresh = useCallback(async () => {
    if (session?.user?.role !== "ADMIN") {
      // Re-fetch assignments for non-admin users
      setIsLoadingAssignments(true);
      try {
        await fetchAvailableTeams();
        // The useEffect will handle the rest
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    }
  }, [session?.user?.role, fetchAvailableTeams]);

  const handleExport = useCallback(() => {
    // Export functionality can be implemented here
    console.log("Export models data");
  }, []);

  const handleAddModel = useCallback(() => {
    router.push("/onboarding");
  }, [router]);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Models
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage and monitor your creator profiles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <RefreshButton
              onClick={handleRefresh}
              isLoading={isLoadingAssignments}
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleAddModel}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Model</span>
            </button>
          </div>
        </div>

        {/* Enhanced Models Page */}
        <EnhancedModelsPage
          assignedCreators={userAssignedCreators}
          userRole={session?.user?.role}
        />
      </div>
    </div>
  );
}