"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, Search, X, Sparkles, Edit2, Check, X as XIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePodStore } from "@/lib/stores/podStore";
import ModelsDropdownList from "@/components/ModelsDropdownList";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

// Query Keys for pricing data
export const pricingQueryKeys = {
  all: ['pricing'] as const,
  creators: (creators?: Creator[]) => [...pricingQueryKeys.all, 'creators', creators] as const,
};

// API Helper Functions
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Fetch Functions
async function fetchPricingData(creators?: Creator[]): Promise<{
  pricingData: PricingGroup[];
  creators: Creator[];
}> {
  let apiUrl = "/api/creators-db";
  if (creators && creators.length > 0) {
    const creatorNames = creators.map(c => c.name).join(',');
    apiUrl += `?creators=${encodeURIComponent(creatorNames)}`;
  }
  
  return apiRequest(apiUrl);
}

async function updatePricing(data: {
  creatorName: string;
  itemName: string;
  newPrice: string;
  rowId?: string;
}): Promise<any> {
  return apiRequest('/api/creators-db/update-pricing', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  updatePricingMutation: any;
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
  onEditValueChange,
  updatePricingMutation
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
            gridTemplateColumns: "minmax(0,1fr) 120px",
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
          {/* Empty column for alignment with price column */}
          <div className="hidden md:block"></div>
        </div>
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
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
                    gridTemplateColumns: "minmax(0,1fr) 120px",
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
                  {/* Single creator pricing column */}
                  {creators.length > 0 && (() => {
                    const creator = creators[0]; // Only use the first creator
                    const currentValue = group.pricing[creator.name]?.[item.name] || "—";
                    const isEditing = editingCell && 
                      editingCell.creatorName === creator.name && 
                      editingCell.itemName === item.name;
                    
                    return (
                      <div className="text-right">
                        {isAdmin && !isEditing ? (
                          <div className="group/price relative">
                            <div className="text-lg font-light text-gray-700 dark:text-gray-300 tabular-nums group-hover/price:bg-gray-50 dark:group-hover/price:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                                 onClick={() => onEditStart(creator.name, item.name, currentValue, creator.rowNumber, creator.row_id)}>
                              {currentValue && currentValue !== "—" && group.groupName === "Sexting Scripts" ? `$${currentValue}` : currentValue}
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
                              disabled={updatePricingMutation.isPending}
                              className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatePricingMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <button 
                              onClick={onEditCancel}
                              disabled={updatePricingMutation.isPending}
                              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-lg font-light text-gray-700 dark:text-gray-300 tabular-nums">
                            {currentValue && currentValue !== "—" && group.groupName === "Sexting Scripts" ? `$${currentValue}` : currentValue}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Hooks for TanStack Query
function usePricingData(creators?: Creator[]) {
  return useQuery({
    queryKey: pricingQueryKeys.creators(creators),
    queryFn: () => fetchPricingData(creators),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

function useUpdatePricingMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePricing,
    onSuccess: (data, variables) => {
      // Invalidate and refetch pricing data
      queryClient.invalidateQueries({ queryKey: pricingQueryKeys.all });
    },
  });
}

const PricingGuide: React.FC<PricingGuideProps> = ({ creators = [] }) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCreators, setDisplayCreators] = useState<Creator[]>([]);
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  // TanStack Query hooks
  const pricingQuery = usePricingData(creators.length > 0 ? creators : undefined);
  const updatePricingMutation = useUpdatePricingMutation();

  // Extract data from query
  const pricingData = pricingQuery.data?.pricingData || [];
  const loading = pricingQuery.isLoading;
  const error = pricingQuery.error ? 'Failed to load pricing data from database.' : null;

  // Update creators state when query data changes
  useEffect(() => {
    if (pricingQuery.data) {
      const { creators: dbCreatorData } = pricingQuery.data;
      
      if (creators.length > 0) {
        // Use assigned creators from props
        setDisplayCreators(creators);
        setAllCreators(creators);
        console.log("✅ Using assigned creators from props:", creators);
      } else if (dbCreatorData && dbCreatorData.length > 0) {
        // Convert database creators to match expected format only if no props provided
        const formattedCreators = dbCreatorData.map((creator: any, index: number) => ({
          id: creator.id,
          name: creator.name,
          rowNumber: index + 1
        }));
        setDisplayCreators(formattedCreators);
        setAllCreators(formattedCreators);
        console.log("✅ Set display creators from database:", formattedCreators);
      }
    }
  }, [pricingQuery.data, creators]);

  // Handle creator selection
  const handleCreatorSelection = (creatorName: string) => {
    setSelectedCreator(creatorName);
    if (creatorName === "all") {
      // Show only the first creator instead of 3
      setDisplayCreators(allCreators.slice(0, 1));
    } else {
      const selectedCreatorObj = allCreators.find(c => c.name === creatorName);
      setDisplayCreators(selectedCreatorObj ? [selectedCreatorObj] : []);
    }
  };

  // Get available creators for display
  const availableCreators = useMemo(() => {
    console.log("Available creators calculation:", {
      selectedCreator,
      displayCreators: displayCreators,
      allCreators: allCreators,
      pricingData: pricingData,
    });

    if (selectedCreator !== "all") {
      // Show only the selected creator
      return displayCreators;
    }

    // If showing all creators, use the existing logic
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
      return mergedCreators.slice(0, 1);
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
      .slice(0, 1);

    console.log("Final available creators:", result);
    return result;
  }, [selectedCreator, creators, displayCreators, allCreators, pricingData]);

  // Filter pricing data based on creators and search query
  const filteredPricingData = useMemo(() => {
    console.log("Filtering pricing data:", { searchQuery, pricingData, creators });
    
    // First filter by creators if provided
    let dataToFilter = pricingData;
    if (creators.length > 0) {
      const creatorNames = creators.map(c => c.name);
      dataToFilter = pricingData.map((group) => ({
        ...group,
        pricing: Object.keys(group.pricing)
          .filter(creatorName => creatorNames.includes(creatorName))
          .reduce((filteredPricing: any, creatorName: string) => {
            filteredPricing[creatorName] = group.pricing[creatorName];
            return filteredPricing;
          }, {})
      })).filter((group) => Object.keys(group.pricing).length > 0);
    }

    // Then filter by search query
    if (!searchQuery.trim()) {
      console.log("No search query, returning filtered pricing data:", dataToFilter);
      return dataToFilter;
    }

    return dataToFilter
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
  }, [searchQuery, pricingData, creators]);

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
    if (!editingCell || !isAdmin || updatePricingMutation.isPending) return;

    try {
      setUpdateStatus(null);
      
      console.log('💾 Updating price in Prisma DB:', {
        creatorName: editingCell.creatorName,
        itemName: editingCell.itemName,
        newPrice: editingCell.newValue
      });
      
      await updatePricingMutation.mutateAsync({
        creatorName: editingCell.creatorName,
        itemName: editingCell.itemName,
        newPrice: editingCell.newValue,
        rowId: editingCell.creatorRowId
      });

      console.log('✅ Price updated in database');

      setUpdateStatus({ 
        type: 'success', 
        message: `Price for "${editingCell.itemName}" updated successfully!` 
      });
      setEditingCell(null);
      
      // Clear success message after 4 seconds
      setTimeout(() => setUpdateStatus(null), 4000);
      
    } catch (error: any) {
      console.error('❌ Error updating price in database:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: error.message || 'Failed to update price. Please try again.' 
      });
      
      // Clear error message after 6 seconds
      setTimeout(() => setUpdateStatus(null), 6000);
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                      Pricing Guide
                    </h3>
                    {isAdmin && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Admin/Mod</span>}
                    {updatePricingMutation.isPending && (
                      <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating...
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transparent pricing for all creative contents
                    {loading && " (Loading latest data...)"}
                    {isAdmin && " • Click prices to edit"}
                  </p>
                  {error && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {error}
                    </div>
                  )}
                  {updateStatus && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${
                      updateStatus.type === 'success' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {updateStatus.type === 'success' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {updateStatus.message}
                    </div>
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
              
              {/* Price header (single column) */}
              {loading ? (
                <div className="text-right min-w-[120px] hidden sm:block">
                  <div className="animate-pulse">
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded ml-auto"></div>
                  </div>
                </div>
              ) : availableCreators.length > 0 ? (
                <div className="text-right min-w-[120px] hidden sm:block">
                  <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 truncate">
                    Price
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
                  updatePricingMutation={updatePricingMutation}
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
