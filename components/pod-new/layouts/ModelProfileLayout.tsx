"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ModelProfileSidebar } from "../features/models/profile/ModelProfileSidebar";
import { ModelInformationTab } from "../features/models/profile/tabs/ModelInformationTab";
import ModelForumTab from "../features/models/profile/tabs/ModelForumTab";
import ModelGalleryTab from "../features/models/profile/tabs/ModelGalleryTab";
import { ModelAssetsTab } from "../features/models/tabs/ModelAssetsTab";

interface ModelProfileLayoutProps {
  modelData: ExtendedModelDetails;
  creatorName?: string;
  children?: React.ReactNode;
}

export function ModelProfileLayout({
  modelData,
  creatorName,
  children,
}: ModelProfileLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("information");

  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get("tab");
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, [searchParams]);

  // Handler that updates both state AND URL
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      // Update URL without full page reload
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

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
        return <ModelAssetsTab modelName={creatorName || modelData.name} />;
      case "chatters":
        return (
          <div className="w-full p-8">
            <h2 className="text-2xl font-bold mb-4">Chatters</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Chatters management coming soon...
            </p>
          </div>
        );
      case "apps":
        return (
          <div className="w-full p-8">
            <h2 className="text-2xl font-bold mb-4">Apps</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Apps integration coming soon...
            </p>
          </div>
        );
      case "gallery":
        return <ModelGalleryTab />;
      case "forum":
        return <ModelForumTab modelName={modelData.name} />;
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
            onTabChange={handleTabChange}
          />
          <SidebarInset className="flex-1 overflow-hidden">
            <main className="h-full overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {children || renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
