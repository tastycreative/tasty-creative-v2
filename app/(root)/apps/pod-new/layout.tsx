"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LeftSidebar from "@/components/pod-new/layouts/LeftSidebar";
import RightSidebar from "@/components/pod-new/layouts/RightSidebar";
import {
  usePodStore,
  usePodData,
  useAvailableTeams,
} from "@/lib/stores/podStore";

interface PodNewLayoutProps {
  children: React.ReactNode;
}

export default function PodNewLayout({ children }: PodNewLayoutProps) {
  const pathname = usePathname();
  const { selectedRow, selectedTeamId, setSelectedTeamId } = usePodStore();
  const { fetchPodData } = usePodData();
  const { teams, loading: isLoadingTeams, fetchAvailableTeams } = useAvailableTeams();

  // Check if this is a model profile page that should be full-screen
  const isModelProfilePage = pathname?.includes('/my-models/') && pathname?.split('/').length > 4;

  // Ensure teams and pod data are loaded for pod-new pages
  useEffect(() => {
    fetchAvailableTeams();
  }, [fetchAvailableTeams]);

  useEffect(() => {
    if (selectedRow && teams.length > 0) {
      // Convert selectedRow to team ID (1-based indexing)
      const targetTeam = teams[selectedRow - 1];
      if (targetTeam?.id) {
        fetchPodData(targetTeam.id);
      }
    } else if (selectedTeamId) {
      fetchPodData(selectedTeamId);
    }
  }, [selectedRow, selectedTeamId, teams, fetchPodData]);

  // Auto-select first team if none is selected (matching original pod layout behavior)
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0 && !isLoadingTeams) {
      console.log(
        `🎯 Auto-selecting first team: ${teams[0].name} (${teams[0].id})`
      );
      setSelectedTeamId(teams[0].id);
    }
  }, [selectedTeamId, teams, isLoadingTeams, setSelectedTeamId]);

  const getCurrentTab = () => {
    if (!pathname) return "dashboard";
    if (pathname === "/apps/pod-new" || pathname === "/apps/pod-new/dashboard")
      return "dashboard";
    if (pathname.includes("/apps/pod-new/sheets")) return "sheets";
    if (pathname.includes("/apps/pod-new/board")) return "board";
    if (pathname.includes("/apps/pod-new/pricing")) return "pricing";
    if (pathname.includes("/apps/pod-new/gallery")) return "gallery";
    if (pathname.includes("/apps/pod-new/gif-maker")) return "gif-maker";
    if (pathname.includes("/apps/pod-new/forms")) return "forms";
    if (pathname.includes("/apps/pod-new/admin")) return "admin";
    return "dashboard";
  };

  const activeTab = getCurrentTab();

  const tabItems = [
    { id: "dashboard", label: "Dashboard", href: "/apps/pod-new/dashboard" },
    { id: "sheets", label: "Sheets Integration", href: "/apps/pod-new/sheets" },
    { id: "board", label: "Board", href: "/apps/pod-new/board" },
    { id: "pricing", label: "Pricing Guide", href: "/apps/pod-new/pricing" },
    { id: "gallery", label: "Gallery", href: "/apps/pod-new/gallery" },
    { id: "gif-maker", label: "GIF Maker", href: "/apps/pod-new/gif-maker" },
    { id: "forms", label: "Workflow Forms", href: "/apps/pod-new/forms" },
  ];

  // For model profile pages, render completely full-screen without any parent layout
  if (isModelProfilePage) {
    return children;
  }

  // Determine if sidebars should be shown (show on most pages including board)
  const showRightSidebar = pathname === "/apps/pod-new" ||
                          pathname === "/apps/pod-new/dashboard" ||
                          pathname === "/apps/pod-new/forms" ||
                          pathname === "/apps/pod-new/board";

  const showLeftSidebar = true; // Always show left sidebar

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="mx-auto max-w-full xl:max-w-[1400px] px-6 py-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500/10 via-purple-500/15 to-pink-500/10 dark:from-fuchsia-500/10 dark:via-purple-500/15 dark:to-pink-500/10 border border-gray-200/50 dark:border-white/20 backdrop-blur-md px-8 py-6 shadow-2xl shadow-purple-500/10 dark:shadow-purple-500/10 transition-all duration-300 hover:shadow-purple-500/20 dark:hover:shadow-purple-500/20 hover:border-gray-300/70 dark:hover:border-white/30">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-purple-500/10 to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-center bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 dark:from-white dark:via-purple-100 dark:to-pink-100 bg-clip-text text-transparent tracking-tight">
              POD Management Dashboard
            </h1>
            <p className="mt-3 text-center text-gray-600/90 dark:text-slate-300/90 text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
              Streamline your team operations, track workflow progress, and
              seamlessly integrate with Google Spreadsheets
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-3 right-3 w-16 h-16 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-3 left-3 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-lg animate-pulse delay-1000" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 px-6">
        {tabItems.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`inline-flex items-center rounded-full border border-gray-200/50 dark:border-white/10 px-4 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-gray-100/80 dark:bg-white/10 text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Content Grid - Conditional layout based on sidebar visibility */}
      <div className={`w-full max-w-full xl:max-w-[1600px] mx-auto px-4 lg:px-6 mt-6 grid grid-cols-1 ${
        showLeftSidebar && showRightSidebar
          ? "xl:grid-cols-[280px_1fr_320px]"
          : showLeftSidebar
          ? "xl:grid-cols-[280px_1fr]"
          : showRightSidebar
          ? "xl:grid-cols-[1fr_320px]"
          : "xl:grid-cols-1"
      } gap-4 items-start`}>
        {showLeftSidebar && <LeftSidebar />}
        {/* Main Content */}
        <main className="min-h-[500px] w-full min-w-0">{children}</main>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}
