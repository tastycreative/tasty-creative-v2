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
    console.log('🔄 Pricing rotation effect triggered:', {
      allPricingDataLength: allPricingData.length,
      isPricingPreviewLoading,
      creatorsLength: creators?.length,
      pricingPreviewLength: pricingPreview.length
    });

    if (
      allPricingData.length > 0 &&
      !isPricingPreviewLoading &&
      creators &&
      creators.length > 0
    ) {
      console.log('✅ Starting pricing rotation intervals');
      
      // Reset progress to 0 at start
      setPricingRotationProgress(0);
      
      // Rotation and progress sync
      let progressValue = 0;
      
      const syncedInterval = setInterval(() => {
        console.log('🔄 Rotating pricing preview...');
        rotatePricingPreview(); // This will reset progress to 0 in the store
        progressValue = 0; // Reset local tracking
        setPricingRotationProgress(0); // Ensure UI starts from 0
      }, 5000); // 5 seconds

      // Progress bar animation - perfectly synced
      const progressInterval = setInterval(() => {
        progressValue += 2; // 2% every 100ms = 100% in 5000ms
        if (progressValue > 100) {
          progressValue = 100; // Cap at 100%
        }
        
        setPricingRotationProgress(progressValue);
        
        if (progressValue % 20 === 0) { // Log every 20%
          console.log(`📊 Progress: ${progressValue}%`);
        }
      }, 100); // 100ms intervals

      return () => {
        console.log('🛑 Clearing pricing rotation intervals');
        clearInterval(syncedInterval);
        clearInterval(progressInterval);
      };
    } else {
      console.log('❌ Pricing rotation conditions not met');
    }
  }, [allPricingData, isPricingPreviewLoading, creators, setPricingRotationProgress, rotatePricingPreview]);

  return {
    pricingPreview,
    pricingRotationProgress,
  };
};