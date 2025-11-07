"use client";

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { Image, Grid3x3, List, Search, Eye, X, Folder, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface GalleryProps {
  teamName: string;
  teamId: string;
}

type ViewMode = 'grid' | 'list';

interface GalleryItem {
  id: string;
  fileName: string;
  fileType: 'VIDEO' | 'THUMBNAIL' | 'IMAGE' | 'GIF' | 'OTHER';
  folderName: string | null;
  folderDriveId: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  fileSize: number | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  position: number | null;
  createdAt: string;
  clientModel: string;
  galleryId: string;
}

interface ClientModelFilter {
  id: string;
  name: string;
  itemCount: number;
}

// Helper function to format duration in a user-friendly way
const formatDuration = (durationSeconds: number): string => {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }
  
  if (minutes > 0) {
    if (seconds > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${minutes}m`;
  }
  
  return `${seconds}s`;
};

// Helper function to format file size in a user-friendly way
const formatFileSize = (sizeInBytes: number): string => {
  const gb = sizeInBytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  
  const mb = sizeInBytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  
  const kb = sizeInBytes / 1024;
  if (kb >= 1) {
    return `${kb.toFixed(2)} KB`;
  }
  
  return `${sizeInBytes} B`;
};

export default function Gallery({ teamName, teamId }: GalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientModel, setSelectedClientModel] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<GalleryItem | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Fetch all gallery items
  const { data: galleryData, isLoading, error } = useQuery({
    queryKey: ['oftv-gallery-items', selectedClientModel],
    queryFn: async () => {
      let url = '/api/oftv-gallery/items';
      if (selectedClientModel) {
        url += `?clientModel=${encodeURIComponent(selectedClientModel)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch gallery items');
      }
      return response.json();
    },
  });

  const items: GalleryItem[] = galleryData?.items || [];
  const clientModels: ClientModelFilter[] = galleryData?.clientModels || [];

  // Apply search filter
  const filteredItems = items.filter((item: GalleryItem) =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.folderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle ESC key to close preview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewFile) {
        setPreviewFile(null);
        setImageLoading(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewFile]);

  // Reset loading state when preview file changes
  useEffect(() => {
    if (previewFile) {
      setImageLoading(true);
    }
  }, [previewFile]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            OFTV Gallery
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLoading ? (
              <span className="inline-block h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            ) : (
              `${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'items'}${selectedClientModel ? ` for ${selectedClientModel}` : ''}`
            )}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 dark:bg-red-900/20">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to load gallery
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
            {error instanceof Error ? error.message : 'Unable to fetch gallery items'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Content */
        <>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Client Model Filter */}
            {clientModels.length > 0 && (
              <select
                value={selectedClientModel || ''}
                onChange={(e) => setSelectedClientModel(e.target.value || null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              >
                <option value="">All Models ({items.length})</option>
                {clientModels.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name} ({model.itemCount})
                  </option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Gallery Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isImage = item.fileType === 'IMAGE' || item.mimeType?.startsWith('image/');
                const isVideo = item.fileType === 'VIDEO' || item.mimeType?.startsWith('video/');
                
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      if (isImage) {
                        setPreviewFile(item);
                      } else {
                        window.open(item.fileUrl, '_blank');
                      }
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative">
                      {item.thumbnailUrl || (isImage && item.fileUrl) ? (
                        <div className="w-full h-full relative">
                          <NextImage
                            src={item.thumbnailUrl || item.fileUrl}
                            alt={item.fileName}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          {isVideo ? (
                            <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          ) : (
                            <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.fileType}
                          </span>
                        </div>
                      )}
                      
                      {/* Video Play Button Overlay */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-lg">
                            <svg className="h-8 w-8 text-pink-600 dark:text-pink-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Image Zoom Indicator */}
                      {isImage && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 text-white p-1.5 rounded-lg">
                            <Eye className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                        {item.fileName}
                      </h3>
                      
                      {/* Folder Name with Drive Link */}
                      {item.folderName && (
                        <div className="mb-2 space-y-1">
                          <a
                            href={`https://drive.google.com/drive/folders/${item.folderDriveId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 transition-colors"
                          >
                            <Folder className="h-3 w-3" />
                            <span className="truncate">{item.folderName}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                          <div className="text-xs text-gray-500 dark:text-gray-400 pl-4">
                            {item.clientModel}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {item.width && item.height && `${item.width}x${item.height}`}
                          {item.duration && formatDuration(item.duration)}
                          {item.fileSize && !item.width && formatFileSize(item.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const isImage = item.fileType === 'IMAGE' || item.mimeType?.startsWith('image/');
                const isVideo = item.fileType === 'VIDEO' || item.mimeType?.startsWith('video/');
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all bg-white dark:bg-gray-800 cursor-pointer group"
                    onClick={() => {
                      if (isImage) {
                        setPreviewFile(item);
                      } else {
                        window.open(item.fileUrl, '_blank');
                      }
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative">
                      {item.thumbnailUrl || (isImage && item.fileUrl) ? (
                        <img
                          src={item.thumbnailUrl || item.fileUrl}
                          alt={item.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div>
                          {isVideo ? (
                            <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          ) : (
                            <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                      
                      {/* Video Play Button Overlay */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center">
                            <svg className="h-5 w-5 text-pink-600 dark:text-pink-400 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.fileName}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {/* Folder Name with Drive Link */}
                        {item.folderName && (
                          <>
                            <a
                              href={`https://drive.google.com/drive/folders/${item.folderDriveId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 transition-colors"
                            >
                              <Folder className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{item.folderName}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <span>•</span>
                          </>
                        )}
                        <span className="text-gray-400">{item.fileType}</span>
                        {item.width && item.height && (
                          <>
                            <span>•</span>
                            <span>{item.width}x{item.height}</span>
                          </>
                        )}
                        {item.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(item.duration)}</span>
                          </>
                        )}
                        {item.fileSize && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(item.fileSize)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No items found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                {searchQuery ? (
                  `No results found for "${searchQuery}"`
                ) : (
                  'No gallery items available.'
                )}
              </p>
            </div>
          )}
        </>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => {
            setPreviewFile(null);
            setImageLoading(false);
          }}
        >
          <button
            onClick={() => {
              setPreviewFile(null);
              setImageLoading(false);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2"
            aria-label="Close preview (ESC)"
            title="Close (ESC)"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute top-4 left-4 text-white z-10 bg-black/50 rounded-lg p-3">
            <h3 className="text-lg font-semibold mb-2">{previewFile.fileName}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              {previewFile.width && previewFile.height && (
                <span>{previewFile.width} × {previewFile.height}</span>
              )}
              {previewFile.fileSize && (
                <span>{formatFileSize(previewFile.fileSize)}</span>
              )}
            </div>
            {previewFile.folderName && (
              <a
                href={`https://drive.google.com/drive/folders/${previewFile.folderDriveId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300 transition-colors mt-2"
              >
                <Folder className="h-3 w-3" />
                <span>{previewFile.folderName}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div 
            className="max-w-7xl max-h-full w-full h-full flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600"></div>
              </div>
            )}
            
            {/* Load full resolution image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <NextImage
                src={previewFile.fileUrl}
                alt={previewFile.fileName}
                fill
                className={`object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={(e) => e.stopPropagation()}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                unoptimized
                sizes="100vw"
              />
            </div>
          </div>

          {/* ESC hint */}
          <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg">
            Press <kbd className="px-2 py-0.5 bg-white/20 rounded">ESC</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
}
