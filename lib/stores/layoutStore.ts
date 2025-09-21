import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import React from 'react';

interface LayoutState {
  // Sidebar states
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;

  // Layout modes
  focusMode: boolean;

  // Responsive states
  isMobile: boolean;
  isTablet: boolean;

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  collapseLeftSidebar: () => void;
  expandLeftSidebar: () => void;
  collapseRightSidebar: () => void;
  expandRightSidebar: () => void;
  toggleFocusMode: () => void;
  setFocusMode: (enabled: boolean) => void;
  setResponsiveState: (isMobile: boolean, isTablet: boolean) => void;

  // Smart layout management
  optimizeForBoard: () => void;
  resetLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // Initial state
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      focusMode: false,
      isMobile: false,
      isTablet: false,

      // Sidebar actions
      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebarCollapsed: !state.leftSidebarCollapsed,
          focusMode: false // Exit focus mode when manually toggling sidebars
        })),

      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebarCollapsed: !state.rightSidebarCollapsed,
          focusMode: false // Exit focus mode when manually toggling sidebars
        })),

      collapseLeftSidebar: () =>
        set({ leftSidebarCollapsed: true }),

      expandLeftSidebar: () =>
        set({ leftSidebarCollapsed: false }),

      collapseRightSidebar: () =>
        set({ rightSidebarCollapsed: true }),

      expandRightSidebar: () =>
        set({ rightSidebarCollapsed: false }),

      // Focus mode actions
      toggleFocusMode: () => {
        const { focusMode } = get();
        set({
          focusMode: !focusMode,
          leftSidebarCollapsed: !focusMode,
          rightSidebarCollapsed: !focusMode,
        });
      },

      setFocusMode: (enabled: boolean) =>
        set({
          focusMode: enabled,
          leftSidebarCollapsed: enabled,
          rightSidebarCollapsed: enabled,
        }),

      // Responsive state
      setResponsiveState: (isMobile: boolean, isTablet: boolean) =>
        set({ isMobile, isTablet }),

      // Smart layout management
      optimizeForBoard: () => {
        const { isMobile, isTablet } = get();

        if (isMobile) {
          // On mobile, hide both sidebars
          set({
            leftSidebarCollapsed: true,
            rightSidebarCollapsed: true,
          });
        } else if (isTablet) {
          // On tablet, hide left sidebar but keep right for team info
          set({
            leftSidebarCollapsed: true,
            rightSidebarCollapsed: false,
          });
        } else {
          // On desktop, keep left for navigation but collapse right to maximize board space
          set({
            leftSidebarCollapsed: false,
            rightSidebarCollapsed: true,
          });
        }
      },

      resetLayout: () =>
        set({
          leftSidebarCollapsed: false,
          rightSidebarCollapsed: false,
          focusMode: false,
        }),
    }),
    {
      name: 'layout-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        rightSidebarCollapsed: state.rightSidebarCollapsed,
        focusMode: state.focusMode,
      }),
    }
  )
);

// Hook for responsive detection
export const useResponsiveLayout = () => {
  const { isMobile, isTablet, setResponsiveState } = useLayoutStore();

  React.useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;

      if (newIsMobile !== isMobile || newIsTablet !== isTablet) {
        setResponsiveState(newIsMobile, newIsTablet);
      }
    };

    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, [isMobile, isTablet, setResponsiveState]);

  return { isMobile, isTablet };
};