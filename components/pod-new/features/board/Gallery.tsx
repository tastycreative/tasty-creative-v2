"use client";

import React, { useState, useEffect } from 'react';
import { Image, Grid3x3, List, Search, Download, Eye, X, Folder, FolderOpen, ChevronRight, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface GalleryProps {
  teamName: string;
  teamId: string;
}

type ViewMode = 'grid' | 'list';

interface GalleryFolder {
  id: string;
  name: string;
  webViewLink: string;
  itemCount: number;
  createdAt: string;
  modifiedAt: string;
  isPublished: boolean;
  isGallery?: boolean; // Flag to indicate if this is a gallery folder (client model)
  isFolder?: boolean; // Flag to indicate if this is a folder (vs a file)
  clientModel?: string;
  clientModelId?: string;
  galleryId?: string;
  parentFolderLink?: string;
  driveFolderId?: string; // The actual Google Drive folder ID to open
}

interface GalleryFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: string;
  createdAt: string;
  modifiedAt: string;
  isFolder: false;
  width?: number;
  height?: number;
  durationMillis?: number;
}

// Helper function to format duration in a user-friendly way
const formatDuration = (durationMillis: number): string => {
  const totalSeconds = Math.round(durationMillis / 1000);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

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
const formatFileSize = (sizeInBytes: string | number): string => {
  const bytes = Number(sizeInBytes);
  
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  
  const kb = bytes / 1024;
  if (kb >= 1) {
    return `${kb.toFixed(2)} KB`;
  }
  
  return `${bytes} B`;
};

export default function Gallery({ teamName, teamId }: GalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentGalleryId, setCurrentGalleryId] = useState<string | null>(null); // Track which gallery we're viewing
  const [currentGalleryName, setCurrentGalleryName] = useState<string | null>(null); // Track gallery name for breadcrumb
  const [currentFolder, setCurrentFolder] = useState<string | null>(null); // Track current subfolder
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]); // Breadcrumb path
  const [showPublished, setShowPublished] = useState(false);
  const [previewFile, setPreviewFile] = useState<GalleryFile | null>(null); // For image preview modal
  const [imageLoading, setImageLoading] = useState(false); // Track image loading state

  // Fetch folders from Google Drive via API
  const { data: galleryData, isLoading, error } = useQuery({
    queryKey: ['oftv-gallery-folders', currentGalleryId, currentFolder],
    queryFn: async () => {
      let url = '/api/oftv-gallery/folders';
      if (currentFolder) {
        // Navigating into a subfolder
        url += `?folderId=${currentFolder}`;
      } else if (currentGalleryId) {
        // Viewing a gallery's root folders
        url += `?galleryId=${currentGalleryId}`;
      }
      // else: viewing all galleries
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch gallery folders');
      }
      return response.json();
    },
  });

  const allFolders = galleryData?.folders || [];
  const publishedFolders = galleryData?.publishedFolders || [];
  const files = galleryData?.files || [];
  
  // Apply search filter
  const filteredFolders = (showPublished ? publishedFolders : allFolders).filter((folder: GalleryFolder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = files.filter((file: GalleryFile) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const displayFolders = filteredFolders;

  const currentFolderData = allFolders.find((f: GalleryFolder) => f.id === currentFolder);

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
          <div className="flex items-center gap-2 flex-wrap">
            {/* Always show "All Galleries" */}
            {(currentGalleryId || currentFolder) ? (
              <button
                onClick={() => {
                  setCurrentGalleryId(null);
                  setCurrentGalleryName(null);
                  setCurrentFolder(null);
                  setFolderPath([]);
                }}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                All Galleries
              </button>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                OFTV Gallery
              </h2>
            )}

            {/* Show gallery name */}
            {currentGalleryId && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                {currentFolder ? (
                  <button
                    onClick={() => {
                      setCurrentFolder(null);
                      setFolderPath([]);
                    }}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    {currentGalleryName || galleryData?.clientModel}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentGalleryName || galleryData?.clientModel}
                  </span>
                )}
              </>
            )}

            {/* Show folder path */}
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                {index === folderPath.length - 1 ? (
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {folder.name}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      // Navigate back to this folder
                      const newPath = folderPath.slice(0, index + 1);
                      setCurrentFolder(folder.id);
                      setFolderPath(newPath);
                    }}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    {folder.name}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLoading ? (
              <span className="inline-block h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            ) : currentFolder ? (
              `${displayFolders.length} folders, ${filteredFiles.length} files`
            ) : (
              `${displayFolders.length} folders${showPublished ? ' (Published)' : ''}`
            )}
          </p>
        </div>
        
        {/* Published Toggle - only show at gallery root, not in subfolders */}
        {currentGalleryId && !currentFolder && (publishedFolders.length > 0 || allFolders.length > 0) && (
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setShowPublished(false)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                !showPublished
                  ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Parent ({allFolders.length})
            </button>
            <button
              onClick={() => setShowPublished(true)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                showPublished
                  ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Published ({publishedFolders.length})
            </button>
          </div>
        )}
      </div>

      {/* Loading State - Show skeleton while keeping header visible */}
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
        <>
          {(() => {
            const isPermissionError = error instanceof Error && 
              (error.message.includes('File not found') || 
               error.message.includes('Cannot access') ||
               error.message.includes('permission'));

            return (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isPermissionError 
                    ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                    : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {isPermissionError ? (
                    <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {isPermissionError ? 'Access Required' : 'Failed to load gallery'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                  {isPermissionError ? (
                    <>
                      You don't have permission to access this Google Drive folder. 
                      Please contact your administrator to grant you access.
                    </>
                  ) : (
                    error.message || 'Unable to fetch folders from Google Drive'
                  )}
                </p>
                {isPermissionError && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-lg p-4 max-w-md text-left">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      💡 How to fix this:
                    </p>
                    <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                      <li>Ask the folder owner to share it with your email: <strong className="text-yellow-900 dark:text-yellow-100">{error.message.match(/for (.+@.+\..+)/)?.[1] || 'your account'}</strong></li>
                      <li>Make sure you have at least "Viewer" permissions</li>
                      <li>Refresh this page after access is granted</li>
                    </ol>
                  </div>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            );
          })()}
        </>
      ) : (
        /* Content */
        <>
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search images..."
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

      {/* Gallery Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Folders */}
          {displayFolders.map((folder: GalleryFolder) => (
            <div
              key={`folder-${folder.id}`}
              className={`group relative rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
                folder.isGallery
                  ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700'
                  : folder.isPublished
                  ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700'
                  : 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-700'
              }`}
              onClick={() => {
                if (folder.isGallery) {
                  // Fetch folders from this gallery's Drive folder
                  setCurrentGalleryId(folder.id);
                  setCurrentGalleryName(folder.name);
                  setFolderPath([]);
                } else {
                  // Navigate into this subfolder
                  setCurrentFolder(folder.id);
                  setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
                }
              }}
            >
              {/* Folder Icon */}
              <div className={`aspect-video overflow-hidden flex items-center justify-center ${
                folder.isGallery
                  ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-800/30 dark:to-indigo-800/30'
                  : folder.isPublished
                  ? 'bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-800/30 dark:to-blue-800/30'
                  : 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-800/30 dark:to-purple-800/30'
              }`}>
                <Folder className={`h-16 w-16 group-hover:hidden ${
                  folder.isGallery
                    ? 'text-purple-600 dark:text-purple-400'
                    : folder.isPublished 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-pink-600 dark:text-pink-400'
                }`} />
                <FolderOpen className={`h-16 w-16 hidden group-hover:block ${
                  folder.isGallery
                    ? 'text-purple-600 dark:text-purple-400'
                    : folder.isPublished 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-pink-600 dark:text-pink-400'
                }`} />
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {folder.name}
                </h3>
                {folder.clientModel && !folder.isGallery && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {folder.clientModel}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {folder.isGallery ? 'Gallery' : `${folder.itemCount} items`}
                  </span>
                  {!folder.isGallery && (
                    <a
                      href={folder.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                      title="Open in Google Drive"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Files - show when in a subfolder */}
          {currentFolder && filteredFiles.map((file: GalleryFile) => {
            const isImage = file.mimeType?.startsWith('image/');
            const isVideo = file.mimeType?.startsWith('video/');
            const thumbnailUrl = file.thumbnailLink 
              ? `/api/oftv-gallery/thumbnail?thumbnailLink=${encodeURIComponent(file.thumbnailLink)}`
              : isImage && file.id
              ? `/api/oftv-gallery/thumbnail?fileId=${file.id}`
              : null;
            
            return (
              <div
                key={`file-${file.id}`}
                className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 cursor-pointer"
                onClick={() => {
                  if (isImage) {
                    // Open image in fullscreen modal
                    setPreviewFile(file);
                  } else {
                    // Open video or other files directly in Google Drive
                    window.open(file.webViewLink, '_blank');
                  }
                }}
              >
                {/* Thumbnail/Preview */}
                <div className="aspect-video overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon on error
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="flex flex-col items-center gap-2">
                            <svg class="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-xs text-gray-500">${file.mimeType?.split('/')[1]?.toUpperCase()}</span>
                          </div>
                        `;
                      }}
                    />
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
                        {file.mimeType?.split('/')[1]?.toUpperCase()}
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
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {file.width && file.height && `${file.width}x${file.height}`}
                      {file.durationMillis && formatDuration(file.durationMillis)}
                      {file.size && !file.width && formatFileSize(file.size)}
                    </span>
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                      title="Open in Google Drive"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {/* Folders */}
          {displayFolders.map((folder: GalleryFolder) => (
            <div
              key={`folder-${folder.id}`}
              className={`flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer ${
                folder.isGallery
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700'
                  : folder.isPublished
                  ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700'
                  : 'bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-700'
              }`}
              onClick={() => {
                if (folder.isGallery) {
                  // Fetch folders from this gallery's Drive folder
                  setCurrentGalleryId(folder.id);
                  setCurrentGalleryName(folder.name);
                  setFolderPath([]);
                } else {
                  // Navigate into this subfolder
                  setCurrentFolder(folder.id);
                  setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
                }
              }}
            >
              {/* Folder Icon */}
              <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center ${
                folder.isGallery
                  ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-800/30 dark:to-indigo-800/30'
                  : folder.isPublished
                  ? 'bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-800/30 dark:to-blue-800/30'
                  : 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-800/30 dark:to-purple-800/30'
              }`}>
                <Folder className={`h-10 w-10 ${
                  folder.isGallery
                    ? 'text-purple-600 dark:text-purple-400'
                    : folder.isPublished 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-pink-600 dark:text-pink-400'
                }`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {folder.name}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {folder.clientModel && !folder.isGallery && (
                    <>
                      <span className="font-medium">{folder.clientModel}</span>
                      <span>•</span>
                    </>
                  )}
                  {folder.isGallery ? (
                    <span className="font-medium text-purple-600 dark:text-purple-400">Gallery</span>
                  ) : (
                    <>
                      <span>{folder.itemCount} items</span>
                      <span>•</span>
                      <span>{folder.isPublished ? 'Published' : 'Parent'}</span>
                      <span>•</span>
                      <a
                        href={folder.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open in Drive</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          ))}

          {/* Files - show when in a subfolder */}
          {currentFolder && filteredFiles.map((file: GalleryFile) => {
            const isImage = file.mimeType?.startsWith('image/');
            const isVideo = file.mimeType?.startsWith('video/');
            const thumbnailUrl = file.thumbnailLink 
              ? `/api/oftv-gallery/thumbnail?thumbnailLink=${encodeURIComponent(file.thumbnailLink)}`
              : isImage && file.id
              ? `/api/oftv-gallery/thumbnail?fileId=${file.id}`
              : null;
            
            return (
              <div
                key={`file-${file.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all bg-white dark:bg-gray-800 cursor-pointer group"
                onClick={() => {
                  if (isImage) {
                    // Open image in fullscreen modal
                    setPreviewFile(file);
                  } else {
                    // Open video or other files directly in Google Drive
                    window.open(file.webViewLink, '_blank');
                  }
                }}
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={file.name}
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
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-gray-400">{file.mimeType?.split('/')[1]?.toUpperCase()}</span>
                    {file.width && file.height && (
                      <>
                        <span>•</span>
                        <span>{file.width}x{file.height}</span>
                      </>
                    )}
                    {file.durationMillis && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(file.durationMillis)}</span>
                      </>
                    )}
                    {file.size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                      </>
                    )}
                    <span>•</span>
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in Drive</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayFolders.length === 0 && filteredFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No {currentFolder ? 'content' : 'folders'} found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            {searchQuery ? (
              `No results found for "${searchQuery}"`
            ) : currentFolder ? (
              'This folder is empty.'
            ) : (
              'No folders found in the parent Google Drive folder. Make sure the parent folder link is configured correctly.'
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
            <h3 className="text-lg font-semibold mb-2">{previewFile.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              {previewFile.width && previewFile.height && (
                <span>{previewFile.width} × {previewFile.height}</span>
              )}
              {previewFile.size && (
                <span>{formatFileSize(previewFile.size)}</span>
              )}
            </div>
          </div>

          <a
            href={previewFile.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors z-10 shadow-lg"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in Google Drive</span>
          </a>

          <div 
            className="max-w-7xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600"></div>
              </div>
            )}
            
            {/* Load full resolution image from Drive API */}
            <img
              src={`/api/oftv-gallery/thumbnail?fileId=${previewFile.id}`}
              alt={previewFile.name}
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={(e) => e.stopPropagation()}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
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
