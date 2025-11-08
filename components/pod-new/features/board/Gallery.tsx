"use client";

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { Image, Grid3x3, List, Search, Eye, X, Folder, ExternalLink, Filter, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface GalleryProps {
  teamName: string;
  teamId: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'video-number-asc' | 'video-number-desc' | 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc' | 'duration-desc' | 'duration-asc';

interface GalleryItem {
  id: string;
  fileName: string;
  fileType: 'VIDEO' | 'THUMBNAIL' | 'IMAGE' | 'GIF' | 'OTHER';
  folderName: string | null;
  folderDriveId: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  fileSize: number | null;
  durationMillis: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  position: number | null;
  createdAt: string;
  updatedAt: string;
  clientModel: string;
  galleryId: string;
  itemCount?: number;
  latestVideoDuration?: number | null;
  isFolderView?: boolean;
}

interface ClientModelFilter {
  id: string;
  name: string;
  itemCount: number;
}

interface PaginationInfo {
  page: number;
  foldersPerPage: number;
  totalItems: number;
  totalFolders: number;
  totalPages: number;
  itemsOnCurrentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Helper function to format file size
const formatFileSize = (sizeInBytes: number): string => {
  const gb = sizeInBytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  
  const mb = sizeInBytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  
  const kb = sizeInBytes / 1024;
  if (kb >= 1) return `${kb.toFixed(2)} KB`;
  
  return `${sizeInBytes} B`;
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
};

// Helper function to format video duration
const formatDuration = (millis: number): string => {
  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function GalleryNew({ teamName, teamId }: GalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClientModel, setSelectedClientModel] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('video-number-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [featuredItem, setFeaturedItem] = useState<GalleryItem | null>(null);
  const [previewFile, setPreviewFile] = useState<GalleryItem | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [featuredImageLoading, setFeaturedImageLoading] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClientModel, sortOption]);

  // Fetch gallery items (one per folder)
  const { data: galleryData, isLoading, error } = useQuery({
    queryKey: ['oftv-gallery-items', selectedClientModel, debouncedSearch, currentPage, sortOption],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sortBy: sortOption
      });
      
      if (selectedClientModel) params.append('clientModel', selectedClientModel);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await fetch(`/api/oftv-gallery/items?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch gallery items');
      }
      return response.json();
    },
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  // Fetch folder items using TanStack Query
  const { data: folderData, isLoading: loadingFolder } = useQuery({
    queryKey: ['oftv-gallery-folder', selectedFolder],
    queryFn: async () => {
      if (!selectedFolder) return null;
      
      const encodedFolder = encodeURIComponent(selectedFolder === 'Uncategorized' ? '' : selectedFolder);
      const response = await fetch(`/api/oftv-gallery/folder/${encodedFolder}`);
      if (!response.ok) throw new Error('Failed to fetch folder items');
      return response.json();
    },
    enabled: !!selectedFolder, // Only run query when selectedFolder is set
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const folderItems: GalleryItem[] = folderData?.items || [];

  // Update featured item when folder data changes
  useEffect(() => {
    if (folderItems.length > 0 && !featuredItem) {
      // Find the latest updated video for featured item
      const videoItems = folderItems.filter((item: GalleryItem) => 
        item.mimeType?.startsWith('video/') || item.fileType === 'VIDEO'
      );
      
      const latestVideo = videoItems.length > 0
        ? videoItems.reduce((latest: GalleryItem, current: GalleryItem) => 
            new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
          )
        : folderItems[0]; // Fallback to first item if no videos
      
      setFeaturedItem(latestVideo);
      setFeaturedImageLoading(true); // Start loading state
    }
  }, [folderItems, featuredItem]);

  // Set loading state when featured item changes
  useEffect(() => {
    if (featuredItem) {
      setFeaturedImageLoading(true);
    }
  }, [featuredItem?.id]); // Only trigger when the ID changes

  const folders: GalleryItem[] = galleryData?.items || [];
  const clientModels: ClientModelFilter[] = galleryData?.clientModels || [];
  const pagination: PaginationInfo | undefined = galleryData?.pagination;

  const filteredFolders = folders;

  // Open folder modal - TanStack Query will handle fetching
  const openFolderModal = (folderName: string) => {
    setSelectedFolder(folderName);
    setFeaturedItem(null); // Reset featured item, will be set by useEffect
  };

  const closeFolderModal = () => {
    setSelectedFolder(null);
    setFeaturedItem(null);
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedFolder) {
          closeFolderModal();
        } else if (previewFile) {
          setPreviewFile(null);
          setImageLoading(false);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedFolder, previewFile]);

  useEffect(() => {
    if (previewFile) setImageLoading(true);
  }, [previewFile]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">OFTV Gallery</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLoading ? (
              <span className="inline-block h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            ) : pagination ? (
              <>
                {filteredFolders.length !== pagination.totalFolders && (
                  <span className="text-pink-600 dark:text-pink-400 font-medium">
                    {filteredFolders.length} of {pagination.totalFolders} folders
                  </span>
                )}
                {filteredFolders.length === pagination.totalFolders && (
                  <span>{pagination.totalFolders} {pagination.totalFolders === 1 ? 'folder' : 'folders'}</span>
                )}
                {selectedClientModel && <span> for {selectedClientModel}</span>}
                {sortOption !== 'video-number-asc' && (
                  <span className="text-pink-600 dark:text-pink-400"> • Filtered</span>
                )}
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Client Model Filter */}
          <select
            value={selectedClientModel || ''}
            onChange={(e) => setSelectedClientModel(e.target.value || null)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
          >
            <option value="">All Models</option>
            {clientModels.length > 0 && [...clientModels].sort((a, b) => a.name.localeCompare(b.name)).map((model) => (
              <option key={model.id} value={model.name}>
                {model.name} ({model.itemCount})
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg transition-all ${
              showFilters || sortOption !== 'video-number-asc'
                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {sortOption !== 'video-number-asc' && (
              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            )}
          </button>

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

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
            {/* Sort Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort By
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              >
                <optgroup label="Video Number">
                  <option value="video-number-desc">Newest Video (Highest #)</option>
                  <option value="video-number-asc">Oldest Video (Lowest #)</option>
                </optgroup>
                <optgroup label="Date">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </optgroup>
                <optgroup label="Name">
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </optgroup>
              </select>
            </div>

            {/* Active Filters Summary & Reset */}
            {sortOption !== 'video-number-asc' && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Filter className="h-4 w-4" />
                  <span>Sort: {sortOption.replace('-', ' ')}</span>
                </div>
                <button
                  onClick={() => {
                    setSortOption('video-number-asc');
                  }}
                  className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State - Only show skeleton on initial load */}
      {isLoading && !galleryData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
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
        <div className="relative">
          {/* Loading overlay when fetching new page data */}
          {isLoading && galleryData && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading...</span>
              </div>
            </div>
          )}

          {/* Gallery Grid/List */}
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${isLoading && galleryData ? 'opacity-60 pointer-events-none' : ''}`}>
              {filteredFolders.map((folder) => {
                const isImage = folder.mimeType?.startsWith('image/') || folder.fileType === 'IMAGE' || folder.fileType === 'THUMBNAIL' || folder.fileType === 'GIF';
                
                return (
                  <div
                    key={folder.id}
                    className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 cursor-pointer"
                    onClick={() => openFolderModal(folder.folderName || '')}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative">
                      {folder.thumbnailUrl || (isImage && folder.fileUrl) ? (
                        <div className="w-full h-full relative">
                          <NextImage
                            src={`/api/oftv-gallery/thumbnail?fileId=${folder.fileUrl}`}
                            alt={folder.folderName || 'Folder'}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            className="object-cover transition-opacity duration-300"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Folder className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      {/* YouTube-style duration badge */}
                      {folder.latestVideoDuration && (
                        <div className="absolute bottom-2 right-2">
                          <div className="bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                            {formatDuration(folder.latestVideoDuration)}
                          </div>
                        </div>
                      )}

                      {/* View icon on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
                          <Eye className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                        {folder.folderName || 'Uncategorized'}
                      </h3>

                      {/* Model name */}
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate">{folder.clientModel}</span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                        <span>{folder.itemCount || 0} {folder.itemCount === 1 ? 'item' : 'items'}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(folder.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className={`space-y-2 relative ${isLoading && galleryData ? 'opacity-60 pointer-events-none' : ''}`}>
              {filteredFolders.map((folder) => {
                const isImage = folder.mimeType?.startsWith('image/') || folder.fileType === 'IMAGE' || folder.fileType === 'THUMBNAIL' || folder.fileType === 'GIF';
                
                return (
                  <div
                    key={folder.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all bg-white dark:bg-gray-800 cursor-pointer group"
                    onClick={() => openFolderModal(folder.folderName || '')}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative">
                      {folder.thumbnailUrl || (isImage && folder.fileUrl) ? (
                        <div className="w-full h-full relative">
                          <NextImage
                            src={`/api/oftv-gallery/thumbnail?fileId=${folder.fileUrl}`}
                            alt={folder.folderName || 'Folder'}
                            fill
                            sizes="80px"
                            className="object-cover transition-opacity duration-300"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                            unoptimized
                          />
                          {/* YouTube-style duration badge */}
                          {folder.latestVideoDuration && (
                            <div className="absolute bottom-1 right-1">
                              <div className="bg-black/80 text-white px-1 py-0.5 rounded text-[10px] font-semibold">
                                {formatDuration(folder.latestVideoDuration)}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Folder className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                        {folder.folderName || 'Uncategorized'}
                      </h3>
                      
                      <div className="flex flex-col gap-1">
                        {/* Model name */}
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span className="truncate">{folder.clientModel}</span>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>{folder.itemCount || 0} items</span>
                          <span>•</span>
                          <span>{formatRelativeTime(folder.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* View icon */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredFolders.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Folder className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No folders found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                {searchQuery ? (
                  `No results found for "${searchQuery}"`
                ) : selectedClientModel ? (
                  `No folders found for ${selectedClientModel}`
                ) : (
                  'No gallery folders available.'
                )}
              </p>
              {(selectedClientModel || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedClientModel(null);
                    setSearchQuery('');
                    setSortOption('video-number-asc');
                  }}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls - Always visible when pagination exists */}
      {pagination && pagination.totalPages > 1 && (
        <div className="relative">
          {/* Loading progress bar */}
          {isLoading && (
            <div className="absolute -top-1 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-pink-600 animate-progress-bar"></div>
            </div>
          )}
          
          <div className="flex items-center justify-between py-6 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Page {currentPage} of {pagination.totalPages} • {pagination.totalFolders} folders total</span>
              {isLoading && (
                <span className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-600"></div>
                  Loading...
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>
              
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                        currentPage === pageNum
                          ? 'bg-pink-600 text-white'
                          : 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
              
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal - Show all items in selected folder */}
      {selectedFolder && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={closeFolderModal}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="text-white">
              <h2 className="text-2xl font-bold">{selectedFolder || 'Uncategorized'}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {loadingFolder ? 'Loading...' : `${folderItems.length} ${folderItems.length === 1 ? 'item' : 'items'}`}
              </p>
            </div>
            <button
              onClick={closeFolderModal}
              className="text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {loadingFolder ? (
            /* Skeleton Loading State */
            <div className="flex-1 flex gap-6 p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Featured Item Skeleton - Left */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full aspect-video bg-gray-800 rounded-lg animate-pulse"></div>
              </div>

              {/* Items Column Skeleton - Right */}
              <div className="w-80 flex flex-col gap-3 overflow-hidden">
                <div className="h-6 w-32 bg-gray-800 rounded animate-pulse mb-2"></div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-32 aspect-video bg-gray-800 rounded-lg animate-pulse flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-800 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-20 bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Content - Side by Side Layout */
            <div className="flex-1 flex gap-6 p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Featured Item - Left Side */}
              {featuredItem && (
                <div className="flex-1 flex flex-col">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 shadow-2xl group mb-4">
                    {/* Loading Skeleton with Spinner */}
                    {featuredImageLoading && (
                      <div className="absolute inset-0 bg-gray-800 animate-pulse z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin h-12 w-12 border-4 border-pink-600 border-t-transparent rounded-full"></div>
                          <p className="text-white text-sm">Loading preview...</p>
                        </div>
                      </div>
                    )}
                    
                    {featuredItem.thumbnailUrl || featuredItem.fileUrl ? (
                      <>
                        {(() => {
                          const isVideo = featuredItem.mimeType?.startsWith('video/') || featuredItem.fileType === 'VIDEO';
                          const thumbnailUrl = isVideo 
                            ? `/api/oftv-gallery/thumbnail?fileId=${featuredItem.fileUrl}&size=large`
                            : `/api/oftv-gallery/thumbnail?fileId=${featuredItem.fileUrl}`;
                          
                          return (
                            <NextImage
                              src={thumbnailUrl}
                              alt={featuredItem.fileName}
                              fill
                              className="object-contain"
                              quality={100}
                              priority
                              unoptimized
                              onLoad={() => setFeaturedImageLoading(false)}
                            />
                          );
                        })()}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="h-20 w-20 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      </div>
                    )}

                    {/* Video duration badge */}
                    {featuredItem.durationMillis && (
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-black/80 text-white px-2 py-1 rounded text-sm font-semibold">
                          {formatDuration(featuredItem.durationMillis)}
                        </div>
                      </div>
                    )}

                    {/* Play button overlay for videos */}
                    {(featuredItem.mimeType?.startsWith('video/') || featuredItem.fileType === 'VIDEO') && (
                      <button
                        onClick={() => window.open(featuredItem.fileUrl, '_blank')}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
                      >
                        <div className="w-20 h-20 rounded-full bg-pink-600 hover:bg-pink-700 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                          <svg className="h-10 w-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </button>
                    )}

                    {/* External link button */}
                    <a
                      href={featuredItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-5 w-5 text-white" />
                    </a>
                  </div>

                  {/* Featured Item Info */}
                  <div className="text-white">
                    <h3 className="text-lg font-semibold mb-2 truncate">{featuredItem.fileName}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      {featuredItem.width && featuredItem.height && (
                        <span>{featuredItem.width} × {featuredItem.height}</span>
                      )}
                      {featuredItem.fileSize && (
                        <span>{formatFileSize(featuredItem.fileSize)}</span>
                      )}
                      <span>{formatRelativeTime(featuredItem.updatedAt)}</span>
                      {featuredItem.durationMillis && (
                        <span className="text-pink-400 font-semibold">Latest Video</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* All Items Column - Right Side */}
              <div className="w-80 flex flex-col border-l border-gray-800 pl-6 overflow-hidden">
                <h4 className="text-white font-semibold mb-4 flex items-center justify-between">
                  <span>All Items</span>
                  <span className="text-sm text-gray-400">({folderItems.length})</span>
                </h4>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                  {folderItems.map((item) => {
                    const isImage = item.mimeType?.startsWith('image/') || item.fileType === 'IMAGE' || item.fileType === 'THUMBNAIL' || item.fileType === 'GIF';
                    const isVideo = item.mimeType?.startsWith('video/') || item.fileType === 'VIDEO';
                    const isFeatured = featuredItem?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          isFeatured 
                            ? 'bg-pink-600/20 border border-pink-500' 
                            : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                        }`}
                        onClick={() => setFeaturedItem(item)}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-32 aspect-video rounded overflow-hidden bg-gray-700 flex-shrink-0">
                          {item.thumbnailUrl || (isImage && item.fileUrl) ? (
                            <NextImage
                              src={`/api/oftv-gallery/thumbnail?fileId=${item.fileUrl}`}
                              alt={item.fileName}
                              fill
                              className="object-cover"
                              sizes="128px"
                              quality={95}
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              {isVideo ? (
                                <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                              ) : (
                                <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          )}

                          {/* Duration badge */}
                          {item.durationMillis && (
                            <div className="absolute bottom-1 right-1">
                              <div className="bg-black/80 text-white px-1 py-0.5 rounded text-[10px] font-semibold">
                                {formatDuration(item.durationMillis)}
                              </div>
                            </div>
                          )}

                          {/* Play icon for videos */}
                          {isVideo && !isFeatured && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                                <svg className="h-4 w-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className={`text-sm font-medium truncate mb-1 ${
                            isFeatured ? 'text-pink-400' : 'text-white'
                          }`}>
                            {item.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {isVideo && <span>🎬 Video</span>}
                            {isImage && <span>🖼️ Image</span>}
                            {item.durationMillis && (
                              <span>• {formatDuration(item.durationMillis)}</span>
                            )}
                          </div>
                        </div>

                        {/* Featured indicator */}
                        {isFeatured && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-4 border-t border-gray-800 text-sm text-gray-400">
            Press <kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd> to close
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
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
          </div>

          <div 
            className="max-w-7xl max-h-full w-full h-full flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600"></div>
              </div>
            )}
            
            <div className="relative w-full h-full flex items-center justify-center">
              <NextImage
                src={`/api/oftv-gallery/thumbnail?fileId=${previewFile.fileUrl}`}
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

          <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg">
            Press <kbd className="px-2 py-0.5 bg-white/20 rounded">ESC</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
}
