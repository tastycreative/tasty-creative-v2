"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Folder, Video, X, Download } from "lucide-react";

interface VaultMedia {
  type: "video" | "photo" | "gif" | "audio";
  url: string;
  videoUrl?: string; // For actual video file
  id?: string;
  title?: string;
}

interface VaultList {
  id: number;
  type: string;
  name: string;
  hasMedia: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  videosCount: number;
  photosCount: number;
  gifsCount: number;
  audiosCount: number;
  medias: VaultMedia[];
}

interface VaultPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaSelected: (mediaUrls: string[]) => void;
}

export const VaultPicker: React.FC<VaultPickerProps> = ({
  isOpen,
  onClose,
  // onMediaSelected, // Currently unused as we show "Coming Soon" message
}) => {
  const [vaultLists, setVaultLists] = useState<VaultList[]>([]);
  const [selectedList, setSelectedList] = useState<VaultList | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapingQueue, setScrapingQueue] = useState<Set<string>>(new Set());
  const [scrapedUrls, setScrapedUrls] = useState<
    Map<string, { url: string; expiration: string }>
  >(new Map());
  const [rateLimitStatus, setRateLimitStatus] = useState<{
    remaining_minute: number;
    remaining_day: number;
    limit_minute: number;
    limit_day: number;
  } | null>(null);

  // Throttled scraping queue to limit concurrent requests
  const [scrapingPromises, setScrapingPromises] = useState<
    Map<string, Promise<string>>
  >(new Map());
  const MAX_CONCURRENT_SCRAPING = 3; // Limit concurrent scraping requests

  // Rate limiting: Only allow scraping if we have sufficient rate limit remaining
  const canMakeApiRequest = () => {
    if (!rateLimitStatus) return true; // Allow if we don't know the limits yet
    return (
      rateLimitStatus.remaining_minute > 10 &&
      rateLimitStatus.remaining_day > 50
    ); // Keep some buffer
  };

  // Update rate limit status from API response
  const updateRateLimitStatus = (responseData: {
    _meta?: {
      _rate_limits?: {
        remaining_minute: number;
        remaining_day: number;
        limit_minute: number;
        limit_day: number;
      };
    };
  }) => {
    if (responseData._meta?._rate_limits) {
      setRateLimitStatus(responseData._meta._rate_limits);
    }
  };

  const getScrapedImageUrl = async (originalUrl: string): Promise<string> => {
    try {
      // Check if we already have a cached, non-expired URL
      const cached = scrapedUrls.get(originalUrl);
      if (cached) {
        const expirationDate = new Date(cached.expiration);
        if (expirationDate > new Date()) {
          console.log("Using cached scraped URL for:", originalUrl);
          return cached.url;
        } else {
          // Remove expired entry
          setScrapedUrls((prev) => {
            const newMap = new Map(prev);
            newMap.delete(originalUrl);
            return newMap;
          });
        }
      }

      // Check rate limits before making API request
      if (!canMakeApiRequest()) {
        console.warn(
          "Rate limit approaching, skipping scraping for:",
          originalUrl
        );
        return originalUrl; // Return original URL without scraping
      }

      // Check if already in scraping queue to avoid duplicate requests
      if (scrapingQueue.has(originalUrl)) {
        console.log("Already scraping, waiting for:", originalUrl);
        return originalUrl; // Return original for now, will be updated when scraping completes
      }

      // Add to scraping queue
      setScrapingQueue((prev) => new Set(prev).add(originalUrl));

      // Add a small delay to avoid overwhelming the API
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 200)
      ); // 100-300ms delay

      console.log("Scraping image URL:", originalUrl);
      const requestBody = {
        endpoint: "media-scrape",
        accountId: ACCOUNT_ID,
        url: originalUrl,
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " "), // 24 hours from now
      };
      console.log("Sending request body:", requestBody);

      const response = await fetch(`/api/onlyfans/models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Remove from scraping queue
      setScrapingQueue((prev) => {
        const newSet = new Set(prev);
        newSet.delete(originalUrl);
        return newSet;
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Media scrape failed:", errorText);

        // Check if it's a rate limit error
        if (response.status === 429) {
          console.warn("Rate limit exceeded, will retry later");
          return originalUrl;
        }

        throw new Error(`Failed to scrape media: ${response.status}`);
      }

      const data = await response.json();
      console.log("OnlyFans Media Scrape response:", data);

      // Update rate limit status from response
      updateRateLimitStatus(data);

      if (data.scrapedUrl) {
        // Cache the scraped URL with expiration
        setScrapedUrls((prev) =>
          new Map(prev).set(originalUrl, {
            url: data.scrapedUrl,
            expiration:
              data.expiration_date ||
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
        );

        return data.scrapedUrl;
      }

      return originalUrl; // Fallback to original if scraping fails
    } catch (error) {
      console.error("Media scrape failed:", error);

      // Remove from scraping queue on error
      setScrapingQueue((prev) => {
        const newSet = new Set(prev);
        newSet.delete(originalUrl);
        return newSet;
      });

      return originalUrl; // Fallback to original URL
    }
  };

  // Throttled scraping function to limit concurrent requests
  const throttledGetScrapedImageUrl = async (
    originalUrl: string
  ): Promise<string> => {
    // Check if we already have a promise for this URL
    const existingPromise = scrapingPromises.get(originalUrl);
    if (existingPromise) {
      return existingPromise;
    }

    // Check if we're already at the concurrent limit
    if (scrapingPromises.size >= MAX_CONCURRENT_SCRAPING) {
      console.log("Max concurrent scraping reached, waiting for:", originalUrl);
      return originalUrl; // Return original URL for now
    }

    // Create and store the promise
    const promise = getScrapedImageUrl(originalUrl);
    setScrapingPromises((prev) => new Map(prev).set(originalUrl, promise));

    try {
      const result = await promise;
      // Remove from promises map when done
      setScrapingPromises((prev) => {
        const newMap = new Map(prev);
        newMap.delete(originalUrl);
        return newMap;
      });
      return result;
    } catch (error) {
      // Remove from promises map on error
      setScrapingPromises((prev) => {
        const newMap = new Map(prev);
        newMap.delete(originalUrl);
        return newMap;
      });
      throw error;
    }
  };

  const ImageWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
  }> = ({ src, alt, className = "", width, height }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [scrapedSrc, setScrapedSrc] = useState<string | null>(null);

    // Try to scrape the image URL when component mounts
    useEffect(() => {
      const scrapeImage = async () => {
        try {
          const scrapedUrl = await throttledGetScrapedImageUrl(src);
          setScrapedSrc(scrapedUrl);
        } catch (error) {
          console.error("Failed to scrape image:", error);
          setScrapedSrc(src); // Fallback to original
        }
      };

      scrapeImage();
    }, [src]);

    if (hasError) {
      // Show simple fallback UI
      return (
        <div
          className={`bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${className}`}
          style={{ width, height }}
        >
          <div className="text-center">
            <Video className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Restricted</div>
          </div>
        </div>
      );
    }

    const handleImageError = () => {
      console.log("Image failed to load:", scrapedSrc || src);
      console.log("Setting hasError to true for:", scrapedSrc || src);
      setHasError(true);
      setIsLoading(false);
    };

    const handleImageLoad = () => {
      console.log("Image loaded successfully:", scrapedSrc || src);
      setIsLoading(false);
    };

    // Don't render anything until we have a scraped URL
    if (!scrapedSrc) {
      return (
        <div
          className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mx-auto mb-1"></div>
            <div className="text-xs text-gray-500">Scraping...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative" style={{ width, height }}>
        {isLoading && (
          <div
            className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mx-auto mb-1"></div>
              <div className="text-xs text-gray-500">Loading...</div>
            </div>
          </div>
        )}
        <Image
          src={scrapedSrc}
          alt={alt}
          width={width || 200}
          height={height || 200}
          className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
          style={{ width, height, objectFit: "cover" }}
          onError={handleImageError}
          onLoad={handleImageLoad}
          unoptimized={true} // Since these are external URLs that might change
        />
      </div>
    );
  };

  const ACCOUNT_ID = "acct_0a4c116d5a104a37a8526087c68d4e61";

  useEffect(() => {
    if (isOpen) {
      fetchVaultLists();
    }
  }, [isOpen]);

  const fetchVaultLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/onlyfans/models?endpoint=vault-lists&accountId=${ACCOUNT_ID}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vault lists");
      }

      const data = await response.json();
      console.log("Vault lists received:", data.data?.list);
      setVaultLists(data.data?.list || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault");
    } finally {
      setLoading(false);
    }
  };

  const handleListSelect = async (list: VaultList) => {
    setSelectedList(list);
    setSelectedMedia([]);

    // If the list doesn't have media loaded, fetch the detailed list
    if (!list.medias || list.medias.length === 0) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/onlyfans/models?endpoint=vault-list-details&accountId=${ACCOUNT_ID}&listId=${list.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vault list details");
        }

        const data = await response.json();
        const updatedList = { ...list, medias: data.data?.medias || [] };
        setSelectedList(updatedList);

        // Update the vault lists array as well
        setVaultLists((prev) =>
          prev.map((l) => (l.id === list.id ? updatedList : l))
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load vault details"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMediaToggle = (mediaUrl: string) => {
    setSelectedMedia((prev) =>
      prev.includes(mediaUrl)
        ? prev.filter((url) => url !== mediaUrl)
        : [...prev, mediaUrl]
    );
  };

  const handleBack = () => {
    setSelectedList(null);
    setSelectedMedia([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedList ? selectedList.name : "Select from Vault"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info notice about media scraping */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Enhanced Media Access:</strong> Images are now fetched using
            OnlyFans API media scraping for better authentication and CDN
            access.
          </p>
        </div>

        {/* Rate limit status indicator */}
        {rateLimitStatus && (
          <div
            className={`border rounded-lg p-3 mb-4 ${
              rateLimitStatus.remaining_minute > 50 &&
              rateLimitStatus.remaining_day > 1000
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : rateLimitStatus.remaining_minute > 10 &&
                    rateLimitStatus.remaining_day > 50
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                rateLimitStatus.remaining_minute > 50 &&
                rateLimitStatus.remaining_day > 1000
                  ? "text-green-800 dark:text-green-200"
                  : rateLimitStatus.remaining_minute > 10 &&
                      rateLimitStatus.remaining_day > 50
                    ? "text-yellow-800 dark:text-yellow-200"
                    : "text-red-800 dark:text-red-200"
              }`}
            >
              API Rate Limits: {rateLimitStatus.remaining_minute}/
              {rateLimitStatus.limit_minute} per minute,{" "}
              {rateLimitStatus.remaining_day}/{rateLimitStatus.limit_day} per
              day
            </p>
            {rateLimitStatus.remaining_minute <= 10 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                ⚠️ Low rate limit - image loading may be throttled
              </p>
            )}
          </div>
        )}

        {/* Queue status */}
        {scrapingQueue.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-4">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              🔄 Scraping {scrapingQueue.size} image
              {scrapingQueue.size !== 1 ? "s" : ""}...
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex-1 overflow-hidden">
            {!selectedList ? (
              // Vault Lists View
              <div className="space-y-2 overflow-y-auto max-h-full">
                {vaultLists.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No vault lists found
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Create vault lists in your OnlyFans account to organize
                      your media
                    </p>
                  </div>
                ) : (
                  vaultLists.map((list) => (
                    <div
                      key={list.id}
                      onClick={() => handleListSelect(list)}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Folder className="w-5 h-5 text-blue-500" />
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {list.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {list.videosCount} videos, {list.photosCount}{" "}
                              photos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {list.medias && list.medias.length > 0 ? (
                            list.medias.slice(0, 3).map((media, index) => (
                              <div
                                key={index}
                                className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden relative"
                              >
                                <ImageWithFallback
                                  src={media.url}
                                  alt={`Preview ${index + 1}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  width={48}
                                  height={48}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400">
                              Click to view media
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Media Grid View
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handleBack}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    ← Back to Lists
                  </button>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedMedia.length} selected
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        Loading media...
                      </span>
                    </div>
                  ) : (
                    <>
                      {selectedList.medias.filter(
                        (media) => media.type === "video"
                      ).length === 0 ? (
                        <div className="text-center py-8">
                          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No videos found in this vault
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Enhanced scraping info */}
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              <strong>Media Scraping:</strong> Using OnlyFans
                              API media scraping endpoint for secure and
                              authenticated access to CDN content with proper
                              expiration handling.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {selectedList.medias
                              .filter((media) => media.type === "video")
                              .map((media, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleMediaToggle(media.url)}
                                  className={`relative aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                                    selectedMedia.includes(media.url)
                                      ? "border-green-500"
                                      : "border-transparent hover:border-gray-300"
                                  }`}
                                >
                                  <ImageWithFallback
                                    src={media.url}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 left-2">
                                    <Video className="w-4 h-4 text-white bg-black bg-opacity-50 rounded p-0.5" />
                                  </div>
                                  {selectedMedia.includes(media.url) && (
                                    <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">
                                          ✓
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert(
                        "Video importing from vault is being implemented. The streaming proxy successfully handles OnlyFans authentication and media access."
                      );
                    }}
                    disabled={selectedMedia.length === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Import {selectedMedia.length} Videos (In Progress)
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
