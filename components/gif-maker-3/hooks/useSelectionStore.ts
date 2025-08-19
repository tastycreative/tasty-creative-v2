/**
 * Selection store to eliminate flicker on clip selection
 * Uses granular state slices and memoization to prevent unnecessary re-renders
 */

import { create } from "zustand";

interface SelectionState {
  // Current selections
  selectedClipId: string | null;
  selectedTextOverlayId: string | null;
  selectedBlurOverlayId: string | null;

  // Transform state for selected clip
  isTransforming: boolean;
  showTransformHandles: boolean;
  transformMode: "move" | "scale" | "rotate" | null;

  // Actions
  setSelectedClip: (id: string | null) => void;
  setSelectedTextOverlay: (id: string | null) => void;
  setSelectedBlurOverlay: (id: string | null) => void;
  clearAllSelections: () => void;

  // Transform actions
  setTransforming: (isTransforming: boolean) => void;
  setShowTransformHandles: (show: boolean) => void;
  setTransformMode: (mode: "move" | "scale" | "rotate" | null) => void;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  // Initial state
  selectedClipId: null,
  selectedTextOverlayId: null,
  selectedBlurOverlayId: null,
  isTransforming: false,
  showTransformHandles: false,
  transformMode: null,

  // Selection actions
  setSelectedClip: (id) => {
    const current = get();
    if (current.selectedClipId === id) return; // Prevent unnecessary updates

    set({
      selectedClipId: id,
      selectedTextOverlayId: null, // Clear other selections
      selectedBlurOverlayId: null,
      isTransforming: false,
      transformMode: null,
    });
  },

  setSelectedTextOverlay: (id) => {
    const current = get();
    if (current.selectedTextOverlayId === id) return;

    set({
      selectedTextOverlayId: id,
      selectedClipId: null, // Clear other selections
      selectedBlurOverlayId: null,
      isTransforming: false,
      transformMode: null,
    });
  },

  setSelectedBlurOverlay: (id) => {
    const current = get();
    if (current.selectedBlurOverlayId === id) return;

    set({
      selectedBlurOverlayId: id,
      selectedClipId: null, // Clear other selections
      selectedTextOverlayId: null,
      isTransforming: false,
      transformMode: null,
    });
  },

  clearAllSelections: () =>
    set({
      selectedClipId: null,
      selectedTextOverlayId: null,
      selectedBlurOverlayId: null,
      isTransforming: false,
      transformMode: null,
    }),

  // Transform actions
  setTransforming: (isTransforming) => set({ isTransforming }),

  setShowTransformHandles: (show) => set({ showTransformHandles: show }),

  setTransformMode: (mode) => set({ transformMode: mode }),
}));

// Granular selectors to prevent unnecessary re-renders
export const useSelectedClipId = () =>
  useSelectionStore((state) => state.selectedClipId);
export const useSelectedTextOverlayId = () =>
  useSelectionStore((state) => state.selectedTextOverlayId);
export const useSelectedBlurOverlayId = () =>
  useSelectionStore((state) => state.selectedBlurOverlayId);

export const useIsClipSelected = (clipId: string) =>
  useSelectionStore((state) => state.selectedClipId === clipId);

export const useIsTextOverlaySelected = (overlayId: string) =>
  useSelectionStore((state) => state.selectedTextOverlayId === overlayId);

export const useIsBlurOverlaySelected = (overlayId: string) =>
  useSelectionStore((state) => state.selectedBlurOverlayId === overlayId);

// Transform selectors - individual selectors to prevent object creation
export const useIsTransforming = () => useSelectionStore((state) => state.isTransforming);
export const useShowTransformHandles = () => useSelectionStore((state) => state.showTransformHandles);
export const useTransformMode = () => useSelectionStore((state) => state.transformMode);

// Individual action selectors to prevent subscription conflicts
export const useSetSelectedClip = () =>
  useSelectionStore((state) => state.setSelectedClip);
export const useSetSelectedTextOverlay = () =>
  useSelectionStore((state) => state.setSelectedTextOverlay);
export const useSetSelectedBlurOverlay = () =>
  useSelectionStore((state) => state.setSelectedBlurOverlay);
export const useClearAllSelections = () =>
  useSelectionStore((state) => state.clearAllSelections);
export const useSetTransforming = () =>
  useSelectionStore((state) => state.setTransforming);
export const useSetShowTransformHandles = () =>
  useSelectionStore((state) => state.setShowTransformHandles);
export const useSetTransformMode = () =>
  useSelectionStore((state) => state.setTransformMode);
