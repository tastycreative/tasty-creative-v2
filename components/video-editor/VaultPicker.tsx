/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Folder, Video, X, Download } from "lucide-react";
import { getAccountId } from "@/lib/onlyfans-accounts";

interface VaultMedia {
  id: number;
  type: "video" | "photo" | "gif" | "audio";
  convertedToVideo: boolean;
  canView: boolean;
  hasError: boolean;
  createdAt: string;
  isReady: boolean;
  counters: {
    likesCount: number;
    tipsSumm: number;
  };
  files?: {
    full: {
      url: string;
      width: number;
      height: number;
      size: number;
      sources: any[];
    };
    thumb: {
      url: string;
      width: number;
      height: number;
      size: number;
    } | null;
    preview: any;
    squarePreview: any;
  };
  duration?: number;
  hasPosts: boolean;
  listStates: any[];
  releaseForms: any[];
  hasCustomPreview: boolean;
  videoSources?: {
    "240": string | null;
    "720": string | null;
  };
  // For vault list previews (different structure)
  url?: string;
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
  onMediaSelected: (files: File[]) => void; // Changed to accept File[] instead of string[]
  combinedModel?: string; // e.g., "AUTUMN_FREE" - optional since it might be empty
}

export const VaultPicker: React.FC<VaultPickerProps> = ({
  isOpen,
  onClose,
  onMediaSelected,
  combinedModel,
}) => {
  // Handle empty or undefined combinedModel
  const validCombinedModel =
    combinedModel && combinedModel.trim() !== "" ? combinedModel : null;
  const ACCOUNT_ID = validCombinedModel
    ? getAccountId(validCombinedModel)
    : null;

  const [vaultLists, setVaultLists] = useState<VaultList[]>([]);
  const [selectedList, setSelectedList] = useState<VaultList | null>(null);
  const [selectedMediaSet, setSelectedMediaSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);

  // Convert Set to Array for compatibility with existing code
  const selectedMedia = useMemo(() => Array.from(selectedMediaSet), [selectedMediaSet]);

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  console.log(
    `VaultPicker initialized for ${validCombinedModel || "no model"} with account ID: ${ACCOUNT_ID}`
  );
  console.log("VaultPicker state:", {
    selectedList: selectedList?.name,
    selectedMediaCount: selectedMedia.length,
  });

  // Check if account ID exists for the selected model
  const hasValidAccount = ACCOUNT_ID !== null;

  const DirectImagePreview: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
  }> = React.memo(({ src, alt, className = "", width = 48, height = 48 }) => {
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

    // Create the proxy URL that will return the actual image data
    const proxyUrl = `/api/onlyfans/image-scraper?url=${encodeURIComponent(src)}&accountId=${ACCOUNT_ID}`;

    // Reset imageLoaded when src changes
    useEffect(() => {
      setImageLoaded(false);
    }, [src]);

    const containerStyle = {
      width: width,
      height: height,
      minWidth: width,
      minHeight: height,
    };

    const handleImageLoad = useCallback(() => {
      setImageLoaded(true);
    }, []);

    const handleImageError = useCallback(() => {
      setImageLoaded(true); // Still hide spinner even on error
    }, []);

    return (
      <div className="relative" style={containerStyle}>
        {/* Show loading spinner when image not loaded */}
        <div
          className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${
            !imageLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
        >
          <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-pink-500"></div>
        </div>

        {/* Use the proxy URL directly as the image source */}
        <img
          src={proxyUrl}
          alt={alt}
          className={`${className} absolute inset-0 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
          style={{ width, height, objectFit: "cover" }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.src === nextProps.src &&
      prevProps.alt === nextProps.alt &&
      prevProps.className === nextProps.className &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height
    );
  });
  DirectImagePreview.displayName = 'DirectImagePreview';

  const ImageWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    lazy?: boolean;
  }> = React.memo(({
    src,
    alt,
    className = "",
    width = 200,
    height = 200,
    lazy = false,
  }) => {
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [isInView, setIsInView] = useState(!lazy);
    const imgRef = React.useRef<HTMLDivElement>(null);

    // Create the proxy URL that will return the actual image data
    const proxyUrl = `/api/onlyfans/image-scraper?url=${encodeURIComponent(src)}&accountId=${ACCOUNT_ID}`;

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (!lazy || isInView) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: "50px" }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [lazy, isInView, src]);

    // Reset imageLoaded when src changes
    useEffect(() => {
      setImageLoaded(false);
    }, [src]);

    // Fixed container with consistent dimensions
    const containerStyle = {
      width: width,
      height: height,
      minWidth: width,
      minHeight: height,
    };

    const handleImageLoad = useCallback(() => {
      setImageLoaded(true);
    }, []);

    const handleImageError = useCallback(() => {
      setImageLoaded(true); // Still hide spinner even on error
    }, []);

    return (
      <div ref={imgRef} className="relative" style={containerStyle}>
        {/* Show loading spinner when not in view or image not loaded */}
        {(!isInView || !imageLoaded) && (
          <div
            className={`absolute inset-0 bg-gray-200 flex items-center justify-center z-10`}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-pink-500 mx-auto mb-1"></div>
              <div className="text-xs text-gray-500">Loading...</div>
            </div>
          </div>
        )}

        {/* Show image when in view */}
        {isInView && (
          <img
            src={proxyUrl}
            alt={alt}
            className={`${className} ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
            style={{ width, height, objectFit: "cover" }}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.src === nextProps.src &&
      prevProps.alt === nextProps.alt &&
      prevProps.className === nextProps.className &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.lazy === nextProps.lazy
    );
  });
  ImageWithFallback.displayName = 'ImageWithFallback';

  // Memoized MediaItem component to prevent re-renders when selection changes
  const MediaItem: React.FC<{
    media: VaultMedia;
    index: number;
    isSelected: boolean;
    onToggle: () => void;
  }> = React.memo(({ media, index, isSelected, onToggle }) => {
    const mediaUrl = media.files?.full?.url || (media as any).url;
    const thumbnailUrl =
      media.files?.thumb?.url ||
      media.files?.full?.url ||
      (media as any).url;

    if (!mediaUrl) return null;

    return (
      <div
        onClick={onToggle}
        className={`relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
          isSelected
            ? "border-pink-500"
            : "border-transparent hover:border-gray-300"
        }`}
        style={{
          aspectRatio: "1/1",
          minHeight: "200px",
        }}
      >
        <ImageWithFallback
          src={thumbnailUrl}
          alt={`Video ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          width={200}
          height={200}
          lazy={true}
        />
        <div className="absolute top-2 left-2">
          <Video className="w-4 h-4 text-white bg-pink-600 bg-opacity-80 rounded p-0.5" />
        </div>
        {isSelected && (
          <div className="absolute inset-0 bg-pink-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          </div>
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when only selection changes
    return (
      prevProps.media.id === nextProps.media.id &&
      prevProps.index === nextProps.index &&
      prevProps.isSelected === nextProps.isSelected
    );
  });
  MediaItem.displayName = 'MediaItem';

  // Memoized VaultListItem component to prevent re-renders
  const VaultListItem: React.FC<{
    list: VaultList;
    onSelect: () => void;
  }> = React.memo(({ list, onSelect }) => {
    return (
      <div
        onClick={onSelect}
        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Folder className="w-5 h-5 text-pink-500" />
            <div>
              <h3 className="font-medium text-gray-900">
                {list.name}
              </h3>
              <p className="text-sm text-gray-500">
                {list.videosCount} videos, {list.photosCount} photos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {list.medias && list.medias.length > 0 ? (
              list.medias.slice(0, 3).map((media, index) => (
                <div
                  key={index}
                  className="w-12 h-12 bg-gray-200 rounded overflow-hidden relative"
                >
                  <DirectImagePreview
                    src={
                      media.files?.thumb?.url ||
                      media.files?.full?.url ||
                      (media as any).url
                    }
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
    );
  });
  VaultListItem.displayName = 'VaultListItem';

  // Loading skeleton component for vault lists
  const VaultListSkeleton: React.FC = React.memo(() => {
    return (
      <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div>
              <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="w-12 h-12 bg-gray-200 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  });
  VaultListSkeleton.displayName = 'VaultListSkeleton';

  useEffect(() => {
    if (!isOpen || !hasValidAccount || !ACCOUNT_ID) return;

    // Reset pagination state and fetch initial data
    console.log("VaultPicker opened, initializing...");
    setVaultLists([]);
    offsetRef.current = 0;
    setHasMore(true);
    setError(null);
    
    // Create the fetch function locally to avoid dependency issues
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/onlyfans/models?endpoint=vault-lists&accountId=${ACCOUNT_ID}&limit=20&offset=0`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          throw new Error(`Failed to fetch vault lists: ${response.status} - ${errorText}`);
        }      const data = await response.json();
      console.log("Initial vault lists response:", data);
      console.log("Initial response structure check:", {
        hasDataProperty: !!data.data,
        hasListProperty: !!data.data?.list,
        listLength: data.data?.list?.length || 0,
        hasMoreProperty: data.data?.hasMore,
        rawHasMore: data.data?.hasMore
      });
      
      const newVaultLists = data.data?.list || [];
      const hasMoreData = data.data?.hasMore !== false; // Default to true unless explicitly false

      setVaultLists(newVaultLists);
      offsetRef.current = newVaultLists.length;
      setHasMore(hasMoreData);
      
      console.log("Initial vault lists loaded:", newVaultLists.length, "items, hasMore:", hasMoreData, "offset:", newVaultLists.length);
      } catch (err) {
        console.error("Error fetching initial vault lists:", err);
        setError(err instanceof Error ? err.message : "Failed to load vault");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [isOpen, hasValidAccount, ACCOUNT_ID]);

  const loadMoreVaultLists = useCallback(async () => {
    if (loadingMore || !hasMore || !ACCOUNT_ID) {
      console.log("Skipping load more:", { loadingMore, hasMore, hasAccountId: !!ACCOUNT_ID });
      return;
    }
    
    const currentOffset = offsetRef.current;
    console.log("Loading more vault lists, current offset:", currentOffset);
    setLoadingMore(true);
    
    try {
      const url = `/api/onlyfans/models?endpoint=vault-lists&accountId=${ACCOUNT_ID}&limit=20&offset=${currentOffset}`;
      console.log("Making API request to:", url);
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Load more API Error:", response.status, errorText);
        throw new Error(`Failed to load more vault lists: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Load more vault lists response:", data);
      console.log("Raw API data structure:", {
        hasDataProperty: !!data.data,
        hasListProperty: !!data.data?.list,
        listLength: data.data?.list?.length || 0,
        hasMoreProperty: data.data?.hasMore,
        rawHasMore: data.data?.hasMore
      });
      
      const newVaultLists = data.data?.list || [];
      const hasMoreData = data.data?.hasMore !== false;

      console.log("Processed pagination data:", {
        newItemsCount: newVaultLists.length,
        hasMoreData,
        currentOffset
      });

      if (newVaultLists.length > 0) {
        setVaultLists(prev => {
          const updated = [...prev, ...newVaultLists];
          console.log("Appended vault lists, new total:", updated.length);
          return updated;
        });
        offsetRef.current = currentOffset + newVaultLists.length;
        console.log("Updated offset to:", offsetRef.current);
      } else {
        console.log("No new items received, setting hasMore to false");
        setHasMore(false);
        return;
      }
      
      setHasMore(hasMoreData);
      console.log("Load more completed, hasMore:", hasMoreData);
    } catch (err) {
      console.error("Error loading more vault lists:", err);
      setError(err instanceof Error ? err.message : "Failed to load more vault lists");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, ACCOUNT_ID]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;
    const scrollContainer = scrollContainerRef.current;
    
    // Only set up observer if the element exists and we have more content to load
    if (!currentLoadMoreRef || !hasMore || loadingMore || loading) {
      console.log("Skipping intersection observer setup:", {
        hasLoadMoreRef: !!currentLoadMoreRef,
        hasScrollContainer: !!scrollContainer,
        hasMore,
        loadingMore,
        loading
      });
      return;
    }

    console.log("Setting up intersection observer for infinite scroll", {
      hasScrollContainer: !!scrollContainer,
      scrollContainerHeight: scrollContainer?.scrollHeight,
      scrollContainerClientHeight: scrollContainer?.clientHeight
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log("Intersection observer triggered:", {
          isIntersecting: entry.isIntersecting,
          hasMore,
          loadingMore,
          loading,
          boundingClientRect: entry.boundingClientRect,
          intersectionRatio: entry.intersectionRatio,
          rootBounds: entry.rootBounds,
          target: entry.target
        });
        
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          console.log("Triggering load more vault lists from intersection observer");
          loadMoreVaultLists();
        }
      },
      { 
        root: scrollContainer, // Use the scroll container as root
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '100px' // Start loading 100px before reaching the element
      }
    );

    observer.observe(currentLoadMoreRef);
    console.log("Intersection observer attached to loadMoreRef");

    return () => {
      console.log("Cleaning up intersection observer");
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMore, loadingMore, loading, loadMoreVaultLists]);

  // Fallback scroll listener for more reliable infinite scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    
    if (!scrollContainer || !hasMore || loadingMore || loading) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      console.log("Scroll event:", {
        scrollTop,
        scrollHeight,
        clientHeight,
        scrollPercentage,
        hasMore,
        loadingMore,
        loading
      });
      
      // Trigger load more when user scrolls to 90% of the content
      if (scrollPercentage >= 0.9 && hasMore && !loadingMore && !loading) {
        console.log("Triggering load more vault lists from scroll event");
        loadMoreVaultLists();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, loadingMore, loading, loadMoreVaultLists]);

  const handleListSelect = async (list: VaultList) => {
    setSelectedList(list);
    setSelectedMediaSet(new Set()); // Use Set instead of array

    // Always fetch the detailed list from the new API endpoint
    setLoading(true);
    setError(null);
    try {
      const accountId = getAccountId(validCombinedModel!);
      if (!accountId) {
        throw new Error("Invalid account configuration");
      }

      const response = await fetch(
        `/api/onlyfans/models?endpoint=vault-media&accountId=${accountId}&list=${list.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vault media");
      }

      const data = await response.json();
      const medias = data.data?.list || [];

      console.log("Vault media loaded:", medias.length, "media items");
      const updatedList = { ...list, medias };
      setSelectedList(updatedList);

      // Update the vault lists array as well
      setVaultLists((prev) =>
        prev.map((l) => (l.id === list.id ? updatedList : l))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vault media"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMediaToggle = useCallback((mediaId: number) => {
    const media = selectedList?.medias.find((m) => m.id === mediaId);
    if (!media) return;

    const mediaUrl = media.files?.full?.url || (media as any).url;
    if (!mediaUrl) return;

    setSelectedMediaSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mediaUrl)) {
        newSet.delete(mediaUrl);
      } else {
        newSet.add(mediaUrl);
      }
      return newSet;
    });
  }, [selectedList]);

  // Memoized list of filtered videos to prevent recreation on every render
  const filteredVideos = useMemo(() => {
    if (!selectedList) return [];
    return selectedList.medias.filter((media) => media.type === "video");
  }, [selectedList]);

  // Stable callback factory for MediaItem onToggle to prevent re-renders
  const mediaToggleCallbacks = useMemo(() => {
    const callbacks = new Map<number, () => void>();
    filteredVideos.forEach((media) => {
      callbacks.set(media.id, () => handleMediaToggle(media.id));
    });
    return callbacks;
  }, [filteredVideos, handleMediaToggle]);

  const handleBack = () => {
    setSelectedList(null);
    setSelectedMediaSet(new Set());
  };

  const handleImportSelectedMedia = async () => {
    if (!validCombinedModel || selectedMedia.length === 0) return;

    const accountId = getAccountId(validCombinedModel);
    if (!accountId) {
      alert("Invalid account configuration");
      return;
    }

    setLoading(true);
    setDownloadProgress({ current: 0, total: selectedMedia.length, currentFile: "" });
    const downloadedFiles: File[] = [];

    try {
      for (let i = 0; i < selectedMedia.length; i++) {
        const mediaUrl = selectedMedia[i];
        try {
          setDownloadProgress({ 
            current: i + 1, 
            total: selectedMedia.length, 
            currentFile: `video-${i + 1}` 
          });

          // Use media-scraper API to get a fresh downloadable URL
          const scrapeResponse = await fetch("/api/onlyfans/models", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              endpoint: "media-scrape",
              accountId: accountId,
              url: mediaUrl,
            }),
          });

          if (!scrapeResponse.ok) {
            throw new Error(`Failed to scrape media: ${scrapeResponse.status}`);
          }

          const scrapeData = await scrapeResponse.json();
          console.log("Scrape response:", scrapeData);
          
          // The API route normalizes the response and provides scrapedUrl
          const downloadUrl = scrapeData.scrapedUrl || scrapeData.temporary_url || scrapeData.url;

          if (!downloadUrl) {
            console.error("No download URL in response:", scrapeData);
            throw new Error("No download URL received from scraper");
          }

          console.log("Attempting to download from:", downloadUrl);

          // Use our proxy endpoint to download the video (to avoid CORS issues)
          const filename = `vault-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
          
          let downloadResponse;
          let fallbackAttempted = false;
          
          try {
            downloadResponse = await fetch("/api/onlyfans/download-video", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: downloadUrl,
                filename: filename
              })
            });
            
            console.log("Download response status:", downloadResponse.status);
            
            if (!downloadResponse.ok) {
              const errorText = await downloadResponse.text();
              console.error("Proxy download failed:", downloadResponse.status, downloadResponse.statusText, errorText);
              
              // Try direct download as fallback (may fail due to CORS, but worth trying)
              console.log("Attempting direct download as fallback...");
              fallbackAttempted = true;
              
              downloadResponse = await fetch(downloadUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                  'Accept': 'video/mp4,video/*,*/*',
                }
              });
              
              if (!downloadResponse.ok) {
                throw new Error(`Both proxy and direct download failed. Status: ${downloadResponse.status}`);
              }
              
              console.log("Direct download succeeded as fallback");
            }
          } catch (fetchError) {
            console.error("Download error:", fetchError);
            throw new Error(
              fallbackAttempted 
                ? `Both proxy and direct download failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
                : `Proxy download failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
            );
          }

          const blob = await downloadResponse.blob();
          console.log("Downloaded blob size:", blob.size, "bytes");
          
          if (blob.size === 0) {
            throw new Error("Downloaded video is empty");
          }
          
          const file = new File([blob], filename, { type: 'video/mp4' });

          downloadedFiles.push(file);
          console.log("Successfully processed file:", filename);
        } catch (error) {
          console.error("Error downloading media:", mediaUrl, error);
          
          // Provide more specific error information
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
            console.warn("Download timed out - this video may be very large or the server may be slow");
          } else if (errorMessage.includes('connect') || errorMessage.includes('CONNECT')) {
            console.warn("Connection failed - network or server issue");
          } else if (errorMessage.includes('503')) {
            console.warn("Service unavailable - server may be overloaded");
          }
          
          // Continue with other files even if one fails
        }
      }

      if (downloadedFiles.length > 0) {
        console.log(`Successfully downloaded ${downloadedFiles.length} files:`, downloadedFiles.map(f => f.name));
        onMediaSelected(downloadedFiles);

        if (downloadedFiles.length !== selectedMedia.length) {
          const failedCount = selectedMedia.length - downloadedFiles.length;
          alert(
            `Successfully imported ${downloadedFiles.length} out of ${selectedMedia.length} videos.\n\n` +
            `${failedCount} download(s) failed. This can happen due to:\n` +
            `• Network timeouts (large files or slow connection)\n` +
            `• Expired temporary URLs\n` +
            `• Server connectivity issues\n\n` +
            `Try selecting fewer videos at once or refresh the vault to get new URLs.`
          );
        } else {
          console.log("All files imported successfully");
        }

        // Close the vault picker after successful import
        handleClose();
      } else {
        console.error("No files were successfully downloaded");
        alert(
          "Failed to download any videos. This can happen due to:\n\n" +
          "• Network connectivity issues\n" +
          "• Expired temporary URLs (try refreshing the vault)\n" +
          "• Server overload or maintenance\n" +
          "• Large file sizes causing timeouts\n\n" +
          "Suggestions:\n" +
          "• Check your internet connection\n" +
          "• Try selecting fewer videos at once\n" +
          "• Refresh the vault list and try again\n" +
          "• Try again in a few minutes if the server is busy"
        );
      }
    } catch (error) {
      console.error("Error importing vault media:", error);
      alert("Failed to import videos from vault. Please try again.");
    } finally {
      setLoading(false);
      setDownloadProgress(null);
    }
  };

  const handleClose = useCallback(() => {
    // Reset pagination state when closing
    setVaultLists([]);
    setSelectedList(null);
    setSelectedMediaSet(new Set());
    offsetRef.current = 0;
    setHasMore(true);
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // Show error if no account is registered for the selected model/type
  if (!hasValidAccount) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Account Not Found
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-pink-600" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-pink-800">
                  No Account Registered
                </h3>
                <p className="text-sm text-pink-700 mt-1">
                  {validCombinedModel
                    ? `No account ID is registered for model "${validCombinedModel}".`
                    : "No model selected. Please select a model in VideoEditor first."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-pink-800">
              {validCombinedModel ? (
                <>
                  <strong>To add this model:</strong> Update the account
                  configuration in
                  <code className="mx-1 px-1 bg-pink-100 rounded">
                    lib/onlyfans-accounts.ts
                  </code>
                  with the OnlyFans account ID for &ldquo;{validCombinedModel}
                  &rdquo;.
                </>
              ) : (
                <>
                  <strong>Select a model first:</strong> Go back to VideoEditor
                  and choose a model (e.g., &ldquo;Autumn&rdquo;) and type
                  (FREE/PAID) before accessing the vault.
                </>
              )}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 h-[80vh] overflow-hidden flex flex-col relative">
        {/* Header - Fixed */}
        <div className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedList ? selectedList.name : "Select from Vault"}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info notice about media scraping */}
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-pink-800">
              <strong>Instant Display:</strong> Vault lists appear immediately
              with loading placeholders. Thumbnails update individually using
              fresh OnlyFans temporary URLs via our scraping API endpoint.
            </p>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
          {loading && downloadProgress && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Downloading Videos
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Processing {downloadProgress.current} of {downloadProgress.total} videos...
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Current: {downloadProgress.currentFile}
                  </p>
                  <p className="text-xs text-gray-400">
                    Large videos may take longer to download. Each attempt times out after 30 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && !downloadProgress && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {[...Array(6)].map((_, index) => (
                  <VaultListSkeleton key={index} />
                ))}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4 flex-shrink-0">
              <p className="text-pink-800">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-2 mb-4 flex-shrink-0">
                  <p className="text-xs text-pink-800">
                    Debug: {vaultLists.length} vault lists loaded, hasMore: {String(hasMore)}, loading: {String(loading)}, loadingMore: {String(loadingMore)}, offset: {offsetRef.current}
                  </p>
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={loadMoreVaultLists}
                      disabled={loadingMore || !hasMore}
                      className="px-2 py-1 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white text-xs rounded"
                    >
                      Test Load More
                    </button>
                    <button
                      onClick={() => console.log("Current state:", { vaultLists: vaultLists.length, hasMore, offsetRef: offsetRef.current })}
                      className="px-2 py-1 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded"
                    >
                      Log State
                    </button>
                  </div>
                </div>
              )}
              
              {!selectedList ? (
                // Vault Lists View
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto space-y-2 pr-2" 
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {vaultLists.length === 0 && !loading ? (
                    <div className="text-center py-8">
                      <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No vault lists found
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Create vault lists in your OnlyFans account to organize
                        your media
                      </p>
                    </div>
                  ) : (
                    <>
                      {vaultLists.map((list) => (
                        <VaultListItem
                          key={list.id}
                          list={list}
                          onSelect={() => handleListSelect(list)}
                        />
                      ))}
                      
                      {/* Load More Trigger - Always present for intersection observer */}
                      <div ref={loadMoreRef} className="py-4 min-h-[1px]">
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-400 mb-2">
                            [Load More Trigger - Offset: {offsetRef.current}, HasMore: {String(hasMore)}, LoadingMore: {String(loadingMore)}]
                          </div>
                        )}
                        {hasMore ? (
                          loadingMore ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                              <span className="ml-2 text-gray-500">Loading more...</span>
                            </div>
                          ) : (
                            <div className="text-center space-y-2">
                              <div className="text-gray-500">
                                <span className="text-sm">Scroll to load more...</span>
                              </div>
                              <button
                                onClick={loadMoreVaultLists}
                                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm transition-colors"
                                disabled={loadingMore}
                              >
                                Load More
                              </button>
                            </div>
                          )
                        ) : vaultLists.length > 0 ? (
                          <div className="text-center text-gray-500">
                            <span className="text-sm">You&apos;ve reached the end of the list</span>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Media Grid View
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <button
                      onClick={handleBack}
                      className="text-pink-600 hover:underline"
                    >
                      ← Back to Lists
                    </button>
                    <div className="text-sm text-gray-500">
                      {selectedMedia.length} selected
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                        <span className="ml-2 text-gray-600">
                          Loading media...
                        </span>
                      </div>
                    ) : (
                      <>
                        {filteredVideos.length === 0 ? (
                          <div className="text-center py-8">
                            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                              No videos found in this vault
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Enhanced scraping info */}
                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
                              <p className="text-sm text-pink-800">
                                <strong>Fresh Media Loading:</strong> Using
                                OnlyFans scraping API endpoint for fresh
                                temporary URLs with lazy loading for optimal
                                performance.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                              {filteredVideos.map((media, index) => {
                                const mediaUrl =
                                  media.files?.full?.url ||
                                  (media as any).url;
                                const toggleCallback = mediaToggleCallbacks.get(media.id) || (() => {});

                                return (
                                  <MediaItem
                                    key={`media-${media.id}-${media.type}`}
                                    media={media}
                                    index={index}
                                    isSelected={selectedMediaSet.has(mediaUrl)}
                                    onToggle={toggleCallback}
                                  />
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons - Fixed at bottom */}
          {selectedList && (
            <div className="border-t border-gray-200 p-6 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedMedia.length > 0) {
                      handleImportSelectedMedia();
                    }
                  }}
                  disabled={selectedMedia.length === 0 || loading}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {downloadProgress ? 
                          `Downloading ${downloadProgress.current}/${downloadProgress.total}...` : 
                          "Importing..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>
                        Import {selectedMedia.length} Video
                        {selectedMedia.length !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
