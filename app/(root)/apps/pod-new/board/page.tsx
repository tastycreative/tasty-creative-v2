"use client";

import React, { Suspense, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";

// Dynamic import for better performance
const Board = dynamic(() => import("@/components/pod-new/board/Board"), {
  loading: () => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
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
  const pathname = usePathname();
  const { selectedTeamId, setSelectedTeamId } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

  // Memoize search params to avoid unnecessary re-renders
  const teamParam = useMemo(() => searchParams?.get("team"), [searchParams]);

  // Memoize team existence check to avoid recalculating on every render
  const teamExists = useMemo(() => {
    if (!teamParam || !availableTeams.length) return false;
    return availableTeams.some(team => team.id === teamParam);
  }, [teamParam, availableTeams]);

  // Debounced URL update function
  const updateURL = useCallback((teamId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("team", teamId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Sync URL team parameter with Zustand store on mount - reduced dependencies
  useEffect(() => {
    // Skip if teams are not loaded yet
    if (!availableTeams.length) return;

    if (teamParam && teamParam !== selectedTeamId && teamExists) {
      setSelectedTeamId(teamParam);
    } else if (selectedTeamId && !teamParam) {
      updateURL(selectedTeamId);
    }
  }, [teamParam, selectedTeamId, teamExists, setSelectedTeamId, updateURL, availableTeams.length]);

  // Update URL when team changes in store - simplified
  useEffect(() => {
    if (selectedTeamId && teamParam !== selectedTeamId) {
      updateURL(selectedTeamId);
    }
  }, [selectedTeamId, teamParam, updateURL]);

  // Convert team options to match Board component expectations
  const teamOptions = availableTeams.map((team, index) => ({
    row: index + 1, // Convert to row numbers for Board component
    name: team.name,
    label: team.name
  }));

  const currentTeam = availableTeams.find((team) => team.id === selectedTeamId);
  const selectedRow = currentTeam ? teamOptions.findIndex(t => t.name === currentTeam.name) + 1 : 1;

  const handleTeamChange = (row: number) => {
    const team = teamOptions[row - 1];
    const actualTeam = availableTeams.find(t => t.name === team?.name);
    if (actualTeam) {
      setSelectedTeamId(actualTeam.id);
    }
  };

  if (!selectedTeamId || !currentTeam) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
        <p className="text-gray-700 dark:text-gray-300">Please select a team to view the board.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Loading board...</span>
        </div>
      </div>
    }>
      <Board
        teamId={selectedTeamId}
        teamName={currentTeam.name}
        session={session}
        availableTeams={teamOptions}
        onTeamChange={handleTeamChange}
        selectedRow={selectedRow}
      />
    </Suspense>
  );
}
