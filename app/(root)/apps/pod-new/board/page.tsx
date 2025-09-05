"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";

// Dynamic import for better performance
const Board = dynamic(() => import("@/components/pod/Board"), {
  loading: () => (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        <span className="text-white">Loading board...</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function BoardPage() {
  const { data: session } = useSession();
  const { selectedRow, setSelectedRow } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

  return (
    <Suspense
      fallback={
        <div className="bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            <span className="text-white">Loading board...</span>
          </div>
        </div>
      }
    >
      <Board
        teamId={`team-${selectedRow}`}
        teamName={
          availableTeams.find((team) => team.row === selectedRow)?.name ||
          "Selected Team"
        }
        session={session}
        availableTeams={availableTeams}
        onTeamChange={setSelectedRow}
        selectedRow={selectedRow}
      />
    </Suspense>
  );
}
