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
        "hidden lg:flex flex-1 relative transition-all duration-300",
        isCollapsed ? "ml-28" : "ml-80"
      )}>
        <div className="w-full h-full rounded-2xl backdrop-blur-[2px] shadow-xl border border-white/50 dark:border-slate-700/50 overflow-hidden">
          {/* Subtle dot pattern */}
          {/* <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" /> */}

          {/* Gentle top gradient */}
          {/* <div className="absolute inset-x-0 top-0 h-32" /> */}

          {/* Content */}
          <ProtectedFeature>
            <div className="relative h-full p-6">{children}</div>
          </ProtectedFeature>
        </div>
      </div>

      {/* Mobile/Tablet Main Content */}
      <div className="lg:hidden flex-1 w-full pt-16">
        <div className="h-full rounded-2xl backdrop-blur-[2px] shadow-xl border border-white/50 dark:border-slate-700/50 overflow-hidden">
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" />

          {/* Gentle top gradient */}
          <div className="absolute inset-x-0 top-0 h-32" />

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