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

  // Dynamic bento box grid sizing - creates visually appealing layouts
  const getGridSize = (index: number, totalVisible: number) => {
    // Bento-style layouts with varied sizes that completely fill the grid
    const layouts = {
      // 10 apps - 5x4 complete fill
      10: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-2 row-span-1", // Generative AI
        "col-span-1 row-span-1", // Onboarding
        "col-span-1 row-span-1", // Chatting
        "col-span-1 row-span-1", // Models
        "col-span-1 row-span-1", // Vault
        "col-span-2 row-span-1", // Forms
        "col-span-1 row-span-1", // Timesheet
        "col-span-2 row-span-1", // SWD
        "col-span-1 row-span-1", // App 10
      ],
      // 9 apps - 5x3 complete fill
      9: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-2 row-span-1", // Generative AI
        "col-span-1 row-span-1", // Onboarding
        "col-span-1 row-span-1", // Chatting
        "col-span-1 row-span-1", // Models
        "col-span-1 row-span-1", // Vault
        "col-span-2 row-span-1", // Forms
        "col-span-2 row-span-1", // Timesheet
        "col-span-1 row-span-1", // SWD
      ],
      // 8 apps - 4x3 complete fill
      8: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-2 row-span-1", // Generative AI
        "col-span-1 row-span-1", // Onboarding
        "col-span-1 row-span-1", // Chatting
        "col-span-2 row-span-1", // Models
        "col-span-1 row-span-1", // Vault
        "col-span-1 row-span-1", // Forms
        "col-span-2 row-span-1", // Timesheet
      ],
      // 7 apps - 4x3 complete fill
      7: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-2 row-span-1", // Generative AI
        "col-span-1 row-span-2", // Onboarding (tall)
        "col-span-1 row-span-1", // Chatting
        "col-span-2 row-span-1", // Models
        "col-span-1 row-span-1", // Vault
        "col-span-1 row-span-1", // Forms
      ],
      // 6 apps - 3x3 complete fill
      6: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-1 row-span-1", // Generative AI
        "col-span-1 row-span-2", // Onboarding (tall)
        "col-span-1 row-span-1", // Chatting
        "col-span-2 row-span-1", // Models
        "col-span-1 row-span-1", // Vault
      ],
      // 5 apps - 3x2 complete fill
      5: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-1 row-span-1", // Generative AI
        "col-span-1 row-span-1", // Onboarding
        "col-span-2 row-span-1", // Chatting
        "col-span-1 row-span-1", // Models
      ],
      // 4 apps - 3x2 balanced
      4: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-1 row-span-1", // Generative AI
        "col-span-1 row-span-1", // Onboarding
        "col-span-2 row-span-1", // Models
      ],
      // 3 apps - L-shape bento
      3: [
        "col-span-2 row-span-2", // Generate Flyers (hero)
        "col-span-1 row-span-1", // Generative AI
        "col-span-1 row-span-1", // Onboarding
      ],
      // 2 apps - side by side
      2: [
        "col-span-1 row-span-1", // Generate Flyers
        "col-span-1 row-span-1", // Generative AI
      ],
      // 1 app - centered
      1: [
        "col-span-1 row-span-1", // Generate Flyers
      ],
    };

    return layouts[totalVisible as keyof typeof layouts]?.[index] || "col-span-1 row-span-1";
  };

  // Bento box grid container classes - creates compact, complete layouts
  const getGridContainerClasses = (totalVisible: number) => {
    const baseClasses =
      "grid gap-2 sm:gap-3 lg:gap-4 h-[calc(100%-4rem)] sm:h-[calc(100%-6rem)] lg:h-[calc(100%-8rem)] max-w-6xl mx-auto";

    // Compact grids that completely fill all spaces
    if (totalVisible >= 10) {
      return `${baseClasses} grid-cols-5 grid-rows-4 auto-rows-fr`;
    } else if (totalVisible >= 9) {
      return `${baseClasses} grid-cols-5 grid-rows-3 auto-rows-fr`;
    } else if (totalVisible >= 8) {
      return `${baseClasses} grid-cols-4 grid-rows-3 auto-rows-fr`;
    } else if (totalVisible >= 6) {
      return `${baseClasses} grid-cols-3 grid-rows-3 auto-rows-fr`;
    } else if (totalVisible >= 4) {
      return `${baseClasses} grid-cols-3 grid-rows-2 auto-rows-fr`;
    } else if (totalVisible >= 3) {
      return `${baseClasses} grid-cols-3 grid-rows-2 auto-rows-fr`;
    } else if (totalVisible >= 2) {
      return `${baseClasses} grid-cols-2 grid-rows-1 auto-rows-fr`;
    } else {
      return `${baseClasses} grid-cols-1 grid-rows-1 auto-rows-fr place-items-center`;
    }
  };

  return (
    <div className="w-full h-full p-3 sm:p-4 lg:p-6">
      {/* Page Title - Responsive typography */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-1 sm:mb-2">
          Applications
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
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
              className={`${dynamicSize} relative group overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] min-h-[120px] sm:min-h-[140px] lg:min-h-[160px]`}
              onMouseEnter={() => setHoveredItem(app.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleNavigation(app.path)}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-3xl`}
              />

              {/* Animated Glow Effect - Hidden on mobile for performance */}
              {isHovered && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.color} blur-xl hidden sm:block rounded-2xl sm:rounded-3xl`}
                />
              )}

              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl" />

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-pink-200/30 group-hover:border-pink-300/50 transition-colors duration-300" />

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
