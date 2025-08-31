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
 */
export function useGalleryData() {
  return useQuery({
    queryKey: QUERY_KEYS.gallery,
    queryFn: fetchGalleryData,
    staleTime: 0, // Always refetch for fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch favorites data
 */
export function useFavoritesData() {
  return useQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: fetchFavoritesData,
    staleTime: 0, // Always refetch for fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch releases data
 */
export function useReleasesData() {
  return useQuery({
    queryKey: QUERY_KEYS.releases,
    queryFn: fetchReleasesData,
    staleTime: 0, // Always refetch for fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to toggle favorite with optimistic updates
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, action }: { item: GalleryItem; action: 'add' | 'remove' }) => {
      // Extract raw ID without table prefix for API
      const rawItemId = item.tableName && item.id.startsWith(`${item.tableName}_`) 
        ? item.id.substring(item.tableName.length + 1) 
        : item.id;

      await toggleFavorite(rawItemId, item.tableName || 'default', item.title, action);
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
    mutationFn: async ({ item, action }: { item: GalleryItem; action: 'add' | 'remove' }) => {
      // Extract raw ID without table prefix for API
      const rawItemId = item.tableName && item.id.startsWith(`${item.tableName}_`) 
        ? item.id.substring(item.tableName.length + 1) 
        : item.id;

      await togglePTR(rawItemId, item.tableName || 'default', item.title, action);
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