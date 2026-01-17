/**
 * Utility functions for handling S3 image URLs
 * Handles expired presigned URLs by proxying through our API
 */

/**
 * Checks if a URL is an S3 URL
 *
 * @param url - The URL to check
 * @returns true if it's an S3 URL, false otherwise
 */
export function isS3Url(url: string | null | undefined): boolean {
  if (!url) return false;

  // Check for common S3 URL patterns
  return (
    url.includes('.s3.') ||
    url.includes('.s3-') ||
    url.includes('s3.amazonaws.com') ||
    url.includes('s3-')
  );
}

/**
 * Converts an S3 URL (potentially expired presigned URL) to a proxied URL
 * that will generate a fresh presigned URL on-demand
 *
 * @param url - The S3 URL (can be expired presigned URL)
 * @returns Proxied URL that will work even if original is expired
 */
export function getProxiedS3Url(url: string): string {
  if (!isS3Url(url)) {
    return url; // Not an S3 URL, return as-is
  }

  // Proxy through our API endpoint which will generate a fresh presigned URL
  return `/api/s3/image?url=${encodeURIComponent(url)}`;
}

/**
 * Extracts the S3 key from an S3 URL
 * Supports both bucket.s3.region and s3.region/bucket formats
 *
 * @param url - The S3 URL
 * @returns The S3 key (path) or null if not found
 */
export function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (hostname.includes('.s3.') || hostname.includes('.s3-')) {
      // Format: bucket.s3.region.amazonaws.com/path/to/file.jpg
      return urlObj.pathname.substring(1); // Remove leading slash
    } else if (hostname.startsWith('s3.') || hostname.startsWith('s3-')) {
      // Format: s3.region.amazonaws.com/bucket/path/to/file.jpg
      const parts = urlObj.pathname.substring(1).split('/');
      parts.shift(); // Remove bucket name
      return parts.join('/');
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if an S3 URL is expired by looking for the Expires parameter
 * Note: This is a best-effort check and may not work for all URL formats
 *
 * @param url - The S3 presigned URL
 * @returns true if URL appears to be expired, false otherwise
 */
export function isS3UrlExpired(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const expiresParam = urlObj.searchParams.get('Expires') || urlObj.searchParams.get('X-Amz-Expires');

    if (!expiresParam) {
      return false; // No expiry parameter, assume not expired
    }

    const expiryTimestamp = parseInt(expiresParam, 10);
    const now = Math.floor(Date.now() / 1000);

    return now > expiryTimestamp;
  } catch {
    return false; // Can't determine, assume not expired
  }
}
