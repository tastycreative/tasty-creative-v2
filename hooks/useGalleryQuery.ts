/**
 * React Query hooks for gallery data management
 * Provides caching, optimistic updates, and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGalleryData,
  fetchFavoritesData,
  fetchReleasesData,
  toggleFavorite,
  togglePTR,
  markPTRAsSent,
  GalleryApiResponse
} from '@/services/gallery/api';
import { GalleryItem } from '@/types/gallery';
import { toast } from 'sonner';

// Query keys for cache management
export const QUERY_KEYS = {
  gallery: ['gallery'],
  favorites: ['gallery', 'favorites'],
  releases: ['gallery', 'releases'],
} as const;

/**
 * Hook to fetch all gallery data
 * Optimized cache strategy to reduce unnecessary API calls
 */
export function useGalleryData() {
  return useQuery({
    queryKey: QUERY_KEYS.gallery,
    queryFn: fetchGalleryData,
    staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Use cache if available
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
  });
}

/**
 * Hook to fetch favorites data
 * Optimized cache strategy
 */
export function useFavoritesData() {
  return useQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: fetchFavoritesData,
    staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch releases data
 * Optimized cache strategy
 */
export function useReleasesData() {
  return useQuery({
    queryKey: QUERY_KEYS.releases,
    queryFn: fetchReleasesData,
    staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to toggle favorite with optimistic updates
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, action, userId }: { item: GalleryItem; action: 'add' | 'remove'; userId?: string }) => {
      // Extract raw ID without table prefix for API
      const rawItemId = item.tableName && item.id.startsWith(`${item.tableName}_`)
        ? item.id.substring(item.tableName.length + 1)
        : item.id;

      await toggleFavorite(rawItemId, item.tableName || 'default', item.title, action, userId);
    },
    
    // Optimistic update - immediate UI feedback
    onMutate: async ({ item, action }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.gallery });

      // Snapshot the previous value
      const previousGalleryData = queryClient.getQueryData<GalleryApiResponse>(QUERY_KEYS.gallery);

      // Optimistically update the cache
      if (previousGalleryData) {
        queryClient.setQueryData<GalleryApiResponse>(QUERY_KEYS.gallery, (old) => ({
          ...old!,
          items: old!.items.map(i => 
            i.id === item.id 
              ? { ...i, isFavorite: action === 'add' } 
              : i
          ),
          breakdown: {
            ...old!.breakdown,
            favorites: action === 'add' 
              ? old!.breakdown.favorites + 1 
              : Math.max(0, old!.breakdown.favorites - 1)
          }
        }));
      }

      // Show immediate user feedback
      toast.success(action === 'add' ? "Added to favorites" : "Removed from favorites");

      // Return context for rollback
      return { previousGalleryData, item, action };
    },

    // On error, rollback the optimistic update
    onError: (error, variables, context) => {
      if (context?.previousGalleryData) {
        queryClient.setQueryData(QUERY_KEYS.gallery, context.previousGalleryData);
      }
      toast.error("Failed to update favorites - reverted");
    },

    // Always refetch after success or error
    onSettled: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites });
    },
  });
}

/**
 * Hook to toggle PTR with optimistic updates
 */
export function useTogglePTR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, action, userId }: { item: GalleryItem; action: 'add' | 'remove'; userId?: string }) => {
      // Extract raw ID without table prefix for API
      const rawItemId = item.tableName && item.id.startsWith(`${item.tableName}_`)
        ? item.id.substring(item.tableName.length + 1)
        : item.id;

      await togglePTR(rawItemId, item.tableName || 'default', item.title, action, userId);
    },
    
    // Optimistic update - immediate UI feedback
    onMutate: async ({ item, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.gallery });

      // Snapshot the previous value
      const previousGalleryData = queryClient.getQueryData<GalleryApiResponse>(QUERY_KEYS.gallery);

      // Optimistically update the cache
      if (previousGalleryData) {
        queryClient.setQueryData<GalleryApiResponse>(QUERY_KEYS.gallery, (old) => ({
          ...old!,
          items: old!.items.map(i => 
            i.id === item.id 
              ? { ...i, isPTR: action === 'add', isRelease: action === 'add' } 
              : i
          ),
          breakdown: {
            ...old!.breakdown,
            releases: action === 'add' 
              ? old!.breakdown.releases + 1 
              : Math.max(0, old!.breakdown.releases - 1)
          }
        }));
      }

      // Show immediate user feedback
      toast.success(action === 'add' ? "Added to PTR" : "Removed from PTR");

      // Return context for rollback
      return { previousGalleryData, item, action };
    },

    // On error, rollback the optimistic update
    onError: (error, variables, context) => {
      if (context?.previousGalleryData) {
        queryClient.setQueryData(QUERY_KEYS.gallery, context.previousGalleryData);
      }
      toast.error("Failed to update PTR status - reverted");
    },

    // Always refetch after success or error
    onSettled: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.releases });
    },
  });
}

/**
 * Hook to mark PTR as sent with optimistic updates
 */
export function useMarkPTRAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, userId }: { item: GalleryItem; userId: string }) => {
      // Extract raw ID without table prefix for API
      const rawItemId = item.tableName && item.id.startsWith(`${item.tableName}_`)
        ? item.id.substring(item.tableName.length + 1)
        : item.id;

      await markPTRAsSent(rawItemId, item.tableName || 'default', userId);
    },

    // Optimistic update - immediate UI feedback
    onMutate: async ({ item }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.gallery });

      // Snapshot the previous value
      const previousGalleryData = queryClient.getQueryData<GalleryApiResponse>(QUERY_KEYS.gallery);

      // Optimistically update the cache
      if (previousGalleryData) {
        queryClient.setQueryData<GalleryApiResponse>(QUERY_KEYS.gallery, (old) => ({
          ...old!,
          items: old!.items.map(i =>
            i.id === item.id
              ? {
                  ...i,
                  ptrSent: true,
                  dateMarkedSent: new Date().toISOString()
                }
              : i
          )
        }));
      }

      // Show immediate user feedback
      toast.success("Marked PTR as sent");

      // Return context for rollback
      return { previousGalleryData, item };
    },

    // On error, rollback the optimistic update
    onError: (error, variables, context) => {
      if (context?.previousGalleryData) {
        queryClient.setQueryData(QUERY_KEYS.gallery, context.previousGalleryData);
      }
      toast.error("Failed to mark PTR as sent - reverted");
    },

    // Always refetch after success or error
    onSettled: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gallery });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.releases });
    },
  });
}