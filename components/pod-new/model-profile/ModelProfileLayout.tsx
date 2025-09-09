"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ModelProfileSidebar } from "./ModelProfileSidebar";
import { ModelInformationTab } from "./tabs/ModelInformationTab";
import ModelForumTab from "./tabs/ModelForumTab";
import ModelGalleryTab from "./tabs/ModelGalleryTab";

interface ModelProfileLayoutProps {
  modelData: ExtendedModelDetails;
  creatorName?: string;
}

export function ModelProfileLayout({
  modelData,
  creatorName,
}: ModelProfileLayoutProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("information");

  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case "information":
        return (
          <ModelInformationTab
            modelData={modelData}
            creatorName={creatorName}
          />
        );
      case "assets":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Assets</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Assets management coming soon...
            </p>
          </div>
        );
      case "chatters":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Chatters</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Chatters management coming soon...
            </p>
          </div>
        );
      case "apps":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Apps</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Apps integration coming soon...
            </p>
          </div>
        );
      case "gallery":
        return (
          <div className="p-8">
            <ModelGalleryTab modelName={modelData.name} />
          </div>
        );
      case "forum":
        return (
          <div className="p-8">
            <ModelForumTab modelName={modelData.name} />
          </div>
        );
      default:
        return (
          <ModelInformationTab
            modelData={modelData}
            creatorName={creatorName}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-background">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <ModelProfileSidebar
            modelData={modelData}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <SidebarInset className="flex-1 overflow-hidden">
            <main className="h-full overflow-y-auto">{renderContent()}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
