import { type ImageLoader } from 'next/image';

// Whitelisted domains from next.config.ts
const OPTIMIZABLE_DOMAINS = [
  'lh3.googleusercontent.com',
  'drive.google.com',
  'images.unsplash.com',
  'cdn2.onlyfans.com',
  'allthiscash.com',
  'www.allthiscash.com',
  'betterfans.app',
  'www.betterfans.app',
  'tastycreative-site.s3.us-east-1.amazonaws.com'
];

/**
 * Checks if a given image URL serves from a domain that is whitelisted
 * for Next.js Image Optimization in next.config.ts.
 * 
 * @param url The image URL to check
 * @returns true if the image can be safely optimized, false otherwise
 */
export function isOptimizable(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    // Handle relative URLs (they are local and optimizable)
    if (url.startsWith('/')) return true;
    
    // Check if it's a blob url (not optimizable)
    if (url.startsWith('blob:')) return false;

    // Check if it's a data url (not optimizable)
    if (url.startsWith('data:')) return false;

    const urlObj = new URL(url);
    return OPTIMIZABLE_DOMAINS.some(domain => urlObj.hostname === domain);
  } catch (e) {
    // If URL parsing fails, assume not optimizable to be safe
    return false;
  }
}
