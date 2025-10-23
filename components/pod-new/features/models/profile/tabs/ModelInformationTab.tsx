"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  MapPin,
  Calendar,
  Instagram,
  Twitter,
  Activity,
  Star,
  Heart,
  MessageCircle,
  ExternalLink,
  Globe,
  Award,
  Target,
  Sparkles,
  Grid,
  Package,
  ChevronDown,
  User,
  Edit2,
  Check,
  X as XIcon,
  Camera,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreator } from "@/hooks/useCreatorsQuery";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import PricingGuide from "@/components/PricingGuide";

interface ModelInformationTabProps {
  modelData: ExtendedModelDetails;
  creatorName?: string;
}

interface EditingState {
  creatorName: string;
  itemName: string;
  originalValue: string;
  newValue: string;
  creatorRowNumber?: number;
  creatorRowId?: string;
}

export function ModelInformationTab({
  modelData,
  creatorName,
}: ModelInformationTabProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingContent, setUpdatingContent] = useState(false);
  const [updatingPricing, setUpdatingPricing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch live creator context by name using TanStack Query
  const resolvedCreatorName = creatorName || modelData?.name;
  const creatorQuery = useCreator(resolvedCreatorName);
  const dbData = creatorQuery.data;
  const dbCreator = dbData?.creators?.[0];
  const dbPricing = dbData?.pricingData || [];

  const runtimeContext = dbCreator
    ? { ...dbCreator, pricingData: dbPricing }
    : undefined;
  console.log("Runtime Context:", runtimeContext);

  // Get the actual status from database
  const actualStatus = dbCreator?.status?.toLowerCase() === 'active' ? 'active' : 'dropped';
  
  // Debug status for ModelInformationTab
  if (modelData.name === "Alaya") {
    console.log(`ModelInformationTab "${modelData.name}":`, {
      modelDataStatus: modelData.status,
      dbCreatorStatus: dbCreator?.status,
      actualStatus: actualStatus,
    });
  }

  // Show skeleton while loading initial creator context
  if (creatorQuery.isLoading || !runtimeContext) {
    return (
      <div className="min-h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Hero skeleton */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="p-1 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl">
                  <Skeleton className="h-[120px] w-[120px] rounded-2xl" />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-6 w-56" />
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/40 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>

          {/* Main grid skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/40 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Skeleton className="h-6 w-40" />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <div className="flex gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-14 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/40 p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/40 p-6">
                <Skeleton className="h-6 w-28 mb-4" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Derive profile image URL (supports Google Drive links)
  // Prioritize fresh database data from runtimeContext over potentially stale modelData
  const profileImageUrl = (() => {
    const dbProfileLink = dbCreator?.profileLink;
    const url =
      dbProfileLink || (runtimeContext as any)?.profileLink || modelData.profileImage || "";
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
          return `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
        }
      } catch {
        // ignore and fall through
      }
    }
    return url;
  })();

  // Context-style helpers
  const formatUsdFlexible = (amount?: number | string) => {
    if (amount == null) return "";
    const str = String(amount).replace(/,/g, "");
    const match = str.match(/\d+(?:\.\d+)?/);
    const numeric = match ? Number.parseFloat(match[0]) : NaN;
    if (!Number.isFinite(numeric)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  };

  const formatDateSafely = (dateValue?: string | null) => {
    if (!dateValue || dateValue.trim() === "") return "N/A";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  const normalizePriceLabel = (value?: string) => {
    if (!value) return "N/A";
    const trimmed = value.trim();
    return trimmed === "" ? "N/A" : trimmed;
  };

  // Derived basic info fallbacks
  const launchDateText =
    (runtimeContext as any)?.launchDate || modelData.profile.joinedDate;
  const referrerText =
    (runtimeContext as any)?.referrerName || modelData.referrerName;
  const personalityText =
    (runtimeContext as any)?.personalityType || modelData.personalityType;
  const derivedCommonTerms =
    modelData.commonTerms && modelData.commonTerms.length > 0
      ? modelData.commonTerms
      : (runtimeContext as any)?.commonTerms
        ? String((runtimeContext as any).commonTerms)
            .split(/\s+/)
            .filter(Boolean)
        : [];
  const derivedCommonEmojis =
    modelData.commonEmojis && modelData.commonEmojis.length > 0
      ? modelData.commonEmojis
      : (runtimeContext as any)?.commonEmojis
        ? Array.from(String((runtimeContext as any).commonEmojis))
        : [];

  const handleToUrl = (
    platform: "instagram" | "twitter" | "tiktok",
    handle?: string
  ) => {
    const clean = (handle || "").replace(/^@/, "");
    const base =
      platform === "instagram"
        ? "https://instagram.com/"
        : platform === "twitter"
          ? "https://twitter.com/"
          : "https://tiktok.com/@";
    return `${base}${clean}`;
  };

  const socialLinks = [
    {
      platform: "Instagram",
      username: modelData.instagram ?? runtimeContext?.instagram,
      icon: Instagram,
      color: "text-pink-500",
      url: handleToUrl(
        "instagram",
        modelData.instagram ?? runtimeContext?.instagram
      ),
    },
    {
      platform: "Twitter",
      username: modelData.twitter ?? runtimeContext?.twitter,
      icon: Twitter,
      color: "text-blue-500",
      url: handleToUrl("twitter", modelData.twitter ?? runtimeContext?.twitter),
    },
    {
      platform: "TikTok",
      username: modelData.tiktok ?? runtimeContext?.tiktok,
      icon: Activity,
      color: "text-gray-900 dark:text-white",
      url: handleToUrl("tiktok", modelData.tiktok ?? runtimeContext?.tiktok),
    },
  ]; // Always show all platforms for editing

  // Derived values from runtimeContext
  // const standardRange = normalizePriceLabel(
  //   runtimeContext?.contentDetails?.boobContent || ""
  // );
  const customVideo = runtimeContext?.contentDetails?.customVideoPricing || "";
  const customCall = runtimeContext?.contentDetails?.customCallPricing || "";
  // Use raw values directly - show exactly what was typed
  const customVideoPretty = customVideo || "N/A";
  const customCallPretty = customCall || "Not offered";

  const bundlePricingSource: Record<string, string> = (() => {
    const group = (runtimeContext as any)?.pricingData?.find(
      (g: any) => g.id === "bundle-contents"
    );
    const creatorKey = (
      (runtimeContext as any)?.contentDetails?.clientModelName ||
      (runtimeContext as any)?.name ||
      modelData?.name ||
      ""
    ).trim();
    const pricing = group?.pricing?.[creatorKey] as
      | Record<string, string>
      | undefined;
    return pricing || {};
  })();

  // Helper: get a pricing group and resolved row for current creator
  const getPricingGroup = (groupId: string): {
    group?: { id: string; groupName: string; items: { id: string; name: string; description?: string }[]; pricing: Record<string, Record<string, string>> };
    row?: Record<string, string>;
  } => {
    const groups = (runtimeContext as any)?.pricingData as
      | Array<{
          id: string;
          groupName: string;
          items: { id: string; name: string; description?: string }[];
          pricing: Record<string, Record<string, string>>;
        }>
      | undefined;
    const group = groups?.find((g) => g.id === groupId);
    if (!group) return {};
    const creatorKey = (
      (runtimeContext as any)?.contentDetails?.clientModelName ||
      (runtimeContext as any)?.name ||
      modelData?.name ||
      ""
    ).trim();
    const row = (group.pricing as any)?.[creatorKey] as
      | Record<string, string>
      | undefined;
    return { group, row };
  };

  const handleEditStart = (creatorName: string, itemName: string, currentValue: string, creatorRowNumber?: number, creatorRowId?: string) => {
    setEditingCell({
      creatorName,
      itemName,
      originalValue: currentValue,
      newValue: currentValue === '—' ? '' : currentValue,
      creatorRowNumber,
      creatorRowId
    });
  };

  const handleEditCancel = () => {
    setEditingCell(null);
  };

  const handleEditValueChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, newValue: value });
    }
  };

  const handleEditSave = async () => {
    if (!editingCell || !isAdmin || updatingPricing) return;

    try {
      setUpdateStatus(null);
      setUpdatingPricing(true);
      
      console.log('💾 Updating price in Prisma DB:', {
        creatorName: editingCell.creatorName,
        itemName: editingCell.itemName,
        newPrice: editingCell.newValue
      });
      
      const response = await fetch('/api/creators-db/update-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorName: editingCell.creatorName,
          itemName: editingCell.itemName,
          newPrice: editingCell.newValue,
          rowId: editingCell.creatorRowId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update price in database');
      }

      const result = await response.json();
      console.log('✅ Successfully updated price:', result);

      setUpdateStatus({ type: 'success', message: 'Price updated successfully!' });
      setEditingCell(null);

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['model-data'] });

      // Clear success message after 3 seconds
      setTimeout(() => setUpdateStatus(null), 3000);

    } catch (error) {
      console.error('❌ Error updating price:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update price' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setUpdateStatus(null), 5000);
    } finally {
      setUpdatingPricing(false);
    }
  };

  const handleContentDetailsEditSave = async () => {
    if (!editingCell || !isAdmin || updatingContent) return;

    try {
      setUpdateStatus(null);
      setUpdatingContent(true);
      
      console.log('💾 Updating content details in Prisma DB:', {
        creatorName: editingCell.creatorName,
        fieldName: editingCell.itemName,
        newValue: editingCell.newValue
      });
      
      const response = await fetch('/api/creators-db/update-content-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorName: editingCell.creatorName,
          fieldName: editingCell.itemName,
          newValue: editingCell.newValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update content details in database');
      }

      const result = await response.json();
      console.log('✅ Successfully updated content details:', result);

      setUpdateStatus({ type: 'success', message: 'Content details updated successfully!' });
      setEditingCell(null);

      // Invalidate and refetch creator data (same as pricing updates)
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      
      // Also specifically refetch current creator query
      creatorQuery.refetch();

      // Clear success message after 3 seconds
      setTimeout(() => setUpdateStatus(null), 3000);

    } catch (error) {
      console.error('❌ Error updating content details:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update content details' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setUpdateStatus(null), 5000);
    } finally {
      setUpdatingContent(false);
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('creatorName', resolvedCreatorName || '');

      console.log('📤 Uploading profile image for:', resolvedCreatorName);

      const response = await fetch('/api/creators-db/update-profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile image');
      }

      const result = await response.json();
      console.log('✅ Profile image updated successfully:', result);

      toast.success('Profile image updated successfully!');
      
      // Invalidate all creator queries to update both tab and sidebar
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      
      // Also specifically refetch current creator query
      creatorQuery.refetch();

    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      toast.error('Failed to upload profile image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileImageClick = () => {
    if (isAdmin && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const { group: contentRangesGroup, row: contentRangesRow } =
    getPricingGroup("content-price-ranges");
  const { group: bundleGroup, row: bundleRow } = getPricingGroup(
    "bundle-contents"
  );

  // Analytics guards (render graceful fallbacks when data is missing)
  const analytics = modelData?.analytics;
  const hasRevenue =
    Number(analytics?.revenue?.thisMonth) > 0 ||
    Number(analytics?.revenue?.lastMonth) > 0;
  const hasSubscribers = Number(analytics?.subscribers?.total) > 0;
  const hasResponse = Boolean(
    analytics?.responseTime?.average && analytics.responseTime.average.trim()
  );
  const hasEngagement = Number(analytics?.engagementRate) > 0;

  return (
    <div className="min-h-full bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Hero Section */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
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
                        // Handle image error - could set state to show fallback
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
                      variant={
                        actualStatus === "active" ? "default" : "secondary"
                      }
                    >
                      {actualStatus === "active"
                        ? "🟢 Active"
                        : "🔴 Dropped"}
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
                      Joined{" "}
                      {formatDateSafely(modelData.profile.joinedDate)}
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
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
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
        </div>

        {/* Stats Grid - Gallery Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Monthly Revenue */}
          {hasRevenue ? (
            <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                        Monthly Revenue
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        +{analytics.revenue.trend}%
                      </span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                      {formatCurrency(analytics.revenue.thisMonth)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      vs {formatCurrency(analytics.revenue.lastMonth)} last
                      month
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: "85%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Revenue performance
                </p>
              </div>
            </div>
          ) : null}

          {/* Total Subscribers */}
          {hasSubscribers ? (
            <div className="relative group overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                        Total Subscribers
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        +{analytics.subscribers.trend}%
                      </span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                      {formatNumber(analytics.subscribers.total)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {formatNumber(analytics.subscribers.active)} active
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: "72%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Subscriber growth
                </p>
              </div>
            </div>
          ) : null}

          {/* Response Time */}
          {hasResponse ? (
            <div className="relative group overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                        Response Time
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        -{Math.abs(analytics.responseTime.trend)}%
                      </span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                      {analytics.responseTime.average}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      12% faster than last month
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: "65%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Response efficiency
                </p>
              </div>
            </div>
          ) : null}

          {/* Engagement Rate */}
          {hasEngagement ? (
            <div className="relative group overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                        Engagement Rate
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                        +{analytics.engagementRate}%
                      </span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                      {analytics.engagementRate}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Above industry average
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: "78%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Engagement performance
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full translate-y-10 -translate-x-10 blur-xl"></div>
              </div>

              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                    <Globe className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-pink-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                      Personal Information
                    </span>
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personality Type - Editable */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Personality Type
                      </label>
                      {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Personality Type' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingCell.newValue}
                            onChange={(e) => handleEditValueChange(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            autoFocus
                          />
                          <button
                            onClick={handleContentDetailsEditSave}
                            disabled={updatingContent}
                            className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingContent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            disabled={updatingContent}
                            className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p 
                          className={`font-semibold ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded' : ''}`}
                          onClick={() => isAdmin && setEditingCell({
                            creatorName: resolvedCreatorName || '',
                            itemName: 'Personality Type',
                            originalValue: personalityText || '',
                            newValue: personalityText || ''
                          })}
                        >
                          {personalityText}
                          {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                        </p>
                      )}
                    </div>
                    
                    {/* Referrer - NOT Editable */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Referrer
                      </label>
                      <p className="font-semibold">{referrerText}</p>
                    </div>
                    
                    {/* Restricted Terms or Emojis - Editable */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Restricted Terms or Emojis
                      </label>
                      {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Restricted Terms or Emojis' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingCell.newValue}
                            onChange={(e) => handleEditValueChange(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            autoFocus
                            placeholder="Enter restricted terms or emojis..."
                          />
                          <button
                            onClick={handleContentDetailsEditSave}
                            disabled={updatingContent}
                            className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingContent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            disabled={updatingContent}
                            className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p 
                          className={`font-semibold ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded' : ''}`}
                          onClick={() => isAdmin && setEditingCell({
                            creatorName: resolvedCreatorName || '',
                            itemName: 'Restricted Terms or Emojis',
                            originalValue: runtimeContext?.contentDetails?.restrictedTerms || '',
                            newValue: runtimeContext?.contentDetails?.restrictedTerms || ''
                          })}
                        >
                          {runtimeContext?.contentDetails?.restrictedTerms || "N/A"}
                          {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                        </p>
                      )}
                    </div>
                    
                    {/* Notes - Editable */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Notes
                      </label>
                      {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Notes' ? (
                        <div className="flex items-center gap-1">
                          <textarea
                            value={editingCell.newValue}
                            onChange={(e) => handleEditValueChange(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            autoFocus
                            rows={3}
                            placeholder="Enter notes..."
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={handleContentDetailsEditSave}
                              disabled={updatingContent}
                              className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingContent ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={updatingContent}
                              className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p 
                          className={`font-semibold ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded' : ''}`}
                          onClick={() => isAdmin && setEditingCell({
                            creatorName: resolvedCreatorName || '',
                            itemName: 'Notes',
                            originalValue: runtimeContext?.contentDetails?.notes || '',
                            newValue: runtimeContext?.contentDetails?.notes || ''
                          })}
                        >
                          {runtimeContext?.contentDetails?.notes || "N/A"}
                          {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* General client notes/requests - Full width */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      General Client Notes/Requests
                    </label>
                    {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'General Client Notes/Requests' ? (
                      <div className="flex items-start gap-1 mt-2">
                        <textarea
                          value={editingCell.newValue}
                          onChange={(e) => handleEditValueChange(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          autoFocus
                          rows={4}
                          placeholder="Enter general client notes or requests..."
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={handleContentDetailsEditSave}
                            disabled={updatingContent}
                            className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingContent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            disabled={updatingContent}
                            className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
                        onClick={() => isAdmin && setEditingCell({
                          creatorName: resolvedCreatorName || '',
                          itemName: 'General Client Notes/Requests',
                          originalValue: runtimeContext?.contentDetails?.generalClientNotes || '',
                          newValue: runtimeContext?.contentDetails?.generalClientNotes || ''
                        })}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {runtimeContext?.contentDetails?.generalClientNotes || "No notes or requests yet..."}
                          {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Common Terms
                    </label>
                    {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Common Terms' ? (
                      <div className="flex items-start gap-1">
                        <textarea
                          value={editingCell.newValue}
                          onChange={(e) => handleEditValueChange(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          autoFocus
                          rows={3}
                          placeholder="Enter common terms separated by spaces..."
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={handleContentDetailsEditSave}
                            disabled={updatingContent}
                            className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingContent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            disabled={updatingContent}
                            className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded' : ''}`}
                        onClick={() => isAdmin && setEditingCell({
                          creatorName: resolvedCreatorName || '',
                          itemName: 'Common Terms',
                          originalValue: runtimeContext?.commonTerms || '',
                          newValue: runtimeContext?.commonTerms || ''
                        })}
                      >
                        <div className="flex flex-wrap gap-2">
                          {derivedCommonTerms.map((term, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-primary/5"
                            >
                              #{term}
                            </Badge>
                          ))}
                          {derivedCommonTerms.length === 0 && (
                            <span className="text-muted-foreground text-sm">No common terms set</span>
                          )}
                          {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Common Emojis
                    </label>
                    {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Common Emojis' ? (
                      <div className="flex items-start gap-1">
                        <textarea
                          value={editingCell.newValue}
                          onChange={(e) => handleEditValueChange(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          autoFocus
                          rows={2}
                          placeholder="Enter common emojis..."
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={handleContentDetailsEditSave}
                            disabled={updatingContent}
                            className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingContent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            disabled={updatingContent}
                            className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded' : ''}`}
                        onClick={() => isAdmin && setEditingCell({
                          creatorName: resolvedCreatorName || '',
                          itemName: 'Common Emojis',
                          originalValue: runtimeContext?.commonEmojis || '',
                          newValue: runtimeContext?.commonEmojis || ''
                        })}
                      >
                        <div className="flex gap-2 text-2xl">
                          {derivedCommonEmojis.map((emoji, idx) => (
                            <span key={idx}>{emoji}</span>
                          ))}
                          {derivedCommonEmojis.length === 0 && (
                            <span className="text-muted-foreground text-sm">No common emojis set</span>
                          )}
                          {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Integrated Pricing Guide */}
            <PricingGuide creators={[{ id: resolvedCreatorName || '', name: resolvedCreatorName || '' }]} />

            {/* Core Pricing (Context7) - COMMENTED OUT FOR PRICINGGUIDE INTEGRATION */}
            {/* <div className="relative group overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-green-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-emerald-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full translate-y-10 -translate-x-10 blur-xl"></div>
              </div>

              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-400/20 dark:to-green-400/20 rounded-xl border border-emerald-200/50 dark:border-emerald-500/30">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-emerald-600 to-green-600 dark:from-pink-100 dark:via-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                      Core Pricing
                    </span>
                    {isAdmin && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full ml-2">Admin</span>}
                  </h2>
                  {updateStatus && (
                    <p className={`text-xs mt-1 ${
                      updateStatus.type === 'success' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {updateStatus.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Custom Videos
                    </span>
                    {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Custom Videos' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingCell.newValue}
                          onChange={(e) => handleEditValueChange(e.target.value)}
                          className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave();
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                        />
                        <button 
                          onClick={handleEditSave}
                          disabled={updatingPricing}
                          className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingPricing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <button 
                          onClick={handleEditCancel}
                          disabled={updatingPricing}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ) : isAdmin ? (
                      <div className="group/price relative">
                        <div className="font-semibold group-hover/price:bg-gray-50 dark:group-hover/price:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                             onClick={() => handleEditStart(resolvedCreatorName || '', 'Custom Videos', customVideoPretty)}>
                          {customVideoPretty}
                        </div>
                        <Edit2 className="absolute -top-1 -right-1 h-3 w-3 text-gray-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <span className="font-semibold">{customVideoPretty}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Custom Calls
                    </span>
                    {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Custom Calls' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingCell.newValue}
                          onChange={(e) => handleEditValueChange(e.target.value)}
                          className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave();
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                        />
                        <button 
                          onClick={handleEditSave}
                          disabled={updatingPricing}
                          className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingPricing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <button 
                          onClick={handleEditCancel}
                          disabled={updatingPricing}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ) : isAdmin ? (
                      <div className="group/price relative">
                        <div className={cn(
                          "font-semibold group-hover/price:bg-gray-50 dark:group-hover/price:bg-gray-700 px-2 py-1 rounded cursor-pointer",
                          customCallPretty === "Not offered" &&
                            "text-red-600 dark:text-red-400"
                        )}
                             onClick={() => handleEditStart(resolvedCreatorName || '', 'Custom Calls', customCallPretty)}>
                          {customCallPretty}
                        </div>
                        <Edit2 className="absolute -top-1 -right-1 h-3 w-3 text-gray-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "font-semibold",
                          customCallPretty === "Not offered" &&
                            "text-red-600 dark:text-red-400"
                        )}
                      >
                        {customCallPretty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div> */}

            {/* Collapsible: Content Price Ranges - COMMENTED OUT FOR PRICINGGUIDE INTEGRATION */}
            {/* <div className="relative group overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-blue-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
              </div>
              <div className="relative p-4">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Grid className="h-4 w-4" />
                        <span>Content Price Ranges</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="grid gap-2 text-sm">
                      {contentRangesGroup && contentRangesGroup.items?.length ? (
                        contentRangesGroup.items.map((item) => {
                          const label = item.name;
                          const raw = contentRangesRow?.[label] ?? "";
                          const value = normalizePriceLabel(raw);
                          return (
                            <div
                              key={item.id}
                              className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"
                            >
                              <span className="text-muted-foreground">{label}</span>
                              {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === label ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingCell.newValue}
                                    onChange={(e) => handleEditValueChange(e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleEditSave();
                                      if (e.key === 'Escape') handleEditCancel();
                                    }}
                                  />
                                  <button 
                                    onClick={handleEditSave}
                                    disabled={updatingPricing}
                                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingPricing ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </button>
                                  <button 
                                    onClick={handleEditCancel}
                                    disabled={updatingPricing}
                                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <XIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : isAdmin ? (
                                <div className="group/price relative">
                                  <div className="font-medium group-hover/price:bg-gray-50 dark:group-hover/price:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                                       onClick={() => handleEditStart(resolvedCreatorName || '', label, value)}>
                                    {value}
                                  </div>
                                  <Edit2 className="absolute -top-1 -right-1 h-3 w-3 text-gray-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                                </div>
                              ) : (
                                <span className="font-medium">{value}</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        // Fallback to a minimal subset from contentDetails if group data missing
                        Object.entries({
                          "Boob Content": runtimeContext?.contentDetails?.boobContent,
                          "Pussy Content": runtimeContext?.contentDetails?.pussyContent,
                          "Anal Content": runtimeContext?.contentDetails?.analContent,
                        }).map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"
                          >
                            <span className="text-muted-foreground">{label}</span>
                            {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === label ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingCell.newValue}
                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSave();
                                    if (e.key === 'Escape') handleEditCancel();
                                  }}
                                />
                                <button 
                                  onClick={handleEditSave}
                                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={handleEditCancel}
                                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ) : isAdmin ? (
                              <div className="group/price relative">
                                <div className="font-medium group-hover/price:bg-gray-50 dark:group-hover/price:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                                     onClick={() => handleEditStart(resolvedCreatorName || '', label, normalizePriceLabel((value as string) || ""))}>
                                  {normalizePriceLabel((value as string) || "")}
                                </div>
                                <Edit2 className="absolute -top-1 -right-1 h-3 w-3 text-gray-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                              </div>
                            ) : (
                              <span className="font-medium">
                                {normalizePriceLabel((value as string) || "")}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div> */}

            {/* Collapsible: Platform Limitations */}
            <div className="relative group overflow-hidden bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-yellow-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
              <div className="relative p-4">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Platform Limitations</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-2 text-sm">
                      {/* OnlyFans Wall Limitations */}
                      <div className="flex justify-between items-center">
                        <span>OnlyFans Wall Limitations</span>
                        {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'OnlyFans Wall Limitations' ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editingCell.newValue}
                              onChange={(e) => handleEditValueChange(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              autoFocus
                            >
                              <option value="">Select option...</option>
                              <option value="No nudity">No nudity</option>
                              <option value="Shows everything">Shows everything</option>
                              <option value="Topless">Topless</option>
                              <option value="Topless on VIP page">Topless on VIP page</option>
                            </select>
                            <button
                              onClick={handleContentDetailsEditSave}
                              disabled={updatingContent}
                              className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingContent ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={updatingContent}
                              className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            className={`text-amber-600 font-medium ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded' : ''}`}
                            onClick={() => isAdmin && setEditingCell({
                              creatorName: resolvedCreatorName || '',
                              itemName: 'OnlyFans Wall Limitations',
                              originalValue: runtimeContext?.contentDetails?.onlyFansWallLimitations || '',
                              newValue: runtimeContext?.contentDetails?.onlyFansWallLimitations || ''
                            })}
                          >
                            {runtimeContext?.contentDetails?.onlyFansWallLimitations || "N/A"}
                            {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                          </span>
                        )}
                      </div>

                      {/* Twitter Nudity */}
                      <div className="flex justify-between items-center">
                        <span>Twitter Nudity</span>
                        {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Twitter Nudity' ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editingCell.newValue}
                              onChange={(e) => handleEditValueChange(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              autoFocus
                            >
                              <option value="">Select option...</option>
                              <option value="SFW">SFW</option>
                              <option value="Nipples">Nipples</option>
                              <option value="Full Nude">Full Nude</option>
                              <option value="Sextapes">Sextapes</option>
                            </select>
                            <button
                              onClick={handleContentDetailsEditSave}
                              disabled={updatingContent}
                              className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingContent ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={updatingContent}
                              className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            className={`text-green-600 font-medium ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded' : ''}`}
                            onClick={() => isAdmin && setEditingCell({
                              creatorName: resolvedCreatorName || '',
                              itemName: 'Twitter Nudity',
                              originalValue: runtimeContext?.contentDetails?.twitterNudity || '',
                              newValue: runtimeContext?.contentDetails?.twitterNudity || ''
                            })}
                          >
                            {runtimeContext?.contentDetails?.twitterNudity || "N/A"}
                            {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                          </span>
                        )}
                      </div>

                      {/* Flyer Censorship Limitations */}
                      <div className="flex justify-between items-center">
                        <span>Flyer Censorship Limitations</span>
                        {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Flyer Censorship Limitations' ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editingCell.newValue}
                              onChange={(e) => handleEditValueChange(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              autoFocus
                            >
                              <option value="">Select option...</option>
                              <option value="No nudity">No nudity</option>
                              <option value="Shows everything">Shows everything</option>
                              <option value="Topless">Topless</option>
                              <option value="Topless on VIP page">Topless on VIP page</option>
                            </select>
                            <button
                              onClick={handleContentDetailsEditSave}
                              disabled={updatingContent}
                              className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingContent ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={updatingContent}
                              className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            className={`text-rose-600 font-medium ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded' : ''}`}
                            onClick={() => isAdmin && setEditingCell({
                              creatorName: resolvedCreatorName || '',
                              itemName: 'Flyer Censorship Limitations',
                              originalValue: runtimeContext?.contentDetails?.flyerCensorshipLimitations || '',
                              newValue: runtimeContext?.contentDetails?.flyerCensorshipLimitations || ''
                            })}
                          >
                            {runtimeContext?.contentDetails?.flyerCensorshipLimitations || "N/A"}
                            {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                          </span>
                        )}
                      </div>

                      {/* Open to Livestreams */}
                      <div className="flex justify-between items-center">
                        <span>Open to Livestreams</span>
                        {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Open to Livestreams' ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editingCell.newValue}
                              onChange={(e) => handleEditValueChange(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              autoFocus
                            >
                              <option value="YES">YES</option>
                              <option value="NO">NO</option>
                              <option value="MAYBE">MAYBE</option>
                            </select>
                            <button
                              onClick={handleContentDetailsEditSave}
                              disabled={updatingContent}
                              className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingContent ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={updatingContent}
                              className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <Badge
                            variant={
                              runtimeContext?.contentDetails?.openToLivestreams === "YES"
                                ? "default"
                                : "secondary"
                            }
                            className={`text-xs ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                            onClick={() => isAdmin && setEditingCell({
                              creatorName: resolvedCreatorName || '',
                              itemName: 'Open to Livestreams',
                              originalValue: runtimeContext?.contentDetails?.openToLivestreams || '',
                              newValue: runtimeContext?.contentDetails?.openToLivestreams || ''
                            })}
                          >
                            {runtimeContext?.contentDetails?.openToLivestreams || "N/A"}
                            {isAdmin && <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {/* Collapsible: Bundle Pricing - COMMENTED OUT FOR PRICINGGUIDE INTEGRATION */}
            {/* <div className="relative group overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
              <div className="relative p-4">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Bundle Contents</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="grid gap-2">
                      {bundleGroup && bundleGroup.items?.length ? (
                        bundleGroup.items.map((item) => {
                          const label = item.name;
                          const content = bundleRow?.[label] ?? "N/A";
                          const isNA = !content || content.trim() === "" || content === "N/A";
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "p-3 rounded-md border",
                                isNA ? "opacity-60 border-border/50" : "border-border/80"
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{label}</span>
                                <Badge
                                  variant={isNA ? "secondary" : "default"}
                                  className="text-xs"
                                >
                                  {isNA ? "N/A" : content}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // Fallback to known ranges if group missing
                        [
                          "$5-10 Bundle Content",
                          "$10-15 Bundle Content",
                          "$15-20 Bundle Content",
                          "$20-25 Bundle Content",
                          "$25-30 Bundle Content",
                          "$30+ Bundle Content",
                        ].map((range) => {
                          const content = (bundlePricingSource as any)[range] ?? "N/A";
                          const isNA = content === "N/A";
                          return (
                            <div
                              key={range}
                              className={cn(
                                "p-3 rounded-md border",
                                isNA ? "opacity-60 border-border/50" : "border-border/80"
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{range}</span>
                                <Badge
                                  variant={isNA ? "secondary" : "default"}
                                  className="text-xs"
                                >
                                  {content}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div> */}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Social Links */}
            <div className="relative group overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-blue-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full translate-y-8 -translate-x-8 blur-xl"></div>
              </div>

              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 rounded-xl border border-blue-200/50 dark:border-blue-500/30">
                    <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-pink-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                      Social Links
                    </span>
                  </h3>
                </div>
                <div className="space-y-3">
                  {socialLinks.map((link, idx) => {
                    const Icon = link.icon;
                    const fieldName = `Main ${link.platform}`;
                    const currentUsername = link.username || '';
                    
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 transition-colors">
                        <Icon className={cn("w-5 h-5", link.color)} />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm">{link.platform}</p>
                            {currentUsername && (
                              <a 
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === fieldName ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="text"
                                value={editingCell.newValue}
                                onChange={(e) => handleEditValueChange(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                autoFocus
                                placeholder={`Enter ${link.platform} username...`}
                              />
                              <button
                                onClick={handleContentDetailsEditSave}
                                disabled={updatingContent}
                                className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingContent ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                disabled={updatingContent}
                                className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XIcon className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className={`flex items-center gap-1 mt-1 ${isAdmin ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-1 py-0.5 rounded' : ''}`}
                              onClick={() => isAdmin && setEditingCell({
                                creatorName: resolvedCreatorName || '',
                                itemName: fieldName,
                                originalValue: currentUsername,
                                newValue: currentUsername
                              })}
                            >
                              <p className="text-xs text-muted-foreground flex-1">
                                {currentUsername || `No ${link.platform} set`}
                              </p>
                              {isAdmin && <Edit2 className="h-3 w-3 opacity-50" />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chatting Managers */}
            <div className="relative group overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-orange-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full translate-y-8 -translate-x-8 blur-xl"></div>
              </div>

              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 rounded-xl border border-orange-200/50 dark:border-orange-500/30">
                    <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-orange-600 to-amber-600 dark:from-pink-100 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                      Chatting Managers
                    </span>
                  </h3>
                </div>
                
                {/* Chatting Managers List - User-Friendly Editable */}
                <div className="space-y-3">
                  {/* Current Managers */}
                  {((runtimeContext as any)?.chattingManagers || []).map((manager: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {manager.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        {isAdmin && editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === `Manager-${idx}` ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCell.newValue}
                              onChange={(e) => handleEditValueChange(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              autoFocus
                              placeholder="Manager name..."
                            />
                            <button
                              onClick={async () => {
                                const currentManagers = [...((runtimeContext as any)?.chattingManagers || [])];
                                currentManagers[idx] = editingCell.newValue;
                                setEditingCell({
                                  creatorName: resolvedCreatorName || '',
                                  itemName: 'Chatting Managers',
                                  originalValue: currentManagers.join('\n'),
                                  newValue: currentManagers.join('\n')
                                });
                                await handleContentDetailsEditSave();
                              }}
                              disabled={updatingContent}
                              className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingContent ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={updatingContent}
                              className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{manager}</p>
                              <p className="text-xs text-muted-foreground">Manager</p>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({
                                      creatorName: resolvedCreatorName || '',
                                      itemName: `Manager-${idx}`,
                                      originalValue: manager,
                                      newValue: manager
                                    });
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-700 rounded"
                                  title="Edit manager"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const currentManagers = [...((runtimeContext as any)?.chattingManagers || [])];
                                    currentManagers.splice(idx, 1);
                                    setEditingCell({
                                      creatorName: resolvedCreatorName || '',
                                      itemName: 'Chatting Managers',
                                      originalValue: currentManagers.join('\n'),
                                      newValue: currentManagers.join('\n')
                                    });
                                    await handleContentDetailsEditSave();
                                  }}
                                  disabled={updatingContent}
                                  className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove manager"
                                >
                                  {updatingContent ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <XIcon className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add New Manager */}
                  {isAdmin && (
                    <div>
                      {editingCell && editingCell.creatorName === (resolvedCreatorName || '') && editingCell.itemName === 'Add-Manager' ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border-2 border-dashed border-primary/30">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCell.newValue}
                              onChange={(e) => handleEditValueChange(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              autoFocus
                              placeholder="Enter manager name..."
                            />
                            <button
                              onClick={async () => {
                                if (editingCell.newValue.trim()) {
                                  const currentManagers = [...((runtimeContext as any)?.chattingManagers || [])];
                                  currentManagers.push(editingCell.newValue.trim());
                                  
                                  // Call the API directly with the correct data
                                  try {
                                    setUpdateStatus(null);
                                    setUpdatingContent(true);
                                    
                                    const response = await fetch('/api/creators-db/update-content-details', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        creatorName: resolvedCreatorName || '',
                                        fieldName: 'Chatting Managers',
                                        newValue: currentManagers.join('\n')
                                      })
                                    });

                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.error || 'Failed to update');
                                    }

                                    const result = await response.json();
                                    console.log('✅ Content details updated successfully:', result);
                                    setUpdateStatus({ type: 'success', message: 'Manager added successfully!' });
                                    
                                    // Invalidate and refetch creator data
                                    queryClient.invalidateQueries({ 
                                      queryKey: ['creators'],
                                      exact: false 
                                    });
                                    await creatorQuery.refetch();
                                    
                                    // Wait a bit for the user to see the success state, then hide input
                                    setTimeout(() => {
                                      setEditingCell(null);
                                      setUpdateStatus(null);
                                    }, 1500);
                                  } catch (error) {
                                    console.error('❌ Error updating content details:', error);
                                    setUpdateStatus({ type: 'error', message: 'Failed to add manager' });
                                    setTimeout(() => setUpdateStatus(null), 3000);
                                  } finally {
                                    setUpdatingContent(false);
                                  }
                                }
                              }}
                              disabled={updatingContent || !editingCell.newValue.trim()}
                              className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingContent ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={updatingContent}
                              className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCell({
                            creatorName: resolvedCreatorName || '',
                            itemName: 'Add-Manager',
                            originalValue: '',
                            newValue: ''
                          })}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted-foreground/10 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                              Add new manager
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {((runtimeContext as any)?.chattingManagers || []).length === 0 && !isAdmin && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">No chatting managers assigned</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
