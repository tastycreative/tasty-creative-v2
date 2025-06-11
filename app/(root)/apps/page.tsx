"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Palette,
  FileText,
  MessageSquareHeart,
  VenetianMask,
  Package,
  FileSpreadsheet,
  CalendarRange,
} from "lucide-react";

// Global variable to persist animation state across component unmounts
let hasAnimatedBefore = false;

export default function AppsPage() {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shouldAnimate, setShouldAnimate] = useState(!hasAnimatedBefore);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current && !hasAnimatedBefore) {
      hasAnimatedBefore = true;
      isFirstRender.current = false;
    }
  }, []);

  const appPages = [
    {
      id: 1,
      name: "Generate Flyers",
      path: "/apps/generate/live",
      icon: Code,
      color: "from-blue-500 to-cyan-500",
      // Responsive sizing: mobile (1x2), tablet (2x1), desktop (2x2)
      size: "col-span-1 row-span-2 sm:col-span-2 sm:row-span-1 lg:col-span-2 lg:row-span-2",
      description: "Generate Flyers, Posters, and more",
    },
    {
      id: 2,
      name: "Generative AI",
      path: "/apps/generative-ai/voice",
      icon: Palette,
      color: "from-purple-500 to-pink-500",
      size: "col-span-1 row-span-1 sm:col-span-2 lg:col-span-3",
      description: "Generate with AI",
    },
    {
      id: 3,
      name: "Onboarding",
      path: "/apps/onboarding",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      size: "col-span-1 row-span-1 sm:col-span-2 lg:col-span-2",
      description: "Onboarding Clients",
    },
    {
      id: 4,
      name: "Chatting",
      path: "/apps/chatting",
      icon: MessageSquareHeart,
      color: "from-gray-500 to-slate-500",
      size: "col-span-1 row-span-1",
      description: "Chatting Team Information",
    },
    {
      id: 5,
      name: "Models",
      path: "/apps/models",
      icon: VenetianMask,
      color: "from-orange-500 to-red-500",
      size: "col-span-1 row-span-2 sm:col-span-2 sm:row-span-1 lg:col-span-2 lg:row-span-2",
      description: "Models Data Information",
    },
    {
      id: 6,
      name: "Vault",
      path: "/apps/vault",
      icon: Package,
      color: "from-sky-500 to-blue-500",
      size: "col-span-1 row-span-1 sm:col-span-2 lg:col-span-2",
      description: "Model's OnlyFans Vault",
    },
    {
      id: 7,
      name: "Forms",
      path: "/apps/forms",
      icon: FileSpreadsheet,
      color: "from-indigo-500 to-purple-500",
      size: "col-span-1 row-span-2 sm:col-span-1 sm:row-span-1 lg:col-span-1 lg:row-span-2",
      description: "Forms and Surveys",
    },
    {
      id: 8,
      name: "Timesheet",
      path: "/apps/timesheet",
      icon: CalendarRange,
      color: "from-yellow-500 to-amber-500",
      size: "col-span-1 row-span-1 sm:col-span-2 lg:col-span-2",
      description: "Manage Timesheets",
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Animation variants - only animate on first visit
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldAnimate ? 0.05 : 0,
        delayChildren: shouldAnimate ? 0 : 0,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: shouldAnimate ? 0 : 1,
      y: shouldAnimate ? 20 : 0,
      scale: shouldAnimate ? 0.9 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: shouldAnimate
        ? {
            type: "spring",
            stiffness: 200,
            damping: 20,
          }
        : { duration: 0 },
    },
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
      <div
        // variants={containerVariants}
        //initial="hidden"
        //animate="visible"
        className="grid gap-2 sm:gap-3 lg:gap-4 h-[calc(100%-4rem)] sm:h-[calc(100%-6rem)] lg:h-[calc(100%-8rem)]
                   grid-cols-2 grid-rows-8 auto-rows-fr
                   sm:grid-cols-4 sm:grid-rows-6
                   lg:grid-cols-6 lg:grid-rows-4"
      >
        {appPages.map((app) => {
          const Icon = app.icon;
          const isHovered = hoveredItem === app.id;

          return (
            <button
              key={app.id}
              // variants={itemVariants}
              // //whileHover={{
              //   scale: 1.02,
              //   transition: { type: "spring", stiffness: 400, damping: 10 },
              // }}
              // //whileTap={{ scale: 0.98 }}
              className={`${app.size} relative group overflow-hidden rounded-xl sm:rounded-2xl transition-shadow duration-300 hover:shadow-2xl min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]`}
              onMouseEnter={() => setHoveredItem(app.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleNavigation(app.path)}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Animated Glow Effect - Hidden on mobile for performance */}
              {/* <AnimatePresence> */}
              {isHovered && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.color} blur-xl hidden sm:block`}
                  //initial={{ opacity: 0 }}
                  //animate={{ opacity: 0.5 }}
                  //exit={{ opacity: 0 }}
                  //transition={{ duration: 0.3 }}
                />
              )}
              {/* </AnimatePresence> */}

              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm" />

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-white/20 group-hover:border-white/40 transition-colors duration-300" />

              {/* Content - Responsive sizing */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-3 lg:p-4 text-white">
                <div
                  //animate={{
                  //   scale: isHovered ? 1.15 : 1,
                  //   rotate: isHovered ? [0, -5, 5, 0] : 0,
                  // }}
                  //transition={{
                  //   scale: { type: "spring", stiffness: 300, damping: 20 },
                  //   rotate: { duration: 0.6, ease: "easeInOut" },
                  // }}
                  className="mb-1 sm:mb-2 lg:mb-3"
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12" />
                </div>

                <h3 className="font-bold text-xs sm:text-sm lg:text-lg xl:text-xl mb-1 sm:mb-2 text-center leading-tight">
                  {app.name}
                </h3>

                {/* Description container - Only show on larger screens and when hovered */}
                <div className="h-0 sm:h-6 lg:h-10 flex items-center justify-center">
                  {/* <AnimatePresence mode="wait"> */}
                  {isHovered && (
                    <p
                      className="text-xs sm:text-sm text-white/90 text-center line-clamp-2 hidden sm:block"
                      //initial={{ opacity: 0, y: 10 }}
                      //animate={{ opacity: 1, y: 0 }}
                      //exit={{ opacity: 0, y: 5 }}
                      //transition={{ duration: 0.2 }}
                    >
                      {app.description}
                    </p>
                  )}
                  {/* </AnimatePresence> */}
                </div>
              </div>

              {/* Hover Animation Effects - Hidden on mobile for performance */}
              {/* <AnimatePresence> */}
              {isHovered && (
                <>
                  <div
                    className="absolute top-0 left-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/20 rounded-full blur-xl sm:blur-2xl hidden sm:block"
                    //initial={{ x: -8, y: -8, opacity: 0 }}
                    //animate={{
                    //   x: [-8, -16, -8],
                    //   y: [-8, -16, -8],
                    //   opacity: [0, 1, 1],
                    // }}
                    //exit={{ opacity: 0 }}
                    //transition={{
                    //   x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    //   y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    //   opacity: { duration: 0.5 },
                    // }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-20 h-20 sm:w-30 sm:h-30 lg:w-40 lg:h-40 bg-white/10 rounded-full blur-2xl sm:blur-3xl hidden sm:block"
                    //initial={{ x: 10, y: 10, opacity: 0 }}
                    //animate={{
                    //   x: [10, 20, 10],
                    //   y: [10, 20, 10],
                    //   opacity: [0, 1, 1],
                    // }}
                    //exit={{ opacity: 0 }}
                    //transition={{
                    // x: {
                    //   duration: 3,
                    //   repeat: Infinity,
                    //   ease: "easeInOut",
                    //   delay: 0.3,
                    // },
                    // y: {
                    //   duration: 3,
                    //   repeat: Infinity,
                    //   ease: "easeInOut",
                    //   delay: 0.3,
                    // },
                    // opacity: { duration: 0.5 },
                    // }}
                  />
                </>
              )}
              {/* </AnimatePresence> */}
            </button>
          );
        })}
      </div>
    </div>
  );
}
