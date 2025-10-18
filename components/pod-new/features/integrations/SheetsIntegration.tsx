"use client";

import React from "react";
import SheetsIntegrationBase from "@/components/SheetsIntegration";

interface SheetsIntegrationProps {
  onSpreadsheetCreated?: (url: string) => void;
  onSheetCreated?: () => void;
}

export default function SheetsIntegration(props: SheetsIntegrationProps) {
  // Wrapper kept separate for pod-new to allow future style overrides if needed
  return <SheetsIntegrationBase {...props} />;
}
