"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Info, Image, MessageSquare, Zap, Users, Images, FileSpreadsheet } from "lucide-react";
import { usePodData } from "@/lib/stores/podStore";
import { useCreatorComplete } from "@/lib/stores/creatorStore";

// Helper function to get the appropriate image URL
const getImageUrl = (model: any): string => {
  const imageUrl = model?.profileImage;
  
  if (!imageUrl) {
    return '/placeholder-image.jpg';
  }
  
  // Check if it's a Google Drive URL that needs proxying
  if (imageUrl.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // Return the URL as-is for other image sources
  return imageUrl;
};
import ModelPodInfoTab from "@/components/models/ModelPodInfoTab";
import ModelAssetsTab from "@/components/models/ModelAssetTabs";
import ModelChattersTab from "@/components/models/tabs/ModelChattersTab";
import ModelSheetLinksTab from "@/components/models/tabs/ModelSheetLinksTab";
import dynamic from "next/dynamic";
import ModelForumTab from "@/components/models/tabs/ModelForumTab";
import ModelAppsTab from "@/components/models/tabs/ModelAppsTab";

// Dynamically import the component to avoid SSR issues
const ModelContentGalleryTab = dynamic(
  () => import("@/components/models/tabs/ModelContentGalleryTab"),
  { ssr: false }
);

function CreatorImage({ creator, model }: { creator: any; model?: ModelDetails | null }) {
  const [imageError, setImageError] = useState(false);

  // Debug logging
  console.log("CreatorImage Debug:", {
    creatorName: creator?.name,
    hasModel: !!model,
    modelId: model?.id,
    modelName: model?.name,
    profileImage: model?.profileImage,
    imageError
  });

  // If we have model data with a profile image, try to show it
  if (model && model.profileImage && !imageError) {
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 p-0.5 flex items-center justify-center">
        <img
          src={getImageUrl(model)}
          alt={creator?.name || "Creator"}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
      <span className="text-white text-3xl font-bold">
        {creator?.name?.charAt(0).toUpperCase() || "?"}
      </span>
    </div>
  );
}

function CreatorPageSkeleton() {
  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
        </div>

        {/* Main Content Skeleton */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-gray-700 shadow-2xl overflow-hidden">
          {/* Header Skeleton */}
          <div className="p-6 border-b border-pink-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-emerald-900/20">
            <div className="flex items-center gap-4">
              {/* Avatar Skeleton */}
              <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              <div>
                {/* Name Skeleton */}
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2 animate-pulse"></div>
                {/* Role Skeleton */}
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-6 bg-white/50 dark:bg-gray-800/50">
            <div className="space-y-6">
              {/* Multiple content blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
              
              {/* Additional skeleton rows */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorNavigation({ creatorName }: { creatorName: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams?.get("tab") || "information";

  const tabs = [
    { id: "information", label: "Information", icon: Info, color: "purple" },
    { id: "assets", label: "Assets", icon: Image, color: "pink" },
    { id: "chatters", label: "Chatters", icon: MessageSquare, color: "blue" },
    { id: "sheet-links", label: "Sheet Links", icon: FileSpreadsheet, color: "emerald" },
    { id: "apps", label: "Apps", icon: Zap, color: "green" },
    { id: "content-gallery", label: "Content Gallery", icon: Images, color: "cyan" },
    { id: "forum", label: "Forum", icon: Users, color: "orange" },
  ];

  const handleTabClick = (tabId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tabId);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="border-b border-pink-200 dark:border-gray-600">
      <nav className="flex overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 sm:space-x-8 min-w-max px-2 sm:px-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              isActive
                ? "border-pink-500 text-pink-600 dark:text-pink-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Icon className="w-4 h-4 mr-2 sm:mr-0 sm:inline" />
            <span className="sm:hidden">{tab.label}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
        </div>
      </nav>
    </div>
  );
}

function CreatorTabContent({ tab, creatorName }: { tab: string; creatorName: string }) {
  // Use creator name for tabs, capitalizing first letter like in model pages
  const displayName = creatorName ? creatorName.charAt(0).toUpperCase() + creatorName.slice(1) : "";

  switch (tab) {
    case "information":
      return (
        <div>
          <ModelPodInfoTab creatorName={creatorName} />
        </div>
      );
    case "assets":
      return <ModelAssetsTab modelName={displayName} />;
    case "chatters":
      return <ModelChattersTab modelName={displayName} />;
    case "sheet-links":
      return <ModelSheetLinksTab modelName={displayName} />;
    case "apps":
      return <ModelAppsTab modelName={displayName} />;
    case "content-gallery":
      return <ModelContentGalleryTab modelName={displayName} />;
    case "forum":
      return <ModelForumTab modelName={displayName} />;
    default:
      return (
        <div>
          <ModelPodInfoTab creatorName={creatorName} />
        </div>
      );
  }
}

export default function CreatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const creatorName = searchParams?.get("creator");
  const currentTab = searchParams?.get("tab") || "information";
  const { podData } = usePodData();
  
  const { creator, model, loading, fetchAllData, reset } = useCreatorComplete();

  // Get contextual back text based on current page
  const getBackText = () => {
    if (pathname?.includes("/dashboard")) return "Back to Dashboard";
    if (pathname?.includes("/sheets")) return "Back to Sheets";
    if (pathname?.includes("/board")) return "Back to Board";
    if (pathname?.includes("/pricing")) return "Back to Pricing";
    if (pathname?.includes("/admin")) return "Back to Admin";
    return "Back";
  };

  useEffect(() => {
    if (!creatorName) {
      router.replace("/apps/pod/dashboard");
      return;
    }

    // Reset store when creator name changes
    reset();
    
    // Fetch all creator data using Zustand store, passing podData for creator info
    fetchAllData(creatorName, false, podData);
  }, [creatorName, router, reset, fetchAllData, podData]);

  const handleBack = () => {
    // Get the current page and navigate back appropriately
    if (pathname && pathname.includes("/dashboard")) {
      router.push("/apps/pod/dashboard");
    } else if (pathname && pathname.includes("/sheets")) {
      router.push("/apps/pod/sheets");
    } else if (pathname && pathname.includes("/board")) {
      router.push("/apps/pod/board");
    } else if (pathname && pathname.includes("/pricing")) {
      router.push("/apps/pod/pricing");
    } else if (pathname && pathname.includes("/admin")) {
      router.push("/apps/pod/admin");
    } else {
      router.push("/apps/pod/dashboard");
    }
  };

  if (loading) {
    return <CreatorPageSkeleton />;
  }

  if (!creator) {
    return (
      <div className="min-h-screen dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-gray-100 text-xl">Creator not found</div>
      </div>
    );
  }

  return (
    <>
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{getBackText()}</span>
      </button>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-200 dark:border-gray-600 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-pink-200 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-emerald-900/20">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <CreatorImage creator={creator} model={model} />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{creator.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                Content Creator
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <CreatorNavigation creatorName={creatorName || ""} />

        {/* Content */}
        <div className="p-4 sm:p-6 bg-white/50 dark:bg-gray-800/50">
          <CreatorTabContent 
            tab={currentTab}
            creatorName={creatorName || ""} 
          />
        </div>
      </div>
    </>
  );
}