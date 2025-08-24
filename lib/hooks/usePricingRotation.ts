"use client";

import { useEffect } from 'react';
import { usePricingPreview } from '@/lib/stores/podStore';

export const usePricingRotation = (creators: any[]) => {
  const { 
    preview: pricingPreview,
    allData: allPricingData,
    progress: pricingRotationProgress,
    loading: isPricingPreviewLoading,
    setPricingRotationProgress,
    rotatePricingPreview
  } = usePricingPreview();

  // Auto-rotate pricing preview every 5 seconds with progress bar
  useEffect(() => {
    if (
      allPricingData.length > 0 &&
      !isPricingPreviewLoading &&
      creators &&
      creators.length > 0
    ) {
      const interval = setInterval(() => {
        rotatePricingPreview(); // Use store method for rotation
      }, 5000); // 5 seconds

      // Progress bar animation
      const progressInterval = setInterval(() => {
        setPricingRotationProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 2; // Update every 100ms, reach 100% in 5 seconds
        });
      }, 100);

      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    }
  }, [allPricingData, isPricingPreviewLoading, creators, setPricingRotationProgress, rotatePricingPreview]);

  return {
    pricingPreview,
    pricingRotationProgress,
  };
};