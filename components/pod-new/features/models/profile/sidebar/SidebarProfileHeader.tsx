"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Search,
  X,
  User,
  Check,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";

interface SidebarProfileHeaderProps {
  modelData: ExtendedModelDetails;
  dbCreator: any;
  allCreators: any[];
  isLoading: boolean;
  isLoadingAllCreators: boolean;
}

// Helper to extract Google Drive ID and return thumbnail URL
const getGoogleDriveImageUrl = (url: string) => {
  if (!url || !url.includes("drive.google.com")) return url;
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
    return url;
  }
  return url;
};

export function SidebarProfileHeader({
  modelData,
  dbCreator,
  allCreators,
  isLoading,
  isLoadingAllCreators,
}: SidebarProfileHeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [imageError, setImageError] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      setSearchQuery("");
      setDebouncedSearchQuery("");
    }
  };

  const handleModelSelect = (selectedCreator: any) => {
    const encodedName = encodeURIComponent(selectedCreator.name);
    // Preserve current tab if possible, or default to information? 
    // The original code preserved it, but here we don't know the active tab.
    // We'll just navigation to the root of the model which defaults to info.
    // Or we should pass activeTab. For now, simple navigation is safer.
    router.push(`/my-models/${encodedName}`);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  // Filter creators
  const filteredCreators = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return allCreators;
    const query = debouncedSearchQuery.toLowerCase().trim();
    return allCreators.filter((creator) =>
      (creator.name || "").toLowerCase().includes(query)
    );
  }, [allCreators, debouncedSearchQuery]);

  // Image helpers
  const currentProfileImage = React.useMemo(() => {
    const url = modelData.profileImage || dbCreator?.profileLink || "";
    return getGoogleDriveImageUrl(url);
  }, [modelData.profileImage, dbCreator?.profileLink]);

  if (isLoading) {
    return (
      <div className="relative group overflow-hidden bg-white dark:bg-transparent rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
        <div className="relative p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-0.5 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-full">
                <Skeleton className="w-[60px] h-[60px] rounded-full" />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/my-models")}
        className="mb-3 sm:mb-4 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="text-xs sm:text-sm">Back to Models</span>
      </Button>

      {/* Model Selector Dropdown */}
      <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group overflow-hidden bg-white dark:bg-transparent rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-0">
              <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full -translate-y-6 translate-x-6 sm:-translate-y-8 sm:translate-x-8 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full translate-y-4 -translate-x-4 sm:translate-y-6 sm:-translate-x-6 blur-xl"></div>
            </div>

            <div className="relative p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative">
                  <div className="p-0.5 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full">
                    {currentProfileImage && !imageError ? (
                      <Image
                        src={currentProfileImage}
                        alt={modelData.name}
                        width={60}
                        height={60}
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
                      dbCreator?.status?.toLowerCase() === "active"
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
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    isDropdownOpen && "rotate-180"
                  )}
                />
              </div>
            </div>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-hidden" align="start">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    setDebouncedSearchQuery("");
                  }
                }}
                className="pl-10 pr-10 h-9"
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

          <div className="max-h-80 overflow-y-auto">
            {isLoadingAllCreators ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading models...
              </div>
            ) : filteredCreators.length > 0 ? (
              filteredCreators.map((creator, index) => {
                const creatorImageUrl = getGoogleDriveImageUrl(creator.profileLink);
                const isCurrentModel = creator.name === modelData.name;
                const normalizedStatus =
                  creator.status?.toLowerCase() === "active"
                    ? "active"
                    : "dropped";

                return (
                  <DropdownMenuItem
                    key={creator.id || index}
                    onClick={() => handleModelSelect(creator)}
                    className="p-3 focus:bg-gray-50 dark:focus:bg-gray-800 cursor-pointer"
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
              })
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No models found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
