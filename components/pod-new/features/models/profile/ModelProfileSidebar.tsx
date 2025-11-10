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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Info,
  Image as ImageIcon,
  MessageCircle,
  Smartphone,
  Images as Gallery,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronRight,
  Check,
  Search,
  X,
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
  FileSpreadsheet,
} from "lucide-react";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { useAllCreators, useCreator } from "@/hooks/useCreatorsQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

// Safe date helper to avoid Invalid Time Value errors
const formatDateDistanceSafely = (dateValue?: string | null) => {
  if (!dateValue || dateValue.trim() === "") return "Recently";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "Recently";
  return formatDistanceToNow(date, { addSuffix: true });
};

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Handle model selection
  const handleModelSelect = (selectedCreator: any) => {
    const encodedName = encodeURIComponent(selectedCreator.name);
    const currentTab = activeTab || 'information';
    const newUrl = `/my-models/${encodedName}${currentTab !== 'information' ? `?tab=${currentTab}` : ''}`;
    router.push(newUrl);
    setIsDropdownOpen(false);
    setSearchQuery(""); // Clear search when selecting a model
  };

  // Handle dropdown open/close
  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      setSearchQuery(""); // Clear search when dropdown closes
      setDebouncedSearchQuery(""); // Clear debounced search too
    }
  };

  // Debounce search query to improve performance
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-expand apps section when on an app route
  React.useEffect(() => {
    if (currentAppRoute) {
      setExpandedApps(true);
    }
  }, [currentAppRoute]);


  // Memoize creator name to prevent unnecessary refetches
  const resolvedCreatorName = React.useMemo(() => 
    creatorName || modelData?.name, 
    [creatorName, modelData?.name]
  );

  // Fetch all creators for the dropdown using TanStack Query
  const allCreatorsQuery = useAllCreators();
  const allCreators = React.useMemo(() => {
    const creators = allCreatorsQuery.data?.creators || [];
    console.log(`Total creators loaded: ${creators.length}`);
    if (creators.length > 0) {
      console.log('First few creators:', creators.slice(0, 3).map(c => ({ name: c.name, referrer: c.referrerName })));
    }
    return creators;
  }, [allCreatorsQuery.data?.creators]);

  // Fetch current creator to derive profileLink image when available using TanStack Query
  const currentCreatorQuery = useCreator(resolvedCreatorName);
  const dbData = currentCreatorQuery.data;
  const isLoadingCreator = currentCreatorQuery.isLoading;
  const isLoadingAllCreators = allCreatorsQuery.isLoading;

  // Filter creators based on debounced search query (name only)
  const filteredCreators = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return allCreators;
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    const filtered = allCreators.filter(creator => {
      // Search only by name
      const creatorName = (creator.name || '').toLowerCase();
      const nameMatch = creatorName.includes(query);
      
      // Debug logging for search issues
      if (query === "bri") {
        console.log(`Search Debug for "${creator.name}":`, {
          query,
          creatorName,
          nameMatch,
          originalName: creator.name,
        });
      }
      
      return nameMatch;
    });
    
    console.log(`Search "${query}" returned ${filtered.length} results out of ${allCreators.length} total`);
    if (query === "bri") {
      console.log('Filtered results for "bri":', filtered.map(c => c.name));
    }
    return filtered;
  }, [allCreators, debouncedSearchQuery]);
  // Memoize dbCreator to prevent unnecessary recalculations
  const dbCreator = React.useMemo(() => 
    dbData?.creators?.[0], 
    [dbData?.creators]
  );

  // Helper function to get profile image URL
  const getProfileImageUrl = React.useCallback((creator: any) => {
    const url = modelData.profileImage || creator?.profileLink || "";
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
  }, [modelData.profileImage]);

  // Memoize profile image URL to prevent unnecessary recalculations
  const profileImageUrl = React.useMemo(() => 
    getProfileImageUrl(dbCreator), 
    [getProfileImageUrl, dbCreator]
  );

  // Debug current model status
  if (modelData.name === "Alaya") {
    console.log(`Current model "${modelData.name}":`, {
      modelDataStatus: modelData.status,
      dbCreatorStatus: dbCreator?.status,
      dbCreatorStatusLower: dbCreator?.status?.toLowerCase(),
    });
  }

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
              className="mb-3 sm:mb-4 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Back to Models</span>
            </Button>

            {/* Model Selector Dropdown */}
            <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
              <DropdownMenuTrigger asChild>
                <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02] dark:opacity-0">
                    <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full -translate-y-6 translate-x-6 sm:-translate-y-8 sm:translate-x-8 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full translate-y-4 -translate-x-4 sm:translate-y-6 sm:-translate-x-6 blur-xl"></div>
                  </div>

                  <div className="relative p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="relative">
                        <div className="p-0.5 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full">
                          {profileImageUrl && !imageError ? (
                            <Image
                              src={profileImageUrl}
                              alt={modelData.name}
                              width={50}
                              height={50}
                              className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full object-cover"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-lg",
                            // Use database status if available, fallback to modelData.status
                            dbCreator?.status?.toLowerCase() === 'active'
                              ? "bg-gradient-to-r from-emerald-400 to-green-500"
                              : "bg-gradient-to-r from-red-400 to-red-500"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-base sm:text-lg truncate">
                          <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-pink-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {modelData.name}
                          </span>
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">
                          {modelData.profile.location}
                        </p>
                        <div className="flex items-center gap-1 sm:gap-1.5 mt-1 flex-wrap">
                          {modelData.profile.verificationStatus === "verified" && (
                            <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-sm">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isDropdownOpen && "rotate-180"
                      )} />
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-80 max-h-96 overflow-hidden"
                align="start"
              >
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        // Prevent dropdown from closing when typing
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                          setSearchQuery("");
                          setDebouncedSearchQuery("");
                        }
                      }}
                      onClick={(e) => {
                        // Prevent dropdown from closing when clicking input
                        e.stopPropagation();
                      }}
                      className="pl-10 pr-10 h-9"
                      autoFocus={false}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {searchQuery && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery("");
                          setDebouncedSearchQuery("");
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-80 overflow-y-auto">
                  {isLoadingAllCreators ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading models...
                    </div>
                  ) : filteredCreators.length > 0 ? (
                    <>
                      {/* Debug: Show search info */}
                      {debouncedSearchQuery && (
                        <div className="p-2 text-xs text-muted-foreground bg-muted/30 border-b">
                          Showing {filteredCreators.length} results for "{debouncedSearchQuery}"
                        </div>
                      )}
                      {filteredCreators.map((creator, index) => {
                      const creatorImageUrl = getProfileImageUrl(creator);
                      const isCurrentModel = creator.name === modelData.name;
                      
                      // Normalize status to handle different API responses (Active/Dropped, active/dropped, etc.)
                      const normalizedStatus = creator.status?.toLowerCase() === 'active' ? 'active' : 'dropped';
                      
                      // Debug for this specific case
                      if (creator.name === "Alaya") {
                        console.log(`Alaya status: "${creator.status}" -> normalized: "${normalizedStatus}"`);
                      }
                      
                      return (
                        <DropdownMenuItem
                          key={creator.id || index}
                          onClick={() => handleModelSelect(creator)}
                          className="p-3 focus:bg-gray-50 dark:focus:bg-gray-800 cursor-pointer"
                          onSelect={(event) => {
                            // Prevent default behavior that might interfere with search
                            event.preventDefault();
                            handleModelSelect(creator);
                          }}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="relative">
                              <div className="p-0.5 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full">
                                {creatorImageUrl ? (
                                  <Image
                                    src={creatorImageUrl}
                                    alt={creator.name}
                                    width={40}
                                    height={40}
                                    className="w-[40px] h-[40px] rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div
                                className={cn(
                                  "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-lg",
                                  // Use the normalized status
                                  normalizedStatus === "active"
                                    ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                    : "bg-gradient-to-r from-red-400 to-red-500"
                                )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {creator.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {normalizedStatus === "active" ? "Active" : "Dropped"}
                              </div>
                            </div>
                            {isCurrentModel && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {debouncedSearchQuery.trim() ? (
                      <div className="space-y-2">
                        <p>No models found for "{debouncedSearchQuery}"</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setDebouncedSearchQuery("");
                          }}
                          className="text-xs"
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      "No models found"
                    )}
                  </div>
                )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Real Stats - Launch Date & Social Platforms */}
            <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-10">
              {/* Launch Date Card */}
              <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-0">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full -translate-y-4 translate-x-4"></div>
                </div>
                <div className="relative p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Calendar className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Launched
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white break-words">
                    {formatDateDistanceSafely(dbCreator?.launchDate)}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium mt-1">
                    <Rocket className="w-3 h-3" />
                    Launch date
                  </p>
                </div>
              </div>

              {/* Social Platforms Card */}
              <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl border border-gray-200/60 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-0">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full -translate-y-4 translate-x-4"></div>
                </div>
                <div className="relative p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Share2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Platforms
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white break-words">
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
      <SidebarContent className="px-3 sm:px-6 py-3 sm:py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            {isLoadingCreator ? (
              <NavigationSkeleton />
            ) : (
              <SidebarMenu className="space-y-4 sm:space-y-6 lg:space-y-8">
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
