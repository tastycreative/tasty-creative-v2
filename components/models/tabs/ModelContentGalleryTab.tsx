"use client";

import React, { useState, useEffect } from "react";
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
}

const ModelContentGalleryTab: React.FC<ModelContentGalleryTabProps> = ({
  modelName,
}) => {
  const [activeTab, setActiveTab] = useState("all-content");
  const [searchQuery, setSearchQuery] = useState("");
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Map of driveId to sibling thumbnailLink
  const [siblingThumbnails, setSiblingThumbnails] = useState<Record<string, string>>(/** @type {any} */({}));

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
      case "social-media":
        filtered = [];
        break;
      default:
        // all-content shows everything
        break;
    }
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  // Calculate stats and filteredItems after function definitions
  const stats = getDashboardStats();
  const filteredItems = getFilteredItems();

  // Fetch thumbnails using the same logic as FolderViewer (get parent folder, list files, match by name)
  useEffect(() => {
    const fetchThumbnails = async () => {
      const driveIds = filteredItems
        .map(item => item.driveId)
        .filter((id): id is string => !!id);
      const newThumbnails: Record<string, string> = {};
      await Promise.all(driveIds.map(async (driveId) => {
        try {
          const res = await fetch(`/api/drive-parent-folder-contents?fileId=${driveId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.thumbnailLink) {
              newThumbnails[driveId] = data.thumbnailLink;
            }
          }
        } catch {}
      }));
      setSiblingThumbnails(prev => ({ ...prev, ...newThumbnails }));
    };
    fetchThumbnails();
    // Only refetch when filteredItems changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems.map(i => i.driveId).join(",")]);

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

  // Dynamic tab counts based on actual data
  const getTabCounts = () => {
    const allCount = contentItems.length;
    const vaultNewCount = contentItems.filter(
      (item) => item.isVaultNew === true
    ).length;
    const needsGifCount = contentItems.filter(
      (item) => item.status === "NEEDS_GIF"
    ).length;
    const campaignReadyCount = contentItems.filter(
      (item) => item.campaignReady
    ).length;
    return {
      allCount,
      vaultNewCount,
      needsGifCount,
      campaignReadyCount,
    };
  };


  // Declare stats and filteredItems once, before any effect that uses them
  // (Already declared above)

  // Tabs variable moved up here
  const { allCount, vaultNewCount, needsGifCount, campaignReadyCount } = getTabCounts();
  const tabs = [
    { id: "all-content", label: "All Content", count: allCount },
    {
      id: "vault-new",
      label: "Vault NEW",
      count: vaultNewCount,
      badge: vaultNewCount > 0 ? "NEW" : undefined,
    },
    { id: "sexting-sets", label: "Sexting Sets", count: 0 },
    { id: "social-media", label: "Social Media", count: 0 },
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
    }
  };

  const handleBackToGallery = () => {
    setSelectedFolder(null);
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

      {/* Search Bar */}
      {!loading && (
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
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
                        <img
                          src={item.driveId && siblingThumbnails[item.driveId]
                            ? siblingThumbnails[item.driveId]
                            : `/api/image-proxy?id=${item.driveId}`}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Fallback to placeholder
                            if (!target.src.includes('placeholder')) {
                              target.src = `https://via.placeholder.com/400x225/374151/9ca3af?text=${encodeURIComponent(item.title.substring(0, 20))}`;
                            }
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully for:', item.title);
                          }}
                        />
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
                          <>📹 {item.duration} min</>
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

                    {/* Status */}
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
                    </div>

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
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs font-medium">
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
          )}
        </div>
      )}
    </div>
  );
};

export default ModelContentGalleryTab;
