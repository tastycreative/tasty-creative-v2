import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useSelectedModelStore from '@/store/useSelectedModelStore';

/**
 * Hook for managing cleanup of persisted model data
 * Provides multiple strategies for when to clear the data
 */
export function useModelDataCleanup(options?: {
  clearOnRouteChange?: boolean;  // Clear when navigating away from model pages
  clearOnWindowClose?: boolean;   // Clear when browser/tab closes
  clearOnInactivity?: number;     // Clear after X milliseconds of inactivity
  clearOnModelMismatch?: string;  // Clear if current model doesn't match stored
}) {
  const pathname = usePathname();
  const { 
    selectedModel, 
    clearSelectedModel, 
    isExpired,
    getTimeUntilExpiration 
  } = useSelectedModelStore();

  // Strategy 1: Clear on route change (navigating away from model pages)
  useEffect(() => {
    if (!options?.clearOnRouteChange) return;
    
    // Check if we've navigated away from model-related pages
    const isModelPage = pathname?.includes('/my-models/') || 
                       pathname?.includes('/pod-new/');
    
    if (!isModelPage && selectedModel) {
      console.log('Navigated away from model pages, clearing data...');
      clearSelectedModel();
    }
  }, [pathname, options?.clearOnRouteChange, selectedModel, clearSelectedModel]);

  // Strategy 2: Clear on window/tab close
  useEffect(() => {
    if (!options?.clearOnWindowClose) return;

    const handleWindowClose = () => {
      clearSelectedModel();
    };

    window.addEventListener('beforeunload', handleWindowClose);
    return () => window.removeEventListener('beforeunload', handleWindowClose);
  }, [options?.clearOnWindowClose, clearSelectedModel]);

  // Strategy 3: Clear after inactivity
  useEffect(() => {
    if (!options?.clearOnInactivity) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('Clearing data due to inactivity...');
        clearSelectedModel();
      }, options.clearOnInactivity);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start the timer
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [options?.clearOnInactivity, clearSelectedModel]);

  // Strategy 4: Clear if model mismatch
  useEffect(() => {
    if (!options?.clearOnModelMismatch || !selectedModel) return;
    
    if (selectedModel.name !== options.clearOnModelMismatch) {
      console.log('Model mismatch detected, clearing old data...');
      clearSelectedModel();
    }
  }, [options?.clearOnModelMismatch, selectedModel, clearSelectedModel]);

  // Strategy 5: Check expiration on mount and periodically
  useEffect(() => {
    // Check on mount
    if (isExpired()) {
      console.log('Data has expired, clearing...');
      clearSelectedModel();
      return;
    }

    // Check every minute for expiration
    const interval = setInterval(() => {
      if (isExpired()) {
        console.log('Data has expired, clearing...');
        clearSelectedModel();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isExpired, clearSelectedModel]);

  // Utility function to format remaining time
  const getFormattedTimeRemaining = useCallback(() => {
    const remaining = getTimeUntilExpiration();
    if (!remaining) return null;

    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }, [getTimeUntilExpiration]);

  return {
    clearData: clearSelectedModel,
    isExpired: isExpired(),
    timeRemaining: getFormattedTimeRemaining(),
    hasData: !!selectedModel,
  };
}

/**
 * Pre-configured cleanup strategies
 */
export const CleanupStrategies = {
  // Conservative: Only clear on expiration (2 hours by default)
  CONSERVATIVE: {},
  
  // Moderate: Clear on navigation away and expiration
  MODERATE: {
    clearOnRouteChange: true,
  },
  
  // Aggressive: Clear on navigation, tab close, and 30 min inactivity
  AGGRESSIVE: {
    clearOnRouteChange: true,
    clearOnWindowClose: true,
    clearOnInactivity: 30 * 60 * 1000, // 30 minutes
  },
  
  // Session-based: Clear when browser closes
  SESSION_ONLY: {
    clearOnWindowClose: true,
  },
  
  // Activity-based: Clear after 15 minutes of inactivity
  ACTIVITY_BASED: {
    clearOnInactivity: 15 * 60 * 1000, // 15 minutes
  },
};

/**
 * Example usage:
 * 
 * // Use pre-configured strategy
 * useModelDataCleanup(CleanupStrategies.MODERATE);
 * 
 * // Or custom configuration
 * useModelDataCleanup({
 *   clearOnRouteChange: true,
 *   clearOnInactivity: 10 * 60 * 1000, // 10 minutes
 * });
 */