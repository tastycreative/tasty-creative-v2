/* eslint-disable @typescript-eslint/no-explicit-any */
// components/models/tabs/ModelAssetsTab.tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Image,
  FileText,
  Star,
  Upload,
  Download,
  Plus,
  Grid,
  List,
  Calendar,
  Eye,
} from "lucide-react";
import { extractDriveIdFromFormula } from "@/lib/utils";

export default function ModelAssetsTab({ modelName }: ModelAssetsTabProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<
    "all" | "live" | "vip" | "ftt"
  >("all");
  const [modelAssets, setModelAssets] = useState<{
    live: Asset[];
    vip: Asset[];
    ftt: Asset[];
  }>({ live: [], vip: [], ftt: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log("Fetched model assets:", data);

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
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
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
    },
    {
      id: "live",
      label: "Live Flyers",
      icon: FileText,
      count: modelAssets.live.length,
    },
    {
      id: "vip",
      label: "VIP Flyers",
      icon: Star,
      count: modelAssets.vip.length,
    },
    {
      id: "ftt",
      label: "FTT Flyers",
      icon: FileText,
      count: modelAssets.ftt.length,
    },
  ];

  const filteredAssets =
    selectedType === "all"
      ? allAssets
      : allAssets.filter((asset) => asset.type === selectedType);

  // Debug logging
  console.log("Selected type:", selectedType);
  console.log("Filtered assets count:", filteredAssets.length);
  console.log(
    "Filtered assets:",
    filteredAssets.map((a) => a.type)
  );

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">Error loading assets: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {filteredAssets.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
          <Image className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">
            No assets found for{" "}
            {selectedType === "all" ? "this model" : selectedType}
          </p>
          <button className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Upload First Asset
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div
          key={`grid-${selectedType}-${filteredAssets.length}`}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredAssets.map((asset, index) => {
            const finalOutputUrl = getFileUrl(asset, "Final Output");
            const psdUrl = getFileUrl(asset, "PSD File");

            return (
              <motion.div
                key={`${asset["Request ID"]}-${selectedType}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-sm flex flex-col justify-between rounded-xl border border-white/10 overflow-hidden group hover:border-purple-500/50 transition-all"
              >
                <div className="aspect-square bg-gray-800 relative flex items-center justify-center">
                  <div className="text-center p-4">
                    {asset["Final Output"] &&
                    typeof asset["Final Output"] === "object" &&
                    asset["Final Output"].formula ? (
                      <img
                        src={`/api/image-proxy?id=${extractDriveIdFromFormula(
                          asset["Final Output"].formula
                        )}`}
                        alt={`Asset ${asset["Request ID"]}`}
                        className="max-h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-500" />
                    )}
                    <span
                      className={`inline-block absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold ${
                        asset.type === "live"
                          ? "bg-green-500/50 text-green-200"
                          : asset.type === "vip"
                            ? "bg-yellow-500/50 text-yellow-200"
                            : "bg-blue-500/50 text-blue-200"
                      }`}
                    >
                      {asset.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {finalOutputUrl && (
                      <a
                        href={finalOutputUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-white" />
                      </a>
                    )}
                    {finalOutputUrl && (
                      <a
                        href={finalOutputUrl}
                        download
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(asset.Date)}
                  </p>
                  {asset["Created by"] && (
                    <p className="text-gray-500 text-xs truncate">
                      By: {asset["Created by"]}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div
          key={`list-${selectedType}-${filteredAssets.length}`}
          className="space-y-2"
        >
          {filteredAssets.map((asset, index) => {
            const finalOutputUrl = getFileUrl(asset, "Final Output");
            const psdUrl = getFileUrl(asset, "PSD File");

            return (
              <motion.div
                key={`${asset["Request ID"]}-${selectedType}-list`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    {asset["Final Output"] &&
                    typeof asset["Final Output"] === "object" &&
                    asset["Final Output"].formula ? (
                      <img
                        src={`/api/image-proxy?id=${extractDriveIdFromFormula(
                          asset["Final Output"].formula
                        )}`}
                        alt={`Asset ${asset["Request ID"]}`}
                        className="max-h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Request {asset["Request ID"]?.slice(-8)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          asset.type === "live"
                            ? "bg-green-500/20 text-green-400"
                            : asset.type === "vip"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {asset.type.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span>{formatDate(asset.Date)}</span>
                      {asset["Created by"] && (
                        <>
                          <span>•</span>
                          <span>By: {asset["Created by"]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {finalOutputUrl && (
                    <a
                      href={finalOutputUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                  {finalOutputUrl && (
                    <a
                      href={finalOutputUrl}
                      download
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                  {psdUrl && (
                    <a
                      href={psdUrl}
                      download
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
