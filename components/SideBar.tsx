"use client";

import React from "react";
import AccountMenu from "./AccountMenu";
import SideMenu from "./SideMenu";
import Logo from "./Logo";
import clsx from "clsx";
import { ChevronLeft, Menu, X } from "lucide-react";
import { Session } from "next-auth";
import { useSidebar } from "./SidebarProvider";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "./admin/ThemeToggle";

const Sidebar = () => {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { data: session } = useSession();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={clsx(
        "hidden lg:block sticky top-0 h-screen transition-all duration-300 ease-in-out z-20",
        "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-pink-200 dark:border-pink-500/30",
        "shadow-[4px_0_24px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-64 h-64 bg-pink-500/5 dark:bg-pink-500/3 rounded-full blur-3xl" />
        </div>

        {/* Content wrapper */}
        <div className="relative h-full flex flex-col">
          {/* Header with Logo and Toggle */}
          <div className="relative flex items-center justify-between p-4 border-b border-pink-200 dark:border-pink-500/30">
            <Logo collapsed={isCollapsed} />
            <button
              onClick={toggleCollapsed}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors p-2 rounded-lg"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={clsx(
                "w-4 h-4 transition-all duration-300",
                isCollapsed && "rotate-180"
              )} />
            </button>
          </div>

          {/* User Section */}
          <div className="border-b border-pink-200 dark:border-pink-500/30">
            <AccountMenu session={session} collapsed={isCollapsed} />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <SideMenu collapsed={isCollapsed} session={session} />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between">
              <div className={clsx(
                "text-xs text-gray-500 dark:text-gray-400",
                isCollapsed && "hidden"
              )}>
                Tasty Creative v2.0
              </div>
              {isCollapsed && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center w-full mb-2">
                  v2.0
                </div>
              )}
              <div className={clsx(
                "flex-shrink-0",
                isCollapsed && "w-full flex justify-center"
              )}>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Sidebar */}
      <MobileSidebar session={session} />
    </>
  );
};

// Separate component for mobile sidebar
const MobileSidebar = ({ session }: { session: Session | null }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMobile = () => setIsOpen(!isOpen);
  const closeMobile = () => setIsOpen(false);

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-pink-100 dark:border-pink-500/30 px-4 py-3 transition-colors">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={toggleMobile}
              className="p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-500/20 cursor-pointer transition-colors"
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-6 h-6 text-slate-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile Sidebar Panel */}
      <div className={clsx(
        "fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-pink-200 dark:border-pink-500/30 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
        "shadow-[4px_0_24px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-64 h-64 bg-pink-500/5 dark:bg-pink-500/3 rounded-full blur-3xl" />
        </div>

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-pink-200 dark:border-pink-500/30">
            <Logo />
            <button
              onClick={closeMobile}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              aria-label="Close mobile menu"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors" />
            </button>
          </div>

          {/* User Section */}
          <div className="border-b border-pink-200 dark:border-pink-500/30">
            <AccountMenu session={session} />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <SideMenu onItemClick={closeMobile} session={session} />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tasty Creative v2.0
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Add padding to main content on mobile to account for fixed header */}
      <div className="h-16 lg:hidden" />
    </div>
  );
};

export default Sidebar;