"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, Search, X, Sparkles } from "lucide-react";

interface PricingItem {
  id: string;
  name: string;
  description?: string;
}

interface PricingGroup {
  id: string;
  groupName: string;
  items: PricingItem[];
  pricing: Record<string, Record<string, string>>; // creatorName -> itemName -> price
}

interface Creator {
  id: string;
  name: string;
  specialty: string;
}

interface PricingGuideProps {
  creators?: Creator[];
}

// Retry helper function for API calls
async function fetchWithRetry(url: string, retryCount = 0): Promise<Response> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  try {
    const response = await fetch(url);

    // If we get a 429 (quota exceeded) or 500 error, retry
    if (
      (response.status === 429 || response.status === 500) &&
      retryCount < maxRetries
    ) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
      console.log(
        `API request failed (${response.status}), retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, retryCount + 1);
    }

    return response;
  } catch (error) {
    // For network errors, also retry
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(
        `Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, retryCount + 1);
    }

    throw error;
  }
}

const PricingAccordionRow: React.FC<{
  group: PricingGroup;
  creators: Creator[];
  isOpen: boolean;
  onToggle: () => void;
}> = ({ group, creators, isOpen, onToggle }) => {
  return (
    <div className="group">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-6 hover:bg-gradient-to-r hover:from-transparent hover:via-purple-500/5 hover:to-transparent transition-all duration-300"
      >
        <div
          className={`grid grid-cols-1 gap-4 items-center`}
          style={{
            gridTemplateColumns:
              creators.length > 0
                ? `minmax(0,1fr) repeat(${creators.length}, 120px)`
                : "minmax(0,1fr)",
          }}
        >
          <div className="flex items-center space-x-4">
            <div
              className={`transition-all duration-300 ${isOpen ? "rotate-180" : ""}`}
            >
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900 dark:text-gray-50 tracking-tight">
                {group.groupName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {group.items.length} contents
              </p>
            </div>
          </div>
          {/* Empty columns for alignment with price columns */}
          {Array.from({ length: creators.length }, (_, i) => (
            <div key={i} className="hidden md:block"></div>
          ))}
        </div>
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6">
          <div className="border-l-2 border-gray-100 dark:border-gray-800 ml-2 pl-10">
            {group.items.map((item, index) => (
              <div
                key={item.id}
                className={`py-4 ${index !== 0 ? "border-t border-gray-100 dark:border-gray-800" : ""}`}
              >
                {/* Item Info and Pricing */}
                <div
                  className={`grid grid-cols-1 gap-4 items-center`}
                  style={{
                    gridTemplateColumns:
                      creators.length > 0
                        ? `minmax(0,1fr) repeat(${creators.length}, 120px)`
                        : "minmax(0,1fr)",
                  }}
                >
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {creators.map((creator) => (
                    <div key={creator.id} className="text-right">
                      <div className="text-lg font-light text-gray-700 dark:text-gray-300 tabular-nums">
                        {group.pricing[creator.name]?.[item.name] || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingGuide: React.FC<PricingGuideProps> = ({ creators = [] }) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [pricingData, setPricingData] = useState<PricingGroup[]>([]);
  const [displayCreators, setDisplayCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Google Sheets only if assigned creators are available
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch both pricing data and creator data from our API route with retry
        const response = await fetchWithRetry("/api/pricing-data");

        if (!response.ok) {
          throw new Error("Failed to fetch pricing data");
        }

        const { pricingData: sheetPricingData, creators: sheetCreatorData } =
          await response.json();

        console.log("Fetched pricing data:", sheetPricingData);
        console.log("Fetched creators:", sheetCreatorData);

        if (sheetPricingData && sheetPricingData.length > 0) {
          setPricingData(sheetPricingData);
          console.log("Set pricing data:", sheetPricingData);
        }

        if (sheetCreatorData && sheetCreatorData.length > 0) {
          setDisplayCreators(sheetCreatorData);
          console.log("Set display creators:", sheetCreatorData);
        }
      } catch (err) {
        console.error("Failed to fetch data from Google Sheets:", err);
        setError("Failed to load pricing data from Google Sheets.");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch pricing data if there are assigned creators from props
    if (creators.length > 0) {
      setDisplayCreators(creators);
      loadData();
    } else {
      // If no assigned creators, clear data and stop loading
      setPricingData([]);
      setDisplayCreators([]);
      setLoading(false);
    }
  }, [creators]);

  // Get assigned creators (show all assigned creators, even if no pricing data)
  const availableCreators = useMemo(() => {
    console.log("Available creators calculation:", {
      creators: creators,
      displayCreators: displayCreators,
      pricingData: pricingData,
    });

    // If creators prop is provided (from PodComponent), always use those creators
    // Don't filter them based on pricing data - show them even if no pricing exists
    if (creators.length > 0) {
      console.log("Using creators prop:", creators);
      return creators.slice(0, 3);
    }

    // Otherwise, use creators from Google Sheet that have pricing data
    const creatorsWithPricing = new Set<string>();
    pricingData.forEach((group) => {
      console.log("Processing group:", group);
      Object.keys(group.pricing).forEach((creatorName) => {
        // Check if creator has any item pricing
        const creatorPricing = group.pricing[creatorName];
        if (creatorPricing && Object.keys(creatorPricing).length > 0) {
          creatorsWithPricing.add(creatorName);
          console.log("Added creator with pricing:", creatorName);
        }
      });
    });

    const result = displayCreators
      .filter((creator) => creatorsWithPricing.has(creator.name))
      .slice(0, 3);

    console.log("Final available creators:", result);
    return result;
  }, [creators, displayCreators, pricingData]);

  // Filter pricing data based on search query
  const filteredPricingData = useMemo(() => {
    console.log("Filtering pricing data:", { searchQuery, pricingData });
    if (!searchQuery.trim()) {
      console.log("No search query, returning all pricing data:", pricingData);
      return pricingData;
    }

    return pricingData
      .map((group) => {
        const groupMatches = group.groupName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchingItems = group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description &&
              item.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()))
        );

        if (groupMatches || matchingItems.length > 0) {
          return {
            ...group,
            items: groupMatches ? group.items : matchingItems,
          };
        }

        return null;
      })
      .filter(Boolean) as PricingGroup[];
  }, [searchQuery, pricingData]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleAllGroups = () => {
    const allOpen = Object.values(openGroups).every((isOpen) => isOpen);
    const newState = filteredPricingData.reduce(
      (acc, group) => ({
        ...acc,
        [group.id]: !allOpen,
      }),
      {}
    );
    setOpenGroups(newState);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pricing Guide
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transparent pricing for all creative contents
                    {loading && " (Loading latest data...)"}
                  </p>
                  {error && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={toggleAllGroups}
                className="md:hidden text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                {Object.values(openGroups).every((isOpen) => isOpen)
                  ? "Collapse"
                  : "Expand"}{" "}
                All
              </button>
            </div>
          </div>

          {/* Creator Headers & Search - All screens */}
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
            <div
              className={`grid grid-cols-1 gap-4 items-end`}
              style={{
                gridTemplateColumns:
                  availableCreators.length > 0
                    ? `minmax(0,1fr) repeat(${availableCreators.length}, 120px)`
                    : "minmax(0,1fr)",
              }}
            >
              {/* Search bar (spans first column) */}
              <div className="relative max-w-md w-full md:w-full col-span-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Creator headers (each in their own column) */}
              {loading
                ? // Skeleton loaders for creator headers
                  Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="text-right min-w-[120px]">
                      <div className="animate-pulse">
                        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded ml-auto"></div>
                      </div>
                    </div>
                  ))
                : availableCreators.map((creator) => (
                    <div key={creator.id} className="text-right min-w-[120px]">
                      <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 truncate">
                        {creator.name}
                      </div>
                    </div>
                  ))}
            </div>
            {/* Search results count (all screens, below search) */}
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                {filteredPricingData.length === 0
                  ? "No results found"
                  : `${filteredPricingData.reduce((total, group) => total + group.items.length, 0)} results`}
              </div>
            )}
          </div>

          {/* Debug info */}
          {console.log("Render state:", {
            loading,
            availableCreators: availableCreators.length,
            pricingData: pricingData.length,
            filteredPricingData: filteredPricingData.length,
            searchQuery,
          })}

          {/* Accordion Rows */}
          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Skeleton loaders for accordion rows */}
              {Array.from({ length: 3 }, (_, groupIndex) => (
                <div key={groupIndex} className="px-6 py-6">
                  <div className="animate-pulse">
                    {/* Group header skeleton */}
                    <div
                      className={`grid grid-cols-1 gap-4 items-center mb-4`}
                      style={{
                        gridTemplateColumns: "minmax(0,1fr) repeat(3, 120px)",
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="space-y-2">
                          <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="hidden md:block"></div>
                      <div className="hidden md:block"></div>
                      <div className="hidden md:block"></div>
                    </div>

                    {/* Items skeleton */}
                    <div className="border-l-2 border-gray-100 dark:border-gray-800 ml-2 pl-10 space-y-4">
                      {Array.from({ length: 4 }, (_, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`py-4 ${itemIndex !== 0 ? "border-t border-gray-100 dark:border-gray-800" : ""}`}
                        >
                          <div
                            className={`grid grid-cols-1 gap-4 items-center`}
                            style={{
                              gridTemplateColumns:
                                "minmax(0,1fr) repeat(3, 120px)",
                            }}
                          >
                            <div className="space-y-2">
                              <div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPricingData.length > 0 && availableCreators.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPricingData.map((group) => (
                <PricingAccordionRow
                  key={group.id}
                  group={group}
                  creators={availableCreators}
                  isOpen={openGroups[group.id] || false}
                  onToggle={() => toggleGroup(group.id)}
                />
              ))}
            </div>
          ) : availableCreators.length > 0 && pricingData.length === 0 ? (
            // Show a placeholder when we have assigned creators but no pricing data from Google Sheets
            <div className="px-6 py-16 text-center">
              <div className="text-gray-400 dark:text-gray-600">
                <div className="mx-auto h-12 w-12 mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-lg">—</span>
                </div>
                <p className="text-lg">Pricing data unavailable</p>
                <p className="text-sm mt-1">
                  No pricing information found for:{" "}
                  {availableCreators.map((c) => c.name).join(", ")}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="text-gray-400 dark:text-gray-600">
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                {searchQuery ? (
                  <>
                    <p className="text-lg">No matching contents found</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg">No pricing data available</p>
                    <p className="text-sm mt-1">
                      Please check back later or contact support
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Prices shown are based on Client Basic Information and Notes on
            Google Sheets final pricing
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingGuide;
