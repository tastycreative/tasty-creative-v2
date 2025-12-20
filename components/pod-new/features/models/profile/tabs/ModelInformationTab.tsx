"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ExtendedModelDetails } from "@/lib/mock-data/model-profile";
import { useCreator } from "@/hooks/useCreatorsQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import PricingGuide from "@/components/PricingGuide";
import { Skeleton } from "@/components/ui/skeleton";
// Utils
import { EditingState } from "./information/utils";
// Extracted Components
import { ModelHero } from "./information/ModelHero";
import { ModelStats } from "./information/ModelStats";
import { ModelDetails } from "./information/ModelDetails";
import { ModelSocials } from "./information/ModelSocials";
import { ModelManagers } from "./information/ModelManagers";
import { ModelLimitations } from "./information/ModelLimitations";
import { ModelSheetLinksTab } from "./ModelSheetLinksTab";
// Icons
import {
  Instagram,
  Twitter,
  Activity,
  Globe
} from "lucide-react";

interface ModelInformationTabProps {
  modelData: ExtendedModelDetails;
  creatorName?: string;
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
  const [showSheetLinks, setShowSheetLinks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  // Fetch live creator context by name using TanStack Query
  const resolvedCreatorName = creatorName || modelData?.name;
  const creatorQuery = useCreator(resolvedCreatorName);
  const dbData = creatorQuery.data;
  const dbCreator = dbData?.creators?.[0];
  const dbPricing = dbData?.pricingData || [];

  const runtimeContext = useMemo(() => {
     return dbCreator
     ? { ...dbCreator, pricingData: dbPricing }
     : undefined;
  }, [dbCreator, dbPricing]);

  // Get the actual status from database
  const actualStatus = dbCreator?.status?.toLowerCase() === 'active' ? 'active' : 'dropped';
  
  // derived from runtimeContext
  const chattingManagers = (runtimeContext as any)?.chattingManagers || [] as string[];

  // Show skeleton while loading initial creator context
  if (creatorQuery.isLoading || !runtimeContext) {
    return (
      <div className="min-h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Skeleton placeholders matching the new structure */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
             <div className="p-8"><Skeleton className="h-32 w-full" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2"><Skeleton className="h-96 w-full rounded-2xl" /></div>
             <div><Skeleton className="h-64 w-full rounded-2xl" /></div>
          </div>
        </div>
      </div>
    );
  }

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

      await response.json();
      toast.success('Profile image updated successfully!');
      
      // Invalidate all creator queries to update both tab and sidebar
      queryClient.invalidateQueries({ queryKey: ['creators'] });
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

  const handleContentDetailsEditSave = async (overrideState?: EditingState) => {
    const stateToUse = overrideState || editingCell;
    if (!stateToUse || !isAdmin || updatingContent) return;

    try {
      setUpdateStatus(null);
      setUpdatingContent(true);
      
      console.log('💾 Updating content details in Prisma DB:', {
        creatorName: stateToUse.creatorName,
        fieldName: stateToUse.itemName,
        newValue: stateToUse.newValue
      });
      
      const response = await fetch('/api/creators-db/update-content-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorName: stateToUse.creatorName,
          fieldName: stateToUse.itemName,
          newValue: stateToUse.newValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update content details in database');
      }

      await response.json();
      setUpdateStatus({ type: 'success', message: 'Content details updated successfully!' });
      setEditingCell(null);

      // Invalidate and refetch creator data
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      creatorQuery.refetch();

      setTimeout(() => setUpdateStatus(null), 3000);

    } catch (error) {
      console.error('❌ Error updating content details:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update content details' 
      });
      setTimeout(() => setUpdateStatus(null), 5000);
    } finally {
      setUpdatingContent(false);
    }
  };

  const handleEditValueChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, newValue: value });
    }
  };


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
        {
            platform: "Website",
            username: runtimeContext?.website,
            icon: Globe,
            color: "text-purple-600 dark:text-purple-400",
            url: runtimeContext?.website
        }
      ].map(link => ({
        ...link,
        // Ensure values are strings or undefined for ModelSocials
        username: link.username as string | undefined,
        url: link.url as string | undefined
      }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-full bg-white dark:bg-gray-900"
    >
      <div className="w-full p-6 space-y-6">
        <ModelHero 
            modelData={modelData}
            resolvedCreatorName={resolvedCreatorName || null}
            runtimeContext={runtimeContext}
            isAdmin={isAdmin}
            uploadingImage={uploadingImage}
            fileInputRef={fileInputRef}
            handleProfileImageUpload={handleProfileImageUpload}
            handleProfileImageClick={handleProfileImageClick}
            actualStatus={actualStatus}
            setShowSheetLinks={setShowSheetLinks}
            showSheetLinks={showSheetLinks}
            socialLinks={socialLinks}
            launchDateText={launchDateText}
            referrerText={referrerText}
        />

        {showSheetLinks ? (
            <ModelSheetLinksTab modelName={resolvedCreatorName || modelData.name} />
        ) : (
            <>
                <ModelStats 
                    analytics={analytics}
                    hasRevenue={hasRevenue}
                    hasSubscribers={hasSubscribers}
                    hasResponse={hasResponse}
                    hasEngagement={hasEngagement}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ModelDetails
                            resolvedCreatorName={resolvedCreatorName || null}
                            isAdmin={isAdmin}
                            editingCell={editingCell}
                            setEditingCell={setEditingCell}
                            handleEditValueChange={handleEditValueChange}
                            handleContentDetailsEditSave={handleContentDetailsEditSave}
                            updatingContent={updatingContent}
                            personalityText={personalityText}
                            referrerText={referrerText}
                            runtimeContext={runtimeContext}
                            derivedCommonTerms={derivedCommonTerms}
                            derivedCommonEmojis={derivedCommonEmojis}
                        />

                        {/* Integrated Pricing Guide */}
                        <PricingGuide creators={[{ id: resolvedCreatorName || '', name: resolvedCreatorName || '' }]} />

                        <ModelLimitations
                            runtimeContext={runtimeContext}
                            isAdmin={isAdmin}
                            editingCell={editingCell}
                            setEditingCell={setEditingCell}
                            handleEditValueChange={handleEditValueChange}
                            handleContentDetailsEditSave={handleContentDetailsEditSave}
                            updatingContent={updatingContent}
                            resolvedCreatorName={resolvedCreatorName || null}
                        />
                    </div>

                    <div className="space-y-6">
                         <ModelSocials 
                            socialLinks={socialLinks}
                            isAdmin={isAdmin}
                            editingCell={editingCell}
                            setEditingCell={setEditingCell}
                            handleEditValueChange={handleEditValueChange}
                            handleContentDetailsEditSave={handleContentDetailsEditSave}
                            updatingContent={updatingContent}
                            resolvedCreatorName={resolvedCreatorName || null}
                         />

                         <ModelManagers 
                            chattingManagers={chattingManagers}
                            isAdmin={isAdmin}
                            editingCell={editingCell}
                            setEditingCell={setEditingCell}
                            handleEditValueChange={handleEditValueChange}
                            handleContentDetailsEditSave={handleContentDetailsEditSave}
                            updatingContent={updatingContent}
                            resolvedCreatorName={resolvedCreatorName || null}
                         />
                    </div>
                </div>
            </>
        )}
      </div>
    </motion.div>
  );
}
