import { useMemo, useCallback } from "react";
import { 
  useInfiniteModels, 
  useModelsStats, 
  UseModelsOptions 
} from "./usePodNewModels";

// Memoized search/filter computations
export function useOptimizedModelsData(options: UseModelsOptions) {
  // Original data fetching with React Query
  const modelsQuery = useInfiniteModels(options);
  const statsQuery = useModelsStats(options);

  // Expensive computation: Flatten and transform all models
  const processedModels = useMemo(() => {
    if (!modelsQuery.data?.pages) return [];
    
    const allModels = modelsQuery.data.pages.flatMap(page => page.models);
    
    // Expensive transformations with memoization
    return allModels.map((model, index) => ({
      ...model,
      // Pre-compute expensive values
      displayName: model.name.trim(),
      searchableText: `${model.name} ${model.referrerName || ''} ${model.personalityType || ''}`.toLowerCase(),
      statusLabel: model.status.charAt(0).toUpperCase() + model.status.slice(1).toLowerCase(),
      hasImage: Boolean(model.profileImage),
      hasSocialLinks: Boolean(model.instagram || model.twitter || model.tiktok),
      revenueFormatted: model.stats?.monthlyRevenue 
        ? `$${model.stats.monthlyRevenue.toLocaleString()}` 
        : null,
      subscribersFormatted: model.stats?.subscribers 
        ? model.stats.subscribers.toLocaleString()
        : null,
      // Virtual list optimization
      virtualIndex: index,
    }));
  }, [modelsQuery.data?.pages]);

  // Memoized filter functions for better performance
  const filterFunctions = useMemo(() => ({
    // Pre-compiled search filter
    searchFilter: (searchQuery: string) => {
      if (!searchQuery.trim()) return () => true;
      const lowerQuery = searchQuery.toLowerCase();
      return (model: typeof processedModels[0]) => 
        model.searchableText.includes(lowerQuery);
    },

    // Pre-compiled status filter
    statusFilter: (status: string) => {
      if (status === "all") return () => true;
      return (model: typeof processedModels[0]) => 
        model.status.toLowerCase() === status.toLowerCase();
    },

    // Pre-compiled sort functions
    sortFunctions: {
      name: (a: typeof processedModels[0], b: typeof processedModels[0]) => 
        a.displayName.localeCompare(b.displayName),
      date: (a: typeof processedModels[0], b: typeof processedModels[0]) => 
        new Date(b.launchDate || 0).getTime() - new Date(a.launchDate || 0).getTime(),
      revenue: (a: typeof processedModels[0], b: typeof processedModels[0]) => 
        (b.stats?.monthlyRevenue || 0) - (a.stats?.monthlyRevenue || 0),
    },
  }), []);

  // Memoized filtered and sorted models
  const filteredModels = useMemo(() => {
    let filtered = processedModels;

    // Apply search filter
    if (options.search) {
      const searchFn = filterFunctions.searchFilter(options.search);
      filtered = filtered.filter(searchFn);
    }

    // Apply status filter
    if (options.status && options.status !== "all") {
      const statusFn = filterFunctions.statusFilter(options.status);
      filtered = filtered.filter(statusFn);
    }

    // Apply sorting
    if (options.sort && filterFunctions.sortFunctions[options.sort]) {
      filtered = [...filtered].sort(filterFunctions.sortFunctions[options.sort]);
    }

    return filtered;
  }, [processedModels, options.search, options.status, options.sort, filterFunctions]);

  // Memoized statistics calculations
  const computedStats = useMemo(() => {
    const totalModels = filteredModels.length;
    const activeModels = filteredModels.filter(m => m.status.toLowerCase() === 'active').length;
    const totalRevenue = filteredModels.reduce((sum, m) => sum + (m.stats?.totalRevenue || 0), 0);
    const avgRevenue = totalModels > 0 ? totalRevenue / totalModels : 0;
    
    return {
      total: totalModels,
      active: activeModels,
      dropped: totalModels - activeModels,
      activePercentage: totalModels > 0 ? (activeModels / totalModels) * 100 : 0,
      totalRevenue,
      avgRevenue,
    };
  }, [filteredModels]);

  // Memoized pagination info
  const paginationInfo = useMemo(() => ({
    totalPages: modelsQuery.data?.pages.length || 0,
    totalItems: processedModels.length,
    filteredItems: filteredModels.length,
    hasNextPage: modelsQuery.hasNextPage,
    isFetching: modelsQuery.isFetchingNextPage,
  }), [
    modelsQuery.data?.pages.length,
    processedModels.length,
    filteredModels.length,
    modelsQuery.hasNextPage,
    modelsQuery.isFetchingNextPage,
  ]);

  // Optimized callback handlers
  const optimizedHandlers = useMemo(() => ({
    // Debounced refetch
    refetchModels: modelsQuery.refetch,
    
    // Optimized fetch next page
    fetchNextPage: modelsQuery.fetchNextPage,
    
    // Batch model operations
    batchSelectModels: (indices: number[]) => {
      return indices.map(index => filteredModels[index]).filter(Boolean);
    },
    
    // Quick model lookup by ID
    findModelById: (id: string) => {
      return processedModels.find(model => model.id === id);
    },
    
    // Performance-optimized search
    quickSearch: (query: string, limit: number = 10) => {
      if (!query.trim()) return [];
      const searchFn = filterFunctions.searchFilter(query);
      return processedModels.filter(searchFn).slice(0, limit);
    },
  }), [
    modelsQuery.refetch,
    modelsQuery.fetchNextPage,
    filteredModels,
    processedModels,
    filterFunctions,
  ]);

  return {
    // Data
    models: filteredModels,
    allModels: processedModels,
    stats: computedStats,
    serverStats: statsQuery.data, // Original server stats
    pagination: paginationInfo,
    
    // Handlers
    handlers: optimizedHandlers,
    
    // Query states
    isLoading: modelsQuery.isLoading,
    isError: modelsQuery.isError,
    error: modelsQuery.error,
    isFetchingNextPage: modelsQuery.isFetchingNextPage,
    
    // Performance metrics (for monitoring)
    performance: {
      totalProcessed: processedModels.length,
      filteredCount: filteredModels.length,
      filterRatio: processedModels.length > 0 
        ? filteredModels.length / processedModels.length 
        : 0,
    },
  };
}

// Hook for expensive model calculations with memoization
export function useModelAnalytics(models: ModelDetails[]) {
  return useMemo(() => {
    if (!models.length) {
      return {
        topPerformers: [],
        revenueDistribution: {},
        statusBreakdown: {},
        launchDateAnalysis: {},
        socialMediaCoverage: {},
      };
    }

    // Top performers by revenue
    const topPerformers = [...models]
      .filter(m => m.stats?.monthlyRevenue)
      .sort((a, b) => (b.stats?.monthlyRevenue || 0) - (a.stats?.monthlyRevenue || 0))
      .slice(0, 10);

    // Revenue distribution
    const revenueRanges = {
      '0-1k': 0,
      '1k-5k': 0,
      '5k-10k': 0,
      '10k-25k': 0,
      '25k+': 0,
    };
    
    models.forEach(model => {
      const revenue = model.stats?.monthlyRevenue || 0;
      if (revenue === 0) revenueRanges['0-1k']++;
      else if (revenue < 5000) revenueRanges['1k-5k']++;
      else if (revenue < 10000) revenueRanges['5k-10k']++;
      else if (revenue < 25000) revenueRanges['10k-25k']++;
      else revenueRanges['25k+']++;
    });

    // Status breakdown
    const statusBreakdown = models.reduce((acc, model) => {
      const status = model.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Launch date analysis (by year)
    const launchDateAnalysis = models.reduce((acc, model) => {
      if (model.launchDate) {
        const year = new Date(model.launchDate).getFullYear();
        if (!isNaN(year)) {
          acc[year] = (acc[year] || 0) + 1;
        }
      }
      return acc;
    }, {} as Record<number, number>);

    // Social media coverage
    const socialMediaCoverage = {
      hasInstagram: models.filter(m => m.instagram).length,
      hasTwitter: models.filter(m => m.twitter).length,
      hasTiktok: models.filter(m => m.tiktok).length,
      hasAny: models.filter(m => m.instagram || m.twitter || m.tiktok).length,
      hasAll: models.filter(m => m.instagram && m.twitter && m.tiktok).length,
    };

    return {
      topPerformers,
      revenueDistribution: revenueRanges,
      statusBreakdown,
      launchDateAnalysis,
      socialMediaCoverage,
      totalModels: models.length,
    };
  }, [models]);
}

// Hook for optimized model grouping (expensive operation)
export function useOptimizedModelGrouping(models: ModelDetails[], groupBy: 'status' | 'referrer' | 'year' | 'revenue') {
  return useMemo(() => {
    const groups = new Map<string, ModelDetails[]>();
    
    models.forEach(model => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'status':
          groupKey = model.status.toLowerCase();
          break;
        case 'referrer':
          groupKey = model.referrerName || 'Unknown';
          break;
        case 'year':
          groupKey = model.launchDate 
            ? new Date(model.launchDate).getFullYear().toString()
            : 'Unknown';
          break;
        case 'revenue':
          const revenue = model.stats?.monthlyRevenue || 0;
          if (revenue === 0) groupKey = '0-1k';
          else if (revenue < 5000) groupKey = '1k-5k';
          else if (revenue < 10000) groupKey = '5k-10k';
          else if (revenue < 25000) groupKey = '10k-25k';
          else groupKey = '25k+';
          break;
        default:
          groupKey = 'Other';
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)?.push(model);
    });
    
    // Convert to sorted array for consistent rendering
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, models]) => ({
        groupKey: key,
        models,
        count: models.length,
      }));
  }, [models, groupBy]);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const startTime = useMemo(() => performance.now(), []);
  
  return useCallback((operation: string) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - ${operation}: ${duration.toFixed(2)}ms`);
    }
    
    // Could send to analytics service in production
    return duration;
  }, [componentName, startTime]);
}