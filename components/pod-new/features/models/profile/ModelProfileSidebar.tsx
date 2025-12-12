"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { useAllCreators, useCreator } from "@/hooks/useCreatorsQuery";

import { SidebarProfileHeader } from "./sidebar/SidebarProfileHeader";
import { SidebarStats } from "./sidebar/SidebarStats";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";

interface ModelProfileSidebarProps {
  modelData: ExtendedModelDetails;
  activeTab: string;
  onTabChange: (tab: string) => void;
  creatorName?: string;
  currentAppRoute?: string;
}

export function ModelProfileSidebar({
  modelData,
  activeTab,
  onTabChange,
  creatorName,
  currentAppRoute,
}: ModelProfileSidebarProps) {
  const params = useParams();

  // Memoize creator name
  const resolvedCreatorName = useMemo(
    () => creatorName || modelData?.name,
    [creatorName, modelData?.name]
  );

  // Fetch all creators
  const allCreatorsQuery = useAllCreators();
  const allCreators = useMemo(
    () => allCreatorsQuery.data?.creators || [],
    [allCreatorsQuery.data?.creators]
  );

  // Fetch current creator
  const currentCreatorQuery = useCreator(resolvedCreatorName);
  const dbData = currentCreatorQuery.data;
  const isLoadingCreator = currentCreatorQuery.isLoading;
  const isLoadingAllCreators = allCreatorsQuery.isLoading;

  const dbCreator = useMemo(() => dbData?.creators?.[0], [dbData?.creators]);

  return (
    <Sidebar
      variant="inset"
      className="border-r-0 bg-transparent dark:bg-gradient-to-b dark:from-gray-900/90 dark:via-purple-900/30 dark:to-blue-900/30 backdrop-blur-xl w-80"
    >
      {/* Header with model info */}
      <SidebarHeader className="p-8 pb-6">
        <SidebarProfileHeader
          modelData={modelData}
          dbCreator={dbCreator}
          allCreators={allCreators}
          isLoading={isLoadingCreator}
          isLoadingAllCreators={isLoadingAllCreators}
        />
        <SidebarStats dbCreator={dbCreator} isLoading={isLoadingCreator} />
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent className="px-3 sm:px-6 py-3 sm:py-4">
        <SidebarNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          isLoading={isLoadingCreator}
          currentAppRoute={currentAppRoute}
          modelName={(params?.modelName as string) || "unknown"}
        />
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer */}
      <SidebarFooter className="p-6">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
