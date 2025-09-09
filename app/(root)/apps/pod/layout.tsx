"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import {
  TeamMemberSkeleton,
  CreatorSkeleton,
  TeamSelectorSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

// Dynamic import for SheetViewer
const SheetViewer = dynamic(() => import("@/components/SheetViewer"), {
  loading: () => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
        <span className="text-gray-700 dark:text-gray-300">
          Loading sheet viewer...
        </span>
      </div>
    </div>
  ),
  ssr: false,
});
import {
  usePodStore,
  usePodData,
  useAvailableTeams,
  useSheetLinks,
} from "@/lib/stores/podStore";

interface PodLayoutProps {
  children: React.ReactNode;
}

export default function PodLayout({ children }: PodLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Zustand store hooks
  const {
    selectedTeamId,
    openSheetGroups,
    setSelectedTeamId,
    toggleSheetGroup,
    clearCache,
  } = usePodStore();

  const { podData, loading: isLoading, error, fetchPodData } = usePodData();
  const {
    teams: availableTeams,
    loading: isLoadingTeams,
    fetchAvailableTeams,
  } = useAvailableTeams();
  
  const { 
    sheetLinks, 
    loading: isLoadingSheetLinks, 
    fetchSheetLinks 
  } = useSheetLinks();

  // Local component state for UI
  const [selectedSheet, setSelectedSheet] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "sheet" | "creator">(
    "dashboard"
  );

  // Get current tab from pathname
  const getCurrentTab = () => {
    if (!pathname) return "dashboard";
    if (pathname === "/apps/pod" || pathname === "/apps/pod/dashboard")
      return "dashboard";
    if (pathname.includes("/apps/pod/sheets")) return "sheets";
    if (pathname.includes("/apps/pod/board")) return "board";
    if (pathname.includes("/apps/pod/admin")) return "admin";
    if (pathname.includes("/apps/pod/pricing")) return "pricing";
    if (pathname.includes("/apps/pod/my-models")) return "my-models";
    if (pathname.includes("/apps/pod/otp-ptr")) return "otp-ptr";
    if (pathname.includes("/apps/pod/creator")) return "creator";
    return "dashboard";
  };

  const activeTab = getCurrentTab();

  // Group sheet links by creator names
  const groupedSheetLinks = useMemo(() => {
    if (!podData?.creators) return {};

    const groups: Record<
      string,
      Array<{ name: string; url: string; cellGroup?: string; id?: string; sheetType?: string; }>
    > = {};
    podData.creators.forEach((creator) => {
      groups[creator.name] = [];
    });

    groups["Others"] = [];

    if (sheetLinks.length > 0) {
      sheetLinks.forEach((link) => {
        let assignedCreator = "Others";

        // Match by clientName instead of sheet name since we have relational data
        for (const creator of podData.creators || []) {
          if (link.clientName.toLowerCase().includes(creator.name.toLowerCase()) ||
              creator.name.toLowerCase().includes(link.clientName.toLowerCase())) {
            assignedCreator = creator.name;
            break;
          }
        }

        groups[assignedCreator].push({
          name: link.name,
          url: link.url,
          id: link.id,
          sheetType: link.sheetType
        });
      });
    }

    return groups;
  }, [sheetLinks, podData?.creators]);

  // Handle URL parameters for Google Sheets on page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const googleUrl = urlParams.get("googleUrl");
      const sheetName = urlParams.get("sheetName");

      if (googleUrl && sheetName) {
        try {
          const decodedUrl = decodeURIComponent(googleUrl);
          const decodedSheetName = decodeURIComponent(sheetName);
          setSelectedSheet({ name: decodedSheetName, url: decodedUrl });
          setViewMode("sheet");
        } catch (error) {
          console.error("Error decoding URL parameters:", error);
        }
      }
    }
  }, []);

  // Initialize component and fetch teams
  useEffect(() => {
    const initializeComponent = async () => {
      await fetchAvailableTeams();
    };
    initializeComponent();
  }, [fetchAvailableTeams]);

  // Auto-select first team if none is selected
  useEffect(() => {
    if (!selectedTeamId && availableTeams.length > 0 && !isLoadingTeams) {
      console.log(
        `🎯 Auto-selecting first team: ${availableTeams[0].name} (${availableTeams[0].id})`
      );
      setSelectedTeamId(availableTeams[0].id);
    }
  }, [selectedTeamId, availableTeams, isLoadingTeams, setSelectedTeamId]);

  // Fetch pod data when team changes (for all tabs)
  useEffect(() => {
    // Only fetch data if:
    // 1. selectedTeamId is valid
    // 2. teams have been loaded (to avoid race conditions during hydration)
    console.log(`🔍 Layout useEffect triggered:`, {
      selectedTeamId,
      availableTeamsLength: availableTeams.length,
      pathname,
      willFetch: selectedTeamId !== null && availableTeams.length > 0,
    });

    if (selectedTeamId !== null && availableTeams.length > 0) {
      console.log(
        `🔄 Fetching data for team ${selectedTeamId} (teams loaded: ${availableTeams.length})`
      );
      fetchPodData(selectedTeamId, true); // Force refresh when team changes
      
      // Also fetch sheet links from the new ClientModelSheetLinks table
      fetchSheetLinks(selectedTeamId, true); // Force refresh when team changes
    }
  }, [selectedTeamId, fetchPodData, fetchSheetLinks, availableTeams.length]);

  const handleSheetClick = (sheetName: string, sheetUrl: string) => {
    setSelectedSheet({ name: sheetName, url: sheetUrl });
    setViewMode("sheet");

    // Update URL without navigation for better UX and back button support
    const url = new URL(window.location.href);
    url.searchParams.set("googleUrl", encodeURIComponent(sheetUrl));
    url.searchParams.set("sheetName", encodeURIComponent(sheetName));
    window.history.pushState({}, "", url.toString());
  };

  const handleCreatorClick = (creatorName: string) => {
    router.push(`/apps/pod/creator?creator=${encodeURIComponent(creatorName)}`);
  };

  const handleBackToDashboard = () => {
    setViewMode("dashboard");
    setSelectedSheet(null);

    // Clean up URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete("googleUrl");
    url.searchParams.delete("sheetName");
    url.searchParams.delete("creator");
    window.history.pushState({}, "", url.toString());
  };

  // Get contextual back text based on current page
  const getBackText = () => {
    if (activeTab === "dashboard") return "Back to Dashboard";
    if (activeTab === "sheets") return "Back to Sheets";
    if (activeTab === "board") return "Back to Board";
    if (activeTab === "pricing") return "Back to Pricing";
    if (activeTab === "admin") return "Back to Admin";
    if (activeTab === "otp-ptr") return "Back to OTP-PTR";
    return "Back";
  };

  // Remove this function as we'll use Link components for better prefetching

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border border-pink-200 dark:border-pink-500/30">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent mb-2">
              POD Management Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Manage your team, track workflow progress, and sync with Google
              Spreadsheets
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-pink-200 dark:border-pink-500/30">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 sm:space-x-8 min-w-max px-2 sm:px-0">
              <Link
                href="/apps/pod/dashboard"
                prefetch={true}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/apps/pod/sheets"
                prefetch={true}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "sheets"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span className="sm:hidden">Sheets</span>
                <span className="hidden sm:inline">Sheets Integration</span>
              </Link>
              <Link
                href="/apps/pod/board"
                prefetch={true}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "board"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Board
              </Link>
              <Link
                href="/apps/pod/pricing"
                prefetch={true}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "pricing"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span className="sm:hidden">Pricing</span>
                <span className="hidden sm:inline">Pricing Guide</span>
              </Link>
              <Link
                href="/apps/pod/my-models"
                prefetch={true}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "my-models"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span className="sm:hidden">Models</span>
                <span className="hidden sm:inline">My Models</span>
              </Link>
              <Link
                href="/apps/pod/otp-ptr"
                prefetch={true}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "otp-ptr"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                OTP-PTR
              </Link>
              {session?.user?.role === "ADMIN" && (
                <Link
                  href="/apps/pod/admin"
                  prefetch={true}
                  className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === "admin"
                      ? "border-pink-500 text-pink-600 dark:text-pink-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </nav>
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar - Hidden when admin, board, creator, my-models, or otp-ptr tab is active */}
          {activeTab !== "admin" &&
            activeTab !== "board" &&
            activeTab !== "creator" &&
            activeTab !== "my-models" &&
            activeTab !== "otp-ptr" && (
              <div className="lg:w-80 w-full">
                {podData ? (
                  <div className="w-full space-y-6">
                    {/* Team Selection & Info Combined */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
                      {/* Team Selection Header */}
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl">
                              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-tight truncate">
                              {podData.teamName}
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              if (selectedTeamId) {
                                clearCache(`pod-data-${selectedTeamId}`);
                                fetchPodData(selectedTeamId, true);
                              }
                            }}
                            disabled={isLoading || !selectedTeamId}
                            className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                            title="Refresh team data"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Team Selection Dropdown */}
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        {isLoadingTeams ? (
                          <TeamSelectorSkeleton />
                        ) : (
                          <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Switch Team:
                            </label>
                            <select
                              value={selectedTeamId || ""}
                              onChange={(e) => {
                                const newTeamId = e.target.value;
                                setSelectedTeamId(newTeamId);
                              }}
                              disabled={isLoading || isLoadingTeams}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
                            >
                              {availableTeams.length > 0 ? (
                                availableTeams.map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))
                              ) : (
                                <option value="">Loading teams...</option>
                              )}
                            </select>
                            {(isLoading || isLoadingTeams) && (
                              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                                {isLoadingTeams
                                  ? "Loading teams..."
                                  : "Loading data..."}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Team Members */}
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                          <div className="p-1 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg mr-2">
                            <UserPlus className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                          </div>
                          Team Members{" "}
                          {!isLoading &&
                            podData &&
                            `(${podData.teamMembers.length})`}
                        </h4>
                        <div className="space-y-3">
                          {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                              <TeamMemberSkeleton key={index} />
                            ))
                          ) : podData && podData.teamMembers.length > 0 ? (
                            podData.teamMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-medium text-xs">
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {member.name}
                                  </span>
                                </div>
                                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                                  {member.role}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6">
                              <UserPlus className="mx-auto h-8 w-8 text-gray-400 mb-2 opacity-50" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No team members assigned
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assigned Creators */}
                      <div className="px-6 py-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                          <div className="p-1 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-lg mr-2">
                            <Users className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                          </div>
                          Assigned Creators{" "}
                          {!isLoading &&
                            podData &&
                            `(${podData.creators.length})`}
                        </h4>
                        <div className="space-y-3">
                          {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                              <CreatorSkeleton key={index} />
                            ))
                          ) : podData && podData.creators.length > 0 ? (
                            podData.creators.map((creator) => (
                              <div
                                key={creator.id}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-gray-100 dark:border-gray-800 cursor-pointer"
                                onClick={() => handleCreatorClick(creator.name)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-medium text-xs">
                                    {creator.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {creator.name}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6">
                              <Users className="mx-auto h-8 w-8 text-gray-400 mb-2 opacity-50" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No creators assigned
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sheet Links Accordion */}
                      {(isLoading || isLoadingSheetLinks ||
                        (podData?.creators && podData.creators.length > 0)) && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                            <div className="p-1 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg mr-2">
                              <FileSpreadsheet className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Sheet Links
                          </h4>
                          <div className="space-y-2">
                            {isLoading || isLoadingSheetLinks ? (
                              <div className="space-y-2">
                                {Array.from({ length: 2 }).map((_, index) => (
                                  <div
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg"
                                  >
                                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="flex items-center space-x-2">
                                        <Skeleton className="h-3 w-3 rounded" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-6 rounded-full" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              Object.entries(groupedSheetLinks).map(
                                ([creatorName, sheets]) => (
                                  <div
                                    key={creatorName}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg"
                                  >
                                    <button
                                      onClick={() =>
                                        toggleSheetGroup(creatorName)
                                      }
                                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className={`transition-all duration-300 ${openSheetGroups[creatorName] ? "rotate-180" : ""}`}
                                        >
                                          <ChevronDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {creatorName}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                                          {sheets.length}
                                        </span>
                                      </div>
                                    </button>

                                    {openSheetGroups[creatorName] && (
                                      <div className="p-2 space-y-1">
                                        {sheets.map((link, index) => {
                                          const isActive =
                                            selectedSheet?.name === link.name &&
                                            selectedSheet?.url === link.url &&
                                            viewMode === "sheet";
                                          return (
                                            <div
                                              key={
                                                link.id ||
                                                `link-${creatorName}-${index}`
                                              }
                                              className={`w-full p-2 text-left rounded transition-colors group cursor-pointer ${
                                                isActive
                                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30"
                                                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                              }`}
                                              onClick={() =>
                                                handleSheetClick(
                                                  link.name,
                                                  link.url
                                                )
                                              }
                                            >
                                              <div className="flex items-start space-x-2">
                                                <div className="flex-shrink-0 mt-0.5 relative">
                                                  <div
                                                    className={`h-6 w-6 rounded flex items-center justify-center ${
                                                      isActive
                                                        ? "bg-gradient-to-br from-emerald-600 to-green-700 ring-2 ring-emerald-300 dark:ring-emerald-400"
                                                        : "bg-gradient-to-br from-emerald-500 to-green-600"
                                                    }`}
                                                  >
                                                    <FileSpreadsheet className="h-3 w-3 text-white" />
                                                  </div>
                                                  {isActive && (
                                                    <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-gray-800 rounded-full"></div>
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p
                                                    className={`text-xs font-medium transition-colors truncate ${
                                                      isActive
                                                        ? "text-emerald-700 dark:text-emerald-300"
                                                        : "text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                                    }`}
                                                    title={link.name}
                                                  >
                                                    {link.name}
                                                  </p>
                                                  {link.url &&
                                                    link.url.startsWith(
                                                      "http"
                                                    ) && (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          window.open(
                                                            link.url,
                                                            "_blank"
                                                          );
                                                        }}
                                                        className="flex items-center mt-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
                                                      >
                                                        <ExternalLink className="h-2 w-2 mr-1 flex-shrink-0" />
                                                        <span className="truncate">
                                                          Open Sheet
                                                        </span>
                                                      </button>
                                                    )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Note: Scheduler link removed from new schema - can be added back if needed */}
                    </div>
                  </div>
                ) : error?.message ? (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-red-200 dark:border-red-500/30 rounded-lg p-6 text-center">
                    <div className="text-red-600 dark:text-red-400">
                      <p>{error.message}</p>
                      <button
                        onClick={() => {
                          if (selectedTeamId) {
                            clearCache(`pod-data-${selectedTeamId}`);
                            fetchPodData(selectedTeamId, true);
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="w-full space-y-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg shadow-lg">
                      <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/30 dark:to-indigo-900/30 border-b border-purple-200 dark:border-purple-500/30 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <Skeleton className="h-6 w-32" />
                          </h3>
                          <button
                            disabled
                            className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md opacity-50"
                            title="Loading..."
                          >
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Switch Team:
                          </label>
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                      </div>

                      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Team Members
                        </h4>
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <TeamMemberSkeleton key={index} />
                          ))}
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Assigned Creators
                        </h4>
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <CreatorSkeleton key={index} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                    <span className="text-gray-500 dark:text-gray-400">
                      No team data available
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Main Content */}
          <div
            className={`${activeTab === "admin" || activeTab === "board" || activeTab === "creator" || activeTab === "my-models" || activeTab === "otp-ptr" ? "w-full" : "flex-1"} space-y-6`}
          >
            {viewMode === "sheet" && selectedSheet ? (
              <Suspense
                fallback={
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Loading sheet viewer...
                      </span>
                    </div>
                  </div>
                }
              >
                <SheetViewer
                  sheetName={selectedSheet.name}
                  sheetUrl={selectedSheet.url}
                  onBack={handleBackToDashboard}
                  backText={getBackText()}
                />
              </Suspense>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
