"use client";

import React from 'react';
import { ProtectedFeature } from './protected-feature';
import SideBar from './SideBar';
import clsx from 'clsx';
import { useSidebar } from './SidebarProvider';
import { EmailVerificationBanner } from './email-verification-banner';

const ContentLayout = ({ children  }: { children: React.ReactNode}) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex flex-1 relative z-10">
      {/* <SideBar/> */}

      {/* Desktop Main Content */}
      <div className="hidden lg:flex flex-1 relative transition-all duration-300 min-w-0 flex-col">
        <EmailVerificationBanner />
        <div className="w-full h-full overflow-hidden bg-pink-50/30 dark:bg-gray-950 transition-colors">
          {/* Content */}
          <ProtectedFeature>
            <div className="relative h-full p-6">{children}</div>
          </ProtectedFeature>
        </div>
      </div>

      {/* Mobile/Tablet Main Content */}
      <div className="lg:hidden flex-1 w-full pt-16 flex flex-col">
        <EmailVerificationBanner />
        <div className="h-full overflow-hidden bg-pink-50/30 dark:bg-gray-950 transition-colors">
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