"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, Search, X, Sparkles, Edit2, Check, X as XIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePodStore } from "@/lib/stores/podStore";

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
  rowNumber?: number; // Add row number for efficient updates
  row_id?: string; // Add row_id from ClientModel
}

interface PricingGuideProps {
  creators?: Creator[];
}

interface EditingState {
  creatorName: string;
  itemName: string;
  originalValue: string;
  newValue: string;
  creatorRowNumber?: number; // Add row number for efficient updates
  creatorRowId?: string; // Add row_id from ClientModel
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
  isAdmin: boolean;
  editingCell: EditingState | null;
  onEditStart: (creatorName: string, itemName: string, currentValue: string, creatorRowNumber?: number, creatorRowId?: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
}> = ({ 
  group, 
  creators, 
  isOpen, 
  onToggle, 
  isAdmin, 
  editingCell, 
  onEditStart, 
  onEditSave, 
  onEditCancel, 
  onEditValueChange 
}) => {
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
                  {creators.map((creator) => {
                    const currentValue = group.pricing[creator.name]?.[item.name] || "—";
                    const isEditing = editingCell && 
                      editingCell.creatorName === creator.name && 
                      editingCell.itemName === item.name;
                    
                    return (
                      <div key={creator.id} className="text-right">
                        {isAdmin && !isEditing ? (
                          <div className="group/price relative">
                            <div className="text-lg font-light text-gray-700 dark:text-gray-300 tabular-nums group-hover/price:bg-gray-50 dark:group-hover/price:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                                 onClick={() => onEditStart(creator.name, item.name, currentValue, creator.rowNumber, creator.row_id)}>
                              {currentValue}
                            </div>
                            <Edit2 className="absolute -top-1 -right-1 h-3 w-3 text-gray-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                          </div>
                        ) : isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingCell.newValue}
                              onChange={(e) => onEditValueChange(e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') onEditSave();
                                if (e.key === 'Escape') onEditCancel();
                              }}
                            />
                            <button 
                              onClick={onEditSave}
                              className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={onEditCancel}
                              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-lg font-light text-gray-700 dark:text-gray-300 tabular-nums">
                            {currentValue}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
  const { data: session } = useSession();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [pricingData, setPricingData] = useState<PricingGroup[]>([]);
  const [displayCreators, setDisplayCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const isAdmin = session?.user?.role === 'ADMIN';

  // Fetch data from Prisma DB only if assigned creators are available
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build the API URL with creators filter if provided
        let apiUrl = "/api/creators-db";
        if (creators.length > 0) {
          const creatorNames = creators.map(c => c.name).join(',');
          apiUrl += `?creators=${encodeURIComponent(creatorNames)}`;
          console.log('🎯 PricingGuide fetching specific creators from Prisma DB:', creatorNames);
        } else {
          console.log('🎯 PricingGuide fetching all creators from Prisma DB');
        }
        
        const response = await fetchWithRetry(apiUrl);

        if (!response.ok) {
          throw new Error("Failed to fetch pricing data from database");
        }

        const { pricingData: dbPricingData, creators: dbCreatorData } =
          await response.json();

        console.log("📊 Fetched pricing data from Prisma DB:", dbPricingData);
        console.log("👥 Fetched creators from Prisma DB:", dbCreatorData);

        if (dbPricingData && dbPricingData.length > 0) {
          // Filter pricing data to only include data for assigned creators if provided
          let filteredPricingData = dbPricingData;
          if (creators.length > 0) {
            const creatorNames = creators.map(c => c.name);
            filteredPricingData = dbPricingData.map((group: any) => ({
              ...group,
              pricing: Object.keys(group.pricing)
                .filter(creatorName => creatorNames.includes(creatorName))
                .reduce((filteredPricing: any, creatorName: string) => {
                  filteredPricing[creatorName] = group.pricing[creatorName];
                  return filteredPricing;
                }, {})
            })).filter((group: any) => Object.keys(group.pricing).length > 0);
          }
          
          setPricingData(filteredPricingData);
          console.log("✅ Set filtered pricing data:", filteredPricingData);
        }

        if (creators.length > 0) {
          // Use assigned creators from props
          setDisplayCreators(creators);
          console.log("✅ Using assigned creators from props:", creators);
        } else if (dbCreatorData && dbCreatorData.length > 0) {
          // Convert database creators to match expected format only if no props provided
          const formattedCreators = dbCreatorData.map((creator: any, index: number) => ({
            id: creator.id,
            name: creator.name,
            rowNumber: index + 1
          }));
          setDisplayCreators(formattedCreators);
          console.log("✅ Set display creators from database:", formattedCreators);
        }
      } catch (err) {
        console.error("❌ Failed to fetch data from Prisma database:", err);
        setError("Failed to load pricing data from database.");
      } finally {
        setLoading(false);
      }
    };

    // Always load data, but filter based on assigned creators
    loadData();
  }, [creators]);

  // Get assigned creators (show all assigned creators, even if no pricing data)
  const availableCreators = useMemo(() => {
    console.log("Available creators calculation:", {
      creators: creators,
      displayCreators: displayCreators,
      pricingData: pricingData,
    });

    // If creators prop is provided (from PodComponent), merge with displayCreators to get row numbers
    if (creators.length > 0) {
      console.log("Using creators prop:", creators);
      
      // Create a map of displayCreators by name to get their row numbers
      const displayCreatorMap = new Map();
      displayCreators.forEach(creator => {
        displayCreatorMap.set(creator.name.toLowerCase(), creator);
      });
      
      // Merge prop creators with displayCreators to get row numbers
      const mergedCreators = creators.map(creator => {
        const displayCreator = displayCreatorMap.get(creator.name.toLowerCase());
        return {
          ...creator,
          rowNumber: displayCreator?.rowNumber || creator.rowNumber
        };
      });
      
      console.log("Merged creators with row numbers:", mergedCreators);
      return mergedCreators.slice(0, 3);
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

  // Debug logging after all variables are declared
  useEffect(() => {
    console.log("🔍 PricingGuide render state:", {
      loading,
      availableCreatorsLength: availableCreators.length,
      pricingDataLength: pricingData.length,
      filteredPricingDataLength: filteredPricingData.length,
      searchQuery,
    });
  }, [loading, availableCreators.length, pricingData.length, filteredPricingData.length, searchQuery]);

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
    if (!editingCell || !isAdmin) return;

    try {
      setUpdateStatus(null);
      
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
      console.log('✅ Price updated in database:', result);

      // Update local state
      setPricingData(prevData => 
        prevData.map(group => ({
          ...group,
          pricing: {
            ...group.pricing,
            [editingCell.creatorName]: {
              ...group.pricing[editingCell.creatorName],
              [editingCell.itemName]: editingCell.newValue || '—'
            }
          }
        }))
      );

      setUpdateStatus({ type: 'success', message: 'Price updated in database successfully!' });
      setEditingCell(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUpdateStatus(null), 3000);
      
    } catch (error) {
      console.error('❌ Error updating price in database:', error);
      setUpdateStatus({ type: 'error', message: 'Failed to update price in database. Please try again.' });
      
      // Clear error message after 5 seconds
      setTimeout(() => setUpdateStatus(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto">
        {/* Main Content Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          {/* Header */}
          <div className="relative p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                  <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Pricing Guide {isAdmin && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full ml-2">Admin</span>}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transparent pricing for all creative contents
                    {loading && " (Loading latest data...)"}
                    {isAdmin && " • Click prices to edit"}
                  </p>
                  {error && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {error}
                    </p>
                  )}
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
          <div className="relative px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-end justify-between gap-4">
              {/* Search bar */}
              <div className="relative max-w-md w-full flex-1">
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
              {/* Creator header (single column) */}
              {loading ? (
                <div className="text-right min-w-[120px] hidden sm:block">
                  <div className="animate-pulse">
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded ml-auto"></div>
                  </div>
                </div>
              ) : availableCreators.length > 0 ? (
                <div className="text-right min-w-[120px] hidden sm:block">
                  <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 truncate">
                    {availableCreators[0]?.name || "Price"}
                  </div>
                </div>
              ) : null}
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

          {/* Debug info - moved to useEffect to avoid rendering issues */}

          {/* Accordion Rows */}
          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Skeleton loaders for accordion rows */}
              {Array.from({ length: 1 }, (_, groupIndex) => (
                <div key={groupIndex} className="px-6 py-6">
                  <div className="animate-pulse">
                    {/* Group header skeleton */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="space-y-2">
                          <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="hidden sm:block h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>

                    {/* Items skeleton */}
                    <div className="border-l-2 border-gray-100 dark:border-gray-800 ml-2 pl-10 space-y-4">
                      {Array.from({ length: 4 }, (_, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`py-4 ${itemIndex !== 0 ? "border-t border-gray-100 dark:border-gray-800" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                  isAdmin={isAdmin}
                  editingCell={editingCell}
                  onEditStart={handleEditStart}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  onEditValueChange={handleEditValueChange}
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
            Prices shown are based on ContentDetails stored in the database
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingGuide;
