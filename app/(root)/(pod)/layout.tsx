"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Focus, Layout, Users } from "lucide-react";
import LeftSidebar from "@/components/pod-new/layouts/LeftSidebar";
import RightSidebar from "@/components/pod-new/layouts/RightSidebar";
import {
  usePodStore,
  usePodData,
  useAvailableTeams,
} from "@/lib/stores/podStore";
import { useLayoutStore, useResponsiveLayout } from "@/lib/stores/layoutStore";
import { useWelcomeModal } from "@/hooks/useWelcomeModal";
import { WelcomeToPodNewModal } from "@/components/pod-new/shared/WelcomeToPodNewModal";
import { WhatsNewButton } from "@/components/pod-new/shared/WhatsNewButton";
import { useSession } from "next-auth/react";

interface PodLayoutProps {
  children: React.ReactNode;
}

export default function PodLayout({ children }: PodLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { selectedRow, selectedTeamId, setSelectedTeamId } = usePodStore();
  const { fetchPodData } = usePodData();
  const { teams, loading: isLoadingTeams, fetchAvailableTeams } = useAvailableTeams();

  // Layout state management
  const {
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    focusMode,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleFocusMode,
    optimizeForBoard,
  } = useLayoutStore();

  // Responsive layout hook
  const { isMobile, isTablet } = useResponsiveLayout();

  // Welcome modal state
  const {
    isOpen: isWelcomeModalOpen,
    hasViewed: hasViewedWelcome,
    openModal: openWelcomeModal,
    closeModal: closeWelcomeModal,
    markAsDismissed: dismissWelcomeModal,
  } = useWelcomeModal();

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

  // Auto-optimize layout for board pages
  useEffect(() => {
    if (pathname?.includes('/board') && !focusMode) {
      optimizeForBoard();
    }
  }, [pathname, optimizeForBoard, focusMode]);

  const getCurrentTab = () => {
    if (!pathname) return "dashboard";
    if (pathname === "/" || pathname === "/dashboard")
      return "dashboard";
    if (pathname.includes("/my-models")) return "my-models";
    if (pathname.includes("/sheets")) return "sheets";
    if (pathname.includes("/board")) return "board";
    if (pathname.includes("/pricing")) return "pricing";
    if (pathname.includes("/forms")) return "forms";
    if (pathname.includes("/generative-ai")) return "generative-ai";
    if (pathname.includes("/gallery")) return "gallery";
    if (pathname.includes("/pod-admin")) return "pod-admin";
    return "dashboard";
  };

  const activeTab = getCurrentTab();

  const tabItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard" },
    { id: "my-models", label: "My Models", href: "/my-models", highlight: true },
    { id: "sheets", label: "Sheets Integration", href: "/sheets" },
    { id: "gallery", label: "Gallery", href: "/gallery" },
    { id: "generative-ai", label: "Voice", href: "/generative-ai/voice" },
    // Only show POD-Admin to ADMIN and MODERATOR users
    ...(session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR"
      ? [{ id: "pod-admin", label: "POD-Admin", href: "/pod-admin" }]
      : []),
  ];

  // For model profile pages, render completely full-screen without any parent layout
  if (isModelProfilePage) {
    return children;
  }

  // Determine if sidebars should be shown (show on most pages including board)
  const shouldShowLeftSidebar = true; // Always show left sidebar

  // Calculate actual sidebar visibility based on store state
  const showLeftSidebar = shouldShowLeftSidebar && !leftSidebarCollapsed;
  // Right sidebar only shows on board page
  const showRightSidebar = pathname === '/board' && !rightSidebarCollapsed;

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

      {/* Tabs and Layout Controls */}
      <div className="flex flex-wrap justify-center gap-2 px-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {tabItems.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                tab.highlight
                  ? activeTab === tab.id
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-pink-400/50 shadow-lg shadow-pink-500/25"
                    : "bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-600 dark:text-pink-300 border-pink-300/50 dark:border-pink-500/30 hover:from-pink-500/20 hover:to-purple-500/20 hover:border-pink-400/60"
                  : activeTab === tab.id
                    ? "bg-gray-100/80 dark:bg-white/10 text-gray-900 dark:text-white border-gray-200/50 dark:border-white/10"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border-gray-200/50 dark:border-white/10"
              }`}
            >
              {tab.highlight && <Users className="w-4 h-4" />}
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Layout Controls - Show on all pages */}
        <div className="flex items-center gap-2 ml-4">
            {/* What's New Button */}
            <WhatsNewButton
              onClick={openWelcomeModal}
              showBadge={!hasViewedWelcome}
            />

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

            {/* Left Sidebar Toggle */}
            <button
              onClick={toggleLeftSidebar}
              className="inline-flex items-center rounded-full border border-gray-200/50 dark:border-white/10 px-3 py-2 text-sm transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-300"
              title={leftSidebarCollapsed ? "Show navigation" : "Hide navigation"}
            >
              {leftSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Right Sidebar Toggle - Only on /board */}
            {pathname === '/board' && (
            <button
              onClick={toggleRightSidebar}
              className="inline-flex items-center rounded-full border border-gray-200/50 dark:border-white/10 px-3 py-2 text-sm transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-300"
              title={rightSidebarCollapsed ? "Show team info" : "Hide team info"}
            >
              {rightSidebarCollapsed ? (
                <PanelRightOpen className="w-4 h-4" />
              ) : (
                <PanelRightClose className="w-4 h-4" />
              )}
            </button>
            )}

            {/* Focus Mode Toggle */}
            <button
              onClick={toggleFocusMode}
              className={`inline-flex items-center rounded-full border border-gray-200/50 dark:border-white/10 px-3 py-2 text-sm transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white ${
                focusMode
                  ? "bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600"
                  : "text-gray-600 dark:text-gray-300"
              }`}
              title={focusMode ? "Exit focus mode" : "Enter focus mode"}
            >
              <Focus className="w-4 h-4" />
              <span className="ml-1 text-xs">Focus</span>
            </button>
        </div>
      </div>

      {/* Content Grid - Dynamic layout based on sidebar visibility */}
      <div className={`w-full mx-auto px-4 lg:px-6 mt-6 transition-all duration-300 ${
        focusMode ? "max-w-full" : "max-w-full xl:max-w-[1600px]"
      }`}>
        <div className={`grid grid-cols-1 gap-4 items-start transition-all duration-300 ${
          // Grid configuration based on sidebar states
          showLeftSidebar && showRightSidebar
            ? "xl:grid-cols-[280px_1fr_320px]" // Both sidebars: Fixed left, flexible main, fixed right
            : showLeftSidebar && !showRightSidebar
            ? "xl:grid-cols-[280px_1fr]" // Left only: Fixed left, flexible main
            : !showLeftSidebar && showRightSidebar
            ? "xl:grid-cols-[1fr_320px]" // Right only: Flexible main, fixed right
            : "xl:grid-cols-1" // No sidebars: Full width main
        }`}>

          {/* Left Sidebar - Conditional rendering */}
          {showLeftSidebar && (
            <div className="transition-all duration-300">
              <LeftSidebar collapsed={false} />
            </div>
          )}

          {/* Main Content - Full width when sidebars are collapsed */}
          <main className={`min-h-[500px] w-full min-w-0 transition-all duration-300 ${
            focusMode ? "px-0" : ""
          }`}>
            {children}
          </main>

          {/* Right Sidebar - Conditional rendering */}
          {showRightSidebar && (
            <div className="transition-all duration-300">
              <RightSidebar collapsed={false} />
            </div>
          )}
        </div>
      </div>

      {/* Welcome Modal */}
      <WelcomeToPodNewModal
        isOpen={isWelcomeModalOpen}
        onClose={closeWelcomeModal}
        onDismiss={dismissWelcomeModal}
      />
    </div>
  );
}