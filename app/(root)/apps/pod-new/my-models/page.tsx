"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EnhancedModelsPage from "@/components/pod-new/EnhancedModelsPage";
import { RefreshButton } from "@/components/pod-new/LoadingStates";
import { Plus, Download } from "lucide-react";
import { PageLoadingState } from "@/components/pod-new/LoadingStates";
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
              await fetchPodData(team.row);
              const teamPodResponse = await fetch("/api/pod/fetch-db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rowId: team.row }),
              });

              if (teamPodResponse.ok) {
                const { data: teamData } = await teamPodResponse.json();
                const isUserInTeam = teamData?.teamMembers?.some(
                  (member: any) =>
                    member.email?.toLowerCase() ===
                    session.user.email?.toLowerCase()
                );

                if (isUserInTeam && teamData?.creators) {
                  teamData.creators.forEach((creator: any) => {
                    if (!allUserCreators.includes(creator.name)) {
                      allUserCreators.push(creator.name);
                    }
                  });
                }
              }
            } catch (error) {
              console.error(
                `Error fetching data for team row ${team.row}:`,
                error
              );
            }
          }
        }
        setUserAssignedCreators(allUserCreators);
      } catch (error) {
        console.error("Error fetching user assignments:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    if (session?.user?.email) {
      if (teams.length === 0) {
        setIsLoadingAssignments(true);
        fetchAvailableTeams();
      } else {
        fetchUserAssignments();
      }
    } else if (session === null) {
      setIsLoadingAssignments(false);
    }
  }, [session, teams, fetchAvailableTeams, fetchPodData]);

  // Loading state while fetching user assignments
  if (isLoadingAssignments || !session) {
    return <PageLoadingState className="min-h-screen p-6" />;
  }

  // Not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view your models.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/40 to-purple-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 mb-6 backdrop-blur-sm">
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>
          <div className="relative px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-gray-500 via-pink-600 to-purple-600 dark:from-pink-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    My Models
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-base font-medium">
                  Manage and track your model performance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RefreshButton
                  isLoading={false}
                  onClick={() => window.location.reload()}
                  size="md"
                />
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-pink-200 dark:hover:border-pink-700 hover:bg-pink-50 transition-colors duration-200 touch-target">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg shadow-lg shadow-pink-500/25 transition-all duration-200 touch-target">
                  <Plus className="w-4 h-4" />
                  Add Model
                </button>
              </div>
            </div>
          </div>
        </div>

        <EnhancedModelsPage
          userRole={session.user.role}
          assignedCreators={userAssignedCreators}
          showHeader={false}
        />
      </div>
    </div>
  );
}
