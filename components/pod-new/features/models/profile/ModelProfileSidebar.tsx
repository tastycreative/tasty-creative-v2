"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Info,
  Image as ImageIcon,
  MessageCircle,
  Smartphone,
  Images as Gallery,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  LogOut,
  ChevronDown,
  ChevronRight,
  Radio,
  Zap,
  Wand2,
  Trophy,
  Crown,
  User,
  Calendar,
  Rocket,
  Share2,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { useCreatorsDB } from "@/lib/hooks/useCreatorsDB";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ModelProfileSidebarProps {
  modelData: ExtendedModelDetails;
  activeTab: string;
  onTabChange: (tab: string) => void;
  creatorName?: string;
  currentAppRoute?: string; // e.g., "live", "x-ads", etc.
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

function ProfileSkeleton() {
  return (
    <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
      <div className="relative p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-0.5 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-full">
              <Skeleton className="w-[60px] h-[60px] rounded-full" />
            </div>
            <Skeleton className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 mt-10">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm"
        >
          <div className="relative p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-20" />
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NavigationSkeleton() {
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

export function ModelProfileSidebar({
  modelData,
  activeTab,
  onTabChange,
  creatorName,
  currentAppRoute,
}: ModelProfileSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const [expandedApps, setExpandedApps] = useState(!!currentAppRoute);
  const [imageError, setImageError] = useState(false);

  // Auto-expand apps section when on an app route
  React.useEffect(() => {
    if (currentAppRoute) {
      setExpandedApps(true);
    }
  }, [currentAppRoute]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Fetch creator to derive profileLink image when available
  const resolvedCreatorName = creatorName || modelData?.name;
  const { data: dbData, loading: isLoadingCreator } =
    useCreatorsDB(resolvedCreatorName);
  const dbCreator = dbData?.creators?.[0];

  const profileImageUrl = (() => {
    const url = modelData.profileImage || (dbCreator as any)?.profileLink || "";
    if (!url) return null;
    if (url.includes("drive.google.com")) {
      try {
        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        let driveId: string | null = null;
        if (fileMatch && fileMatch[1]) {
          driveId = fileMatch[1];
        } else {
          const urlObj = new URL(url);
          driveId = urlObj.searchParams.get("id");
        }
        if (driveId) {
          return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
        }
      } catch {
        // ignore and fall through
      }
    }
    return url;
  })();

  return (
    <Sidebar
      variant="inset"
      className="border-r-0 bg-transparent dark:bg-gradient-to-b dark:from-gray-900/90 dark:via-purple-900/30 dark:to-blue-900/30 backdrop-blur-xl w-80"
    >
      {/* Header with model info */}
      <SidebarHeader className="p-8 pb-6">
        {isLoadingCreator ? (
          <>
            <ProfileSkeleton />
            <StatsSkeleton />
          </>
        ) : (
          <>
            {/* Back Button - Primary Navigation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/my-models')}
              className="mb-4 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Models
            </Button>

            {/* Hero Profile Card */}
            <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-0">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full -translate-y-8 translate-x-8 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full translate-y-6 -translate-x-6 blur-xl"></div>
              </div>

              <div className="relative p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-0.5 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full">
                      {profileImageUrl && !imageError ? (
                        <Image
                          src={profileImageUrl}
                          alt={modelData.name}
                          width={60}
                          height={60}
                          className="rounded-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg",
                        modelData.status === "active"
                          ? "bg-gradient-to-r from-emerald-400 to-green-500"
                          : "bg-gray-400"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg truncate">
                      <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-pink-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {modelData.name}
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground truncate font-medium">
                      {modelData.profile.location}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant={
                          modelData.status === "active"
                            ? "default"
                            : "secondary"
                        }
                        className={cn(
                          "text-xs border-0 shadow-sm",
                          modelData.status === "active"
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                            : "bg-gray-400 text-white"
                        )}
                      >
                        {modelData.status === "active"
                          ? "🟢 Active"
                          : "⚫ Dropped"}
                      </Badge>
                      {modelData.profile.verificationStatus === "verified" && (
                        <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-sm">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Stats - Launch Date & Social Platforms */}
            <div className="space-y-4 mt-10">
              {/* Launch Date Card */}
              <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-0">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full -translate-y-4 translate-x-4"></div>
                </div>
                <div className="relative p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Calendar className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Launched
                    </span>
                  </div>
                  <p className="text-base font-black text-gray-900 dark:text-white break-words">
                    {dbCreator?.launchDate
                      ? formatDistanceToNow(new Date(dbCreator.launchDate), {
                          addSuffix: true,
                        })
                      : "Recently"}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium mt-1">
                    <Rocket className="w-3 h-3" />
                    {modelData.status === "active" ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              {/* Social Platforms Card */}
              <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-0">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full -translate-y-4 translate-x-4"></div>
                </div>
                <div className="relative p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Share2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Platforms
                    </span>
                  </div>
                  <p className="text-base font-black text-gray-900 dark:text-white break-words">
                    {[
                      dbCreator?.instagram,
                      dbCreator?.twitter,
                      dbCreator?.tiktok,
                    ].filter(Boolean).length || 0}{" "}
                    Connected
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium mt-1">
                    <Globe className="w-3 h-3" />
                    Social presence
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent className="px-6 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            {isLoadingCreator ? (
              <NavigationSkeleton />
            ) : (
              <SidebarMenu className="space-y-8">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const modelName = (params?.modelName as string) || "unknown";

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
                    <div key={item.id}>
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
                            "relative group w-full justify-start transition-all duration-300 rounded-xl border-0 overflow-hidden backdrop-blur-sm h-14",
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

                          <div className="relative flex items-center w-full px-4 py-4">
                            <div
                              className={cn(
                                "p-2.5 rounded-lg mr-4 transition-all duration-300",
                                isActive
                                  ? `bg-gradient-to-r ${theme.gradient} shadow-lg text-white scale-110`
                                  : "bg-gray-100 dark:bg-gray-700 text-muted-foreground group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-left">
                              <div
                                className={cn(
                                  "font-semibold text-sm transition-colors",
                                  isActive
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white"
                                )}
                              >
                                {item.label}
                              </div>
                              <div
                                className={cn(
                                  "text-xs transition-colors",
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
                      {item.hasSubItems && expandedApps && (
                        <div className="ml-6 mt-2 space-y-1">
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer */}
      <SidebarFooter className="p-6">
        {/* Theme Toggle - Settings Only */}
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
