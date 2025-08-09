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
      <div className="hidden lg:block fixed left-4 top-4 bottom-4 z-20">
        <div className={clsx(
          "h-full transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-72"
        )}>
          <div className="h-full rounded-2xl backdrop-blur-sm shadow-lg border border-pink-100/60 dark:border-pink-500/30 bg-white/60 dark:bg-gray-800/60 p-6 flex flex-col relative transition-colors">
            
            {/* Toggle Button - Positioned differently based on collapsed state */}
            <button
              onClick={toggleCollapsed}
              className={clsx(
                "absolute top-4 p-2 rounded-lg hover:bg-pink-100/50 dark:hover:bg-pink-500/20 cursor-pointer transition-all z-10",
                isCollapsed ? "right-1/2 translate-x-1/2" : "right-4"
              )}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={clsx(
                "w-4 h-4 text-slate-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300",
                isCollapsed && "rotate-180"
              )} />
            </button>

            {/* Content - Add top margin to avoid overlap with button */}
            <div className={clsx(
              "flex flex-col h-full transition-all duration-300",
              isCollapsed && "items-center",
              "mt-5" // Add margin to push content below toggle button
            )}>
              <Logo collapsed={isCollapsed} />
              <AccountMenu session={session} collapsed={isCollapsed} />
              <SideMenu collapsed={isCollapsed} session={session} />
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
        "fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-r border-pink-100 dark:border-pink-500/30 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <button
              onClick={closeMobile}
              className="p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-500/20 cursor-pointer transition-colors"
              aria-label="Close mobile menu"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors" />
            </button>
          </div>
          <AccountMenu session={session} />
          <SideMenu onItemClick={closeMobile} session={session} />
        </div>
      </div>

      {/* Add padding to main content on mobile to account for fixed header */}
      <div className="h-16 lg:hidden" />
    </div>
  );
};

export default Sidebar;