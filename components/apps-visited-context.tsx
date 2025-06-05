"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AppsVisitedContextType {
  hasVisitedApps: boolean;
  setHasVisitedApps: (visited: boolean) => void;
}

const AppsVisitedContext = createContext<AppsVisitedContextType | undefined>(
  undefined
);

export function AppsVisitedProvider({ children }: { children: ReactNode }) {
  const [hasVisitedApps, setHasVisitedApps] = useState(false);

  return (
    <AppsVisitedContext.Provider
      value={{ hasVisitedApps, setHasVisitedApps }}
    >
      {children}
    </AppsVisitedContext.Provider>
  );
}

export function useAppsVisited() {
  const context = useContext(AppsVisitedContext);
  if (context === undefined) {
    throw new Error("useAppsVisited must be used within a AppsVisitedProvider");
  }
  return context;
}