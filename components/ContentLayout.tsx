"use client";

import React from 'react';
import { ProtectedFeature } from './protected-feature';
import SideBar from './SideBar';
import clsx from 'clsx';
import { useSidebar } from './SidebarProvider';

const ContentLayout = ({ children  }: { children: React.ReactNode}) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex lg:gap-6 flex-1 lg:p-4 relative z-10">
      <SideBar/>

      {/* Desktop Main Content */}
      <div className={clsx(
        "hidden lg:flex flex-1 relative transition-all duration-300 min-w-0",
        isCollapsed ? "ml-28" : "ml-78"
      )}>
        <div className="w-full h-full rounded-2xl backdrop-blur-sm shadow-xl border border-pink-100/50 overflow-hidden bg-white/60">
          {/* Content */}
          <ProtectedFeature>
            <div className="relative h-full p-6">{children}</div>
          </ProtectedFeature>
        </div>
      </div>

      {/* Mobile/Tablet Main Content */}
      <div className="lg:hidden flex-1 w-full pt-16">
        <div className="h-full rounded-2xl backdrop-blur-sm shadow-xl border border-pink-100/50 overflow-hidden bg-white/60">
          {/* Content */}
          <ProtectedFeature>
            <div className="relative h-full p-4 sm:p-6">{children}</div>
          </ProtectedFeature>
        </div>
      </div>
    </div>
  );
};

export default ContentLayout;