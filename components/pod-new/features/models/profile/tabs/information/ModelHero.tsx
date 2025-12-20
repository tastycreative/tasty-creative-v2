"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Camera,
  Star,
  MapPin,
  Calendar,
  Award,
  Heart,
  FileSpreadsheet,
  Target,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateSafely, formatUsdFlexible } from "./utils";

interface SocialLink {
  platform: string;
  url: string;
  icon: any;
  color: string;
}

interface ModelHeroProps {
  modelData: ExtendedModelDetails;
  isAdmin: boolean;
  profileImageUrl: string | null;
  uploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleProfileImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfileImageClick: () => void;
  actualStatus: string;
  runtimeContext: any;
  launchDateText: string | null;
  referrerText: string;
  showSheetLinks: boolean;
  setShowSheetLinks: (show: boolean) => void;
  socialLinks: SocialLink[];
}

export const ModelHero: React.FC<ModelHeroProps> = ({
  modelData,
  isAdmin,
  profileImageUrl,
  uploadingImage,
  fileInputRef,
  handleProfileImageUpload,
  handleProfileImageClick,
  actualStatus,
  runtimeContext,
  launchDateText,
  referrerText,
  showSheetLinks,
  setShowSheetLinks,
  socialLinks,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative group overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-xl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full translate-y-12 -translate-x-12 blur-2xl"></div>
      </div>

      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="relative group/avatar">
            <div className="p-1 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl">
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt={modelData.name}
                  width={120}
                  height={120}
                  className="rounded-2xl object-cover"
                  onError={() => {
                    // Handle image error
                  }}
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>

            {/* Profile Image Upload Button - Only for Admins/Moderators */}
            {isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
                <button
                  onClick={handleProfileImageClick}
                  disabled={uploadingImage}
                  className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover/avatar:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload new profile image"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </>
            )}

            {/* Performance Score Badge */}
            <div className="absolute -top-2 -right-2">
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg shadow-black/20",
                  "bg-gradient-to-r",
                  modelData.analytics.performanceScore >= 90
                    ? "from-yellow-400 to-yellow-500 text-yellow-900"
                    : modelData.analytics.performanceScore >= 80
                    ? "from-emerald-400 to-green-500 text-white"
                    : "from-blue-400 to-blue-500 text-white"
                )}
              >
                <Star className="w-3 h-3 fill-current" />
                {modelData.analytics.performanceScore}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-pink-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {modelData.name}
                  </span>
                </h1>
                {modelData.profile.verificationStatus === "verified" && (
                  <Badge className="bg-blue-500 text-white">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Verified
                  </Badge>
                )}
                <Badge
                  variant={actualStatus === "active" ? "default" : "secondary"}
                >
                  {actualStatus === "active" ? "🟢 Active" : "🔴 Dropped"}
                </Badge>
              </div>
              {/* Context: Guaranteed and Metadata */}
              {runtimeContext?.guaranteed && (
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatUsdFlexible((runtimeContext as any).guaranteed)}{" "}
                    Guaranteed
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {launchDateText && (
                      <span className="mr-2">
                        {formatDateSafely(launchDateText)}
                      </span>
                    )}
                    {referrerText && <span>• by {referrerText}</span>}
                  </div>
                </div>
              )}
              <p className="text-lg text-muted-foreground mb-2">
                {modelData.profile.bio}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {modelData.profile.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDateSafely(modelData.profile.joinedDate)}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {modelData.profile.badges.map((badge, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-background/60"
                >
                  <Award className="w-3 h-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button className="bg-primary hover:bg-primary/90">
                <Heart className="w-4 h-4 mr-2" />
                Favorite
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSheetLinks(!showSheetLinks)}
                className={
                  showSheetLinks
                    ? "bg-pink-100 dark:bg-pink-900/30 border-pink-500"
                    : ""
                }
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {showSheetLinks ? "Back to Info" : "Sheet Links"}
              </Button>
              <Button variant="outline">
                <Target className="w-4 h-4 mr-2" />
                Set Goals
              </Button>
              {/* Context7 quick social */}
              {socialLinks.length > 0 && (
                <div className="flex gap-1 ml-auto">
                  {socialLinks.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <Button key={i} asChild variant="ghost" size="sm">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.platform}
                        >
                          <Icon className={cn("w-4 h-4", s.color)} />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
