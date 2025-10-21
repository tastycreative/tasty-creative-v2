"use client";

import { useState, useEffect } from 'react';


// Simple cache to prevent duplicate requests
const cache = new Map<string, { data: CreatorsData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCreatorsDB = (creatorName?: string, assignedCreators?: any[]) => {
  const [data, setData] = useState<CreatorsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = async (specificCreator?: string) => {
    const cacheKey = specificCreator || 'all';
    const cached = cache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = specificCreator 
        ? `/api/creators-db?creatorName=${encodeURIComponent(specificCreator)}`
        : '/api/creators-db';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch creators: ${response.statusText}`);
      }
      
      const creatorsData = await response.json();
      
      // Cache the result
      cache.set(cacheKey, { data: creatorsData, timestamp: Date.now() });
      setData(creatorsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch creators';
      setError(errorMessage);
      console.error('Error fetching creators from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators(creatorName);
  }, [creatorName]); // Removed assignedCreators dependency

  return {
    data,
    creators: data?.creators || [],
    pricingData: data?.pricingData || [],
    loading,
    error,
    refetch: () => fetchCreators(creatorName)
  };
};