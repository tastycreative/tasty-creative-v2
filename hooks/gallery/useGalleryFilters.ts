"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { GalleryItem, FilterState } from "@/types/gallery";

interface UseGalleryFiltersProps {
  initialFilters?: Partial<FilterState>;
  items: GalleryItem[];
}

export function useGalleryFilters({ initialFilters, items }: UseGalleryFiltersProps) {
  // Consolidated filter state (default dataSource to SHEET)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    creator: "all",
    messageType: "all",
    outcome: "all",
    sortBy: "revenue",
    revenue: "",
    dataSource: "SHEET",
    postOrigin: "all",
    ...initialFilters,
  });

  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "releases">("all");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  // Debounce search query
  const debouncedSearch = useDebounce(filters.search, 300);

  // Pure client-side filtering function
  const applyFiltersToItems = (itemsToFilter: GalleryItem[]): GalleryItem[] => {
    let filteredItems = [...itemsToFilter];

    // Apply category filter
    if (filters.category && filters.category !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Apply creator filter
    if (filters.creator && filters.creator !== "all") {
      filteredItems = filteredItems.filter(
        (item) =>
          item.creatorName &&
          item.creatorName.toLowerCase().includes(filters.creator.toLowerCase())
      );
    }

    // Apply revenue filter
    if (filters.revenue) {
      const min = parseFloat(filters.revenue);
      filteredItems = filteredItems.filter((item) => item.totalRevenue >= min);
    }

    // Apply message type filter
    if (filters.messageType && filters.messageType !== "all") {
      filteredItems = filteredItems.filter(
        (item) =>
          item.messageType &&
          item.messageType.toLowerCase() === filters.messageType.toLowerCase()
      );
    }

    // Apply outcome filter
    if (filters.outcome && filters.outcome !== "all") {
      filteredItems = filteredItems.filter(
        (item) =>
          item.outcome &&
          item.outcome.toLowerCase() === filters.outcome.toLowerCase()
      );
    }

    // Apply data source filter
    if (filters.dataSource && filters.dataSource !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.dataSource === filters.dataSource
      );
    }

    // Apply post origin filter (only for SHEET items by their messageType)
    if (filters.postOrigin && filters.postOrigin !== "all") {
      filteredItems = filteredItems.filter(
        (item) =>
          (item.dataSource === "SHEET" || !item.dataSource) &&
          item.messageType === filters.postOrigin
      );
    }

    // Apply search filter (using debounced search)
    if (debouncedSearch) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.captionText
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          item.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (item.contentStyle || "")
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase())
      );
    }

    return filteredItems;
  };

  // 1. Basic Filters
  const allFilteredItems = useMemo(() => {
    return applyFiltersToItems(items);
  }, [
    items,
    debouncedSearch,
    filters.category,
    filters.creator,
    filters.revenue,
    filters.messageType,
    filters.outcome,
    filters.dataSource,
    filters.postOrigin,
  ]);

  // 2. Sorting
  const sortedItems = useMemo(() => {
    return [...allFilteredItems].sort((a, b) => {
      switch (filters.sortBy) {
        case "revenue":
          return b.totalRevenue - a.totalRevenue;
        case "popularity":
          return b.totalBuys - a.totalBuys;
        case "success-rate": {
          const outcomeValue = (outcome: string | undefined) => {
            if (!outcome) return 0;
            const lower = outcome.toLowerCase();
            if (lower.includes("good") || lower.includes("success")) return 3;
            if (lower.includes("ok") || lower.includes("decent")) return 2;
            if (lower.includes("bad") || lower.includes("poor")) return 1;
            return 0;
          };
          const outcomeValueDiff =
            outcomeValue(b.outcome) - outcomeValue(a.outcome);
          if (outcomeValueDiff !== 0) return outcomeValueDiff;
          return b.totalRevenue - a.totalRevenue;
        }
        case "recent":
          return (
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          );
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [allFilteredItems, filters.sortBy]);

  // 3. Tab Filtering
  const tabFilteredItems = useMemo(() => {
    switch (activeTab) {
      case "favorites":
        return sortedItems.filter((item) => item.isFavorite);
      case "releases":
        return sortedItems.filter((item) => item.isPTR);
      default:
        return sortedItems;
    }
  }, [sortedItems, activeTab]);

  // 4. Collection Filtering (Final Result)
  const filteredContent = useMemo(() => {
    if (!activeCollection) return tabFilteredItems;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (activeCollection) {
      case "high-performers":
        return tabFilteredItems.filter((item) => item.totalRevenue >= 100);
      case "best-roi":
        return tabFilteredItems.filter(
          (item) =>
            item.outcome?.toLowerCase().includes("good") ||
            item.outcome?.toLowerCase().includes("success")
        );
      case "top-sellers":
        return tabFilteredItems.filter((item) => item.totalBuys >= 20);
      case "favorites":
        return tabFilteredItems.filter((item) => item.isFavorite === true);
      case "ptr-queue":
        return tabFilteredItems.filter((item) => item.isPTR === true && !item.ptrSent);
      case "ptr-sent":
        return tabFilteredItems.filter((item) => item.ptrSent === true);
      case "ready-rotation":
        return tabFilteredItems.filter((item) => item.isReadyForRotation === true);
      case "recent-7d":
        return tabFilteredItems.filter((item) => {
          const added = new Date(item.dateAdded);
          return added >= sevenDaysAgo;
        });
      case "recent-30d":
        return tabFilteredItems.filter((item) => {
          const added = new Date(item.dateAdded);
          return added >= thirtyDaysAgo;
        });
      case "needs-attention":
        return tabFilteredItems.filter(
          (item) =>
            item.outcome?.toLowerCase().includes("bad") ||
            item.outcome?.toLowerCase().includes("poor")
        );
      default:
        return tabFilteredItems;
    }
  }, [tabFilteredItems, activeCollection]);

  return {
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    activeCollection,
    setActiveCollection,
    debouncedSearch,
    filteredContent,
  };
}
