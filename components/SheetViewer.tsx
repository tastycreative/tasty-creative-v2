"use client";

import React, { useEffect } from "react";
import SchedulerSheetViewer from "./SchedulerSheetViewer";
import CreatorSheetViewer from "./CreatorSheetViewer";
import AnalystSheetViewer from "./AnalystSheetViewer";
import DefaultSheetViewer from "./DefaultSheetViewer";
import { useSheetStore } from "@/lib/stores/sheetStore";

interface SheetViewerProps {
  sheetName: string;
  sheetUrl: string;
  onBack: () => void;
  backText?: string;
}

const SheetViewer: React.FC<SheetViewerProps> = ({
  sheetName,
  sheetUrl,
  onBack,
  backText = "Back",
}) => {
  // Access the sheet store for caching and data management
  const clearCache = useSheetStore((state) => state.clearCache);

  // Clear any stale cache when switching between sheets
  useEffect(() => {
    // Clear expired cache entries on component mount
    const allKeys = ['schedulerData', 'creatorData', 'analystData', 'defaultSheetData'];
    // Note: The store's getCachedData method already handles expired entries automatically
  }, [sheetUrl]);

  // Determine which viewer to show based on sheet name
  const getSheetViewer = () => {
    const lowerSheetName = sheetName.toLowerCase();

    if (lowerSheetName.includes("scheduler")) {
      return (
        <SchedulerSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
          backText={backText}
        />
      );
    } else if (lowerSheetName.includes("creator")) {
      return (
        <CreatorSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
          backText={backText}
        />
      );
    } else if (lowerSheetName.includes("analyst")) {
      return (
        <AnalystSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
          backText={backText}
        />
      );
    } else {
      return (
        <DefaultSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
          backText={backText}
        />
      );
    }
  };

  return getSheetViewer();
};

export default SheetViewer;
