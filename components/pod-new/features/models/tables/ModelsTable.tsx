"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Calendar, DollarSign, TrendingUp, Instagram, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelsTableProps {
  models: ModelDetails[];
  onModelClick: (model: ModelDetails) => void;
  startIndex: number;
}

// Image processing function (same as in EnhancedModelCard)
const processImageUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  
  // Google Drive handling
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=s400-c`;
    }
  }
  return url;
};

// Table avatar component
const TableAvatar = ({ model }: { model: ModelDetails }) => {
  const imageUrl = useMemo(() => processImageUrl(model.profileImage), [model.profileImage]);
  
  if (!imageUrl) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
        {model.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
      <Image
        src={imageUrl}
        alt={model.name}
        fill
        className="object-cover"
        sizes="40px"
      />
    </div>
  );
};

export function ModelsTable({ models, onModelClick, startIndex }: ModelsTableProps) {
  if (models.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No models to display
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                Model
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                Status
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                Launch Date
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                Guaranteed
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                Referrer
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                Social
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr 
                key={model.id}
                className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors duration-150 cursor-pointer"
                onClick={() => onModelClick(model)}
              >
                {/* Model Info */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <TableAvatar model={model} />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {model.name}
                      </div>
                      {model.personalityType && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {model.personalityType}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      model.status === "active"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    )}
                  >
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        model.status === "active" ? "bg-emerald-500" : "bg-red-500"
                      )}
                    />
                    {model.status === "active" ? "Active" : "Dropped"}
                  </span>
                </td>

                {/* Launch Date */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {model.launchDate 
                        ? new Date(model.launchDate).toLocaleDateString()
                        : "Not set"
                      }
                    </span>
                  </div>
                </td>

                {/* Guaranteed */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {(() => {
                          const guaranteedStr = (model as any).guaranteed;
                          if (!guaranteedStr || guaranteedStr.trim() === "" || guaranteedStr.trim() === "-") {
                            return "$0";
                          }
                          
                          // Remove $ symbol and any other non-numeric characters except decimal point
                          const cleanValue = guaranteedStr.replace(/[^0-9.-]/g, "");
                          const guaranteed = parseFloat(cleanValue);
                          
                          // Only show if it's a valid positive number
                          if (!isNaN(guaranteed) && guaranteed > 0) {
                            return `$${guaranteed.toLocaleString()}`;
                          }
                          
                          return "$0";
                        })()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Guaranteed
                      </div>
                    </div>
                  </div>
                </td>

                {/* Referrer */}
                <td className="py-4 px-6">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {model.referrerName || "Direct"}
                  </span>
                </td>

                {/* Social Links */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {model.instagram && (
                      <a
                        href={model.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {model.twitter && (
                      <a
                        href={model.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {!model.instagram && !model.twitter && (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}