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
      name: "Generate",
      path: "/apps/generate/live",
      icon: Code,
      color: "from-blue-500 to-cyan-500",
      size: "col-span-2 row-span-2",
      description: "Generate Flyers, Posters, and more",
    },
    {
      id: 2,
      name: "Generative AI",
      path: "/apps/generative-ai",
      icon: Palette,
      color: "from-purple-500 to-pink-500",
      size: "col-span-3 row-span-1",
      description: "Generate with AI",
    },
    {
      id: 3,
      name: "Onboarding",
      path: "/apps/onboarding",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      size: "col-span-2 row-span-1",
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
      size: "col-span-2 row-span-2",
      description: "Models Data Information",
    },
    {
      id: 6,
      name: "Vault",
      path: "/apps/vault",
      icon: Package,
      color: "from-sky-500 to-blue-500",
      size: "col-span-2 row-span-1",
      description: "Model's OnlyFans Vault",
    },
    {
      id: 7,
      name: "Forms",
      path: "/apps/forms",
      icon: FileSpreadsheet,
      color: "from-indigo-500 to-purple-500",
      size: "col-span-1 row-span-2",
      description: "Forms and Surveys",
    },
    {
      id: 8,
      name: "Timesheet",
      path: "/apps/timesheet",
      icon: CalendarRange,
      color: "from-yellow-500 to-amber-500",
      size: "col-span-2 row-span-1",
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
    <div className="w-full h-full p-6">
      {/* Page Title - No animation on return visits */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Applications
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Choose an app to get started
        </p>
      </div>

      {/* Grid Navigation */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-6 grid-rows-4 gap-4 h-[calc(100%-8rem)] auto-rows-fr"
      >
        {appPages.map((app) => {
          const Icon = app.icon;
          const isHovered = hoveredItem === app.id;

          return (
            <motion.button
              key={app.id}
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              whileTap={{ scale: 0.98 }}
              className={`${app.size} relative group overflow-hidden rounded-2xl transition-shadow duration-300 hover:shadow-2xl`}
              onMouseEnter={() => setHoveredItem(app.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleNavigation(app.path)}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Animated Glow Effect */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${app.color} blur-xl`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm" />

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-colors duration-300" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-white">
                <motion.div
                  animate={{
                    scale: isHovered ? 1.15 : 1,
                    rotate: isHovered ? [0, -5, 5, 0] : 0,
                  }}
                  transition={{
                    scale: { type: "spring", stiffness: 300, damping: 20 },
                    rotate: { duration: 0.6, ease: "easeInOut" },
                  }}
                >
                  <Icon className="w-10 h-10 lg:w-12 lg:h-12 mb-3" />
                </motion.div>

                <h3 className="font-bold text-lg lg:text-xl mb-2">
                  {app.name}
                </h3>

                {/* Description container with fixed height */}
                <div className="h-10 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isHovered && (
                      <motion.p
                        className="text-sm text-white/90 text-center line-clamp-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {app.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Hover Animation Effects */}
              <AnimatePresence>
                {isHovered && (
                  <>
                    <motion.div
                      className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"
                      initial={{ x: -16, y: -16, opacity: 0 }}
                      animate={{
                        x: [-16, -32, -16],
                        y: [-16, -32, -16],
                        opacity: [0, 1, 1],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 0.5 },
                      }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"
                      initial={{ x: 20, y: 20, opacity: 0 }}
                      animate={{
                        x: [20, 40, 20],
                        y: [20, 40, 20],
                        opacity: [0, 1, 1],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        x: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.3,
                        },
                        y: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.3,
                        },
                        opacity: { duration: 0.5 },
                      }}
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
