"use client";

import { useState, useEffect } from 'react';

interface Creator {
  id: string;
  name: string;
  guaranteed?: string;
  status?: string;
  launchDate?: string;
  referrerName?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  profileLink?: string;
  personalityType?: string;
  commonTerms?: string;
  commonEmojis?: string;
  restrictedTermsEmojis?: string;
  notes?: string;
  generalNotes?: string;
  contentDetails?: any;
  modelDetails?: {
    id: string;
    full_name?: string;
    age?: string;
    birthday?: string;
    height?: string;
    weight?: string;
    clothing_size?: string;
    ethnicity?: string;
    birthplace?: string;
    current_city?: string;
    timezone?: string;
    background?: string;
    favorite_colors?: string;
    interests?: string;
    personality?: string;
    amazon_wishlist?: string;
    clothing_items?: string;
    content_offered?: string;
    custom_min_price?: string;
    favorite_emojis?: string;
    keywords?: string;
    limitations?: string;
    oftv_channel_interest?: string;
    tone_language?: string;
    video_call_min_price?: string;
    client_name?: string;
    mm_restrictions?: string;
    verbiage_restrictions?: string;
    wall_restrictions?: string;
  };
}

interface PricingGroup {
  id: string;
  groupName: string;
  items: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  pricing: Record<string, Record<string, string>>;
}

interface CreatorsData {
  creators: Creator[];
  pricingData: PricingGroup[];
}

export const useCreatorsDB = (creatorName?: string) => {
  const [data, setData] = useState<CreatorsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = async (specificCreator?: string) => {
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
  }, [creatorName]);

  return {
    data,
    creators: data?.creators || [],
    pricingData: data?.pricingData || [],
    loading,
    error,
    refetch: () => fetchCreators(creatorName)
  };
};