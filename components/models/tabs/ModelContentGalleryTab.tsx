"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Video,
  Image as ImageIcon,
  Rocket,
  Edit,
  Eye,
  Film,
  Calendar,
  Zap,
  Camera,
  Play,
  AlertCircle,
  Folder,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import FolderViewer from "../FolderViewer";

interface ModelContentGalleryTabProps {
  modelName: string;
}

interface ContentItem {
  id: string;
  type: "video" | "photo";
  title: string;
  duration?: string;
  imageCount?: number;
  timeAgo: string;
  status: "HAS_GIF" | "NEEDS_GIF";
  campaignReady: boolean;
  thumbnail: string;
  category?: string;
  featuredEvents?: string;
  caption?: string;
  videoLink?: string;
  creationDate?: string;
  creator?: string;
  results?: string;
  additionalNotes?: string;
  isVaultNew?: boolean;
  driveId?: string | null;
  isFolder?: boolean;
  // Social media specific properties
  contentType?: string;
  platform?: string;
  description?: string;
  postLink?: string;
  uploadDate?: string;
}

const ModelContentGalleryTab: React.FC<ModelContentGalleryTabProps> = ({
  modelName,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all-content");
  const [searchQuery, setSearchQuery] = useState("");
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [sextingItems, setSextingItems] = useState<ContentItem[]>([]);
  const [socialMediaItems, setSocialMediaItems] = useState<ContentItem[]>([]);
  const [socialMediaTotalCount, setSocialMediaTotalCount] = useState(0);
  const [allContentItems, setAllContentItems] = useState<ContentItem[]>([]);
  const [allContentTotalCount, setAllContentTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Map of driveId to sibling thumbnailLink
  const [siblingThumbnails, setSiblingThumbnails] = useState<Record<string, string>>(/** @type {any} */({}));
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // --- Move function definitions above their first use ---
  const getDashboardStats = () => {
    const total = contentItems.length;
    const hasGif = contentItems.filter(
      (item) => item.status === "HAS_GIF"
    ).length;
    const needsGif = contentItems.filter(
      (item) => item.status === "NEEDS_GIF"
    ).length;
    const campaignReady = contentItems.filter(
      (item) => item.campaignReady
    ).length;
    return { total, hasGif, needsGif, campaignReady };
  };

  const getFilteredItems = () => {
    let filtered = contentItems;
    // Filter by active tab
    switch (activeTab) {
      case "all-content":
        // For all content, use the paginated combined items
        filtered = allContentItems;
        break;
      case "vault-new":
        filtered = filtered.filter((item) => item.isVaultNew === true);
        break;
      case "needs-gif":
        filtered = filtered.filter((item) => item.status === "NEEDS_GIF");
        break;
      case "campaign-ready":
        filtered = filtered.filter((item) => item.campaignReady);
        break;
      case "sexting-sets":
        filtered = sextingItems;
        break;
      case "social-media":
        // For social media, we use the paginated items already loaded
        filtered = socialMediaItems;
        break;
      default:
        break;
    }
    // Filter by search query (but not for paginated tabs since they're already server-side filtered)
    if (searchQuery && !["social-media", "all-content"].includes(activeTab)) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const getPaginatedItems = () => {
    const filtered = getFilteredItems();
    // For server-side paginated tabs, items are already paginated
    if (["social-media", "all-content"].includes(activeTab)) {
      return filtered;
    }
    // For other tabs, do client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (activeTab === "social-media") {
      return Math.ceil(socialMediaTotalCount / itemsPerPage);
    }
    if (activeTab === "all-content") {
      return Math.ceil(allContentTotalCount / itemsPerPage);
    }
    const filtered = getFilteredItems();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // Calculate stats and filteredItems after function definitions
  const stats = getDashboardStats();
  const filteredItems = getFilteredItems();
  const paginatedItems = getPaginatedItems();
  const totalPages = getTotalPages();

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Fetch thumbnails for video files by getting parent folder and searching for matching title
  useEffect(() => {
    console.log(`🚀 Thumbnail useEffect triggered for tab: ${activeTab}`, {
      socialMediaItemsLength: socialMediaItems.length,
      filteredItemsLength: filteredItems.length
    });
    
    const fetchThumbnails = async () => {
      // Only process items that are visible on the current page
      const currentPageItems = getPaginatedItems();
      
      console.log(`🔍 Fetching thumbnails for tab: ${activeTab} (page ${currentPage})`, {
        currentPageItems: currentPageItems.length,
        totalItems: activeTab === "social-media" ? socialMediaItems.length : filteredItems.length,
        page: currentPage,
        itemsPerPage: itemsPerPage
      });
      
      const videoItems = currentPageItems
        .filter(item => item.driveId && !item.isFolder) // Only video files, not folders
        .filter(item => item.driveId); // Ensure driveId exists
      
      console.log(`📋 Items with driveId for thumbnails:`, videoItems.map(item => ({ title: item.title, driveId: item.driveId })));
      
      if (videoItems.length === 0) {
        console.log(`❌ No items to process for thumbnails on tab: ${activeTab}`);
        return;
      }
      
      const newThumbnails: Record<string, string> = {};
      
      await Promise.all(videoItems.map(async (item) => {
        try {
          if (!item.driveId) return;
          
          console.log(`🔄 Starting thumbnail fetch for: ${item.title} (${item.driveId})`);
          
          // For social media items, first get the actual filename from Google Drive
          let searchTitle = item.title;
          if (activeTab === "social-media") {
            try {
              const fileMetaRes = await fetch(`/api/google-drive/metadata?id=${item.driveId}`);
              if (fileMetaRes.ok) {
                const fileMeta = await fileMetaRes.json();
                if (fileMeta.name) {
                  searchTitle = fileMeta.name;
                  console.log(`📝 Using actual filename for search: ${searchTitle} (instead of ${item.title})`);
                }
              }
            } catch (error) {
              console.log(`⚠️ Could not get file metadata, using display title: ${item.title}`);
            }
          }
          
          // First, get the parent folder of the video file
          const parentRes = await fetch(`/api/google-drive/get-parent-folder?fileId=${item.driveId}`);
          console.log(`📁 Parent folder API response for ${item.title}:`, parentRes.status);
          
          if (!parentRes.ok) {
            console.log(`❌ Parent folder API failed for ${item.title}`);
            return;
          }
          
          const parentData = await parentRes.json();
          console.log(`📁 Parent folder data for ${item.title}:`, parentData);
          
          if (!parentData.parentFolderId) {
            console.log(`❌ No parent folder ID for ${item.title}`);
            return;
          }
          
          // Then search the parent folder contents for a file matching the actual filename
          const contentsRes = await fetch(`/api/google-drive/search-folder-contents?folderId=${parentData.parentFolderId}&searchTitle=${encodeURIComponent(searchTitle)}`);
          console.log(`🔍 Search folder contents API response for ${item.title} (searching for: ${searchTitle}):`, contentsRes.status);
          
          if (!contentsRes.ok) {
            console.log(`❌ Search folder contents API failed for ${item.title}`);
            return;
          }
          
          const contentsData = await contentsRes.json();
          console.log(`🔍 Search folder contents data for ${item.title}:`, contentsData);
          
          if (contentsData.thumbnailLink) {
            newThumbnails[item.driveId] = contentsData.thumbnailLink;
            console.log(`✅ Found thumbnail for ${item.title}:`, contentsData.thumbnailLink);
          } else {
            console.log(`❌ No thumbnail found for ${item.title}`);
          }
        } catch (error) {
          console.error(`💥 Error fetching thumbnail for ${item.title}:`, error);
        }
      }));
      
      console.log(`💾 Setting thumbnails:`, newThumbnails);
      setSiblingThumbnails(prev => {
        const updated = { ...prev, ...newThumbnails };
        console.log(`📸 Updated siblingThumbnails:`, updated);
        return updated;
      });
    };
    
    // Always fetch thumbnails when items are available on current page
    if ((activeTab === "social-media" && socialMediaItems.length > 0) || 
        (activeTab !== "social-media" && filteredItems.length > 0)) {
      fetchThumbnails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    currentPage,
    itemsPerPage,
    searchQuery,
    socialMediaItems.length,
    filteredItems.map(i => i.driveId).join(","),
    socialMediaItems.map(i => i.driveId).join(",")
  ]);

  // Fetch vault content from API
  useEffect(() => {
    const fetchVaultContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/vault-content?modelName=${encodeURIComponent(modelName)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vault content");
        }

        const data = await response.json();
        setContentItems(data.contentItems || []);
      } catch (err) {
        console.error("Error fetching vault content:", err);
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchVaultContent();
  }, [modelName]);

  // Fetch sexting sets from API
  useEffect(() => {
    const fetchSextingSets = async () => {
      try {
        const response = await fetch(
          `/api/sexting-sets?modelName=${encodeURIComponent(modelName)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sexting sets");
        }

        const data = await response.json();
        setSextingItems(data.contentItems || []);
      } catch (err) {
        console.error("Error fetching sexting sets:", err);
        // Don't set error state here as it might interfere with main content loading
      }
    };

    fetchSextingSets();
  }, [modelName]);

  // Fetch social media total count on mount
  useEffect(() => {
    const fetchSocialMediaCount = async () => {
      try {
        const countResponse = await fetch(
          `/api/social-media?modelName=${encodeURIComponent(modelName)}&getTotalOnly=true`
        );

        if (!countResponse.ok) {
          throw new Error("Failed to fetch social media count");
        }

        const countData = await countResponse.json();
        setSocialMediaTotalCount(countData.totalItems);
        console.log('📊 Social media total items:', countData.totalItems);
      } catch (err) {
        console.error("Error fetching social media count:", err);
      }
    };

    fetchSocialMediaCount();
  }, [modelName]);

  // Fetch all content total count on mount
  useEffect(() => {
    const fetchAllContentCount = async () => {
      try {
        const countResponse = await fetch(
          `/api/all-content?modelName=${encodeURIComponent(modelName)}&getTotalOnly=true`
        );

        if (!countResponse.ok) {
          throw new Error("Failed to fetch all content count");
        }

        const countData = await countResponse.json();
        setAllContentTotalCount(countData.totalItems);
        console.log('📊 All content total items:', countData.totalItems);
      } catch (err) {
        console.error("Error fetching all content count:", err);
      }
    };

    fetchAllContentCount();
  }, [modelName]);

  // Fetch all content page data only when on all-content tab
  useEffect(() => {
    const fetchAllContentPage = async () => {
      if (activeTab !== "all-content") {
        setAllContentItems([]); // Clear items when not on tab
        return;
      }

      try {
        const response = await fetch(
          `/api/all-content?modelName=${encodeURIComponent(modelName)}&page=${currentPage}&limit=${itemsPerPage}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch all content");
        }

        const data = await response.json();
        setAllContentItems(data.contentItems || []);
        
        console.log('📄 All content pagination:', data.pagination);
      } catch (err) {
        console.error("Error fetching all content page:", err);
      }
    };

    fetchAllContentPage();
  }, [modelName, activeTab, currentPage, itemsPerPage]);

  // Fetch social media page data only when on social media tab
  useEffect(() => {
    const fetchSocialMediaPage = async () => {
      if (activeTab !== "social-media") {
        setSocialMediaItems([]); // Clear items when not on tab
        return;
      }

      try {
        const response = await fetch(
          `/api/social-media?modelName=${encodeURIComponent(modelName)}&page=${currentPage}&limit=${itemsPerPage}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch social media content");
        }

        const data = await response.json();
        setSocialMediaItems(data.contentItems || []);
        
        console.log('📄 Social media pagination:', data.pagination);
      } catch (err) {
        console.error("Error fetching social media page:", err);
      }
    };

    fetchSocialMediaPage();
  }, [modelName, activeTab, currentPage, itemsPerPage]);

  // Check for folderid parameter and automatically open folder
  useEffect(() => {
    const folderId = searchParams?.get('folderid');
    if (folderId && !selectedFolder) {
      // Find the folder item in both contentItems and sextingItems
      const allItems = [...contentItems, ...sextingItems, ...socialMediaItems];
      const folderItem = allItems.find(item => item.driveId === folderId && item.isFolder);
      
      if (folderItem) {
        setSelectedFolder({ id: folderId, name: folderItem.title });
      }
    } else if (!folderId && selectedFolder) {
      // If no folderid in URL but we have a selected folder, clear it
      setSelectedFolder(null);
    }
  }, [searchParams, contentItems, sextingItems, socialMediaItems, selectedFolder]);

  // Dynamic tab counts based on actual data
  const getTabCounts = () => {
    const allCount = allContentTotalCount;
    const vaultNewCount = contentItems.filter(
      (item) => item.isVaultNew === true
    ).length;
    const needsGifCount = contentItems.filter(
      (item) => item.status === "NEEDS_GIF"
    ).length;
    const campaignReadyCount = contentItems.filter(
      (item) => item.campaignReady
    ).length;
    const sextingSetsCount = sextingItems.length;
    const socialMediaCount = socialMediaTotalCount;
    return {
      allCount,
      vaultNewCount,
      needsGifCount,
      campaignReadyCount,
      sextingSetsCount,
      socialMediaCount,
    };
  };


  // Declare stats and filteredItems once, before any effect that uses them
  // (Already declared above)

  // Tabs variable moved up here
  const { allCount, vaultNewCount, needsGifCount, campaignReadyCount, sextingSetsCount, socialMediaCount } = getTabCounts();
  const tabs = [
    { id: "all-content", label: "All Content", count: allCount },
    {
      id: "vault-new",
      label: "Vault NEW",
      count: vaultNewCount,
      badge: vaultNewCount > 0 ? "NEW" : undefined,
    },
    { id: "sexting-sets", label: "Sexting Sets", count: sextingSetsCount },
    { id: "social-media", label: "Social Media", count: socialMediaCount },
    { id: "needs-gif", label: "Needs GIF", count: needsGifCount },
    {
      id: "campaign-ready",
      label: "Campaign Ready",
      count: campaignReadyCount,
    },
  ];

  const handleItemClick = (item: ContentItem) => {
    if (item.isFolder && item.driveId) {
      setSelectedFolder({ id: item.driveId, name: item.title });
      // Update URL with folder ID
      const params = new URLSearchParams(searchParams || '');
      params.set('folderid', item.driveId);
      router.push(`?${params.toString()}`);
    }
  };

  const handleBackToGallery = () => {
    // Clear folder ID from URL first
    const params = new URLSearchParams(searchParams || '');
    params.delete('folderid');
    router.push(`?${params.toString()}`);
    // Then immediately update state
    setSelectedFolder(null);
  };

  const handleCreateGif = (item: ContentItem) => {
    if (!item.driveId) {
      console.error('No driveId available for item:', item.title);
      return;
    }

    // Determine the parameter based on whether it's a folder or file
    const param = item.isFolder ? 'folderid' : 'fileid';
    const redirectUrl = `/apps/models/${encodeURIComponent(modelName.toLowerCase())}/apps?tab=gif&${param}=${item.driveId}`;
    
    router.push(redirectUrl);
  };

  // If viewing a folder, show the folder viewer
  if (selectedFolder) {
    return (
      <FolderViewer
        folderId={selectedFolder.id}
        folderName={selectedFolder.name}
        onBack={handleBackToGallery}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
          Content Gallery
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Manage and organize content for{" "}
          <span className="text-cyan-400 font-medium">{modelName}</span>
        </p>
      </div>

      {/* Content Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-800/40 rounded-xl border border-slate-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${
                  activeTab === tab.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                    : "text-gray-400 hover:text-gray-200 hover:bg-slate-700/50"
                }
              `}
            >
              <span>{tab.label}</span>
              <span
                className={`
                px-2 py-0.5 text-xs rounded-full font-semibold
                ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-700 text-gray-300"
                }
              `}
              >
                {tab.count}
              </span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Stats */}
      {activeTab === "all-content" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-gray-400 text-sm">Total Items</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.hasGif}</p>
                <p className="text-gray-400 text-sm">Has GIF</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                <Film className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.needsGif}
                </p>
                <p className="text-gray-400 text-sm">Needs GIF</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.campaignReady}
                </p>
                <p className="text-gray-400 text-sm">Campaign Ready</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading vault content...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading content: {error}</span>
          </div>
        </div>
      )}

      {/* Search Bar and Pagination Controls */}
      {!loading && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 pl-10 pr-4 py-3 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          {/* Pagination Info */}
          {(filteredItems.length > 0 || ["social-media", "all-content"].includes(activeTab)) && (
            <div className="mt-4 text-center text-gray-400 text-sm">
              {activeTab === "social-media" ? (
                <>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, socialMediaTotalCount)} to{" "}
                  {Math.min(currentPage * itemsPerPage, socialMediaTotalCount)} of {socialMediaTotalCount} items
                </>
              ) : activeTab === "all-content" ? (
                <>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, allContentTotalCount)} to{" "}
                  {Math.min(currentPage * itemsPerPage, allContentTotalCount)} of {allContentTotalCount} items
                </>
              ) : (
                <>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredItems.length)} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Items */}
      {!loading && (
        <div>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No content found
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No content available in this category"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className={`group bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:transform hover:scale-105 ${
                    item.isFolder ? "cursor-pointer" : ""
                  }`}
                  onClick={() =>
                    item.isFolder ? handleItemClick(item) : undefined
                  }
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-700/50 overflow-hidden">
                    {item.isFolder ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                        <Folder className="w-16 h-16 text-blue-400" />
                      </div>
                    ) : (
                      <div>
                        {item.driveId && siblingThumbnails[item.driveId] ? (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(siblingThumbnails[item.driveId])}`}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-700/50 flex items-center justify-center absolute inset-0">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <div
                        className={`
                      px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm
                      ${
                        item.status === "HAS_GIF"
                          ? "bg-green-600/80 text-green-100 border border-green-400/50"
                          : "bg-orange-600/80 text-orange-100 border border-orange-400/50"
                      }
                    `}
                      >
                        {item.status === "HAS_GIF" ? (
                          <>
                            <Zap className="w-3 h-3" />
                            GIF
                          </>
                        ) : (
                          <>
                            <Film className="w-3 h-3" />
                            NO GIF
                          </>
                        )}
                      </div>
                    </div>

                    {/* Type indicator */}
                    <div className="absolute top-2 right-2">
                      <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        {item.type === "video" ? (
                          <Play className="w-4 h-4 text-white" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Duration/Count overlay */}
                    <div className="absolute bottom-2 right-2">
                      <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                        {item.type === "video" ? (
                          <>📹 {item.duration}</>
                        ) : (
                          <>📷 {item.imageCount} images</>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-2 overflow-hidden text-ellipsis whitespace-nowrap group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>{item.timeAgo}</span>
                    </div>

                    {/* Status
                    <div className="mb-4">
                      {item.campaignReady ? (
                        <p className="text-green-400 font-medium text-xs">
                          Campaign Ready
                        </p>
                      ) : (
                        <p className="text-orange-400 font-medium text-xs">
                          Awaiting GIF + Caption
                        </p>
                      )}
                    </div> */}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {item.campaignReady ? (
                        <>
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs font-medium">
                            <Rocket className="w-3 h-3" />
                            <span>Deploy Campaign</span>
                          </button>
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-medium">
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering folder click
                              handleCreateGif(item);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs font-medium"
                          >
                            <Film className="w-3 h-3" />
                            <span>Create GIF</span>
                          </button>
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-medium">
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  {/* First page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-gray-400 hover:text-white hover:border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Previous page */}
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-gray-400 hover:text-white hover:border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? "bg-cyan-600 text-white border border-cyan-500"
                              : "bg-slate-800/40 border border-slate-700/50 text-gray-400 hover:text-white hover:border-cyan-500/30"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next page */}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-gray-400 hover:text-white hover:border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Last page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-gray-400 hover:text-white hover:border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelContentGalleryTab;
