import { useState, useEffect } from "react";

const WELCOME_MODAL_KEY = "pod-new-welcome-viewed";
const WELCOME_MODAL_VERSION = "2.0.0"; // Update this when you want to show modal again

interface WelcomeModalState {
  isOpen: boolean;
  hasViewed: boolean;
  shouldAutoShow: boolean;
}

export function useWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasViewed, setHasViewed] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    // Check if user has seen the welcome modal for this version
    const checkWelcomeStatus = () => {
      try {
        const stored = localStorage.getItem(WELCOME_MODAL_KEY);
        if (stored) {
          const data = JSON.parse(stored);

          // If version matches, user has seen it
          if (data.version === WELCOME_MODAL_VERSION) {
            setHasViewed(true);
            return false; // Don't show
          }
        }

        // User hasn't seen this version yet
        setHasViewed(false);
        return true; // Should show
      } catch (error) {
        console.error("Error checking welcome modal status:", error);
        return false;
      }
    };

    const shouldShow = checkWelcomeStatus();

    // Auto-show modal after a short delay if user hasn't seen it
    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000); // 1 second delay for smooth page load

      return () => clearTimeout(timer);
    }
  }, []);

  const markAsViewed = () => {
    try {
      const data = {
        version: WELCOME_MODAL_VERSION,
        viewedAt: new Date().toISOString(),
        dismissed: false,
      };
      localStorage.setItem(WELCOME_MODAL_KEY, JSON.stringify(data));
      setHasViewed(true);
    } catch (error) {
      console.error("Error marking welcome modal as viewed:", error);
    }
  };

  const markAsDismissed = (permanent: boolean = false) => {
    try {
      const data = {
        version: WELCOME_MODAL_VERSION,
        viewedAt: new Date().toISOString(),
        dismissed: true,
        dismissedPermanently: permanent,
      };
      localStorage.setItem(WELCOME_MODAL_KEY, JSON.stringify(data));
      setHasViewed(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Error dismissing welcome modal:", error);
    }
  };

  const openModal = () => {
    setIsOpen(true);
    if (!hasViewed) {
      markAsViewed();
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    if (!hasViewed) {
      markAsViewed();
    }
  };

  return {
    isOpen,
    hasViewed,
    openModal,
    closeModal,
    markAsViewed,
    markAsDismissed,
  };
}
