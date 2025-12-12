"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Info,
  Image as ImageIcon,
  MessageCircle,
  Smartphone,
  Images as Gallery,
  MessageSquare,
  Radio,
  Zap,
  Wand2,
  Trophy,
  Crown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoading: boolean;
  currentAppRoute?: string;
  modelName: string;
}

const navigationItems = [
  {
    id: "information",
    label: "Information",
    icon: Info,
    description: "Overview & personal details",
  },
  {
    id: "assets",
    label: "Assets",
    icon: ImageIcon,
    description: "Photos, videos & media",
  },
  {
    id: "chatters",
    label: "Chatters",
    icon: MessageCircle,
    description: "Fan engagement",
  },
  {
    id: "apps",
    label: "Apps",
    icon: Smartphone,
    description: "Integrations & platforms",
    hasSubItems: true,
    subItems: [
      {
        id: "live",
        label: "LIVE",
        icon: Radio,
        route: "/my-models/[modelName]/apps/live",
      },
      {
        id: "x-ads",
        label: "X ADS",
        icon: Zap,
        route: "/my-models/[modelName]/apps/x-ads",
      },
      {
        id: "gif-maker",
        label: "GIF MAKER",
        icon: Wand2,
        route: "/my-models/[modelName]/apps/gif-maker",
      },
      {
        id: "first-to-tip",
        label: "FIRST TO TIP",
        icon: Trophy,
        route: "/my-models/[modelName]/apps/first-to-tip",
      },
      {
        id: "vip",
        label: "VIP",
        icon: Crown,
        route: "/my-models/[modelName]/apps/vip",
      },
    ],
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: Gallery,
    description: "Content performance",
  },
  {
    id: "forum",
    label: "Forum",
    icon: MessageSquare,
    description: "Community discussions",
  },
];

export function SidebarNavigation({
  activeTab,
  onTabChange,
  isLoading,
  currentAppRoute,
  modelName,
}: SidebarNavigationProps) {
  const [expandedApps, setExpandedApps] = useState(!!currentAppRoute);

  useEffect(() => {
    if (currentAppRoute) {
      setExpandedApps(true);
    }
  }, [currentAppRoute]);

  if (isLoading) {
    return (
      <SidebarMenu className="space-y-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <SidebarMenuItem key={i}>
            <div className="relative w-full rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-transparent backdrop-blur-sm h-14 overflow-hidden">
              <div className="flex items-center w-full px-4 py-4">
                <Skeleton className="w-10 h-10 rounded-lg mr-4" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu asChild>
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 sm:space-y-6 lg:space-y-8">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Color themes for each navigation item
              const themes = [
                {
                  gradient: "from-pink-500 to-purple-500",
                  bg: "from-pink-50/60 to-purple-50/60 dark:from-pink-900/20 dark:to-purple-800/30",
                  shadow: "shadow-pink-500/20",
                  blur: "from-pink-400 to-purple-400",
                },
                {
                  gradient: "from-purple-500 to-blue-500",
                  bg: "from-purple-50/60 to-blue-50/60 dark:from-purple-900/20 dark:to-blue-800/30",
                  shadow: "shadow-purple-500/20",
                  blur: "from-purple-400 to-blue-400",
                },
                {
                  gradient: "from-blue-500 to-cyan-500",
                  bg: "from-blue-50/60 to-cyan-50/60 dark:from-blue-900/20 dark:to-cyan-800/30",
                  shadow: "shadow-blue-500/20",
                  blur: "from-blue-400 to-cyan-400",
                },
                {
                  gradient: "from-emerald-500 to-green-500",
                  bg: "from-emerald-50/60 to-green-50/60 dark:from-emerald-900/20 dark:to-green-800/30",
                  shadow: "shadow-emerald-500/20",
                  blur: "from-emerald-400 to-green-400",
                },
                {
                  gradient: "from-orange-500 to-amber-500",
                  bg: "from-orange-50/60 to-amber-50/60 dark:from-orange-900/20 dark:to-amber-800/30",
                  shadow: "shadow-orange-500/20",
                  blur: "from-orange-400 to-amber-400",
                },
                {
                  gradient: "from-violet-500 to-pink-500",
                  bg: "from-violet-50/60 to-pink-50/60 dark:from-violet-900/20 dark:to-pink-800/30",
                  shadow: "shadow-violet-500/20",
                  blur: "from-violet-400 to-pink-400",
                },
              ];
              const theme = themes[index % themes.length];

              return (
                <motion.div key={item.id} variants={itemVariant}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (item.hasSubItems) {
                          setExpandedApps(!expandedApps);
                        } else {
                          onTabChange(item.id);
                        }
                      }}
                      className={cn(
                        "relative group w-full justify-start transition-all duration-300 rounded-xl border-0 overflow-hidden backdrop-blur-sm h-12 sm:h-14",
                        isActive
                          ? `bg-gradient-to-br ${theme.bg} shadow-lg ${theme.shadow} scale-105 border border-white/50 dark:border-gray-700/50`
                          : "bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:scale-102 border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
                      )}
                      data-active={isActive}
                    >
                      {/* Background Pattern for Active Item */}
                      {isActive && (
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                          <div
                            className={`absolute top-0 right-0 w-6 h-6 bg-gradient-to-br ${theme.blur} rounded-full -translate-y-3 translate-x-3 blur-lg`}
                          ></div>
                        </div>
                      )}

                      <div className="relative flex items-center w-full px-3 sm:px-4 py-3 sm:py-4">
                        <div
                          className={cn(
                            "p-2 sm:p-2.5 rounded-lg mr-3 sm:mr-4 transition-all duration-300",
                            isActive
                              ? `bg-gradient-to-r ${theme.gradient} shadow-lg text-white scale-110`
                              : "bg-gray-100 dark:bg-gray-700 text-muted-foreground group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                          )}
                        >
                          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div
                            className={cn(
                              "font-semibold text-xs sm:text-sm transition-colors truncate",
                              isActive
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white"
                            )}
                          >
                            {item.label}
                          </div>
                          <div
                            className={cn(
                              "text-xs transition-colors truncate",
                              isActive
                                ? "text-gray-600 dark:text-gray-300"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.description}
                          </div>
                        </div>

                        {/* Accordion Arrow for Apps */}
                        {item.hasSubItems && (
                          <div className="transition-transform duration-200">
                            {expandedApps ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}

                        {/* Active Indicator */}
                        {isActive && !item.hasSubItems && (
                          <div
                            className={`w-1 h-8 bg-gradient-to-b ${theme.gradient} rounded-full`}
                          />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Sub-items for Apps */}
                  <AnimatePresence>
                    {item.hasSubItems && expandedApps && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-6 mt-2 space-y-1 overflow-hidden"
                      >
                        {item.subItems?.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const routePath = subItem.route.replace(
                            "[modelName]",
                            modelName
                          );
                          const isCurrentApp = currentAppRoute === subItem.id;

                          return (
                            <Link key={subItem.id} href={routePath}>
                              <div
                                className={cn(
                                  "group flex items-center px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                                  isCurrentApp
                                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800/40"
                                )}
                              >
                                <div
                                  className={cn(
                                    "p-1.5 rounded-md mr-3 transition-colors",
                                    isCurrentApp
                                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                                      : "bg-gray-200/60 dark:bg-gray-700/60 group-hover:bg-gray-300/60 dark:group-hover:bg-gray-600/60"
                                  )}
                                >
                                  <SubIcon
                                    className={cn(
                                      "h-3 w-3 transition-colors",
                                      isCurrentApp
                                        ? "text-white"
                                        : "text-gray-600 dark:text-gray-300"
                                    )}
                                  />
                                </div>
                                <span
                                  className={cn(
                                    "text-xs font-medium transition-colors",
                                    isCurrentApp
                                      ? "text-blue-700 dark:text-blue-300 font-semibold"
                                      : "text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                                  )}
                                >
                                  {subItem.label}
                                </span>

                                {/* Active indicator */}
                                {isCurrentApp && (
                                  <div className="ml-auto w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
