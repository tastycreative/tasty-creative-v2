"use client";

import React, { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";
import BoardErrorBoundary from "@/components/pod-new/features/board/BoardErrorBoundary";

// Dynamic import for better performance
const Board = dynamic(() => import("@/components/pod-new/features/board/Board"), {
  loading: () => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        <span className="text-gray-700 dark:text-gray-300">Loading board...</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function BoardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { selectedTeamId, setSelectedTeamId } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

  const searchParamsString = searchParams?.toString() || "";

  // Ensure store tracks the team from the URL or selects a fallback
  useEffect(() => {
    if (!availableTeams.length) return;

    const params = new URLSearchParams(searchParamsString);
    const urlTeam = params.get("team");
    const urlTeamValid = !!urlTeam && availableTeams.some((team) => team.id === urlTeam);

    if (urlTeamValid) {
      if (urlTeam !== selectedTeamId) {
        setSelectedTeamId(urlTeam!);
      }
      return;
    }

    const storeTeamValid =
      !!selectedTeamId && availableTeams.some((team) => team.id === selectedTeamId);
    const fallbackTeam = storeTeamValid ? selectedTeamId : availableTeams[0]?.id;

    if (fallbackTeam && fallbackTeam !== selectedTeamId) {
      setSelectedTeamId(fallbackTeam);
    }
  }, [availableTeams, searchParamsString, selectedTeamId, setSelectedTeamId]);

  // Make sure the URL always reflects the selected team
  useEffect(() => {
    if (!selectedTeamId) return;

    const params = new URLSearchParams(searchParamsString);
    if (params.get("team") === selectedTeamId) {
      return;
    }

    params.set("team", selectedTeamId);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParamsString, selectedTeamId]);

  const currentTeam = availableTeams.find((team) => team.id === selectedTeamId);

  if (!selectedTeamId || !currentTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg p-6 text-center backdrop-blur-sm">
            <p className="text-gray-700 dark:text-gray-300">Please select a team to view the board.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BoardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 dark:border-pink-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Loading board...</span>
              </div>
            </div>
          }>
            <Board
              teamId={selectedTeamId}
              teamName={currentTeam.name}
              session={session}
            />
          </Suspense>
        </div>
      </div>
    </BoardErrorBoundary>
  );
}
