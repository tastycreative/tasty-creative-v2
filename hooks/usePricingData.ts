import { useState, useEffect, useCallback } from 'react';

interface PricingItem {
  id: string;
  name: string;
  description?: string;
  price?: string;
}

interface PricingGroup {
  id: string;
  groupName: string;
  items: PricingItem[];
  pricing: Record<string, Record<string, string>>;
}

interface Creator {
  id: string;
  name: string;
  guaranteed?: string | null;
  [key: string]: any;
}

interface UsePricingDataReturn {
  pricingGroups: PricingGroup[];
  creators: Creator[];
  loading: boolean;
  error: string | null;
  getPricingForContent: (modelName: string, contentStyle: string) => PricingItem[];
  getBasePriceForContent: (modelName: string, contentItem: string) => string | null;
}

export function usePricingData(modelName?: string): UsePricingDataReturn {
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelName) {
      setPricingGroups([]);
      setCreators([]);
      return;
    }

    const fetchPricingData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/creators-db?creatorName=${encodeURIComponent(modelName)}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch pricing data: ${response.statusText}`);
        }

        const { pricingData, creators: fetchedCreators } = await response.json();

        setPricingGroups(pricingData || []);
        setCreators(fetchedCreators || []);

        console.log('📊 Fetched pricing data for model:', modelName, {
          groupsCount: pricingData?.length || 0,
          creatorsCount: fetchedCreators?.length || 0
        });

      } catch (err) {
        console.error('❌ Error fetching pricing data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing data');
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, [modelName]);

  // Map content styles to pricing groups and return relevant pricing items
  const getPricingForContent = useCallback((modelName: string, contentStyle: string): PricingItem[] => {
    if (!pricingGroups.length || !modelName) return [];

    // Find the model's pricing data
    const modelExists = creators.find(c => c.name.toLowerCase() === modelName.toLowerCase());
    if (!modelExists) return [];

    let relevantGroups: PricingGroup[] = [];

    switch (contentStyle) {
      case 'normal':
      case 'poll':
      case 'game':
        // For basic content, use Content Price Ranges
        relevantGroups = pricingGroups.filter(group => group.id === 'content-price-ranges');
        break;
      case 'ppv':
        // For PPV, use Bundle Contents with mid-range bundles
        relevantGroups = pricingGroups.filter(group => group.id === 'bundle-contents');
        break;
      case 'bundle':
        // For bundles, use Bundle Contents
        relevantGroups = pricingGroups.filter(group => group.id === 'bundle-contents');
        break;
      default:
        // Fallback to all groups
        relevantGroups = pricingGroups;
    }

    // Extract items that have pricing data for this model
    const availableItems: PricingItem[] = [];

    relevantGroups.forEach(group => {
      const modelPricing = group.pricing[modelName];
      if (modelPricing) {
        group.items.forEach(item => {
          const price = modelPricing[item.name];
          if (price && price !== '' && price !== '—') {
            availableItems.push({
              ...item,
              price: price
            });
          }
        });
      }
    });

    return availableItems;
  }, [pricingGroups, creators]);

  // Get base price for a specific content item
  const getBasePriceForContent = useCallback((modelName: string, contentItem: string): string | null => {
    if (!pricingGroups.length || !modelName || !contentItem) return null;

    // Search through all groups to find the pricing for this content item
    for (const group of pricingGroups) {
      const modelPricing = group.pricing[modelName];
      if (modelPricing && modelPricing[contentItem]) {
        const price = modelPricing[contentItem];
        return price !== '' && price !== '—' ? price : null;
      }
    }

    return null;
  }, [pricingGroups]);

  return {
    pricingGroups,
    creators,
    loading,
    error,
    getPricingForContent,
    getBasePriceForContent
  };
}