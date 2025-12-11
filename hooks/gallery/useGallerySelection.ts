"use client";

import { useState, useCallback } from "react";
import { GalleryItem } from "@/types/gallery";

interface UseGallerySelectionProps {
  items: GalleryItem[];
}

export function useGallerySelection({ items }: UseGallerySelectionProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);

  // Toggle selection for a single item
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Select all items currently in view
  const selectAll = useCallback(() => {
    const allIds = new Set(items.map((item) => item.id));
    setSelectedIds(allIds);
  }, [items]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle selection mode on/off
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    // Optionally clear selection when exiting mode, though often users prefer to keep it
    if (selectionMode) {
      clearSelection();
    }
  }, [selectionMode, clearSelection]);

  // Range selection handler for shift+click
  const handleRangeSelection = useCallback(
    (clickedIndex: number) => {
      if (lastSelectedIndex === -1) {
        setLastSelectedIndex(clickedIndex);
        return;
      }

      const start = Math.min(lastSelectedIndex, clickedIndex);
      const end = Math.max(lastSelectedIndex, clickedIndex);
      const itemsInRange = items.slice(start, end + 1);

      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        itemsInRange.forEach((item) => newSet.add(item.id));
        return newSet;
      });
    },
    [lastSelectedIndex, items]
  );

  // Enhanced toggle selection with shift support
  const handleToggleSelectionWithShift = useCallback(
    (id: string, index: number, shiftKey: boolean) => {
      if (shiftKey && selectionMode && lastSelectedIndex !== -1) {
        handleRangeSelection(index);
      } else {
        toggleSelection(id);
        setLastSelectedIndex(index);
      }
    },
    [selectionMode, lastSelectedIndex, handleRangeSelection, toggleSelection]
  );

  // Get array of selected items objects
  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  return {
    selectionMode,
    setSelectionMode,
    selectedIds,
    setSelectedIds,
    lastSelectedIndex,
    setLastSelectedIndex,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    handleRangeSelection,
    handleToggleSelectionWithShift,
    selectedItems,
  };
}
