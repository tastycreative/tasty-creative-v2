"use client";
import React, { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  FileSpreadsheet, 
  ExternalLink,
  ChevronDown,
  Search,
  Edit2,
  UserPlus,
  Sparkles,
  Target,
  BarChart3,
  Hash
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePodData } from "@/lib/stores/podStore";

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

interface ModelPodInfoTabProps {
  creatorName: string;
}

export default function ModelPodInfoTab({ creatorName }: ModelPodInfoTabProps) {
  const { data: session } = useSession();
  const { podData } = usePodData();
  const [pricingData, setPricingData] = useState<PricingGroup[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Find the creator in the pod data
  const creator = useMemo(() => {
    const foundCreator = podData?.creators?.find(c => 
      c.name.toLowerCase() === creatorName.toLowerCase()
    );
    console.log('🔍 Creator Debug:', {
      creatorName,
      podDataExists: !!podData,
      allCreators: podData?.creators?.map(c => ({ 
        name: c.name, 
        earnings: c.earnings,
        hasEarnings: !!c.earnings,
        earningsType: typeof c.earnings
      })),
      foundCreator,
      hasEarnings: !!foundCreator?.earnings,
      foundCreatorEarnings: foundCreator?.earnings,
      rawPodData: podData ? {
        teamName: podData.teamName,
        creatorsLength: podData.creators?.length || 0,
        teamMembersLength: podData.teamMembers?.length || 0
      } : null
    });
    return foundCreator;
  }, [podData?.creators, creatorName]);

  // Fetch pricing data using the same API as the main pricing page
  useEffect(() => {
    const fetchPricingData = async () => {
      if (!podData?.creators || podData.creators.length === 0) return;
      
      setLoadingPricing(true);
      try {
        const response = await fetch('/api/pricing-data');
        
        if (response.ok) {
          const data = await response.json();
          setPricingData(data.pricingData || []);
        } else {
          console.error('Failed to fetch pricing data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchPricingData();
  }, [podData?.creators]);

  // Filter pricing data for current creator
  const creatorPricing = useMemo(() => {
    if (!pricingData.length || !creator) return [];
    
    return pricingData.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const price = group.pricing[creator.name]?.[item.name];
        return price && price !== "" && price !== "0";
      })
    })).filter(group => group.items.length > 0);
  }, [pricingData, creator]);

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
    return creatorPricing.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0);
  }, [creatorPricing, searchQuery]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="space-y-6">

      {/* Key Stats Grid */}
      {podData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Team Name */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Team</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{podData.teamName}</p>
              </div>
            </div>
          </div>

          {/* Team Members Count */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Team Members</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{podData.teamMembers.length}</p>
              </div>
            </div>
          </div>

          {/* Total Creators */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 dark:bg-pink-500/20 rounded-xl">
                <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Creators</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{podData.creators.length}</p>
              </div>
            </div>
          </div>

          {/* Creator Earnings */}
          {creator && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl">
                  <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Earnings</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {creator.earnings || "No data"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        {podData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Team Members
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {podData.teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{member.name}</p>
                      {member.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other Creators */}
        {podData && podData.creators.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                Team Creators
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {podData.creators
                  .filter(c => c.name.toLowerCase() !== creatorName.toLowerCase())
                  .map((otherCreator) => (
                  <div
                    key={otherCreator.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-medium text-sm">
                      {otherCreator.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{otherCreator.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Creator #{otherCreator.id}</p>
                    </div>
                    {otherCreator.earnings && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-medium">
                        {otherCreator.earnings}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Information Section */}
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
          {loadingPricing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading pricing data...</span>
            </div>
          ) : filteredPricing.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? "No services match your search" : "No pricing information available"}
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
                      <span className="font-medium text-gray-900 dark:text-gray-100">{group.groupName}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        {group.items.length} services
                      </span>
                    </div>
                  </button>

                  {expandedGroups[group.id] && (
                    <div className="p-4 space-y-3">
                      {group.items.map((item, index) => {
                        const price = group.pricing[creator?.name || ""]?.[item.name];
                        return (
                        <div
                          key={item.id}
                          className={`p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-600 ${index !== 0 ? 'mt-3' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h5>
                                
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              {price ? (
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {price.startsWith('$') ? price : `$${price}`}
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

      {/* Quick Actions */}
      {podData?.schedulerSpreadsheetUrl && (
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
                onClick={() => window.open(podData.schedulerSpreadsheetUrl, "_blank")}
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
      )}
    </div>
  );
}