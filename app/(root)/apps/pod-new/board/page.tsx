"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";

// Dynamic import for better performance
const Board = dynamic(() => import("@/components/pod/Board"), {
  loading: () => (
    <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
        <span className="text-slate-200">Loading board...</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function PodNewBoardPage() {
  const { data: session } = useSession();
  const { selectedTeamId, setSelectedTeamId } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

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
      <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6 text-center">
        <p className="text-slate-200">Please select a team to view the board.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="bg-slate-900/70 border border-white/10 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
          <span className="text-slate-200">Loading board...</span>
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
