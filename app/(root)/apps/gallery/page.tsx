"use client";

import React, { useState, useEffect, useRef } from "react";

// Global cache to persist loaded image states across component re-mounts
const imageLoadCache = new Map<string, boolean>();
import {
  Search,
  Filter,
  Send,
  Copy,
  Eye,
  DollarSign,
  TrendingUp,
  Heart,
  Star,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  ExternalLink,
  Link,
  Calendar,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
// Removed Google Sheets permissions - now using Supabase database
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const PTRDashboard = dynamic(() => import("@/components/ptr-dashboard"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  ),
});

// Error Boundary Component for robust error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Gallery Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
              Something went wrong
            </div>
            <div className="text-red-500 dark:text-red-300 text-sm mb-4">
              Please refresh the page to try again
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Refresh Page
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

interface GalleryItem {
  id: string;
  sheetRowId: string;
  title: string;
  captionText: string;
  price: number;
  totalBuys: number;
  totalRevenue: number;
  category: string;
  dateAdded: string;
  contentStyle?: string;
  messageType?: string;
  gifUrl?: string;
  previewUrl?: string;
  contentType: "FAVORITE" | "RELEASE" | "LIBRARY";
  usageCount?: number;
  lastUsed?: Date | null;
  notes?: string;
  isFavorite?: boolean;
  isRelease?: boolean;
  isPTR?: boolean;
  creatorName?: string;
  tableName?: string; // Table name from Supabase (e.g., 'gs_dakota_free')
  // New fields from actual sheet structure
  scheduleTab?: string;
  type?: string; // MM or Post
  timePST?: string;
  paywallContent?: string;
  captionStyle?: string;
  outcome?: string; // Good, Bad, etc.
  scheduledDate?: string;
  // PTR rotation fields
  rotationStatus?: "Active" | "Resting" | "Ready";
  daysSinceLastSent?: number | null;
  isReadyForRotation?: boolean;
  performanceHistory?: Array<{
    sentDate: string;
    result?: "good" | "bad" | "pending";
  }>;
}

const GalleryContent = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "releases">(
    "all"
  );
  const [selectedTable, setSelectedTable] = useState("gs_dakota_free"); // New state for table selection
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [tableBreakdown, setTableBreakdown] = useState<Record<string, number>>(
    {}
  );
  const [sortBy, setSortBy] = useState("revenue");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [revenueFilter, setRevenueFilter] = useState("");
  const [messageTypeFilter, setMessageTypeFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [captionStyleFilter, setCaptionStyleFilter] = useState("all");
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([]);
  const [creators, setCreators] = useState<
    { name: string; count: number }[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // State for real-time counts and loading states
  const [breakdown, setBreakdown] = useState<{
    favorites: number;
    releases: number;
    library: number;
  }>({ favorites: 0, releases: 0, library: 0 });
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(
    new Set()
  );

  // Cache for API responses - start with expired cache to force initial fetch
  const [cachedData, setCachedData] = useState<{
    gallery: GalleryItem[];
    favorites: GalleryItem[];
    releases: GalleryItem[];
    lastFetch: {
      gallery: number;
      favorites: number;
      releases: number;
    };
  }>({
    gallery: [],
    favorites: [],
    releases: [],
    lastFetch: {
      gallery: 0, // Expired timestamp to force fetch
      favorites: 0,
      releases: 0,
    },
  });

  // Track ongoing fetch to prevent duplicate calls
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedInitialRef = useRef(false);
  const requestIdRef = useRef(0);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Helper function to check if cache is valid
  const isCacheValid = (lastFetch: number) => {
    return Date.now() - lastFetch < CACHE_TTL;
  };

  // Helper function to fetch gallery data from database (all tables by default)
  const fetchGalleryData = async (
    signal: AbortSignal,
    params: URLSearchParams
  ) => {
    // Use 'all' mode by default to fetch from all tables
    params.set("mode", "all");
    const url = `/api/gallery-db?${params.toString()}`;
    const response = await fetch(url, {
      signal,
    });
    if (!response.ok) throw new Error("Failed to fetch gallery data");
    return await response.json();
  };

  // Helper function to fetch favorites data (now using Supabase)
  const fetchFavoritesData = async (signal: AbortSignal) => {
    // Use gallery-db API with favorites type filter, add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await fetch(`/api/gallery-db?mode=all&type=favorites&t=${timestamp}`, {
      signal,
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    if (!response.ok) throw new Error("Failed to fetch favorites data");
    return await response.json();
  };

  // Helper function to fetch releases data (PTR)
  const fetchReleasesData = async (signal: AbortSignal) => {
    // Use all tables mode with releases filter
    const response = await fetch(`/api/gallery-db?type=releases&mode=all`, {
      signal,
    });
    if (!response.ok) throw new Error("Failed to fetch releases data");
    return await response.json();
  };

  // Comprehensive data fetching function
  const fetchAllData = async (signal: AbortSignal, forceRefresh = false) => {
    const startTime = performance.now();
    const now = Date.now();

    // Determine what needs to be fetched
    const needsGallery =
      forceRefresh || !isCacheValid(cachedData.lastFetch.gallery);
    const needsFavorites =
      forceRefresh || !isCacheValid(cachedData.lastFetch.favorites);
    const needsReleases =
      forceRefresh || !isCacheValid(cachedData.lastFetch.releases);

    

    // Build params for gallery fetch
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);
    if (creatorFilter && creatorFilter !== "all")
      params.set("creator", creatorFilter);
    if (priceRange.min) params.set("minPrice", priceRange.min);
    if (priceRange.max) params.set("maxPrice", priceRange.max);
    if (revenueFilter) params.set("minRevenue", revenueFilter);
    if (messageTypeFilter && messageTypeFilter !== "all")
      params.set("messageType", messageTypeFilter);
    if (outcomeFilter && outcomeFilter !== "all")
      params.set("outcome", outcomeFilter);
    if (captionStyleFilter && captionStyleFilter !== "all")
      params.set("captionStyle", captionStyleFilter);

    // Fetch all needed data in parallel
    const fetchPromises: Promise<{ type: string; data: any }>[] = [];

    if (needsGallery) {
      fetchPromises.push(
        fetchGalleryData(signal, params).then((data) => ({
          type: "gallery",
          data,
        }))
      );
    }

    if (needsFavorites) {
      fetchPromises.push(
        fetchFavoritesData(signal).then((data) => ({ type: "favorites", data }))
      );
    }

    if (needsReleases) {
      // Use gallery API with releases filter to get PTR items
      fetchPromises.push(
        fetchReleasesData(signal).then((data) => ({ type: "releases", data }))
      );
    }

    // Execute all fetches in parallel
    const results = await Promise.allSettled(fetchPromises);

    // Process results and update cache
    const newCachedData = { ...cachedData };

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const { type, data } = result.value;
        switch (type) {
          case "gallery":
            console.log("🔄 Processing gallery API response:", {
              hasData: !!data,
              hasItems: !!data?.items,
              itemsLength: data?.items?.length || 0,
              apiDataStructure: Object.keys(data || {}),
              sampleItem: data?.items?.[0] || null,
            });
            newCachedData.gallery = data.items || [];
            newCachedData.lastFetch.gallery = now;
            // Update breakdown from gallery API
            if (data.breakdown) {
              setBreakdown(data.breakdown);
            }
            if (data.categories) {
              setCategories(data.categories);
            }
            if (data.creators) {
              setCreators(data.creators);
            }
            // Update available tables from response
            if (data.availableTables) {
              setAvailableTables(data.availableTables);
            }
            // Update table breakdown if available
            if (data.tableBreakdown) {
              setTableBreakdown(data.tableBreakdown);
            }
            break;
          case "favorites":
            newCachedData.favorites = data.items || [];
            newCachedData.lastFetch.favorites = now;
            break;
          case "releases":
            // Use gallery API data directly (already processed PTR items)
            newCachedData.releases = data.items || [];
            newCachedData.lastFetch.releases = now;
            break;
        }
      } else {
        console.error(
          `Failed to fetch ${fetchPromises[index]} data:`,
          result.reason
        );
      }
    });

    setCachedData(newCachedData);

    // Update breakdown with actual cached counts
    setBreakdown((prev) => ({
      ...prev,
      favorites: newCachedData.favorites.length,
      releases: newCachedData.releases.length,
      library: newCachedData.gallery.length,
    }));

    const endTime = performance.now();
    console.log(
      `🚀 Data fetch completed in ${Math.round(endTime - startTime)}ms`
    );

    return newCachedData;
  };

  // Function to invalidate cache and force refresh
  const invalidateCache = (type?: "favorites" | "releases" | "gallery" | "all") => {
    setCachedData((prev) => ({
      ...prev,
      lastFetch: {
        ...prev.lastFetch,
        favorites:
          type === "favorites" || type === "all" ? 0 : prev.lastFetch.favorites,
        releases:
          type === "releases" || type === "all" ? 0 : prev.lastFetch.releases,
        gallery: type === "gallery" || type === "all" ? 0 : prev.lastFetch.gallery,
      },
    }));
  };

  // Single effect to handle ALL state changes
  useEffect(() => {
    const fetchData = async () => {
      // Prevent duplicate calls - if already loading, skip
      if (loadingRef.current) {
        return;
      }

      // Increment request ID for this fetch
      const currentRequestId = ++requestIdRef.current;

      // Abort any previous request only when starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      loadingRef.current = true;
      setLoading(true);

      try {
        // Fetch all data and update cache (force refresh due to filter change)
        const updatedCache = await fetchAllData(abortController.signal, true);

        // Now determine what to display based on active tab
        let itemsToDisplay: GalleryItem[] = [];
        let categoriesToDisplay: { name: string; count: number }[] = [];

        switch (activeTab) {
          case "favorites":
            itemsToDisplay = updatedCache.favorites;
            categoriesToDisplay = []; // Favorites don't have category filtering
            console.log("Displaying favorite items:", itemsToDisplay.length);
            break;
          case "releases":
            itemsToDisplay = updatedCache.releases;
            categoriesToDisplay = []; // Releases might not need category filtering
            console.log("Displaying release items:", itemsToDisplay.length);
            break;
          default: // "all"
            itemsToDisplay = updatedCache.gallery;
            // Apply filters to gallery items
            if (categoryFilter && categoryFilter !== "all") {
              itemsToDisplay = itemsToDisplay.filter(
                (item) =>
                  item.category.toLowerCase() === categoryFilter.toLowerCase()
              );
            }
            if (creatorFilter && creatorFilter !== "all") {
              itemsToDisplay = itemsToDisplay.filter(
                (item) =>
                  item.creatorName &&
                  item.creatorName
                    .toLowerCase()
                    .includes(creatorFilter.toLowerCase())
              );
            }
            if (priceRange.min) {
              const min = parseFloat(priceRange.min);
              itemsToDisplay = itemsToDisplay.filter(
                (item) => item.price >= min
              );
            }
            if (priceRange.max) {
              const max = parseFloat(priceRange.max);
              itemsToDisplay = itemsToDisplay.filter(
                (item) => item.price <= max
              );
            }
            if (revenueFilter) {
              const min = parseFloat(revenueFilter);
              itemsToDisplay = itemsToDisplay.filter(
                (item) => item.totalRevenue >= min
              );
            }
            if (searchQuery) {
              itemsToDisplay = itemsToDisplay.filter(
                (item) =>
                  item.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  item.captionText
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  item.category
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  (item.contentStyle || "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
              );
            }
            // Categories are already set from the gallery API response
            break;
        }

        // Update display
        console.log("🎯 Setting gallery items:", {
          itemsToDisplayLength: itemsToDisplay.length,
          activeTab,
          sampleItems: itemsToDisplay.slice(0, 2),
          cachedGalleryLength: updatedCache.gallery.length,
        });
        setGalleryItems(itemsToDisplay);
        setCategories(categoriesToDisplay);

        console.log("Gallery loaded:", {
          activeTab,
          displayedItems: itemsToDisplay.length,
          cachedBreakdown: {
            favorites: updatedCache.favorites.length,
            releases: updatedCache.releases.length,
            library: updatedCache.gallery.length,
          },
        });

        // Mark initial fetch as complete
        hasFetchedInitialRef.current = true;
      } catch (error: any) {
        // Ignore abort errors
        if (error?.name === "AbortError") {
          console.log("Fetch aborted");
          return;
        }
        console.error("Failed to fetch gallery content:", error);
        toast.error("Failed to load gallery content");
      } finally {
        // Only clear loading state if this request is still the current one
        if (
          requestIdRef.current === currentRequestId &&
          abortControllerRef.current === abortController
        ) {
          loadingRef.current = false;
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    };

    let timeoutId: NodeJS.Timeout;

    // Debounce search, but fetch immediately for other changes
    if (searchQuery.trim()) {
      timeoutId = setTimeout(() => {
        fetchData();
      }, 500);
    } else {
      fetchData();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Only abort on component unmount or meaningful dependency changes
      // Don't abort on every useEffect trigger
    };
  }, [
    activeTab,
    selectedTable, // Added table selection to dependencies
    searchQuery,
    categoryFilter,
    creatorFilter,
    priceRange.min,
    priceRange.max,
    revenueFilter,
    messageTypeFilter,
    outcomeFilter,
    captionStyleFilter,
  ]); // Removed pagination from dependencies

  // Fetch available tables on component mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("/api/gallery-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "listTables" }),
        });
        const data = await response.json();
        if (data.tables) {
          setAvailableTables(data.tables);
          // If current selected table is not in the list, use the first one
          if (!data.tables.includes(selectedTable) && data.tables.length > 0) {
            setSelectedTable(data.tables[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch available tables:", error);
      }
    };

    fetchTables();
  }, []); // Run once on mount

  const handleQuickAction = async (
    _itemId: string,
    action: string,
    item: GalleryItem
  ) => {
    try {
      switch (action) {
        case "copy":
          await navigator.clipboard.writeText(item.captionText || "");
          toast.success("Caption copied to clipboard");
          break;
        case "copy_url":
          const mediaUrl = item.previewUrl || item.gifUrl;
          if (mediaUrl) {
            await navigator.clipboard.writeText(mediaUrl);
            toast.success("Media URL copied to clipboard");
          }
          break;
        case "send_dm":
          toast.info("DM functionality would be implemented here");
          break;
        case "view":
          const url = item.previewUrl || item.gifUrl;
          if (url) {
            window.open(url, "_blank");
          }
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Action failed");
    }
  };

  const truncateCaption = (caption: string, maxLength = 100) => {
    if (!caption || caption.length <= maxLength) return caption || "";
    return caption.substring(0, maxLength) + "...";
  };

  // All filtering is now handled server-side through the API
  // Client-side sorting and pagination only
  const allFilteredItems = galleryItems;

  // Apply client-side sorting (since API no longer does pagination-based sorting)
  const sortedItems = [...allFilteredItems].sort((a, b) => {
    switch (sortBy) {
      case "revenue":
        return b.totalRevenue - a.totalRevenue;
      case "popularity":
        // Most popular: Sort by total purchases
        return b.totalBuys - a.totalBuys;
      case "success-rate":
        // Success rate: Good outcomes first, then by revenue within outcome groups
        const outcomeValue = (outcome: string | undefined) => {
          if (!outcome) return 0;
          if (outcome.toLowerCase() === 'good') return 2;
          if (outcome.toLowerCase() === 'bad') return 1;
          return 0;
        };
        const outcomeComparison = outcomeValue(b.outcome) - outcomeValue(a.outcome);
        // If outcomes are equal, sort by revenue within that outcome group
        return outcomeComparison !== 0 ? outcomeComparison : b.totalRevenue - a.totalRevenue;
      case "content-type":
        // Sort by content style alphabetically, then by revenue within each type
        const aType = a.contentStyle || '';
        const bType = b.contentStyle || '';
        const typeComparison = aType.localeCompare(bType);
        // If content types are equal, sort by revenue within that content type
        return typeComparison !== 0 ? typeComparison : b.totalRevenue - a.totalRevenue;
      case "creator":
        // Sort by creator name alphabetically, then by revenue within each creator
        const aCreator = a.creatorName || '';
        const bCreator = b.creatorName || '';
        const creatorComparison = aCreator.localeCompare(bCreator);
        // If creators are equal, sort by revenue within that creator
        return creatorComparison !== 0 ? creatorComparison : b.totalRevenue - a.totalRevenue;
      case "newest":
        return (
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      case "roi":
        // ROI: Revenue per purchase (efficiency metric)
        const aROI = a.totalBuys > 0 ? a.totalRevenue / a.totalBuys : 0;
        const bROI = b.totalBuys > 0 ? b.totalRevenue / b.totalBuys : 0;
        return bROI - aROI;
      default:
        return b.totalRevenue - a.totalRevenue;
    }
  });

  // Client-side pagination
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sortedContent = sortedItems.slice(startIndex, endIndex);

  // Debug pagination values
  console.log("🔢 Pagination Debug:", {
    totalItems,
    totalPages,
    itemsPerPage,
    currentPage,
    shouldShowPagination: totalPages > 1,
    galleryItemsLength: galleryItems.length,
    sortedItemsLength: sortedItems.length,
  });

  // Calculate pagination info for client-side pagination
  const clientPagination =
    totalPages > 1
      ? {
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
          startIndex: startIndex + 1,
          endIndex: Math.min(endIndex, totalItems),
        }
      : null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const ContentCard = ({ content }: { content: GalleryItem }) => {
    const [mediaError, setMediaError] = useState(false);
    const rawMediaUrl = content.previewUrl || content.gifUrl;
    const isGif = rawMediaUrl?.toLowerCase().includes(".gif");

    // Domains that require proxy from the start due to CORS issues
    const corsProblematicDomains = ["betterfans.app", "allthiscash.com"];
    const needsProxy =
      rawMediaUrl &&
      corsProblematicDomains.some((domain) => rawMediaUrl.includes(domain));

    const [useProxy, setUseProxy] = useState(needsProxy);
    const [useVideo, setUseVideo] = useState(false); // Disable video for now, focus on img

    // Use proxy for external URLs to avoid CORS issues
    const getMediaUrl = (url: string) => {
      if (!url) return "";

      // Check if it's an external URL that needs proxying
      const isExternal =
        url.startsWith("http") && !url.includes(window.location.hostname);

      if (isExternal && useProxy) {
        return `/api/media-proxy?url=${encodeURIComponent(url)}`;
      }

      return url;
    };

    const mediaUrl = rawMediaUrl ? getMediaUrl(rawMediaUrl) : "";

    // Use refs and global cache to persist state across component re-renders
    const cacheKey = `${content.id}-${mediaUrl}`;
    const [mediaLoaded, setMediaLoaded] = useState(
      () => imageLoadCache.get(cacheKey) || false
    );
    const mediaLoadedRef = useRef(imageLoadCache.get(cacheKey) || false);
    const imageRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleImageError = () => {
      if (!useProxy && rawMediaUrl?.startsWith("http")) {
        // Try with proxy first
        setUseProxy(true);
        setMediaError(false);
        setMediaLoaded(false);
        mediaLoadedRef.current = false;
        imageLoadCache.delete(cacheKey);
      } else {
        // If proxy also fails or it's not an external URL
        setMediaError(true);
        mediaLoadedRef.current = false;
        imageLoadCache.delete(cacheKey);
      }
    };

    const handleImageLoad = () => {
      setMediaLoaded(true);
      mediaLoadedRef.current = true;
      imageLoadCache.set(cacheKey, true);
    };

    const handleToggleFavorites = async (item: GalleryItem) => {
      // Skip if already loading
      if (loadingFavorites.has(item.id)) return;

      const isAddingToFavorites = !item.isFavorite;
      const actionText = isAddingToFavorites ? "Added to favorites" : "Removed from favorites";

      // 1. OPTIMISTIC UPDATE - Update UI immediately for great UX
      setLoadingFavorites((prev) => new Set(prev).add(item.id));

      // Update the item's favorite status optimistically
      setGalleryItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, isFavorite: !item.isFavorite } : i
        )
      );

      // Update the breakdown counter optimistically
      setBreakdown((prev) => ({
        ...prev,
        favorites: isAddingToFavorites ? prev.favorites + 1 : Math.max(0, prev.favorites - 1),
      }));

      try {
        const response = await fetch("/api/favorites-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: isAddingToFavorites ? "add" : "remove",
            itemId: item.id,
            tableName: item.tableName, // Required for Supabase API
            title: item.title,
            userId: "current-user", // TODO: Get from session when auth is implemented
          }),
        });

        if (response.ok) {
          // 2. SUCCESS - Show confirmation
          toast.success(`${actionText}!`, {
            duration: 2000,
            action: isAddingToFavorites ? {
              label: "View Saved",
              onClick: () => setActiveTab("favorites"),
            } : undefined,
          });

          // 3. INVALIDATE CACHE - Force refresh of favorites data on next access
          invalidateCache("favorites");
        } else {
          // 3. ERROR - Revert optimistic changes
          const errorData = await response.json();

          // Revert the optimistic updates
          setGalleryItems((prevItems) =>
            prevItems.map((i) =>
              i.id === item.id ? { ...i, isFavorite: item.isFavorite } : i
            )
          );

          setBreakdown((prev) => ({
            ...prev,
            favorites: isAddingToFavorites ? Math.max(0, prev.favorites - 1) : prev.favorites + 1,
          }));

          toast.error(errorData.error || `Failed to ${isAddingToFavorites ? 'add to' : 'remove from'} favorites`);
        }
      } catch (error) {
        console.error("❌ Error toggling favorites:", error);

        // Revert the optimistic updates on network error
        setGalleryItems((prevItems) =>
          prevItems.map((i) =>
            i.id === item.id ? { ...i, isFavorite: item.isFavorite } : i
          )
        );

        setBreakdown((prev) => ({
          ...prev,
          favorites: isAddingToFavorites ? Math.max(0, prev.favorites - 1) : prev.favorites + 1,
        }));

        toast.error("Network error. Please try again.");
      } finally {
        // 4. CLEANUP - Remove loading state
        setLoadingFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    };

    const handleTogglePTR = async (item: GalleryItem) => {
      // Skip if already loading
      if (loadingFavorites.has(item.id)) return;

      const isAddingToPTR = !item.isPTR;
      const actionText = isAddingToPTR ? "Marked as PTR" : "Removed from PTR";

      // 1. OPTIMISTIC UPDATE - Update UI immediately for great UX
      setLoadingFavorites((prev) => new Set(prev).add(item.id));

      // Update the item's PTR status optimistically
      setGalleryItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id
            ? {
                ...i,
                isPTR: !item.isPTR,
                isRelease: !item.isPTR, // PTR items are also releases
                // Set initial rotation status for new PTRs
                rotationStatus: !item.isPTR ? ("Ready" as const) : undefined,
                daysSinceLastSent: !item.isPTR ? null : undefined,
                isReadyForRotation: !item.isPTR ? true : false,
              }
            : i
        )
      );

      // Update the breakdown counter optimistically
      if (isAddingToPTR) {
        setBreakdown((prev) => ({
          ...prev,
          releases: prev.releases + 1,
        }));
      } else {
        setBreakdown((prev) => ({
          ...prev,
          releases: Math.max(0, prev.releases - 1),
        }));
      }

      try {
        const response = await fetch("/api/ptr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: item.sheetRowId, // Use sheetRowId instead of item.id for matching
            title: item.title,
            creator: item.creatorName || "Unknown",
            isPTR: !item.isPTR,
            sheetReference: item.sheetRowId,
            updatedAt: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          // 2. SUCCESS - Show confirmation
          toast.success(`${actionText}: "${item.title}"!`, {
            duration: 2000,
            action: isAddingToPTR
              ? {
                  label: "View Releases",
                  onClick: () => setActiveTab("releases"),
                }
              : undefined,
          });
          console.log(`✅ ${actionText}:`, item.title);

          // 3. INVALIDATE CACHE - Force refresh of ALL data on next access
          // This is crucial: PTR changes affect gallery, favorites, and releases views
          invalidateCache("all");
        } else {
          // 3. ERROR - Revert optimistic changes
          const errorData = await response.json();
          console.error(`❌ Failed to toggle PTR:`, errorData);

          // Revert the optimistic updates
          setGalleryItems((prevItems) =>
            prevItems.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    isPTR: item.isPTR,
                    isRelease: item.isRelease,
                    rotationStatus: item.rotationStatus,
                    daysSinceLastSent: item.daysSinceLastSent,
                    isReadyForRotation: item.isReadyForRotation,
                  }
                : i
            )
          );

          // Revert breakdown counter
          if (isAddingToPTR) {
            setBreakdown((prev) => ({
              ...prev,
              releases: Math.max(0, prev.releases - 1),
            }));
          } else {
            setBreakdown((prev) => ({
              ...prev,
              releases: prev.releases + 1,
            }));
          }

          toast.error(errorData.error || "Failed to update PTR status");
        }
      } catch (error) {
        console.error("❌ Error toggling PTR:", error);

        // Revert the optimistic updates on network error
        setGalleryItems((prevItems) =>
          prevItems.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  isPTR: item.isPTR,
                  isRelease: item.isRelease,
                  rotationStatus: item.rotationStatus,
                  daysSinceLastSent: item.daysSinceLastSent,
                  isReadyForRotation: item.isReadyForRotation,
                }
              : i
          )
        );

        // Revert breakdown counter
        if (isAddingToPTR) {
          setBreakdown((prev) => ({
            ...prev,
            releases: Math.max(0, prev.releases - 1),
          }));
        } else {
          setBreakdown((prev) => ({
            ...prev,
            releases: prev.releases + 1,
          }));
        }

        toast.error("Network error. Please try again.");
      } finally {
        // 4. CLEANUP - Remove loading state
        setLoadingFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    };

    const handleMarkPTRAsSent = async (item: GalleryItem) => {
      // Skip if not ready for rotation
      if (!item.isPTR || !item.isReadyForRotation) {
        toast.error("PTR is not ready for rotation");
        return;
      }

      setLoadingFavorites((prev) => new Set(prev).add(item.id));

      try {
        const response = await fetch("/api/ptr-rotation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: item.sheetRowId,
            sentAt: new Date().toISOString(),
            result: "pending",
          }),
        });

        if (response.ok) {
          toast.success(`Marked "${item.title}" as sent!`, {
            description: "PTR rotation updated successfully",
            duration: 3000,
          });

          // Update local state - mark as resting
          setGalleryItems((prev) =>
            prev.map((galleryItem) =>
              galleryItem.id === item.id
                ? {
                    ...galleryItem,
                    rotationStatus: "Resting" as const,
                    daysSinceLastSent: 0,
                    isReadyForRotation: false,
                    usageCount: (galleryItem.usageCount || 0) + 1,
                    lastUsed: new Date(),
                  }
                : galleryItem
            )
          );

          console.log("✅ PTR marked as sent:", item.title);
        } else {
          const errorData = await response.json();
          toast.error("Failed to mark PTR as sent", {
            description: errorData.error || "Please try again",
          });
        }
      } catch (error) {
        console.error("Error marking PTR as sent:", error);
        toast.error("Network error", {
          description: "Please check your connection and try again",
        });
      } finally {
        setLoadingFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    };

    // Initialize loading state on component mount or URL change
    useEffect(() => {
      if (mediaUrl) {
        // Reset loading state when URL changes
        if (!mediaLoadedRef.current) {
          setMediaLoaded(false);
        }
      }
    }, [mediaUrl]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        mediaLoadedRef.current = false;
      };
    }, []);

    return (
      <Card className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] h-[480px] flex flex-col">
        {/* Media Preview */}
        <div className="relative h-48 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 overflow-hidden">
          {mediaUrl && !mediaError ? (
            <div className="relative w-full h-full">
              {!mediaLoaded && !mediaLoadedRef.current && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {isGif && useVideo ? (
                // Try video element first for GIFs (better compatibility)
                <video
                  ref={videoRef}
                  key={`${content.id}-${useProxy}-video`}
                  src={mediaUrl}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  style={{
                    opacity: 1, // Force visible until we fix the state logic
                    transition: "opacity 0.3s ease-in-out",
                    zIndex: 10, // Ensure images appear above other elements
                    position: "absolute", // Essential for proper positioning
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                  onLoadedData={handleImageLoad}
                  onError={() => setUseVideo(false)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  crossOrigin={useProxy ? "anonymous" : undefined}
                />
              ) : (
                <img
                  ref={imageRef}
                  key={`${content.id}-${useProxy}`}
                  src={mediaUrl}
                  alt={content.title}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  style={{
                    opacity: 1, // Force visible until we fix the state logic
                    transition: "opacity 0.3s ease-in-out",
                    zIndex: 10, // Ensure images appear above other elements
                    position: "absolute", // Essential for proper positioning
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                  crossOrigin={useProxy ? "anonymous" : undefined}
                />
              )}

              {/* Debug: Add a test to show if the URL is accessible at all */}
              {mediaError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-sm p-4">
                  <div className="text-red-500 mb-2">Failed to Load</div>
                  <a
                    href={mediaUrl}
                    target="_blank"
                    className="text-blue-500 underline text-xs break-all"
                    rel="noopener noreferrer"
                  >
                    Test URL
                  </a>
                </div>
              )}

              {(mediaLoaded || mediaLoadedRef.current) && (
                <>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {content.isPTR && (
                      <Badge className="bg-red-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm font-bold">
                        PTR
                      </Badge>
                    )}
                    {/* PTR Rotation Status Indicators */}
                    {content.isPTR && content.rotationStatus && (
                      <Badge
                        className={`text-xs px-2 py-1 backdrop-blur-sm font-medium ${
                          content.rotationStatus === "Ready"
                            ? "bg-green-500/90 text-white"
                            : content.rotationStatus === "Resting"
                              ? "bg-yellow-500/90 text-white"
                              : content.rotationStatus === "Active"
                                ? "bg-blue-500/90 text-white"
                                : "bg-gray-500/90 text-white"
                        }`}
                      >
                        {content.rotationStatus === "Ready"
                          ? "🔄"
                          : content.rotationStatus === "Resting"
                            ? "💤"
                            : content.rotationStatus === "Active"
                              ? "⏰"
                              : "❓"}{" "}
                        {content.rotationStatus}
                      </Badge>
                    )}
                    {/* Days Since Last Sent Indicator */}
                    {content.isPTR &&
                      content.daysSinceLastSent !== null &&
                      content.daysSinceLastSent !== undefined &&
                      content.daysSinceLastSent > 0 && (
                        <Badge className="bg-gray-700/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                          {content.daysSinceLastSent}d ago
                        </Badge>
                      )}
                    {content.isPTR && content.daysSinceLastSent === null && (
                      <Badge className="bg-purple-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                        Never sent
                      </Badge>
                    )}
                    {isGif && (
                      <Badge className="bg-purple-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                        GIF
                      </Badge>
                    )}
                    {useProxy && (
                      <Badge className="bg-blue-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                        PROXY
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 z-50 flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant={content.isFavorite ? "default" : "secondary"}
                      disabled={loadingFavorites.has(content.id)}
                      className={`${
                        content.isFavorite
                          ? "bg-pink-500/90 hover:bg-pink-600 text-white border-pink-500"
                          : "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900"
                      } backdrop-blur-sm text-xs px-2 py-1 cursor-pointer transition-all duration-200 ${
                        loadingFavorites.has(content.id)
                          ? "opacity-60 cursor-wait"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleFavorites(content);
                      }}
                    >
                      {loadingFavorites.has(content.id) ? (
                        <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Heart
                          className={`w-3 h-3 mr-1 ${content.isFavorite ? "fill-current" : ""}`}
                        />
                      )}
                      {content.isFavorite ? "Saved" : "Favorite"}
                    </Button>

                    <Button
                      size="sm"
                      variant={content.isPTR ? "destructive" : "secondary"}
                      disabled={loadingFavorites.has(content.id)}
                      className={`${
                        content.isPTR
                          ? "bg-red-500/90 hover:bg-red-600 text-white border-red-500"
                          : "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900"
                      } backdrop-blur-sm text-xs px-2 py-1 cursor-pointer transition-all duration-200 ${
                        loadingFavorites.has(content.id)
                          ? "opacity-60 cursor-wait"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTogglePTR(content);
                      }}
                    >
                      {loadingFavorites.has(content.id) ? (
                        <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Star className="w-3 h-3 mr-1" />
                      )}
                      {loadingFavorites.has(content.id)
                        ? "Processing..."
                        : content.isPTR
                          ? "Remove PTR"
                          : "Mark PTR"}
                    </Button>

                    {/* Mark as Sent button for ready PTRs */}
                    {content.isPTR && content.isReadyForRotation && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={loadingFavorites.has(content.id)}
                        className={`bg-green-500/90 hover:bg-green-600 text-white backdrop-blur-sm text-xs px-2 py-1 cursor-pointer transition-all duration-200 ${
                          loadingFavorites.has(content.id)
                            ? "opacity-60 cursor-wait"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkPTRAsSent(content);
                        }}
                      >
                        {loadingFavorites.has(content.id) ? (
                          <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Send className="w-3 h-3 mr-1" />
                        )}
                        {loadingFavorites.has(content.id)
                          ? "Marking..."
                          : "Mark Sent"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
              <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full text-center">
                {mediaError ? "Media Unavailable" : "No Preview"}
              </div>
              {mediaError && rawMediaUrl && (
                <button
                  onClick={() => {
                    setMediaError(false);
                    setMediaLoaded(false);
                    setUseProxy(!useProxy);
                  }}
                  className="text-xs text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {content.isFavorite && (
              <Badge className="bg-pink-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                <Heart className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
            {content.isRelease && (
              <Badge className="bg-blue-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                <Star className="w-3 h-3 mr-1" />
                Released
              </Badge>
            )}
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
              {content.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          {/* Title and Caption - Top section */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-1 flex-1">
                {content.contentStyle || content.messageType || content.title}
              </h3>
              {content.outcome && (
                <Badge
                  variant={
                    content.outcome === "Good" ? "default" : "destructive"
                  }
                  className="ml-2 text-xs"
                >
                  {content.outcome}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {content.tableName && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                  {content.tableName}
                </span>
              )}
              {content.creatorName && (
                <span className="font-medium">{content.creatorName}</span>
              )}
              {content.type && (
                <>
                  <span>•</span>
                  <span>{content.type}</span>
                </>
              )}
              {content.messageType && (
                <>
                  <span>•</span>
                  <span>{content.messageType}</span>
                </>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
              {truncateCaption(content.captionText, 100)}
            </p>
          </div>

          {/* Spacer to push content to bottom */}
          <div className="flex-1"></div>

          {/* Performance Metrics - Fixed position from bottom */}
          <div className="flex items-center justify-between text-sm mb-4 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                <DollarSign className="w-3 h-3 mr-1" />${content.price}
              </div>
              <div className="flex items-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3 mr-1" />
                {content.totalBuys}
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ${content.totalRevenue.toLocaleString()}
            </div>
          </div>

          {/* Action Buttons - Fixed position at bottom */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
              onClick={() => handleQuickAction(content.id, "send_dm", content)}
            >
              <Send className="w-3 h-3 mr-1" />
              Send
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => handleQuickAction(content.id, "copy", content)}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    // Copy caption to clipboard
                    navigator.clipboard.writeText(content.captionText);
                    toast.success("Caption copied!", {
                      description: "Caption text copied to clipboard",
                      duration: 2000,
                    });
                  }}
                  className="font-medium"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Caption
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Copy all details (caption + price + link)
                    const allDetails = `${content.title}\n\nCaption: ${content.captionText}\n\nPrice: $${content.price}\nCreator: ${content.creatorName || "N/A"}\nPerformance: $${content.totalRevenue} (${content.totalBuys} sales)\n${content.previewUrl || content.gifUrl || ""}`;
                    navigator.clipboard.writeText(allDetails);
                    toast.success("All details copied!", {
                      description: "Full content package copied to clipboard",
                      duration: 2000,
                    });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleQuickAction(content.id, "view", content)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Media
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleQuickAction(content.id, "copy_url", content)
                  }
                >
                  <Link className="w-4 h-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                {content.isPTR && content.isReadyForRotation && (
                  <DropdownMenuItem
                    onClick={() => handleMarkPTRAsSent(content)}
                    className="text-green-600 dark:text-green-400 font-medium"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Mark as Sent
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    // Schedule for later (placeholder)
                    toast.info("Schedule feature coming soon!", {
                      description:
                        "This will allow you to schedule content for specific times",
                      duration: 3000,
                    });
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </DropdownMenuItem>
                
                {/* Favorite/Unfavorite Button */}
                <DropdownMenuItem
                  onClick={() => handleToggleFavorites(content)}
                  disabled={loadingFavorites.has(content.id)}
                  className={`${
                    content.isFavorite 
                      ? "text-pink-600 dark:text-pink-400" 
                      : "text-gray-700 dark:text-gray-300"
                  } font-medium`}
                >
                  {loadingFavorites.has(content.id) ? (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Heart className={`w-4 h-4 mr-2 ${content.isFavorite ? 'fill-current' : ''}`} />
                  )}
                  {content.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </DropdownMenuItem>

                {/* PTR/Release Toggle Button */}
                <DropdownMenuItem
                  onClick={() => handleTogglePTR(content)}
                  disabled={loadingFavorites.has(content.id)}
                  className={`${
                    content.isPTR 
                      ? "text-red-600 dark:text-red-400" 
                      : "text-gray-700 dark:text-gray-300"
                  } font-medium`}
                >
                  {loadingFavorites.has(content.id) ? (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Star className={`w-4 h-4 mr-2 ${content.isPTR ? 'fill-current' : ''}`} />
                  )}
                  {content.isPTR ? "Remove from PTR" : "Mark as PTR"}
                </DropdownMenuItem>
                {mediaError && rawMediaUrl && (
                  <DropdownMenuItem
                    onClick={() => {
                      setMediaError(false);
                      setMediaLoaded(false);
                      setUseProxy(!useProxy);
                    }}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {useProxy ? "Direct Load" : "Use Proxy"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {/* Clean Header - Title Only */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                Content Gallery
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Discover and manage your high-performing content library
              </p>
            </div>

            {/* View Toggle Only */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="border-gray-300 dark:border-gray-600"
            >
              {viewMode === "grid" ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid3X3 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Unified Control Bar - Table Selector + Search + Tabs + Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search content, captions, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            {/* Tabs + Filters Row */}
            <div className="flex items-center gap-3">
              {/* Content Type Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "all" | "favorites" | "releases")
                }
                className="shrink-0"
              >
                <TabsList className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                  >
                    All ({galleryItems.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="favorites"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Saved ({breakdown.favorites})
                  </TabsTrigger>
                  <TabsTrigger
                    value="releases"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Released ({breakdown.releases})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Cache Clear Button (Development) */}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch("/api/gallery-db", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "clearCache",
                        tableName: selectedTable,
                      }),
                    });
                    toast.success(`Cache cleared for ${selectedTable}`);
                    // Force refresh data
                    setCachedData({
                      gallery: [],
                      favorites: [],
                      releases: [],
                      lastFetch: { gallery: 0, favorites: 0, releases: 0 },
                    });
                  } catch (error) {
                    toast.error("Failed to clear cache");
                  }
                }}
                className="border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-300 dark:border-gray-600"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {showFilters && <X className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>

        {/* PPV Filter Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">ℹ</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>PPV-Only View:</strong> Displaying PPV and PPV Follow up content only. Use Message Type filter to narrow down specific PPV types.
            </p>
          </div>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {allFilteredItems.length.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Total Content
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {allFilteredItems
                    .reduce((sum, item) => sum + item.totalBuys, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Total Sales
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  $
                  {allFilteredItems
                    .reduce((sum, item) => sum + item.totalRevenue, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Revenue
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Advanced Filters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter("all");
                  setCreatorFilter("all");
                  setPriceRange({ min: "", max: "" });
                  setRevenueFilter("");
                  setMessageTypeFilter("all");
                  setOutcomeFilter("all");
                  setCaptionStyleFilter("all");
                  setSortBy("performance");
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort By
                </label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">💰 Most Revenue</SelectItem>
                    <SelectItem value="popularity">🔥 Most Popular</SelectItem>
                    <SelectItem value="success-rate">✅ Best Success Rate</SelectItem>
                    <SelectItem value="content-type">📂 By Content Type</SelectItem>
                    <SelectItem value="creator">👤 By Creator</SelectItem>
                    <SelectItem value="price-high">💸 Highest Price</SelectItem>
                    <SelectItem value="price-low">💵 Lowest Price</SelectItem>
                    <SelectItem value="newest">🕒 Newest First</SelectItem>
                    <SelectItem value="roi">💎 Best ROI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Creator Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Creator
                </label>
                <Select
                  value={creatorFilter}
                  onValueChange={(value) => {
                    setCreatorFilter(value);
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Creators</SelectItem>
                    {creators.map((creator) => (
                      <SelectItem key={creator.name} value={creator.name}>
                        {creator.name} ({creator.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price Range
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }));
                    }}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-gray-400">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }));
                    }}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Revenue Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Min Revenue
                </label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Second row of filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              {/* Message Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message Type
                </label>
                <Select
                  value={messageTypeFilter}
                  onValueChange={(value) => {
                    setMessageTypeFilter(value);
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">💰 All PPV Content</SelectItem>
                    <SelectItem value="PPV">💰 PPV Only</SelectItem>
                    <SelectItem value="PPV Follow Up">📞 PPV Follow up Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Outcome Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Outcome
                </label>
                <Select
                  value={outcomeFilter}
                  onValueChange={(value) => {
                    setOutcomeFilter(value);
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Bad">Bad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Caption Style Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Caption Style
                </label>
                <Select
                  value={captionStyleFilter}
                  onValueChange={(value) => {
                    setCaptionStyleFilter(value);
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Styles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    <SelectItem value="Teasing">🔥 Teasing</SelectItem>
                    <SelectItem value="Direct">💯 Direct</SelectItem>
                    <SelectItem value="Story-based">📖 Story-based</SelectItem>
                    <SelectItem value="GFE">
                      💕 GFE (Girlfriend Experience)
                    </SelectItem>
                    <SelectItem value="Dominant">👑 Dominant</SelectItem>
                    <SelectItem value="Submissive">🙏 Submissive</SelectItem>
                    <SelectItem value="Humorous">😄 Humorous</SelectItem>
                    <SelectItem value="Custom">✨ Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* PTR Dashboard - Only show on releases tab */}
        {activeTab === "releases" && (
          <div className="mb-8">
            <PTRDashboard dailyGoal={2} />
          </div>
        )}

        {/* Content Grid */}
        <div
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          } mb-8`}
        >
          {sortedContent.map((content) => (
            <ErrorBoundary
              key={content.id}
              fallback={
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    Error loading content: {content.title || content.id}
                  </div>
                </div>
              }
            >
              <ContentCard content={content} />
            </ErrorBoundary>
          ))}
        </div>

        {/* Pagination */}
        {clientPagination && clientPagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-200 dark:border-gray-700">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {clientPagination.startIndex}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {clientPagination.endIndex}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {clientPagination.totalItems.toLocaleString()}
              </span>{" "}
              results
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Show:
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
              >
                <SelectTrigger className="w-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={!clientPagination.hasPreviousPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!clientPagination.hasPreviousPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-2">
                {Array.from(
                  { length: Math.min(5, clientPagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (clientPagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= clientPagination.totalPages - 2) {
                      pageNum = clientPagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-8 ${
                          currentPage === pageNum
                            ? "bg-pink-600 hover:bg-pink-700 text-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}

                {clientPagination.totalPages > 5 &&
                  currentPage < clientPagination.totalPages - 2 && (
                    <>
                      <span className="text-gray-400 px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(clientPagination.totalPages)
                        }
                        className="w-10 h-8 border-gray-300 dark:border-gray-600"
                      >
                        {clientPagination.totalPages}
                      </Button>
                    </>
                  )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!clientPagination.hasNextPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(clientPagination.totalPages)}
                disabled={!clientPagination.hasNextPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {sortedContent.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? "No results found" : "No content available"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery
                ? `No content matches your search "${searchQuery}". Try adjusting your filters or search terms.`
                : "Your content library appears to be empty. Check your data source or try refreshing the page."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setCreatorFilter("all");
                  setPriceRange({ min: "", max: "" });
                  setRevenueFilter("");
                }}
                className="border-gray-300 dark:border-gray-600"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const GalleryPage = () => {
  return <GalleryContent />;
};

export default GalleryPage;
