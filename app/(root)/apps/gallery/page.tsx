'use client';

import React, { useState, useEffect, useRef } from 'react';

// Global cache to persist loaded image states across component re-mounts
const imageLoadCache = new Map<string, boolean>();
import { Search, Filter, Send, Copy, Eye, DollarSign, TrendingUp, Heart, Star, Grid3X3, List, SlidersHorizontal, X, Play, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreVertical, ExternalLink, Link } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import PermissionGoogleOptimized from '@/components/PermissionGoogleOptimized';

interface GalleryItem {
  id: string;
  sheetRowId: string;
  title: string;
  captionText: string;
  price: number;
  totalBuys: number;
  totalRevenue: number;
  category: string;
  dateAdded: string;
  contentStyle?: string;
  messageType?: string;
  gifUrl?: string;
  previewUrl?: string;
  contentType: 'FAVORITE' | 'RELEASE' | 'LIBRARY';
  usageCount?: number;
  lastUsed?: Date | null;
  notes?: string;
  isFavorite?: boolean;
  isRelease?: boolean;
  isPTR?: boolean; // Added for PTR functionality
  creatorName?: string;
  creator?: string; // Added for backwards compatibility
}

const GalleryContent = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'releases'>('all');
  const [sortBy, setSortBy] = useState('performance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [revenueFilter, setRevenueFilter] = useState('');
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  
  // State for real-time counts and loading states
  const [breakdown, setBreakdown] = useState<{
    favorites: number;
    releases: number;
    library: number;
  }>({ favorites: 0, releases: 0, library: 0 });
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set());
  const [loadingPTR, setLoadingPTR] = useState<Set<string>>(new Set());

  // Single effect to handle ALL state changes
  useEffect(() => {
    const fetchData = async () => {
      if (loadingRef.current) return; // Prevent concurrent calls
      
      loadingRef.current = true;
      setLoading(true);
      try {
        // Build query parameters for filters
        const params = new URLSearchParams();
        
        if (activeTab !== 'all') {
          params.set('type', activeTab);
        }
        
        if (searchQuery) {
          params.set('q', searchQuery);
        }
        
        if (categoryFilter) {
          params.set('category', categoryFilter);
        }
        
        if (creatorFilter) {
          params.set('creator', creatorFilter);
        }
        
        if (priceRange.min) {
          params.set('minPrice', priceRange.min);
        }
        
        if (priceRange.max) {
          params.set('maxPrice', priceRange.max);
        }
        
        if (revenueFilter) {
          params.set('minRevenue', revenueFilter);
        }
        
        // Add pagination parameters
        params.set('page', currentPage.toString());
        params.set('limit', itemsPerPage.toString());
        
        let response;
        if (activeTab === 'favorites') {
          // Fetch favorites data
          response = await fetch('/api/favorites');
        } else {
          // Fetch regular gallery data
          response = await fetch(`/api/gallery?${params.toString()}`);
        }
        
        if (response.ok) {
          const data = await response.json();
          
          if (activeTab === 'favorites') {
            // For favorites, display the full items returned by the API
            const favoriteItems = data.fullItems || [];
            console.log('Displaying favorite items:', favoriteItems.length);
            setGalleryItems(favoriteItems);
            setCategories([]);
            setPagination({ 
              currentPage: 1, 
              totalPages: 1, 
              totalItems: favoriteItems.length,
              itemsPerPage: favoriteItems.length,
              hasNextPage: false,
              hasPreviousPage: false,
              startIndex: 1,
              endIndex: favoriteItems.length
            });
          } else {
            setGalleryItems(data.items || []);
            setCategories(data.categories || []);
            setPagination(data.pagination || null);
            setBreakdown(data.breakdown || { favorites: 0, releases: 0, library: 0 });
          }
          
          console.log('Gallery loaded:', {
            pagination: data.pagination,
            breakdown: data.breakdown,
            items: data.items?.length || 0,
            totalLibraryItems: data.totalLibraryItems
          });
        } else {
          const errorData = await response.json();
          console.error('Gallery API error:', errorData);
          toast.error(errorData.error || 'Failed to load gallery content');
        }
      } catch (error) {
        console.error('Failed to fetch gallery content:', error);
        toast.error('Failed to load gallery content');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    };

    let timeoutId: NodeJS.Timeout;
    
    // Debounce search, but fetch immediately for other changes  
    if (searchQuery.trim()) {
      timeoutId = setTimeout(() => {
        fetchData();
      }, 500);
    } else {
      fetchData();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [activeTab, searchQuery, categoryFilter, creatorFilter, priceRange, revenueFilter, currentPage, itemsPerPage]);

  // Helper function for manual refresh (not tied to useEffect dependencies)
  const fetchGalleryContent = () => {
    // Trigger a re-render by updating a dependency
    setCurrentPage(prev => prev);
  };

  const handleQuickAction = async (itemId: string, action: string, item: GalleryItem) => {
    try {
      switch (action) {
        case 'copy':
          await navigator.clipboard.writeText(item.captionText || '');
          toast.success('Caption copied to clipboard');
          break;
        case 'copy_url':
          const mediaUrl = item.previewUrl || item.gifUrl;
          if (mediaUrl) {
            await navigator.clipboard.writeText(mediaUrl);
            toast.success('Media URL copied to clipboard');
          }
          break;
        case 'send_dm':
          toast.info('DM functionality would be implemented here');
          break;
        case 'favorite':
          // Add to favorites functionality
          toast.info('Add to favorites functionality');
          break;
        case 'view':
          const url = item.previewUrl || item.gifUrl;
          if (url) {
            window.open(url, '_blank');
          }
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Action failed');
    }
  };

  const truncateCaption = (caption: string, maxLength = 100) => {
    if (!caption || caption.length <= maxLength) return caption || '';
    return caption.substring(0, maxLength) + '...';
  };

  // Items are already sorted and paginated by the API
  const currentContent = galleryItems;
  const sortedContent = currentContent; // No need to re-sort, API handles it

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const ContentCard = ({ content }: { content: GalleryItem }) => {
    const [mediaError, setMediaError] = useState(false);
    const rawMediaUrl = content.previewUrl || content.gifUrl;
    const isGif = rawMediaUrl?.toLowerCase().includes('.gif');
    
    // Domains that require proxy from the start due to CORS issues
    const corsProblematicDomains = ['betterfans.app', 'allthiscash.com'];
    const needsProxy = rawMediaUrl && corsProblematicDomains.some(domain => 
      rawMediaUrl.includes(domain)
    );
    
    const [useProxy, setUseProxy] = useState(needsProxy);
    const [useVideo, setUseVideo] = useState(false); // Disable video for now, focus on img
    
    // Use proxy for external URLs to avoid CORS issues
    const getMediaUrl = (url: string) => {
      if (!url) return '';
      
      // Check if it's an external URL that needs proxying
      const isExternal = url.startsWith('http') && !url.includes(window.location.hostname);
      
      if (isExternal && useProxy) {
        return `/api/media-proxy?url=${encodeURIComponent(url)}`;
      }
      
      return url;
    };
    
    const mediaUrl = rawMediaUrl ? getMediaUrl(rawMediaUrl) : '';
    
    // Use refs and global cache to persist state across component re-renders
    const cacheKey = `${content.id}-${mediaUrl}`;
    const [mediaLoaded, setMediaLoaded] = useState(() => imageLoadCache.get(cacheKey) || false);
    const mediaLoadedRef = useRef(imageLoadCache.get(cacheKey) || false);
    const imageRef = useRef<HTMLImageElement>(null);
    
    const handleImageError = () => {
      if (!useProxy && rawMediaUrl?.startsWith('http')) {
        // Try with proxy first
        setUseProxy(true);
        setMediaError(false);
        setMediaLoaded(false);
        mediaLoadedRef.current = false;
        imageLoadCache.delete(cacheKey);
      } else {
        // If proxy also fails or it's not an external URL
        setMediaError(true);
        mediaLoadedRef.current = false;
        imageLoadCache.delete(cacheKey);
      }
    };

    const handleImageLoad = () => {
      setMediaLoaded(true);
      mediaLoadedRef.current = true;
      imageLoadCache.set(cacheKey, true);
    };

    const handleAddToFavorites = async (item: GalleryItem) => {
      // Skip if already loading
      if (loadingFavorites.has(item.id)) return;
      
      // Skip if already favorited
      if (item.isFavorite) {
        toast.info('Item is already in favorites');
        return;
      }
      
      // 1. OPTIMISTIC UPDATE - Update UI immediately for great UX
      setLoadingFavorites(prev => new Set(prev).add(item.id));
      
      // Update the item's favorite status optimistically
      setGalleryItems(prevItems => 
        prevItems.map(i => 
          i.id === item.id ? { ...i, isFavorite: true } : i
        )
      );
      
      // Update the breakdown counter optimistically
      setBreakdown(prev => ({
        ...prev,
        favorites: prev.favorites + 1
      }));

      try {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: item.id,
            title: item.title,
            creator: item.creatorName || 'Unknown',
            sheetReference: item.sheetRowId, // This will be the link back to original sheet data
            addedAt: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          // 2. SUCCESS - Show confirmation
          toast.success(`Added "${item.title}" to favorites!`, {
            duration: 2000,
            action: {
              label: 'View Saved',
              onClick: () => setActiveTab('favorites')
            }
          });
          console.log('✅ Added to favorites:', item.title);
        } else {
          // 3. ERROR - Revert optimistic changes
          const errorData = await response.json();
          console.error('❌ Failed to add to favorites:', errorData);
          
          // Revert the optimistic updates
          setGalleryItems(prevItems => 
            prevItems.map(i => 
              i.id === item.id ? { ...i, isFavorite: false } : i
            )
          );
          
          setBreakdown(prev => ({
            ...prev,
            favorites: Math.max(0, prev.favorites - 1)
          }));
          
          toast.error(errorData.error || 'Failed to add to favorites');
        }
      } catch (error) {
        console.error('❌ Error adding to favorites:', error);
        
        // Revert the optimistic updates on network error
        setGalleryItems(prevItems => 
          prevItems.map(i => 
            i.id === item.id ? { ...i, isFavorite: false } : i
          )
        );
        
        setBreakdown(prev => ({
          ...prev,
          favorites: Math.max(0, prev.favorites - 1)
        }));
        
        toast.error('Network error. Please try again.');
      } finally {
        // 4. CLEANUP - Remove loading state
        setLoadingFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    };

    const handleTogglePTR = async (item: GalleryItem) => {
      try {
        const response = await fetch('/api/ptr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: item.id,
            title: item.title,
            creator: item.creator || 'Unknown',
            isPTR: !item.isPTR,
            updatedAt: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          console.log(item.isPTR ? 'Removed PTR:' : 'Marked as PTR:', item.title);
          // Update local state
          setGalleryItems(prev => prev.map(galleryItem => 
            galleryItem.id === item.id 
              ? { ...galleryItem, isPTR: !item.isPTR }
              : galleryItem
          ));
        } else {
          console.error('Failed to toggle PTR');
        }
      } catch (error) {
        console.error('Error toggling PTR:', error);
      }
    };

    // Initialize loading state on component mount or URL change
    useEffect(() => {
      if (mediaUrl) {
        // Reset loading state when URL changes
        if (!mediaLoadedRef.current) {
          setMediaLoaded(false);
        }
      }
    }, [mediaUrl]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        mediaLoadedRef.current = false;
      };
    }, []);


    return (
      <Card className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
        {/* Media Preview */}
        <div className="relative h-48 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 overflow-hidden">
          {mediaUrl && !mediaError ? (
            <div className="relative w-full h-full">
              {(!mediaLoaded && !mediaLoadedRef.current) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {isGif && useVideo ? (
                // Try video element first for GIFs (better compatibility)
                <video 
                  ref={imageRef}
                  key={`${content.id}-${useProxy}-video`}
                  src={mediaUrl}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  style={{ 
                    opacity: 1, // Force visible until we fix the state logic
                    transition: 'opacity 0.3s ease-in-out',
                    zIndex: 10, // Ensure images appear above other elements
                    position: 'absolute', // Essential for proper positioning
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                  onLoadedData={handleImageLoad}
                  onError={() => setUseVideo(false)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  crossOrigin={useProxy ? 'anonymous' : undefined}
                />
              ) : (
                <img 
                  ref={imageRef}
                  key={`${content.id}-${useProxy}`}
                  src={mediaUrl}
                  alt={content.title}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  style={{ 
                    opacity: 1, // Force visible until we fix the state logic
                    transition: 'opacity 0.3s ease-in-out',
                    zIndex: 10, // Ensure images appear above other elements
                    position: 'absolute', // Essential for proper positioning
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                  crossOrigin={useProxy ? 'anonymous' : undefined}
                />
              )}
              
              {/* Debug: Add a test to show if the URL is accessible at all */}
              {mediaError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-sm p-4">
                  <div className="text-red-500 mb-2">Failed to Load</div>
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    className="text-blue-500 underline text-xs break-all"
                    rel="noopener noreferrer"
                  >
                    Test URL
                  </a>
                </div>
              )}
              
              {(mediaLoaded || mediaLoadedRef.current) && (
                <>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {content.isPTR && (
                      <Badge className="bg-red-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm font-bold">
                        PTR
                      </Badge>
                    )}
                    {isGif && (
                      <Badge className="bg-purple-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                        GIF
                      </Badge>
                    )}
                    {useProxy && (
                      <Badge className="bg-blue-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
                        PROXY
                      </Badge>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 z-50 flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant={content.isFavorite ? "default" : "secondary"}
                      disabled={loadingFavorites.has(content.id)}
                      className={`${content.isFavorite 
                        ? "bg-pink-500/90 hover:bg-pink-600 text-white border-pink-500" 
                        : "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900"} backdrop-blur-sm text-xs px-2 py-1 cursor-pointer transition-all duration-200 ${
                          loadingFavorites.has(content.id) ? "opacity-60 cursor-wait" : ""
                        }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToFavorites(content);
                      }}
                    >
                      {loadingFavorites.has(content.id) ? (
                        <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Heart className={`w-3 h-3 mr-1 ${content.isFavorite ? 'fill-current' : ''}`} />
                      )}
                      {content.isFavorite ? 'Saved' : 'Favorite'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={content.isPTR ? "destructive" : "secondary"}
                      className={`${content.isPTR 
                        ? "bg-red-500/90 hover:bg-red-600 text-white" 
                        : "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900"} backdrop-blur-sm text-xs px-2 py-1 cursor-pointer`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTogglePTR(content);
                      }}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {content.isPTR ? 'Remove PTR' : 'Mark PTR'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
              <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full text-center">
                {mediaError ? 'Media Unavailable' : 'No Preview'}
              </div>
              {mediaError && rawMediaUrl && (
                <button
                  onClick={() => {
                    setMediaError(false);
                    setMediaLoaded(false);
                    setUseProxy(!useProxy);
                  }}
                  className="text-xs text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        
        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {content.isFavorite && (
            <Badge className="bg-pink-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
              <Heart className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
          {content.isRelease && (
            <Badge className="bg-blue-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
              <Star className="w-3 h-3 mr-1" />
              Released
            </Badge>
          )}
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-green-500/90 text-white text-xs px-2 py-1 backdrop-blur-sm">
            {content.category}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Title and Caption */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-1">
            {content.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
            {truncateCaption(content.captionText, 120)}
          </p>
        </div>
        
        {/* Performance Metrics */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
              <DollarSign className="w-3 h-3 mr-1" />
              ${content.price}
            </div>
            <div className="flex items-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3 mr-1" />
              {content.totalBuys}
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ${content.totalRevenue.toLocaleString()}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
            onClick={() => handleQuickAction(content.id, 'send_dm', content)}
          >
            <Send className="w-3 h-3 mr-1" />
            Send
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => handleQuickAction(content.id, 'copy', content)}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          <Button 
            size="sm" 
            variant={content.isFavorite ? "default" : "outline"}
            disabled={loadingFavorites.has(content.id)}
            className={`${content.isFavorite 
              ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-500" 
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"} transition-all duration-200 ${
                loadingFavorites.has(content.id) ? "opacity-60 cursor-wait" : ""
              }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToFavorites(content);
            }}
          >
            {loadingFavorites.has(content.id) ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Heart className={`w-4 h-4 ${content.isFavorite ? 'fill-current' : ''}`} />
            )}
          </Button>
          
          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleQuickAction(content.id, 'view', content)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Media
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction(content.id, 'copy_url', content)}>
                <Link className="w-4 h-4 mr-2" />
                Copy URL
              </DropdownMenuItem>
              {mediaError && rawMediaUrl && (
                <DropdownMenuItem 
                  onClick={() => {
                    setMediaError(false);
                    setMediaLoaded(false);
                    setUseProxy(!useProxy);
                  }}
                  className="text-blue-600 dark:text-blue-400"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {useProxy ? 'Direct Load' : 'Use Proxy'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {/* Modern Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Section */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                Content Gallery
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Discover and manage your high-performing content library
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="border-gray-300 dark:border-gray-600"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-300 dark:border-gray-600"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {showFilters && <X className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors hover:shadow-lg dark:hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentContent.length.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Content</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors hover:shadow-lg dark:hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentContent.reduce((sum, item) => sum + item.totalBuys, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Sales</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors hover:shadow-lg dark:hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${currentContent.reduce((sum, item) => sum + item.totalRevenue, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Revenue</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors hover:shadow-lg dark:hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentContent.filter(item => item.isFavorite || item.isRelease).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Saved Items</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search content, captions, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-xl text-lg"
            />
          </div>
          
          {/* Quick Filter Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'favorites' | 'releases')} className="shrink-0">
            <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                All ({galleryItems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="favorites" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                <Heart className="w-4 h-4 mr-1" />
                Saved ({breakdown.favorites})
              </TabsTrigger>
              <TabsTrigger 
                value="releases" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                <Star className="w-4 h-4 mr-1" />
                Released ({breakdown.releases})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('');
                  setCreatorFilter('');
                  setPriceRange({ min: '', max: '' });
                  setRevenueFilter('');
                  setSortBy('performance');
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</label>
                <Select value={sortBy} onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1); // Reset to first page when changing sort
                }}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Top Performance</SelectItem>
                    <SelectItem value="newest">Most Recent</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <Select value={categoryFilter} onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1); // Reset to first page when changing filter
                }}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Creator Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Creator</label>
                <Select value={creatorFilter} onValueChange={(value) => {
                  setCreatorFilter(value);
                  setCurrentPage(1); // Reset to first page when changing filter
                }}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Creators</SelectItem>
                    <SelectItem value="DAKOTA FREE">Dakota Free</SelectItem>
                    <SelectItem value="BENTLEE FREE">Bentlee Free</SelectItem>
                    <SelectItem value="HAILEY W">Hailey W</SelectItem>
                    <SelectItem value="EMILY RAY">Emily Ray</SelectItem>
                    <SelectItem value="NIKA">Nika</SelectItem>
                    <SelectItem value="ZOE">Zoe</SelectItem>
                    <SelectItem value="GRACE">Grace</SelectItem>
                    <SelectItem value="JANE">Jane</SelectItem>
                    <SelectItem value="OAKLY">Oakly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Range</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange(prev => ({ ...prev, min: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-gray-400">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange(prev => ({ ...prev, max: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
              
              {/* Revenue Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Revenue</label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className={`${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        } mb-8`}>
          {sortedContent.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-200 dark:border-gray-700">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{pagination.startIndex}</span> to{' '}
              <span className="font-medium text-gray-900 dark:text-white">{pagination.endIndex}</span> of{' '}
              <span className="font-medium text-gray-900 dark:text-white">{pagination.totalItems.toLocaleString()}</span> results
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}>
                <SelectTrigger className="w-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={!pagination.hasPreviousPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-2">
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
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-8 ${currentPage === pageNum 
                        ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                        : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                  <>
                    <span className="text-gray-400 px-2">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(pagination.totalPages)}
                      className="w-10 h-8 border-gray-300 dark:border-gray-600"
                    >
                      {pagination.totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {sortedContent.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No results found' : 'No content available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? `No content matches your search "${searchQuery}". Try adjusting your filters or search terms.`
                : 'Your content library appears to be empty. Check your data source or try refreshing the page.'
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setPriceRange({ min: '', max: '' });
                  setRevenueFilter('');
                }}
                className="border-gray-300 dark:border-gray-600"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const GalleryPage = () => {
  return (
    <PermissionGoogleOptimized
      apiEndpoint="/api/gallery"
      cacheKey="gallery-permissions"
      cacheDuration={10 * 60 * 1000} // 10 minutes cache
      skeleton={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="text-gray-900 dark:text-white text-lg font-medium">Checking permissions...</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Setting up your gallery</div>
          </div>
        </div>
      }
    >
      <GalleryContent />
    </PermissionGoogleOptimized>
  );
};

export default GalleryPage;