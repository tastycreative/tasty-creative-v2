"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { appPages } from "@/lib/lib";
import { useSession } from "next-auth/react";

export default function AppsPage() {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const { data: session } = useSession();

  // Filter visible apps based on user role
  const visibleApps = appPages.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app) => !(app as any).roles || (app as any).roles.includes(session?.user?.role || "GUEST")
  );

  // Dynamic grid sizing function - creates layouts that completely fill the grid
  const getGridSize = (index: number, totalVisible: number) => {
    // Define layouts that completely fill the grid space with no gaps
    const layouts = {
      // When all 9 apps are visible - 6x4 grid
      9: [
        "col-span-2 row-span-2", // Generate Flyers (0)
        "col-span-4 row-span-1", // Generative AI (1)
        "col-span-2 row-span-1", // Onboarding (2)
        "col-span-2 row-span-1", // Chatting (3)
        "col-span-2 row-span-2", // Models (4)
        "col-span-2 row-span-1", // Vault (5)
        "col-span-1 row-span-2", // Forms (6)
        "col-span-2 row-span-1", // Timesheet (7)
        "col-span-1 row-span-1", // SWD (8)
      ],
      // When 8 apps are visible - 6x3 grid
      8: [
        "col-span-2 row-span-2", // Generate Flyers (0)
        "col-span-4 row-span-1", // Generative AI (1)
        "col-span-2 row-span-1", // Onboarding (2)
        "col-span-2 row-span-1", // Chatting (3)
        "col-span-2 row-span-2", // Models (4)
        "col-span-2 row-span-1", // Vault (5)
        "col-span-2 row-span-2", // Forms (6) - expanded
        "col-span-2 row-span-1", // Timesheet (7)
      ],
      // When 7 apps are visible - 4x3 grid
      7: [
        "col-span-2 row-span-2", // Generate Flyers (0)
        "col-span-2 row-span-1", // Generative AI (1) - smaller
        "col-span-2 row-span-1", // Onboarding (2)
        "col-span-2 row-span-1", // Chatting (3)
        "col-span-2 row-span-2", // Models (4)
        "col-span-2 row-span-1", // Vault (5)
        "col-span-2 row-span-1", // Forms/Timesheet (6)
      ],
      // When 6 apps are visible - 4x3 grid
      6: [
        "col-span-2 row-span-2", // Generate Flyers (0)
        "col-span-2 row-span-1", // Generative AI (1)
        "col-span-2 row-span-1", // Onboarding (2)
        "col-span-2 row-span-1", // Chatting (3)
        "col-span-2 row-span-2", // Models (4)
        "col-span-2 row-span-1", // Vault (5)
      ],
      // When 5 apps are visible - 4x2 grid
      5: [
        "col-span-2 row-span-2", // Generate Flyers (0)
        "col-span-2 row-span-1", // Generative AI (1)
        "col-span-2 row-span-1", // Onboarding (2)
        "col-span-2 row-span-1", // Chatting (3)
        "col-span-2 row-span-1", // Models (4)
      ],
      // When 4 apps are visible - 4x2 grid
      4: [
        "col-span-2 row-span-2", // Generate Flyers (0)
        "col-span-2 row-span-1", // Generative AI (1)
        "col-span-2 row-span-1", // Onboarding (2)
        "col-span-2 row-span-2", // Models (3)
      ],
      // When 3 apps are visible - 2x2 grid
      3: [
        "col-span-1 row-span-2", // Generate Flyers (0)
        "col-span-1 row-span-1", // Generative AI (1)
        "col-span-1 row-span-1", // Onboarding (2)
      ],
      // When 2 apps are visible - 2x1 grid
      2: [
        "col-span-1 row-span-1", // Generate Flyers (0)
        "col-span-1 row-span-1", // Generative AI (1)
      ],
      // When 1 app is visible - 1x1 grid
      1: [
        "col-span-1 row-span-1", // Generate Flyers (0)
      ],
    };

    return layouts[totalVisible as keyof typeof layouts]?.[index] || "col-span-1 row-span-1";
  };

  // Dynamic grid container classes based on number of visible apps
  const getGridContainerClasses = (totalVisible: number) => {
    const baseClasses =
      "grid gap-2 sm:gap-3 lg:gap-4 h-[calc(100%-4rem)] sm:h-[calc(100%-6rem)] lg:h-[calc(100%-8rem)]";

    // Grid configurations that ensure no empty spaces
    if (totalVisible >= 9) {
      return `${baseClasses} grid-cols-6 grid-rows-4 auto-rows-fr`;
    } else if (totalVisible >= 8) {
      return `${baseClasses} grid-cols-6 grid-rows-3 auto-rows-fr`;
    } else if (totalVisible >= 6) {
      return `${baseClasses} grid-cols-4 grid-rows-3 auto-rows-fr`;
    } else if (totalVisible >= 4) {
      return `${baseClasses} grid-cols-4 grid-rows-2 auto-rows-fr`;
    } else if (totalVisible >= 3) {
      return `${baseClasses} grid-cols-2 grid-rows-2 auto-rows-fr`;
    } else if (totalVisible >= 2) {
      return `${baseClasses} grid-cols-2 grid-rows-1 auto-rows-fr`;
    } else {
      return `${baseClasses} grid-cols-1 grid-rows-1 auto-rows-fr`;
    }
  };

  return (
    <div className="w-full h-full p-3 sm:p-4 lg:p-6">
      {/* Page Title - Responsive typography */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2">
          Applications
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Choose an app to get started
        </p>
      </div>

      {/* Responsive Grid Navigation */}
      <div className={getGridContainerClasses(visibleApps.length)}>
        {visibleApps.map((app, index) => {
          const Icon = app.icon;
          const isHovered = hoveredItem === app.id;
          const dynamicSize = getGridSize(index, visibleApps.length);

          return (
            <button
              key={app.id}
              className={`${dynamicSize} relative group overflow-hidden rounded-xl sm:rounded-2xl transition-shadow duration-300 hover:shadow-2xl min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]`}
              onMouseEnter={() => setHoveredItem(app.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleNavigation(app.path)}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Animated Glow Effect - Hidden on mobile for performance */}
              {isHovered && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.color} blur-xl hidden sm:block`}
                />
              )}

              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm" />

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-white/20 group-hover:border-white/40 transition-colors duration-300" />

              {/* Content - Responsive sizing */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-3 lg:p-4 text-white">
                <div className="mb-1 sm:mb-2 lg:mb-3">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12" />
                </div>

                <h3 className="font-bold text-xs sm:text-sm lg:text-lg xl:text-xl mb-1 sm:mb-2 text-center leading-tight">
                  {app.name}
                </h3>

                {/* Description container - Only show on larger screens and when hovered */}
                <div className="h-0 sm:h-6 lg:h-10 flex items-center justify-center">
                  {isHovered && (
                    <p className="text-xs sm:text-sm text-white/90 text-center line-clamp-2 hidden sm:block">
                      {app.description}
                    </p>
                  )}
                </div>
              </div>

              {isHovered && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/20 rounded-full blur-xl sm:blur-2xl hidden sm:block" />
                  <div className="absolute bottom-0 right-0 w-20 h-20 sm:w-30 sm:h-30 lg:w-40 lg:h-40 bg-white/10 rounded-full blur-2xl sm:blur-3xl hidden sm:block" />
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
