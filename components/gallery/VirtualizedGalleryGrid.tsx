"use client";

import React, { useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import ContentCard from "@/components/gallery/ContentCard";
import ListCard from "@/components/gallery/ContentCard/ListCard";
import CompactCard from "@/components/gallery/ContentCard/CompactCard";
import { GalleryItem } from "@/types/gallery";
import { ViewMode, getGridConfig } from "./ViewModeSwitcher";
import { cn } from "@/lib/utils";

interface VirtualizedGalleryGridProps {
  items: GalleryItem[];
  viewMode: ViewMode;
  density?: number;
  onToggleFavorite?: (item: GalleryItem) => Promise<void> | void;
  onTogglePTR?: (item: GalleryItem) => Promise<void> | void;
  onMarkPTRAsSent?: (item: GalleryItem) => Promise<void> | void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  className?: string;
}

// Get number of columns based on view mode and screen width
const getColumnCount = (viewMode: ViewMode, containerWidth: number): number => {
  switch (viewMode) {
    case "list":
      return 1;
    case "compact":
      if (containerWidth < 640) return 2;
      if (containerWidth < 768) return 3;
      if (containerWidth < 1024) return 4;
      if (containerWidth < 1280) return 5;
      return 6;
    case "grid":
    default:
      if (containerWidth < 640) return 1;
      if (containerWidth < 1024) return 2;
      if (containerWidth < 1280) return 3;
      return 4;
  }
};

const VirtualizedGalleryGrid: React.FC<VirtualizedGalleryGridProps> = ({
  items,
  viewMode,
  density = 50,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  className,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(1200);

  // Measure container width
  React.useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(parent);
    setContainerWidth(parent.clientWidth);

    return () => observer.disconnect();
  }, []);

  const gridConfig = useMemo(
    () => getGridConfig(viewMode, density),
    [viewMode, density]
  );

  const columnCount = useMemo(
    () => getColumnCount(viewMode, containerWidth),
    [viewMode, containerWidth]
  );

  // Calculate rows from items
  const rows = useMemo(() => {
    const result: GalleryItem[][] = [];
    for (let i = 0; i < items.length; i += columnCount) {
      result.push(items.slice(i, i + columnCount));
    }
    return result;
  }, [items, columnCount]);

  // Row height based on view mode
  const rowHeight = useMemo(() => {
    const baseHeight = gridConfig.cardHeight;
    const gapHeight = viewMode === "list" ? 12 : viewMode === "compact" ? 16 : 24;
    return baseHeight + gapHeight;
  }, [gridConfig.cardHeight, viewMode]);

  // Row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 3,
  });

  // Render item based on view mode
  const renderItem = useCallback(
    (item: GalleryItem, index: number) => {
      const commonProps = {
        content: item,
        onToggleFavorite,
        onTogglePTR,
        onMarkPTRAsSent,
        selectionMode,
        isSelected: selectedIds.has(item.id),
        onToggleSelection,
      };

      switch (viewMode) {
        case "list":
          return (
            <ListCard
              key={`${item.tableName || "default"}-${item.id}-${item.sheetRowId || index}`}
              {...commonProps}
              cardHeight={gridConfig.cardHeight}
            />
          );
        case "compact":
          return (
            <CompactCard
              key={`${item.tableName || "default"}-${item.id}-${item.sheetRowId || index}`}
              {...commonProps}
              cardHeight={gridConfig.cardHeight}
              imageHeight={gridConfig.imageHeight}
            />
          );
        case "grid":
        default:
          return (
            <ContentCard
              key={`${item.tableName || "default"}-${item.id}-${item.sheetRowId || index}`}
              {...commonProps}
            />
          );
      }
    },
    [
      viewMode,
      gridConfig,
      onToggleFavorite,
      onTogglePTR,
      onMarkPTRAsSent,
      selectionMode,
      selectedIds,
      onToggleSelection,
    ]
  );

  // Get gap class based on view mode
  const gapClass = useMemo(() => {
    switch (viewMode) {
      case "list":
        return "gap-3";
      case "compact":
        return "gap-4";
      default:
        return "gap-6";
    }
  }, [viewMode]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={cn("w-full overflow-auto", className)}
      style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className={cn(
                  "grid",
                  gapClass,
                  viewMode === "list" && "grid-cols-1",
                  viewMode === "compact" &&
                    "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
                  viewMode === "grid" &&
                    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                )}
              >
                {row.map((item, index) =>
                  renderItem(item, virtualRow.index * columnCount + index)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedGalleryGrid;
