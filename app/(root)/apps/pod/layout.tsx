"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import PermissionGoogle from "@/components/PermissionGoogle";
import { PodLayout } from "@/components/PodLayout";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { ProtectedFeature } from "@/components/protected-feature";

interface PodLayoutProps {
  children: React.ReactNode;
}

export default function PodLayoutComponent({ children }: PodLayoutProps) {
  const pathname = usePathname();
  
  // Get current tab from pathname for tab navigation
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

  return (
    <PermissionGoogle apiEndpoint="/api/models">
      {/* Standalone POD Layout - bypasses main ContentLayout */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white">
        <EmailVerificationBanner />
        <ProtectedFeature>
          <PodLayout>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
              <nav className="flex overflow-x-auto scrollbar-hide px-6">
                <div className="flex space-x-8 min-w-max">
                  <Link
                    href="/apps/pod/dashboard"
                    prefetch={true}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === "sheets"
                        ? "border-pink-500 text-pink-600 dark:text-pink-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    Sheets Integration
                  </Link>
                  <Link
                    href="/apps/pod/board"
                    prefetch={true}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === "pricing"
                        ? "border-pink-500 text-pink-600 dark:text-pink-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    Pricing Guide
                  </Link>
                  <Link
                    href="/apps/pod/my-models"
                    prefetch={true}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === "my-models"
                        ? "border-pink-500 text-pink-600 dark:text-pink-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    My Models
                  </Link>
                  <Link
                    href="/apps/pod/admin"
                    prefetch={true}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === "admin"
                        ? "border-pink-500 text-pink-600 dark:text-pink-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    Admin
                  </Link>
                </div>
              </nav>
            </div>

            {/* Page Content */}
            {children}
          </PodLayout>
        </ProtectedFeature>
      </div>
    </div>
  );
}
