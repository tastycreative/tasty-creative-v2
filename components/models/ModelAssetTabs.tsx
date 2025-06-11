// components/models/tabs/ModelAssetsTab.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Image,
  FileText,
  Star,
  Upload,
  Download,
  Trash2,
  Plus,
  Grid,
  List,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: "all" | "liveFlyers" | "vipFlyers" | "fttFlyers";
  uploadDate: string;
  size: string;
  preview?: string;
}

interface ModelAssetsTabProps {
  modelId: string;
}

export default function ModelAssetsTab({ modelId }: ModelAssetsTabProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<
    "all" | "liveFlyers" | "vipFlyers" | "fttFlyers"
  >("all");

  // Mock data - replace with API call
  const [assets] = useState<Asset[]>([
    {
      id: "1",
      name: "Welcome Post Image.jpg",
      type: "liveFlyers",
      uploadDate: "2024-03-15",
      size: "2.4 MB",
      preview: "/api/placeholder/200/200",
    },
    {
      id: "2",
      name: "VIP Promotion Banner.png",
      type: "vipFlyers",
      uploadDate: "2024-03-14",
      size: "1.8 MB",
      preview: "/api/placeholder/200/200",
    },
    {
      id: "3",
      name: "FTT Special Offer.jpg",
      type: "fttFlyers",
      uploadDate: "2024-03-13",
      size: "3.1 MB",
      preview: "/api/placeholder/200/200",
    },
  ]);

  const assetTypes = [
    { id: "all", label: "All Assets", icon: Image, count: assets.length },
    {
      id: "liveFlyers",
      label: "Live Flyers",
      icon: FileText,
      count: assets.filter((a) => a.type === "liveFlyers").length,
    },
    {
      id: "vipFlyers",
      label: "VIP Flyers",
      icon: Star,
      count: assets.filter((a) => a.type === "vipFlyers").length,
    },
    {
      id: "fttFlyers",
      label: "FTT Flyers",
      icon: FileText,
      count: assets.filter((a) => a.type === "fttFlyers").length,
    },
  ];

  const filteredAssets =
    selectedType === "all"
      ? assets
      : assets.filter((asset) => asset.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Model Assets</h3>
          <p className="text-gray-400 text-sm mt-1">
            Manage promotional materials and content
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            <List className="w-5 h-5" />
          </button>

          <button className="ml-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Assets
          </button>
        </div>
      </div>

      {/* Asset Type Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {assetTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as any)}
              className={`p-4 rounded-xl border transition-all ${
                selectedType === type.id
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <p className="font-medium">{type.label}</p>
              <p className="text-2xl font-bold mt-1">{type.count}</p>
            </button>
          );
        })}
      </div>

      {/* Assets Display */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
          <Image className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No assets uploaded yet</p>
          <button className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Upload First Asset
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset, index) => (
            <div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden group hover:border-purple-500/50 transition-all"
            >
              <div className="aspect-square bg-gray-800 relative">
                {asset.preview && (
                  <img
                    src={asset.preview}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <button className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-white text-sm font-medium truncate">
                  {asset.name}
                </p>
                <p className="text-gray-400 text-xs">{asset.size}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset, index) => (
            <div
              key={asset.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden">
                  {asset.preview && (
                    <img
                      src={asset.preview}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{asset.name}</p>
                  <p className="text-gray-400 text-sm">
                    {asset.size} • Uploaded{" "}
                    {new Date(asset.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
