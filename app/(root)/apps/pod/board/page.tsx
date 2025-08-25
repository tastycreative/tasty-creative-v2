"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";

// Dynamic import for better performance
const Board = dynamic(() => import("@/components/pod/Board"), {
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
  const { selectedRow, setSelectedRow } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

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
        teamId={`team-${selectedRow}`}
        teamName={
          availableTeams.find((team) => team.row === selectedRow)
            ?.name || "Selected Team"
        }
        session={session}
        availableTeams={availableTeams}
        onTeamChange={setSelectedRow}
        selectedRow={selectedRow}
      />
    </Suspense>
  );
}