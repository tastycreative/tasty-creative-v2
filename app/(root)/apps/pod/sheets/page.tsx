"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePodData, useDriveSheets, useSheetLinks, usePodStore } from "@/lib/stores/podStore";

// Dynamic import for better performance
const SheetsIntegration = dynamic(() => import("@/components/SheetsIntegration"), {
  loading: () => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
        <span className="text-gray-700 dark:text-gray-300">Loading sheets integration...</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function SheetsPage() {
  const { podData } = usePodData();
  const { fetchDriveSheets } = useDriveSheets();
  const { fetchSheetLinks } = useSheetLinks();
  const selectedTeamId = usePodStore((state) => state.selectedTeamId);

  const handleSpreadsheetCreated = () => {
    // Optional: Enhanced functionality when team data is available
    if (podData?.creators && podData.creators.length > 0) {
      const creatorNames = podData.creators.map(creator => creator.name);
      fetchDriveSheets(creatorNames, true);
    }
  };

  const handleSheetLinksUpdated = () => {
    // Optional: Enhanced functionality when team is selected
    if (selectedTeamId) {
      fetchSheetLinks(selectedTeamId, true); // Force refresh
    }
  };

  // Sheets integration is public - no team data required

  return (
    <Suspense fallback={
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Loading sheets integration...</span>
        </div>
      </div>
    }>
      <SheetsIntegration
        onSpreadsheetCreated={handleSpreadsheetCreated}
        onSheetCreated={() => {
          if (podData?.creators && podData.creators.length > 0) {
            const creatorNames = podData.creators.map(creator => creator.name);
            fetchDriveSheets(creatorNames, true);
          }
        }}
        onSheetLinksUpdated={handleSheetLinksUpdated}
      />
    </Suspense>
  );
}