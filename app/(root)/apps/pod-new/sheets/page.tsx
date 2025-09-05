"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePodData, useDriveSheets } from "@/lib/stores/podStore";

// Dynamic import for better performance
const SheetsIntegration = dynamic(
  () => import("@/components/SheetsIntegration"),
  {
    loading: () => (
      <div className="bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          <span className="text-white">Loading sheets integration...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function SheetsPage() {
  const { podData } = usePodData();
  const { fetchDriveSheets } = useDriveSheets();

  const handleSpreadsheetCreated = () => {
    if (podData?.creators && podData.creators.length > 0) {
      const creatorNames = podData.creators.map((creator) => creator.name);
      fetchDriveSheets(creatorNames, true);
    }
  };

  if (!podData) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          <span className="text-white">
            Loading team data for sheets integration...
          </span>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            <span className="text-white">Loading sheets integration...</span>
          </div>
        </div>
      }
    >
      <SheetsIntegration
        onSpreadsheetCreated={handleSpreadsheetCreated}
        onSheetCreated={() => {
          if (podData?.creators && podData.creators.length > 0) {
            const creatorNames = podData.creators.map(
              (creator) => creator.name
            );
            fetchDriveSheets(creatorNames, true);
          }
        }}
      />
    </Suspense>
  );
}
