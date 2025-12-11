"use client";

import { useEffect, Dispatch, SetStateAction } from "react";
import { ViewMode } from "@/components/gallery/ViewModeSwitcher";
import { GalleryItem } from "@/types/gallery";
import { toast } from "sonner";

interface UseGalleryShortcutsProps {
  searchInputRef: React.RefObject<HTMLInputElement>;
  selectionMode: boolean;
  setSelectionMode: Dispatch<SetStateAction<boolean>>;
  clearSelection: () => void;
  selectAll: () => void;
  toggleSelectionMode: () => void;
  setShowShortcutsHelp: Dispatch<SetStateAction<boolean>>;
  showShortcutsHelp: boolean;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  viewMode: ViewMode;
  focusedIndex: number;
  setFocusedIndex: Dispatch<SetStateAction<number>>;
  paginatedContent: GalleryItem[];
  toggleSelection: (id: string) => void;
  handleToggleFavorite: (item: GalleryItem) => void;
  handleTogglePTR: (item: GalleryItem) => void;
  handleClearCache: () => void;
}

export function useGalleryShortcuts({
  searchInputRef,
  selectionMode,
  setSelectionMode,
  clearSelection,
  selectAll,
  toggleSelectionMode,
  setShowShortcutsHelp,
  showShortcutsHelp,
  setViewMode,
  viewMode,
  focusedIndex,
  setFocusedIndex,
  paginatedContent,
  toggleSelection,
  handleToggleFavorite,
  handleTogglePTR,
  handleClearCache,
}: UseGalleryShortcutsProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const columnCount =
        viewMode === "list" ? 1 : viewMode === "compact" ? 6 : 4;

      switch (e.key.toLowerCase()) {
        case "s":
          // Toggle selection mode
          toggleSelectionMode();
          e.preventDefault();
          break;

        case "f":
        case "/":
          // Focus search bar
          searchInputRef.current?.focus();
          e.preventDefault();
          break;

        case "escape":
          // Clear selection / Close modals
          if (selectionMode) {
            clearSelection();
            setSelectionMode(false);
          }
          if (showShortcutsHelp) {
            setShowShortcutsHelp(false);
          }
          setFocusedIndex(-1);
          break;

        case "a":
          // Select all visible items (Cmd/Ctrl + A)
          if (e.metaKey || e.ctrlKey) {
            if (selectionMode) {
              selectAll();
              e.preventDefault();
            }
          }
          break;

        case "d":
          // Deselect all (Cmd/Ctrl + D)
          if (e.metaKey || e.ctrlKey) {
            if (selectionMode) {
              clearSelection();
              e.preventDefault();
            }
          }
          break;

        case "?":
          // Show keyboard shortcuts help
          setShowShortcutsHelp((prev) => !prev);
          e.preventDefault();
          break;

        // View mode shortcuts
        case "g":
          if (!e.metaKey && !e.ctrlKey) {
            setViewMode("grid");
            e.preventDefault();
          }
          break;

        case "l":
          if (!e.metaKey && !e.ctrlKey) {
            setViewMode("list");
            e.preventDefault();
          }
          break;

        case "c":
          if (!e.metaKey && !e.ctrlKey) {
            setViewMode("compact");
            e.preventDefault();
          }
          break;

        case "r":
          if (!e.metaKey && !e.ctrlKey) {
            handleClearCache();
            e.preventDefault();
          }
          break;

        // Arrow key navigation
        case "arrowleft":
          if (focusedIndex > 0) {
            setFocusedIndex((prev) => prev - 1);
            e.preventDefault();
          }
          break;

        case "arrowright":
          if (focusedIndex < paginatedContent.length - 1) {
            setFocusedIndex((prev) => prev + 1);
            e.preventDefault();
          }
          break;

        case "arrowup":
          if (focusedIndex >= columnCount) {
            setFocusedIndex((prev) => prev - columnCount);
            e.preventDefault();
          }
          break;

        case "arrowdown":
          if (focusedIndex < paginatedContent.length - columnCount) {
            setFocusedIndex((prev) => prev + columnCount);
            e.preventDefault();
          } else if (focusedIndex === -1 && paginatedContent.length > 0) {
            setFocusedIndex(0);
            e.preventDefault();
          }
          break;

        case " ": // Space
          // Space to toggle selection when focused
          if (
            selectionMode &&
            focusedIndex >= 0 &&
            focusedIndex < paginatedContent.length
          ) {
            toggleSelection(paginatedContent[focusedIndex].id);
            e.preventDefault();
          }
          break;

        case "h":
          // Toggle favorite for focused item
          if (focusedIndex >= 0 && focusedIndex < paginatedContent.length) {
            handleToggleFavorite(paginatedContent[focusedIndex]);
            e.preventDefault();
          }
          break;

        case "p":
          // Toggle PTR for focused item
          if (
            !e.metaKey &&
            !e.ctrlKey &&
            focusedIndex >= 0 &&
            focusedIndex < paginatedContent.length
          ) {
            handleTogglePTR(paginatedContent[focusedIndex]);
            e.preventDefault();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    selectionMode,
    showShortcutsHelp,
    viewMode,
    focusedIndex,
    paginatedContent,
    // dependencies for actions
    searchInputRef,
    setSelectionMode,
    clearSelection,
    selectAll,
    toggleSelectionMode,
    setShowShortcutsHelp,
    setViewMode,
    setFocusedIndex,
    toggleSelection,
    handleToggleFavorite,
    handleTogglePTR,
    handleClearCache,
  ]);
}
