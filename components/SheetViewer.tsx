"use client";

import React from "react";
import SchedulerSheetViewer from "./SchedulerSheetViewer";
import CreatorSheetViewer from "./CreatorSheetViewer";
import AnalystSheetViewer from "./AnalystSheetViewer";
import DefaultSheetViewer from "./DefaultSheetViewer";

interface SheetViewerProps {
  sheetName: string;
  sheetUrl: string;
  onBack: () => void;
}

const SheetViewer: React.FC<SheetViewerProps> = ({
  sheetName,
  sheetUrl,
  onBack,
}) => {
  // Determine which viewer to show based on sheet name
  const getSheetViewer = () => {
    const lowerSheetName = sheetName.toLowerCase();

    if (lowerSheetName.includes("scheduler")) {
      return (
        <SchedulerSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
        />
      );
    } else if (lowerSheetName.includes("creator")) {
      return (
        <CreatorSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
        />
      );
    } else if (lowerSheetName.includes("analyst")) {
      return (
        <AnalystSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
        />
      );
    } else {
      return (
        <DefaultSheetViewer
          sheetName={sheetName}
          sheetUrl={sheetUrl}
          onBack={onBack}
        />
      );
    }
  };

  return getSheetViewer();
};

export default SheetViewer;
