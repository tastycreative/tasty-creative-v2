"use client";

import React, { useEffect, memo, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Focus, Layout, Users } from "lucide-react";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import AccountMenu from "@/components/AccountMenu";
import {
  usePodStore,
  usePodData,
  useAvailableTeams,
} from "@/lib/stores/podStore";
import { useLayoutStore, useResponsiveLayout } from "@/lib/stores/layoutStore";
import { useWelcomeModal } from "@/hooks/useWelcomeModal";
import { WhatsNewButton } from "@/components/pod-new/shared/WhatsNewButton";
import { useSession } from "next-auth/react";

// Lazy load sidebars - they're heavy components with many sub-components
const LeftSidebar = dynamic(
  () => import("@/components/pod-new/layouts/LeftSidebar"),
  { ssr: false }
);
const RightSidebar = dynamic(
  () => import("@/components/pod-new/layouts/RightSidebar"),
  { ssr: false }
);

// Lazy load WelcomeToPodNewModal - only shown once to new users
const WelcomeToPodNewModal = dynamic(
  () => import("@/components/pod-new/shared/WelcomeToPodNewModal").then(mod => ({ default: mod.WelcomeToPodNewModal })),
  { ssr: false }
);

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

  // Get page title based on current path
  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
    if (pathname.includes("/my-models")) return "My Models";
    if (pathname.includes("/sheets")) return "Sheets Integration";
    if (pathname.includes("/board")) return "Board";
    if (pathname.includes("/pricing")) return "Pricing";
    if (pathname.includes("/forms")) return "Forms";
    if (pathname.includes("/generative-ai")) return "Generative AI";
    if (pathname.includes("/gallery")) return "Gallery";
    if (pathname.includes("/pod-admin")) return "POD Admin";
    if (pathname.includes("/content-dates")) return "Content Dates";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/calendar")) return "Calendar";
    if (pathname.includes("/schedule")) return "Schedule";
    if (pathname.includes("/team")) return "Team";
    if (pathname.includes("/workspace")) return "Workspace";
    if (pathname.includes("/gif-maker")) return "GIF Maker";
    if (pathname.includes("/onboarding")) return "Onboarding";
    return "Dashboard";
  };

  const pageTitle = getPageTitle();

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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      <div className="h-full flex w-full mx-auto">
        {/* Left Sidebar - Full height (collapsed or expanded) */}
        <div className={`h-full shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto board-scrollbar transition-all duration-200 ${
          showLeftSidebar ? "w-[220px]" : "w-[60px]"
        }`}>
          <LeftSidebar collapsed={!showLeftSidebar} />
        </div>

        {/* Right side: Content with header and children that scroll together */}
        <div className="flex-1 flex min-w-0">
          <main className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 board-scrollbar">
              {/* Header + Tabs */}
              <div className="bg-white dark:bg-gray-900">
                {/* Compact Header */}
                <div className="w-full border-b border-gray-200 dark:border-gray-800 px-4 py-3 ">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <h1 className="text-md font-semibold text-gray-900 dark:text-white">
                        {pageTitle}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Tabs and Layout Controls */}
                <div className="w-full border-b border-gray-200 dark:border-gray-800 px-4 py-2">
                  <div className="flex items-center justify-between gap-4">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {tabItems.map((tab) => (
                        <Link
                          key={tab.id}
                          href={tab.href}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                            tab.highlight
                              ? activeTab === tab.id
                                ? "text-pink-600 dark:text-pink-400 border-b-2 border-pink-500"
                                : "text-pink-500 dark:text-pink-400 hover:text-pink-600"
                              : activeTab === tab.id
                                ? "text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {tab.highlight && <Users className="w-3.5 h-3.5" />}
                          {tab.label}
                        </Link>
                      ))}
                    </div>

                    {/* Layout Controls */}
                    <div className="flex items-center gap-1">
                      <WhatsNewButton
                        onClick={openWelcomeModal}
                        showBadge={!hasViewedWelcome}
                      />

                      <button
                        onClick={toggleLeftSidebar}
                        className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        title={leftSidebarCollapsed ? "Show navigation" : "Hide navigation"}
                      >
                        {leftSidebarCollapsed ? (
                          <PanelLeftOpen className="w-4 h-4" />
                        ) : (
                          <PanelLeftClose className="w-4 h-4" />
                        )}
                      </button>

                      {pathname === '/board' && (
                        <button
                          onClick={toggleRightSidebar}
                          className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                          title={rightSidebarCollapsed ? "Show team info" : "Hide team info"}
                        >
                          {rightSidebarCollapsed ? (
                            <PanelRightOpen className="w-4 h-4" />
                          ) : (
                            <PanelRightClose className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={toggleFocusMode}
                        className={`p-1.5 transition-colors ${
                          focusMode
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        title={focusMode ? "Exit focus mode" : "Enter focus mode"}
                      >
                        <Focus className="w-4 h-4" />
                      </button>

                      <ThemeToggle />
                      
                      <AccountMenu session={session} collapsed />
                    </div>
                  </div>
                </div>
              </div>
              {/* Page Content */}
              <div className="min-h-full min-w-0 overflow-x-hidden">
                {children}
              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          {showRightSidebar && (
            <div className="h-full w-[260px] shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto board-scrollbar">
              <RightSidebar collapsed={false} />
            </div>
          )}
        </div>

        {/* Welcome Modal */}
        <WelcomeToPodNewModal
          isOpen={isWelcomeModalOpen}
          onClose={closeWelcomeModal}
          onDismiss={dismissWelcomeModal}
        />
      </div>
    </div>
  );
}