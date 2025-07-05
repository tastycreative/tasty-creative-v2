"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Folder, Video, X, Download } from "lucide-react";

interface VaultMedia {
  type: "video" | "photo" | "gif" | "audio";
  url: string;
  temporary_url?: string; // Scraped temporary URL from OnlyFans API
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
  const ACCOUNT_ID = "acct_0a4c116d5a104a37a8526087c68d4e61";

  const [vaultLists, setVaultLists] = useState<VaultList[]>([]);
  const [selectedList, setSelectedList] = useState<VaultList | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DirectImagePreview: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
  }> = ({ src, alt, className = "", width = 48, height = 48 }) => {
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

    // Create the proxy URL that will return the actual image data
    const proxyUrl = `/api/onlyfans/image-scraper?url=${encodeURIComponent(src)}&accountId=${ACCOUNT_ID}`;

    // Reset imageLoaded when src changes
    useEffect(() => {
      console.log("DirectImagePreview src changed:", src);
      setImageLoaded(false);
    }, [src]);

    const containerStyle = {
      width: width,
      height: height,
      minWidth: width,
      minHeight: height,
    };

    return (
      <div className="relative" style={containerStyle}>
        {/* Show loading spinner when image not loaded */}
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${
            !imageLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
        >
          <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-500"></div>
        </div>

        {/* Use the proxy URL directly as the image source */}
        <img
          src={proxyUrl}
          alt={alt}
          className={`${className} absolute inset-0 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
          style={{ width, height, objectFit: "cover" }}
          onLoad={() => {
            console.log("DirectImagePreview image loaded:", proxyUrl);
            setImageLoaded(true);
          }}
          onError={() => {
            console.log("DirectImagePreview image error:", proxyUrl);
            setImageLoaded(true); // Still hide spinner even on error
          }}
        />
      </div>
    );
  };

  const ImageWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    lazy?: boolean;
  }> = ({
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
            console.log("ImageWithFallback now in view:", src);
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
      console.log("ImageWithFallback src changed:", src);
      setImageLoaded(false);
    }, [src]);

    // Fixed container with consistent dimensions
    const containerStyle = {
      width: width,
      height: height,
      minWidth: width,
      minHeight: height,
    };

    const handleImageLoad = () => {
      console.log("ImageWithFallback image loaded:", proxyUrl);
      setImageLoaded(true);
    };

    const handleImageError = () => {
      console.log("ImageWithFallback image error:", proxyUrl);
      setImageLoaded(true); // Still hide spinner even on error
    };

    return (
      <div ref={imgRef} className="relative" style={containerStyle}>
        {/* Show loading spinner when not in view or image not loaded */}
        {(!isInView || !imageLoaded) && (
          <div
            className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center z-10`}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mx-auto mb-1"></div>
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
  };

  const fetchVaultLists = useCallback(async () => {
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
      const vaultLists = data.data?.list || [];

      // Set vault lists immediately - images will be scraped via API endpoints
      setVaultLists(vaultLists);
      setLoading(false);

      console.log(
        "Vault lists displayed immediately. Images will be scraped via API as needed."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchVaultLists();
    }
  }, [isOpen, fetchVaultLists]);

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
        const medias = data.data?.medias || [];

        console.log("Vault list details loaded:", medias.length, "media items");
        const updatedList = { ...list, medias };
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
            <strong>Instant Display:</strong> Vault lists appear immediately
            with loading placeholders. Thumbnails update individually using
            fresh OnlyFans temporary URLs via our scraping API endpoint.
          </p>
        </div>

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
                                <DirectImagePreview
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
                              <strong>Fresh Media Loading:</strong> Using
                              OnlyFans scraping API endpoint for fresh temporary
                              URLs with lazy loading for optimal performance.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {selectedList.medias
                              .filter((media) => media.type === "video")
                              .map((media, index) => (
                                <div
                                  key={`${media.url}-${index}`}
                                  onClick={() => handleMediaToggle(media.url)}
                                  className={`relative bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                                    selectedMedia.includes(media.url)
                                      ? "border-green-500"
                                      : "border-transparent hover:border-gray-300"
                                  }`}
                                  style={{
                                    aspectRatio: "1/1",
                                    minHeight: "200px",
                                  }}
                                >
                                  <ImageWithFallback
                                    src={media.url}
                                    alt={`Video ${index + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    width={200}
                                    height={200}
                                    lazy={true}
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
