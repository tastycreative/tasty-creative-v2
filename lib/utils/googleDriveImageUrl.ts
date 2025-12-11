/**
 * Utility functions for handling Google Drive image URLs
 */

/**
 * Converts a Google Drive URL to a direct image display URL
 * Supports various Drive URL formats and converts them to Google's lh3 CDN URL
 *
 * @param url - The URL to convert (can be drive://, view link, thumbnail, or already a direct link)
 * @returns Direct image URL suitable for <img> src attribute
 */
export function getGoogleDriveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // If it's already a lh3.googleusercontent.com URL, return as-is
  if (url.includes('lh3.googleusercontent.com')) {
    return url;
  }

  // If it's our custom drive:// protocol, convert to lh3 URL
  if (url.startsWith('drive://')) {
    const fileId = url.replace('drive://', '');
    return `https://lh3.googleusercontent.com/d/${fileId}=s2000`;
  }

  // If it's not a Google Drive URL at all (e.g., S3 URL), return as-is
  if (!url.includes('drive.google.com') && !url.startsWith('drive://')) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  const fileId = extractGoogleDriveFileId(url);

  if (!fileId) {
    console.warn('Could not extract Google Drive file ID from URL:', url);
    return url; // Return original URL as fallback
  }

  // Return lh3.googleusercontent.com URL for direct image access
  // s2000 = 2000px max dimension while maintaining aspect ratio
  return `https://lh3.googleusercontent.com/d/${fileId}=s2000`;
}

/**
 * Extracts the file ID from various Google Drive URL formats
 *
 * Supported formats:
 * - drive://FILE_ID (our custom protocol)
 * - https://lh3.googleusercontent.com/d/FILE_ID=s2000
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/thumbnail?id=FILE_ID&sz=w2000
 * - https://drive.google.com/uc?id=FILE_ID
 *
 * @param url - The Google Drive URL
 * @returns The extracted file ID or null if not found
 */
export function extractGoogleDriveFileId(url: string): string | null {
  // Match our custom drive:// protocol
  if (url.startsWith('drive://')) {
    return url.replace('drive://', '');
  }

  // Match lh3.googleusercontent.com URL: https://lh3.googleusercontent.com/d/FILE_ID=s2000
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match) return lh3Match[1];

  // Match file URL: https://drive.google.com/file/d/FILE_ID/...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // Match open URL: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  // Match thumbnail URL: https://drive.google.com/thumbnail?id=FILE_ID
  const thumbnailMatch = url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (thumbnailMatch) return thumbnailMatch[1];

  // Match uc URL: https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  return null;
}

/**
 * Checks if a URL is a Google Drive URL
 *
 * @param url - The URL to check
 * @returns true if it's a Google Drive URL, false otherwise
 */
export function isGoogleDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('drive://') ||
         url.includes('drive.google.com') ||
         url.includes('lh3.googleusercontent.com');
}

/**
 * Gets a high-quality direct download URL for a Google Drive file
 * Note: This requires the file to have proper sharing permissions
 *
 * @param fileId - The Google Drive file ID
 * @returns Direct download URL
 */
export function getGoogleDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Gets a thumbnail URL for a Google Drive file with specified size
 *
 * @param fileId - The Google Drive file ID
 * @param size - Size parameter (e.g., 'w2000', 's400', etc.). Default: 'w2000'
 * @returns Thumbnail URL
 */
export function getGoogleDriveThumbnailUrl(fileId: string, size: string = 'w2000'): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
}
