"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePodData } from "@/lib/stores/podStore";
import { useCreatorComplete } from "@/lib/stores/creatorStore";
import ModelInfoTab from "@/components/models/ModelInfoTab";
import { ModelDetails } from "@/types/types";

function CreatorImage({ creator, model }: { creator: any; model: ModelDetails | null }) {
  const [imageError, setImageError] = useState(false);

  // If we have model data with an ID, try to show the profile image
  if (model && model.id && !imageError) {
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 p-0.5 flex items-center justify-center">
        <img
          src={`/api/image-proxy?id=${model.id}`}
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

export default function CreatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const creatorName = searchParams?.get("creator");
  const { podData } = usePodData();
  
  const { creator, model, clientData, loading, fetchAllData, reset } = useCreatorComplete();

  // Memoize the fallback model to prevent unnecessary re-renders
  const fallbackModel = useMemo(() => {
    if (!creator) return null;
    
    return {
      id: creator.id || "unknown",
      name: creator.name,
      status: "active" as const,
      launchDate: "2024-01-01T00:00:00.000Z", // Fixed date to prevent re-renders
      referrerName: "Not specified",
      personalityType: "Content Creator",
      commonTerms: ["content", "creator", "social"],
      commonEmojis: ["💫", "✨", "🎯"],
      instagram: "",
      twitter: "",
      tiktok: "",
      chattingManagers: [],
      stats: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        subscribers: 0,
        avgResponseTime: "N/A"
      }
    };
  }, [creator]);

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
    <div className="min-h-screen dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{getBackText()}</span>
        </button>

        {/* Main Content */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-gray-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-pink-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-emerald-900/20">
            <div className="flex items-center gap-4">
              <CreatorImage creator={creator} model={model} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{creator.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Content Creator
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-white/50 dark:bg-gray-800/50">
            {model ? (
              <ModelInfoTab model={model} />
            ) : fallbackModel ? (
              <ModelInfoTab model={fallbackModel} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}