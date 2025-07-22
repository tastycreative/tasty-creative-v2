"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  FileText,
  Star,
  Sparkles,
  Download,
  Plus,
  Grid,
  List,
  Calendar,
  Eye,
  Crown,
  Zap,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { extractDriveIdFromFormula } from "@/lib/utils";
import LiveFlyer from "../LiveFlyer";
import VIPFlyer from "../VIPFlyer";
import FTTFlyer from "../FTTPage";

interface ModelAssetsTabProps {
  modelName: string;
}

export default function ModelAssetsTab({ modelName }: ModelAssetsTabProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<"all" | "live" | "vip" | "ftt">("all");
  const [modelAssets, setModelAssets] = useState<{
    live: Asset[];
    vip: Asset[];
    ftt: Asset[];
  }>({ live: [], vip: [], ftt: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "vip" | "ftt">("all");

  useEffect(() => {
    const fetchModelAssets = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/google/get-model-assets?model=${encodeURIComponent(modelName)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch assets");
        }
        const data = await response.json();
        
        const processedData = {
          live: (data.live || []).map((asset: any) => ({
            ...asset,
            type: "live",
          })),
          vip: (data.vip || []).map((asset: any) => ({
            ...asset,
            type: "vip",
          })),
          ftt: (data.ftt || []).map((asset: any) => ({
            ...asset,
            type: "ftt",
          })),
        };
        setModelAssets(processedData);
      } catch (err) {
        console.error("Error fetching assets:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchModelAssets();
  }, [modelName]);

  const allAssets = [
    ...modelAssets.live,
    ...modelAssets.vip,
    ...modelAssets.ftt,
  ];

  const assetTypes = [
    {
      id: "all",
      label: "All Assets",
      icon: Image,
      count: allAssets.length,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      id: "live",
      label: "Live Flyers",
      icon: Sparkles,
      count: modelAssets.live.length,
      gradient: "from-red-500 to-pink-500",
    },
    {
      id: "vip",
      label: "VIP Flyers",
      icon: Crown,
      count: modelAssets.vip.length,
      gradient: "from-yellow-500 to-amber-500",
    },
    {
      id: "ftt",
      label: "FTT Flyers",
      icon: Zap,
      count: modelAssets.ftt.length,
      gradient: "from-blue-500 to-cyan-500",
    },
  ];

  const filteredAssets =
    selectedType === "all"
      ? allAssets
      : allAssets.filter((asset) => asset.type === selectedType);

  const getFileUrl = (asset: Asset, fileType: "Final Output" | "PSD File") => {
    const file = asset[fileType];
    if (typeof file === "string") return file;
    if (typeof file === "object" && file?.value) return file.value;
    return null;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10 rounded-2xl blur-xl" />
        <div className="relative bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-400 mb-4">Error loading assets: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-in slide-in-from-left duration-500">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl">
              <Image className="w-5 h-5 text-pink-500" />
            </div>
            Model Assets
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Manage promotional materials and content
          </p>
        </div>
        
        <div className="flex items-center gap-3 animate-in slide-in-from-right duration-500">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white/80 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tab Buttons */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {activeTab !== "all" && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => setActiveTab("all")}
                  className="px-4 py-2.5 bg-white/80 hover:bg-white/90 text-gray-600 rounded-xl font-medium transition-all flex items-center gap-2 border border-pink-200/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  All Assets
                </motion.button>
              )}
            </AnimatePresence>
            
            {["live", "vip", "ftt"].map((type) => {
              const assetType = assetTypes.find(t => t.id === type);
              if (!assetType) return null;
              const Icon = assetType.icon;
              
              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type as any)}
                  className={`
                    relative px-4 py-2.5 rounded-xl font-medium transition-all
                    flex items-center gap-2 group overflow-hidden
                    ${activeTab === type 
                      ? `bg-gradient-to-r ${assetType.gradient} text-white shadow-lg` 
                      : "bg-white/80 hover:bg-white/90 text-gray-600 border border-pink-200/50"
                    }
                  `}
                >
                  <div className={`
                    absolute inset-0 bg-gradient-to-r ${assetType.gradient} opacity-0 
                    group-hover:opacity-20 transition-opacity
                  `} />
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 capitalize">{type}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === "all" && (
        <>
          {/* Asset Type Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {assetTypes.map((type, index) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedType(type.id as any)}
                  className="relative group"
                >
                  {/* Glow effect */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-r ${type.gradient} rounded-2xl blur-xl 
                    transition-all duration-300 ${isSelected ? "opacity-40" : "opacity-0 group-hover:opacity-30"}
                  `} />
                  
                  {/* Card */}
                  <div className={`
                    relative p-6 rounded-2xl border transition-all duration-300
                    ${isSelected
                      ? "bg-white/90 border-pink-500/50"
                      : "bg-white/60 border-pink-200/30 hover:border-pink-300/50"
                    }
                  `}>
                    <div className={`
                      p-3 rounded-xl bg-gradient-to-br ${type.gradient} 
                      bg-opacity-20 mb-3 inline-block
                    `}>
                      <Icon className="w-6 h-6 text-gray-900" />
                    </div>
                    <p className="font-medium text-gray-600">{type.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{type.count}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Assets Display */}
          {filteredAssets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl border border-pink-200/30 p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full flex items-center justify-center">
                  <Image className="w-10 h-10 text-pink-500" />
                </div>
                <p className="text-gray-600 text-lg mb-6">
                  No assets found for {selectedType === "all" ? "this model" : selectedType}
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-pink-500/25 inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Upload First Asset
                </button>
              </div>
            </motion.div>
          ) : viewMode === "grid" ? (
            // Grid View
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredAssets.map((asset, index) => {
                  const finalOutputUrl = getFileUrl(asset, "Final Output");
                  const typeConfig = {
                    live: { bg: "from-red-500/20 to-pink-500/20", text: "text-red-400", border: "border-red-500/20" },
                    vip: { bg: "from-yellow-500/20 to-amber-500/20", text: "text-yellow-400", border: "border-yellow-500/20" },
                    ftt: { bg: "from-blue-500/20 to-cyan-500/20", text: "text-blue-400", border: "border-blue-500/20" },
                  }[asset.type] || { bg: "", text: "", border: "" };

                  return (
                    <motion.div
                      key={`${asset.type}-${index}`}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      {/* Hover Glow */}
                      <div className={`
                        absolute inset-0 bg-gradient-to-br ${typeConfig.bg} rounded-2xl 
                        blur-xl opacity-0 group-hover:opacity-50 transition-all duration-300
                      `} />
                      
                      {/* Card */}
                      <div className={`
                        relative bg-white/80 backdrop-blur-sm rounded-2xl 
                        border ${typeConfig.border} overflow-hidden 
                        hover:border-opacity-50 transition-all duration-300
                        group-hover:transform group-hover:scale-[1.02]
                      `}>
                        {/* Image */}
                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                          {typeof asset["Final Output"] === "object" && asset["Final Output"]?.formula ? (
                            <img
                              src={`/api/image-proxy?id=${extractDriveIdFromFormula(
                                asset["Final Output"].formula
                              )}`}
                              alt={`Asset ${asset["Request ID"]}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-12 h-12 text-gray-600" />
                            </div>
                          )}
                          
                          {/* Type Badge */}
                          <span className={`
                            absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold 
                            bg-gradient-to-r ${typeConfig.bg} backdrop-blur-sm
                            ${typeConfig.text} uppercase
                          `}>
                            {asset.type}
                          </span>
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center gap-3 p-4">
                            {finalOutputUrl && (
                              <>
                                <a
                                  href={finalOutputUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                                >
                                  <Eye className="w-5 h-5 text-white" />
                                </a>
                                <a
                                  href={finalOutputUrl}
                                  download
                                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                                >
                                  <Download className="w-5 h-5 text-white" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="p-4">
                          <p className="text-gray-600 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(asset.Date)}
                          </p>
                          {asset["Created by"] && (
                            <p className="text-gray-500 text-xs mt-1 truncate">
                              By: {asset["Created by"]}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredAssets.map((asset, index) => {
                  const finalOutputUrl = getFileUrl(asset, "Final Output");
                  const psdUrl = getFileUrl(asset, "PSD File");
                  const typeConfig = {
                    live: { gradient: "from-red-500 to-pink-500", bg: "bg-red-500/10", text: "text-red-400" },
                    vip: { gradient: "from-yellow-500 to-amber-500", bg: "bg-yellow-500/10", text: "text-yellow-400" },
                    ftt: { gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-400" },
                  }[asset.type] || { gradient: "", bg: "", text: "" };

                  return (
                    <motion.div
                      key={`${asset.type}-${index}`}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/30 p-5 flex items-center justify-between hover:border-pink-300/50 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {typeof asset["Final Output"] === "object" && asset["Final Output"]?.formula ? (
                              <img
                                src={`/api/image-proxy?id=${extractDriveIdFromFormula(
                                  asset["Final Output"].formula
                                )}`}
                                alt={`Asset ${asset["Request ID"]}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-600" />
                              </div>
                            )}
                            <div className={`absolute inset-0 bg-gradient-to-br ${typeConfig.gradient} opacity-20`} />
                          </div>
                          
                          {/* Info */}
                          <div className="min-w-0">
                            <p className="text-gray-900 font-medium">
                              Request {asset["Request ID"]?.slice(-8)}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>
                                {asset.type.toUpperCase()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(asset.Date)}
                              </span>
                              {asset["Created by"] && (
                                <span className="truncate">
                                  By: {asset["Created by"]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {finalOutputUrl && (
                            <>
                              <a
                                href={finalOutputUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 hover:bg-pink-100/50 rounded-lg transition-all group/action"
                              >
                                <Eye className="w-5 h-5 text-gray-600 group-hover/action:text-gray-900" />
                              </a>
                              <a
                                href={finalOutputUrl}
                                download
                                className="p-2.5 hover:bg-pink-100/50 rounded-lg transition-all group/action"
                              >
                                <Download className="w-5 h-5 text-gray-600 group-hover/action:text-gray-900" />
                              </a>
                            </>
                          )}
                          {psdUrl && (
                            <a
                              href={psdUrl}
                              download
                              className="p-2.5 hover:bg-slate-700/50 rounded-lg transition-all group/action"
                            >
                              <FileText className="w-5 h-5 text-blue-500 group-hover/action:text-blue-600" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
      
      {/* Component Views */}
      <AnimatePresence mode="wait">
        {activeTab === "live" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LiveFlyer modelName={modelName} />
          </motion.div>
        )}
        {activeTab === "vip" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <VIPFlyer modelName={modelName} />
          </motion.div>
        )}
        {activeTab === "ftt" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FTTFlyer modelName={modelName} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}