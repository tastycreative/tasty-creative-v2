/**
 * Gallery API service functions
 * Handles all API calls for gallery functionality
 */

// Gallery API response types
export interface GalleryApiResponse {
  items: any[];
  breakdown: {
    favorites: number;
    releases: number;
    library: number;
  };
  categories: { name: string; count: number }[];
  creators: { name: string; count: number }[];
  postOrigins: { name: string; count: number }[];
  pagination: any;
}

// Base API configurations
const API_CONFIG = {
  cache: 'no-cache' as RequestCache,
  headers: {
    'Cache-Control': 'no-cache',
  }
};

/**
 * Fetch all gallery data from combined_master_table
 */
export async function fetchGalleryData(): Promise<GalleryApiResponse> {
  const timestamp = Date.now();
  const response = await fetch(`/api/gallery-db?t=${timestamp}&forceRefresh=true`, API_CONFIG);

  if (!response.ok) {
    throw new Error('Failed to fetch gallery data');
  }

  return await response.json();
}

/**
 * Fetch favorites data
 */
export async function fetchFavoritesData(): Promise<GalleryApiResponse> {
  const timestamp = Date.now();
  const response = await fetch(`/api/gallery-db?type=favorites&t=${timestamp}`, API_CONFIG);

  if (!response.ok) {
    throw new Error('Failed to fetch favorites data');
  }

  return await response.json();
}

/**
 * Fetch releases (PTR) data
 */
export async function fetchReleasesData(): Promise<GalleryApiResponse> {
  const timestamp = Date.now();
  const response = await fetch(`/api/gallery-db?type=releases&t=${timestamp}`, API_CONFIG);

  if (!response.ok) {
    throw new Error('Failed to fetch releases data');
  }

  return await response.json();
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  itemId: string,
  tableName: string,
  title: string,
  action: 'add' | 'remove',
  userId?: string
): Promise<void> {
  const response = await fetch('/api/favorites-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      itemId,
      tableName,
      title,
      userId: userId || 'current-user'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update favorites');
  }
}

/**
 * Toggle PTR status
 */
export async function togglePTR(
  itemId: string,
  tableName: string,
  title: string,
  action: 'add' | 'remove',
  userId?: string
): Promise<void> {
  const response = await fetch('/api/releases-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      itemId,
      tableName,
      title,
      userId: userId || 'current-user'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update PTR status');
  }
}

/**
 * Mark PTR as sent
 */
export async function markPTRAsSent(itemId: string, tableName: string, userId: string): Promise<void> {
  const response = await fetch('/api/ptr-sent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId,
      tableName,
      userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark PTR as sent');
  }
}

/**
 * Unmark PTR as sent (rollback)
 */
export async function unmarkPTRAsSent(itemId: string, tableName: string): Promise<void> {
  const response = await fetch('/api/ptr-sent', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId,
      tableName
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unmark PTR as sent');
  }
}