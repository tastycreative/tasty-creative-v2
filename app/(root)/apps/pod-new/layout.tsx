"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import PermissionGoogle from "@/components/PermissionGoogle";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { ProtectedFeature } from "@/components/protected-feature";
import { PodSidebarEnhanced } from "@/components/PodSidebarEnhanced";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { TeamSelector } from "@/components/pod-dashboard/TeamSelector";
import { TeamMembersCard } from "@/components/pod-dashboard/TeamMembersCard";
import { AssignedModelsCard } from "@/components/pod-dashboard/AssignedModelsCard";
import { SheetLinksCard } from "@/components/pod-dashboard/SheetLinksCard";

interface PodNewLayoutProps {
  children: React.ReactNode;
}

export default function PodNewLayout({ children }: PodNewLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get current tab from pathname for tab navigation
  const getCurrentTab = () => {
    if (!pathname) return "dashboard";
    if (pathname === "/apps/pod-new" || pathname === "/apps/pod-new/dashboard")
      return "dashboard";
    if (pathname.includes("/apps/pod-new/sheets")) return "sheets";
    if (pathname.includes("/apps/pod-new/board")) return "board";
    if (pathname.includes("/apps/pod-new/admin")) return "admin";
    if (pathname.includes("/apps/pod-new/pricing")) return "pricing";
    if (pathname.includes("/apps/pod-new/my-models")) return "my-models";
    return "dashboard";
  };

  const activeTab = getCurrentTab();

  const tabItems = [
    { id: "dashboard", label: "Dashboard", href: "/apps/pod-new/dashboard" },
    { id: "sheets", label: "Sheets Integration", href: "/apps/pod-new/sheets" },
    { id: "board", label: "Board", href: "/apps/pod-new/board" },
    { id: "pricing", label: "Pricing Guide", href: "/apps/pod-new/pricing" },
    { id: "my-models", label: "My Models", href: "/apps/pod-new/my-models" },
    { id: "admin", label: "Admin", href: "/apps/pod-new/admin" },
  ];

  return (
    <PermissionGoogle apiEndpoint="/api/models">
      <ProtectedFeature>
        <div className="min-h-screen bg-gray-900 text-white">
          {/* Full-Width Hero Header */}
          <div className=" mx-auto px-8 py-8">
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm px-8 py-10 shadow-lg shadow-purple-500/5">
              <h1 className="text-4xl lg:text-5xl font-bold text-center text-white">
                POD Management Dashboard
              </h1>
              <p className="mt-4 text-center text-slate-300 text-lg">
                Manage your team, track workflow progress, and sync with Google
                Spreadsheets
              </p>
            </div>
          </div>
          {/* Pill Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {tabItems.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          {/* Main Grid Layout */}
          <div className="w-full px-6 lg:px-10 mt-6 grid grid-cols-1 xl:grid-cols-[320px_1fr_320px] gap-8 items-start">
            {/* Left Sidebar - Desktop Card */}
            <aside
              className="
              hidden xl:flex xl:flex-col
              sticky top-24
              self-start
              rounded-2xl bg-slate-900/70 border border-white/10 shadow-sm
              max-h-[calc(100vh-6rem)]
              overflow-hidden
            "
            >
              <PodSidebarEnhanced />
            </aside>

            {/* Mobile Sidebar Trigger */}
            <div className="xl:hidden fixed top-4 left-4 z-50">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-lg bg-slate-900/70 border border-white/10 text-white hover:bg-slate-800/70 transition-colors">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="top-[calc(96px+16px)] bg-slate-900/95 border-white/10 backdrop-blur-sm w-72"
                >
                  <PodSidebarEnhanced />
                </SheetContent>
              </Sheet>
            </div>

            {/* Main Content */}
            <main className="min-h-[500px]">{children}</main>

            {/* Right Rail - Live Components */}
            <aside className="hidden xl:block space-y-6">
              {/* Team Selector */}
              <TeamSelector />

              {/* Team Members Card */}
              <TeamMembersCard />

              {/* Assigned Models Card */}
              <AssignedModelsCard />

              {/* Sheet Links Card */}
              <SheetLinksCard />
            </aside>
          </div>
        </div>
      </ProtectedFeature>
    </PermissionGoogle>
  );
}
