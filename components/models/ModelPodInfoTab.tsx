"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  ChevronDown,
  Search,
  UserPlus,
  Sparkles,
  Target,
  BarChart3,
} from "lucide-react";
import { usePodData } from "@/lib/stores/podStore";
import { useCreatorsDB } from "@/lib/hooks/useCreatorsDB";

interface PricingItem {
  id: string;
  name: string;
  description?: string;
}

interface ModelPodInfoTabProps {
  creatorName: string;
}

export default function ModelPodInfoTab({ creatorName }: ModelPodInfoTabProps) {
  const { podData } = usePodData();
  const {
    creators: dbCreators,
    pricingData: dbPricingData,
    loading: loadingCreators,
  } = useCreatorsDB(creatorName, podData?.creators);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  // Format guaranteed amount with commas
  const formatGuaranteed = (amount: string | undefined): string => {
    if (!amount || amount === "No data") return "No data";

    // Remove any existing formatting and convert to number
    const cleanAmount = amount.toString().replace(/[,$]/g, "");
    const numAmount = parseFloat(cleanAmount);

    if (isNaN(numAmount)) return amount;

    // Format with commas and add dollar sign if not present
    const formatted = numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return amount.startsWith("$") ? `$${formatted}` : `$${formatted}`;
  };

  // Find the creator in the database creators
  const creator = useMemo(() => {
    const foundCreator = dbCreators?.find(
      (c) => c.name.toLowerCase() === creatorName.toLowerCase()
    );
    console.log("🔍 Creator Debug (DB):", {
      creatorName,
      dbCreatorsCount: dbCreators?.length || 0,
      allDbCreators: dbCreators?.map((c) => ({
        name: c.name,
        guaranteed: c.guaranteed,
        status: c.status,
        hasGuaranteed: !!c.guaranteed,
        guaranteedType: typeof c.guaranteed,
      })),
      foundCreator,
      hasGuaranteed: !!foundCreator?.guaranteed,
      foundCreatorGuaranteed: foundCreator?.guaranteed,
      contentDetails: foundCreator?.contentDetails,
    });
    return foundCreator;
  }, [dbCreators, creatorName]);

  // Filter pricing data for current creator from database
  const creatorPricing = useMemo(() => {
    if (!dbPricingData.length || !creator) return [];

    return dbPricingData
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const price = group.pricing[creator.name]?.[item.name];
          return price && price !== "" && price !== "0";
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [dbPricingData, creator]);

  // Auto-expand the first pricing group when data loads
  useEffect(() => {
    if (creatorPricing.length > 0 && Object.keys(expandedGroups).length === 0) {
      setExpandedGroups({ [creatorPricing[0].id]: true });
    }
  }, [creatorPricing, expandedGroups]);

  // Search functionality
  const filteredPricing = useMemo(() => {
    if (!searchQuery.trim()) return creatorPricing;

    const query = searchQuery.toLowerCase();
    return creatorPricing
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [creatorPricing, searchQuery]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const SkeletonBox = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}></div>
  );

  const AboutSectionSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-7 w-7 rounded-full bg-white/20" />
          <SkeletonBox className="h-8 w-48 bg-white/20" />
        </div>
      </div>
      <div className="p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-8 w-8 rounded-lg" />
            <SkeletonBox className="h-6 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <SkeletonBox className="h-3 w-12 mb-2" />
                <SkeletonBox className="h-5 w-20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <SkeletonBox className="h-3 w-16 mb-2" />
                <SkeletonBox className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg p-4 border">
              <SkeletonBox className="h-3 w-20 mb-2" />
              <SkeletonBox className="h-5 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl p-6 border">
              <div className="flex items-center gap-3 mb-3">
                <SkeletonBox className="h-10 w-10 rounded-lg" />
                <SkeletonBox className="h-6 w-24" />
              </div>
              <SkeletonBox className="h-8 w-20 mb-1" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PricingSectionSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-5 w-5 rounded" />
            <SkeletonBox className="h-6 w-32" />
          </div>
          <SkeletonBox className="h-10 w-48 rounded-lg" />
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-4 w-4 rounded" />
                    <SkeletonBox className="h-5 w-24" />
                    <SkeletonBox className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const QuickActionsSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-5 w-5 rounded" />
          <SkeletonBox className="h-6 w-32" />
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border">
              <div className="flex items-center gap-3">
                <SkeletonBox className="h-9 w-9 rounded-lg" />
                <div>
                  <SkeletonBox className="h-5 w-20 mb-1" />
                  <SkeletonBox className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* About Section */}
      {loadingCreators ? (
        <AboutSectionSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="h-7 w-7" />
              About {creator?.name || creatorName}
            </h3>
          </div>

          <div className="p-8 space-y-8">
            {/* Personal Details Section */}
            {creator?.modelDetails ? (
              <>
                {(creator.modelDetails.age ||
              creator.modelDetails.birthday ||
              creator.modelDetails.height ||
              creator.modelDetails.weight ||
              creator.modelDetails.clothing_size ||
              creator.modelDetails.ethnicity ||
              creator.modelDetails.birthplace ||
              creator.modelDetails.current_city ||
              creator.modelDetails.personality ||
              creator.modelDetails.interests ||
              creator.modelDetails.background) && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <span>👤</span>
                  </div>
                  Personal Details
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {creator.modelDetails.age && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Age
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.age}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.birthday && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Birthday
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.birthday}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.height && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Height
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.height}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.weight && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Weight
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.weight}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.clothing_size && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Size
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.clothing_size}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.ethnicity && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Ethnicity
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.ethnicity}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.birthplace && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Birthplace
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.birthplace}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.current_city && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Location
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.current_city}
                      </p>
                    </div>
                  )}
                </div>

                {/* Personality, Interests, Background */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {creator.modelDetails.personality && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Personality
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.personality}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.interests && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Interests
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.interests}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.background && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Background
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {creator.modelDetails.background}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preferences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creator.modelDetails.favorite_emojis && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Favorite Emojis
                  </p>
                  <p className="text-lg">
                    {creator.modelDetails.favorite_emojis}
                  </p>
                </div>
              )}

              {creator.modelDetails.keywords && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Keywords
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {creator.modelDetails.keywords}
                  </p>
                </div>
              )}

              {creator.modelDetails.favorite_colors && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Favorite Colors
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {creator.modelDetails.favorite_colors}
                  </p>
                </div>
              )}

              {creator.modelDetails.timezone && (
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Time Zone
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {creator.modelDetails.timezone}
                  </p>
                </div>
              )}
            </div>

            {/* Pricing Cards */}
            {(creator.modelDetails.custom_min_price ||
              creator.modelDetails.video_call_min_price ||
              creator.modelDetails.amazon_wishlist) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creator.modelDetails.custom_min_price && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">💵</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Custom Content
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {creator.modelDetails.custom_min_price}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum price
                    </p>
                  </div>
                )}

                {creator.modelDetails.video_call_min_price && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">📞</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Video Calls
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {creator.modelDetails.video_call_min_price}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum price
                    </p>
                  </div>
                )}

                {creator.modelDetails.amazon_wishlist && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">🎁</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Wishlist
                      </h4>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 break-all">
                      {creator.modelDetails.amazon_wishlist}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Content & Preferences Section */}
            {(creator.modelDetails.content_offered ||
              creator.modelDetails.limitations) && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">
                  Content & Guidelines
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {creator.modelDetails.content_offered && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🔞</span>
                        </div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Content Offered
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {creator.modelDetails.content_offered}
                      </p>
                    </div>
                  )}

                  {creator.modelDetails.limitations && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-lg">⚠️</span>
                        </div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Guidelines
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {creator.modelDetails.limitations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Restrictions Section */}
            {(creator.modelDetails.mm_restrictions ||
              creator.modelDetails.wall_restrictions ||
              creator.modelDetails.verbiage_restrictions) && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <span>📌</span>
                  </div>
                  Communication Preferences
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {creator.modelDetails.mm_restrictions && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        MM Restrictions
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {creator.modelDetails.mm_restrictions}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.wall_restrictions && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        Wall Restrictions
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {creator.modelDetails.wall_restrictions}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.verbiage_restrictions && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        Language to Avoid
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {creator.modelDetails.verbiage_restrictions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extras Section */}
            {(creator.modelDetails.clothing_items ||
              creator.modelDetails.oftv_channel_interest) && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span>🧺</span>
                  </div>
                  Additional Services
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {creator.modelDetails.clothing_items && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        <span>👙</span> Clothing Items Available
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {creator.modelDetails.clothing_items}
                      </p>
                    </div>
                  )}
                  {creator.modelDetails.oftv_channel_interest && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        <span>📺</span> OFTV Channel
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {creator.modelDetails.oftv_channel_interest}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No detailed information available</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Creator details will appear here when available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Information Section */}
      {loadingCreators ? (
        <PricingSectionSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              Pricing Guide
            </h3>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:focus:border-green-400 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {loadingCreators ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Loading pricing data...
              </span>
            </div>
          ) : filteredPricing.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? "No services match your search"
                  : "No pricing information available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPricing.map((group) => (
                <div
                  key={group.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${
                          expandedGroups[group.id] ? "rotate-180" : ""
                        }`}
                      />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {group.groupName}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        {group.items.length} services
                      </span>
                    </div>
                  </button>

                  {expandedGroups[group.id] && (
                    <div className="p-4 space-y-3">
                      {group.items.map((item, index) => {
                        const price =
                          group.pricing[creator?.name || ""]?.[item.name];
                        return (
                          <div
                            key={item.id}
                            className={`p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-600 ${index !== 0 ? "mt-3" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                    {item.name}
                                  </h5>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 text-right">
                                {price ? (
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {price.startsWith("$")
                                      ? price
                                      : `$${price}`}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    Not Available
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Quick Actions */}
      {loadingCreators ? (
        <QuickActionsSkeleton />
      ) : podData?.schedulerSpreadsheetUrl ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Quick Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() =>
                  window.open(podData.schedulerSpreadsheetUrl, "_blank")
                }
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-medium"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Scheduler</p>
                  <p className="text-xs text-indigo-100">Manage content</p>
                </div>
              </button>

              <button
                onClick={() => window.open(`/apps/pod/pricing`, "_blank")}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-medium"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Full Pricing</p>
                  <p className="text-xs text-green-100">View all rates</p>
                </div>
              </button>

              <button
                onClick={() => window.open(`/apps/pod/dashboard`, "_blank")}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-medium"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Dashboard</p>
                  <p className="text-xs text-pink-100">Main POD view</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
