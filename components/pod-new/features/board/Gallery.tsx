"use client";

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { Image, Grid3x3, List, Search, Eye, X, Folder, ExternalLink, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface GalleryProps {
  teamName: string;
  teamId: string;
}

type ViewMode = 'grid' | 'list';
type FileTypeFilter = 'ALL' | 'VIDEO' | 'IMAGE';
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc' | 'duration-desc' | 'duration-asc';

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

// Helper function to format duration in a user-friendly way
const formatDuration = (durationMillis: number): string => {
  const durationSeconds = Math.floor(durationMillis / 1000);
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

export default function Gallery({ teamName, teamId }: GalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClientModel, setSelectedClientModel] = useState<string | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [previewFile, setPreviewFile] = useState<GalleryItem | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClientModel, fileTypeFilter, sortOption]);

  // Fetch paginated gallery items (now paginated by folders, not items)
  const { data: galleryData, isLoading, error } = useQuery({
    queryKey: ['oftv-gallery-items', selectedClientModel, debouncedSearch, currentPage, sortOption],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sortBy: sortOption
      });
      
      if (selectedClientModel) {
        params.append('clientModel', selectedClientModel);
      }
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      const response = await fetch(`/api/oftv-gallery/items?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch gallery items');
      }
      return response.json();
    },
  });

  const items: GalleryItem[] = galleryData?.items || [];
  const clientModels: ClientModelFilter[] = galleryData?.clientModels || [];
  const pagination: PaginationInfo | undefined = galleryData?.pagination;

  // Apply client-side file type filtering only (sorting is done server-side)
  const filteredItems = items.filter(item => {
    // File type filter based on mime type
    if (fileTypeFilter !== 'ALL') {
      const isImage = item.mimeType?.startsWith('image/') || item.fileType === 'IMAGE' || item.fileType === 'THUMBNAIL' || item.fileType === 'GIF';
      const isVideo = item.mimeType?.startsWith('video/') || item.fileType === 'VIDEO';
      
      if (fileTypeFilter === 'IMAGE' && !isImage) {
        return false;
      }
      if (fileTypeFilter === 'VIDEO' && !isVideo) {
        return false;
      }
    }
    return true;
  });

  // Group items by folder name (already sorted by server)
  const groupedByFolder = filteredItems.reduce((acc, item) => {
    const folderKey = item.folderName || 'Uncategorized';
    if (!acc[folderKey]) {
      acc[folderKey] = {
        folderName: item.folderName,
        folderDriveId: item.folderDriveId,
        clientModel: item.clientModel,
        items: []
      };
    }
    acc[folderKey].items.push(item);
    return acc;
  }, {} as Record<string, { folderName: string | null; folderDriveId: string | null; clientModel: string; items: GalleryItem[] }>);

  // Convert to array (preserve server order)
  const folderGroups = Object.values(groupedByFolder);

  // Flatten for total count
  const sortedItems = filteredItems;

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
            ) : pagination ? (
              <>
                {sortedItems.length !== pagination.totalItems && (
                  <span className="text-pink-600 dark:text-pink-400 font-medium">
                    {sortedItems.length} of {pagination.totalItems} items
                  </span>
                )}
                {sortedItems.length === pagination.totalItems && (
                  <span>
                    {pagination.totalItems} {pagination.totalItems === 1 ? 'item' : 'items'}
                  </span>
                )}
                {selectedClientModel && <span> for {selectedClientModel}</span>}
                {(fileTypeFilter !== 'ALL' || sortOption !== 'newest') && (
                  <span className="text-pink-600 dark:text-pink-400"> • Filtered</span>
                )}
              </>
            ) : (
              <>
                {sortedItems.length !== items.length && (
                  <span className="text-pink-600 dark:text-pink-400 font-medium">
                    {sortedItems.length} of {items.length} items
                  </span>
                )}
                {sortedItems.length === items.length && (
                  <span>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                )}
                {selectedClientModel && <span> for {selectedClientModel}</span>}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Filters & Search - Always visible */}
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
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg transition-all ${
              showFilters || fileTypeFilter !== 'ALL' || sortOption !== 'newest'
                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {(fileTypeFilter !== 'ALL' || sortOption !== 'newest') && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* File Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  File Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'IMAGE', 'VIDEO'] as FileTypeFilter[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFileTypeFilter(type)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        fileTypeFilter === type
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-700'
                      }`}
                    >
                      {type === 'ALL' ? 'All Types' : type === 'IMAGE' ? 'Images' : 'Videos'}
                    </button>
                  ))}
                </div>
              </div>

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
                  <optgroup label="Date">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </optgroup>
                  <optgroup label="Name">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </optgroup>
                  <optgroup label="Size">
                    <option value="size-desc">Largest First</option>
                    <option value="size-asc">Smallest First</option>
                  </optgroup>
                  <optgroup label="Duration">
                    <option value="duration-desc">Longest First</option>
                    <option value="duration-asc">Shortest First</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Active Filters Summary & Reset */}
            {(fileTypeFilter !== 'ALL' || sortOption !== 'newest') && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Filter className="h-4 w-4" />
                  <span>
                    {fileTypeFilter !== 'ALL' && `Type: ${fileTypeFilter}`}
                    {fileTypeFilter !== 'ALL' && sortOption !== 'newest' && ' • '}
                    {sortOption !== 'newest' && `Sort: ${sortOption.replace('-', ' ')}`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFileTypeFilter('ALL');
                    setSortOption('newest');
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

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-8">
          {/* Skeleton for folder groups */}
          {[...Array(2)].map((_, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* Folder Header Skeleton */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1 space-y-2">
                  {/* Folder name skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  {/* Model info skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Grid of skeleton items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination skeleton */}
          <div className="flex items-center justify-between py-6 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
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
          {/* Gallery Grid/List */}
          {viewMode === 'grid' ? (
            <div className="space-y-8">
              {folderGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  {/* Folder Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      {group.folderName ? (
                        <a
                          href={`https://drive.google.com/drive/folders/${group.folderDriveId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 transition-colors group/folder"
                        >
                          <Folder className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                          <span>{group.folderName}</span>
                          <ExternalLink className="h-4 w-4 opacity-0 group-hover/folder:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                          <Folder className="h-5 w-5 text-gray-400" />
                          <span>Uncategorized</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>{group.clientModel}</span>
                        <span className="text-gray-400">•</span>
                        <span>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid of items in this folder */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.items.map((item) => {
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
                            src={`/api/oftv-gallery/thumbnail?fileId=${item.fileUrl}`}
                            alt={item.fileName}
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

                      {/* YouTube-style duration badge (bottom-right corner) */}
                      {item.durationMillis && isVideo && (
                        <div className="absolute bottom-2 right-2">
                          <div className="bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                            {formatDuration(item.durationMillis)}
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

                      {/* YouTube-style metadata */}
                      <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                        {/* First line: dimensions and file size */}
                        {(item.width && item.height) || item.fileSize ? (
                          <div className="flex items-center gap-1">
                            {item.width && item.height && (
                              <span>{item.width} × {item.height}</span>
                            )}
                            {item.width && item.height && item.fileSize && (
                              <span>•</span>
                            )}
                            {item.fileSize && (
                              <span>{formatFileSize(item.fileSize)}</span>
                            )}
                          </div>
                        ) : null}
                        
                        {/* Second line: timestamp */}
                        <div className="text-gray-500 dark:text-gray-500">
                          {formatRelativeTime(item.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
          ) : (
            /* List View */
            <div className="space-y-8">
              {folderGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  {/* Folder Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      {group.folderName ? (
                        <a
                          href={`https://drive.google.com/drive/folders/${group.folderDriveId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 transition-colors group/folder"
                        >
                          <Folder className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                          <span>{group.folderName}</span>
                          <ExternalLink className="h-4 w-4 opacity-0 group-hover/folder:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                          <Folder className="h-5 w-5 text-gray-400" />
                          <span>Uncategorized</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>{group.clientModel}</span>
                        <span className="text-gray-400">•</span>
                        <span>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                  </div>

                  {/* List of items in this folder */}
                  <div className="space-y-2">
                    {group.items.map((item) => {
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
                        <div className="w-full h-full relative">
                          <NextImage
                            src={`/api/oftv-gallery/thumbnail?fileId=${item.fileUrl}`}
                            alt={item.fileName}
                            fill
                            sizes="80px"
                            className="object-cover transition-opacity duration-300"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                            unoptimized
                          />
                        </div>
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
                      
                      {/* YouTube-style duration badge */}
                      {item.durationMillis && isVideo && (
                        <div className="absolute bottom-1 right-1">
                          <div className="bg-black/80 text-white text-xs font-semibold px-1 py-0.5 rounded">
                            {formatDuration(item.durationMillis)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                        {item.fileName}
                      </h3>
                      
                      {/* YouTube-style metadata */}
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {item.width && item.height && (
                          <span>{item.width} × {item.height}</span>
                        )}
                        {item.width && item.height && item.fileSize && (
                          <span>•</span>
                        )}
                        {item.fileSize && (
                          <span>{formatFileSize(item.fileSize)}</span>
                        )}
                        {(item.width && item.height || item.fileSize) && (
                          <span>•</span>
                        )}
                        <span className="text-gray-500 dark:text-gray-500">{formatRelativeTime(item.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
          )}

          {/* Empty State */}
          {sortedItems.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No items found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                {searchQuery ? (
                  `No results found for "${searchQuery}"`
                ) : fileTypeFilter !== 'ALL' ? (
                  `No ${fileTypeFilter.toLowerCase()}s found`
                ) : selectedClientModel ? (
                  `No items found for ${selectedClientModel}`
                ) : (
                  'No gallery items available.'
                )}
              </p>
              {(fileTypeFilter !== 'ALL' || selectedClientModel || searchQuery) && (
                <button
                  onClick={() => {
                    setFileTypeFilter('ALL');
                    setSelectedClientModel(null);
                    setSearchQuery('');
                    setSortOption('newest');
                  }}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between py-6 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Page {pagination.page} of {pagination.totalPages} • {pagination.itemsOnCurrentPage} items ({pagination.totalFolders} folders total, {pagination.totalItems} items total)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  First
                </button>
                
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-pink-600 text-white'
                            : 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
                
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Last
                </button>
              </div>
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

          {/* ESC hint */}
          <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg">
            Press <kbd className="px-2 py-0.5 bg-white/20 rounded">ESC</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
}
