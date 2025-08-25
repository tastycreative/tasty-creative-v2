"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePodData } from "@/lib/stores/podStore";
import ModelInfoTab from "@/components/models/ModelInfoTab";

export default function CreatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const creatorName = searchParams?.get("creator");
  const { podData } = usePodData();
  
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    const fetchCreatorData = async () => {
      setLoading(true);
      try {
        // First check if we already have the creator data in the pod store
        if (podData?.creators) {
          const foundCreator = podData.creators.find(
            (c) => c.name === decodeURIComponent(creatorName)
          );

          if (foundCreator) {
            setCreator(foundCreator);
            setLoading(false);
            return;
          }
        }

        // If not found in store, create a basic creator object for display
        setCreator({
          name: decodeURIComponent(creatorName),
          specialty: "Content Creator",
          earnings: "$0"
        });
        setLoading(false);
      } catch (error) {
        console.error("Error setting up creator data:", error);
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [creatorName, podData, router]);

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
    return (
      <div className="min-h-screen dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-gray-100 text-xl">Loading creator...</div>
      </div>
    );
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {creator.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{creator.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {creator.specialty || "Content Creator"}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-white/50 dark:bg-gray-800/50">
            <ModelInfoTab model={{
              id: creator.id || "unknown",
              name: creator.name,
              status: "active",
              launchDate: new Date().toISOString(),
              referrerName: "Not specified",
              personalityType: creator.specialty || "Content Creator",
              commonTerms: ["content", "creator", "social"],
              commonEmojis: ["💫", "✨", "🎯"],
              instagram: "",
              twitter: "",
              tiktok: "",
              stats: {
                totalRevenue: 0,
                monthlyRevenue: 0,
                subscribers: 0,
                avgResponseTime: "N/A"
              },
              chattingManagers: creator.chattingManagers || []
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}