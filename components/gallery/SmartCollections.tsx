"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GalleryItem, FilterState } from "@/types/gallery";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  TrendingUp,
  Star,
  Heart,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Folder,
  ChevronRight,
  DollarSign,
  Users,
  Zap,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Smart collection definition
interface SmartCollection {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  filter: (item: GalleryItem) => boolean;
  filters?: Partial<FilterState>;
  color: string;
  count?: number;
}

interface SmartCollectionsProps {
  items: GalleryItem[];
  activeCollection?: string;
  onSelectCollection: (collectionId: string, filters?: Partial<FilterState>) => void;
  onClearCollection: () => void;
  className?: string;
  collapsed?: boolean;
}

const SmartCollections: React.FC<SmartCollectionsProps> = ({
  items,
  activeCollection,
  onSelectCollection,
  onClearCollection,
  className,
  collapsed = false,
}) => {
  // Define smart collections
  const collections: SmartCollection[] = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      // Performance-based
      {
        id: "high-performers",
        name: "High Performers",
        description: "Revenue > $100",
        icon: TrendingUp,
        filter: (item) => item.totalRevenue >= 100,
        filters: { sortBy: "revenue", outcome: "all" },
        color: "text-emerald-500",
      },
      {
        id: "best-roi",
        name: "Best ROI",
        description: "Good outcome content",
        icon: Zap,
        filter: (item) =>
          item.outcome?.toLowerCase().includes("good") ||
          item.outcome?.toLowerCase().includes("success"),
        filters: { sortBy: "success-rate", outcome: "Good" },
        color: "text-yellow-500",
      },
      {
        id: "top-sellers",
        name: "Top Sellers",
        description: "20+ purchases",
        icon: DollarSign,
        filter: (item) => item.totalBuys >= 20,
        filters: { sortBy: "popularity" },
        color: "text-green-500",
      },

      // Status-based
      {
        id: "favorites",
        name: "My Favorites",
        description: "Saved to favorites",
        icon: Heart,
        filter: (item) => item.isFavorite === true,
        color: "text-pink-500",
      },
      {
        id: "ptr-queue",
        name: "PTR Queue",
        description: "Ready to send",
        icon: Send,
        filter: (item) => item.isPTR === true && !item.ptrSent,
        color: "text-purple-500",
      },
      {
        id: "ptr-sent",
        name: "PTR Sent",
        description: "Already sent",
        icon: CheckCircle2,
        filter: (item) => item.ptrSent === true,
        color: "text-green-500",
      },
      {
        id: "ready-rotation",
        name: "Ready for Rotation",
        description: "Can be reused",
        icon: RefreshCw,
        filter: (item) => item.isReadyForRotation === true,
        color: "text-blue-500",
      },

      // Time-based
      {
        id: "recent-7d",
        name: "Last 7 Days",
        description: "Recently added",
        icon: Clock,
        filter: (item) => {
          const added = new Date(item.dateAdded);
          return added >= sevenDaysAgo;
        },
        filters: { sortBy: "recent" },
        color: "text-blue-500",
      },
      {
        id: "recent-30d",
        name: "Last 30 Days",
        description: "Added this month",
        icon: Clock,
        filter: (item) => {
          const added = new Date(item.dateAdded);
          return added >= thirtyDaysAgo;
        },
        filters: { sortBy: "recent" },
        color: "text-indigo-500",
      },

      // Attention-needed
      {
        id: "needs-attention",
        name: "Needs Attention",
        description: "Bad outcome",
        icon: AlertCircle,
        filter: (item) =>
          item.outcome?.toLowerCase().includes("bad") ||
          item.outcome?.toLowerCase().includes("poor"),
        filters: { outcome: "Bad" },
        color: "text-red-500",
      },
    ];
  }, []);

  // Calculate counts for each collection
  const collectionsWithCounts = useMemo(() => {
    return collections.map((collection) => ({
      ...collection,
      count: items.filter(collection.filter).length,
    }));
  }, [collections, items]);

  // Group collections by category
  const performanceCollections = collectionsWithCounts.filter((c) =>
    ["high-performers", "best-roi", "top-sellers"].includes(c.id)
  );
  const statusCollections = collectionsWithCounts.filter((c) =>
    ["favorites", "ptr-queue", "ptr-sent", "ready-rotation"].includes(c.id)
  );
  const timeCollections = collectionsWithCounts.filter((c) =>
    ["recent-7d", "recent-30d"].includes(c.id)
  );
  const attentionCollections = collectionsWithCounts.filter((c) =>
    ["needs-attention"].includes(c.id)
  );

  // Collapsed view - just icons
  if (collapsed) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-4", className)}>
        {collectionsWithCounts.slice(0, 6).map((collection) => {
          const Icon = collection.icon;
          const isActive = activeCollection === collection.id;

          return (
            <button
              key={collection.id}
              onClick={() =>
                isActive
                  ? onClearCollection()
                  : onSelectCollection(collection.id, collection.filters)
              }
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-pink-100 dark:bg-pink-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title={`${collection.name} (${collection.count})`}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-pink-600" : collection.color
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // Collection group component
  const CollectionGroup = ({
    title,
    collections,
    defaultOpen = true,
  }: {
    title: string;
    collections: SmartCollection[];
    defaultOpen?: boolean;
  }) => (
    <Collapsible defaultOpen={defaultOpen} className="space-y-1">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
        <span>{title}</span>
        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5">
        {collections.map((collection) => {
          const Icon = collection.icon;
          const isActive = activeCollection === collection.id;

          return (
            <button
              key={collection.id}
              onClick={() =>
                isActive
                  ? onClearCollection()
                  : onSelectCollection(collection.id, collection.filters)
              }
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                  isActive
                    ? "bg-pink-100 dark:bg-pink-900/30"
                    : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-pink-600 dark:text-pink-400" : collection.color
                  )}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div
                  className={cn(
                    "text-sm font-medium truncate",
                    isActive
                      ? "text-pink-700 dark:text-pink-300"
                      : "text-gray-700 dark:text-gray-200"
                  )}
                >
                  {collection.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {collection.description}
                </div>
              </div>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  isActive
                    ? "bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-200"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}
              >
                {collection.count}
              </span>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Smart Collections
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Auto-organized based on content
        </p>
      </div>

      {/* Collections List */}
      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-4">
          {/* All Items */}
          <button
            onClick={onClearCollection}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200",
              !activeCollection
                ? "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800"
                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                !activeCollection
                  ? "bg-pink-100 dark:bg-pink-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <Folder
                className={cn(
                  "w-4 h-4",
                  !activeCollection
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500"
                )}
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div
                className={cn(
                  "text-sm font-medium",
                  !activeCollection
                    ? "text-pink-700 dark:text-pink-300"
                    : "text-gray-700 dark:text-gray-200"
                )}
              >
                All Content
              </div>
            </div>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                !activeCollection
                  ? "bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              )}
            >
              {items.length}
            </span>
          </button>

          {/* Performance Collections */}
          <CollectionGroup
            title="Performance"
            collections={performanceCollections}
          />

          {/* Status Collections */}
          <CollectionGroup title="Status" collections={statusCollections} />

          {/* Time-based Collections */}
          <CollectionGroup
            title="Recent"
            collections={timeCollections}
            defaultOpen={false}
          />

          {/* Attention Collections */}
          {attentionCollections.some((c) => (c.count || 0) > 0) && (
            <CollectionGroup
              title="Needs Attention"
              collections={attentionCollections}
            />
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{items.length} total items</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            <span>
              {items.filter((i) => i.isFavorite).length} favorites
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCollections;
