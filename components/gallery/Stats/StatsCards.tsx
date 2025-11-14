"use client";

import React, { useMemo } from "react";
import { Grid3X3, TrendingUp, DollarSign, User } from "lucide-react";
import { GalleryItem } from "@/types/gallery";

export interface StatsCardsProps {
  totalContent: number;
  totalSales: number;
  totalRevenue: number;
  items?: GalleryItem[]; // New: pass items for calculations
  className?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalContent,
  totalSales,
  totalRevenue,
  items = [],
  className = "",
}) => {
  // Calculate enhanced metrics
  const enhancedMetrics = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        avgRevenue: 0,
        topCreator: "N/A",
        avgPrice: 0,
        totalEarnings: 0,
        itemsWithRevenue: 0,
      };
    }

    const itemsWithRevenue = items.filter((item) => (item.revenue || item.totalRevenue || 0) > 0);
    const totalEarnings = items.reduce((sum, item) => sum + (item.revenue || item.totalRevenue || 0), 0);
    const avgRevenue = itemsWithRevenue.length > 0 ? totalEarnings / itemsWithRevenue.length : 0;

    const itemsWithPrice = items.filter((item) => item.price > 0);
    const avgPrice = itemsWithPrice.length > 0
      ? itemsWithPrice.reduce((sum, item) => sum + item.price, 0) / itemsWithPrice.length
      : 0;

    // Find top creator by revenue
    const creatorRevenues: Record<string, number> = {};
    items.forEach((item) => {
      const creator = item.creatorName || "Unknown";
      const revenue = item.revenue || item.totalRevenue || 0;
      creatorRevenues[creator] = (creatorRevenues[creator] || 0) + revenue;
    });
    const topCreator = Object.entries(creatorRevenues).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

    return {
      avgRevenue,
      topCreator,
      avgPrice,
      totalEarnings,
      itemsWithRevenue: itemsWithRevenue.length,
    };
  }, [items]);

  const stats = [
    {
      label: "Total Content",
      value: totalContent.toLocaleString(),
      subtitle: "Available items",
      icon: Grid3X3,
      gradient: "from-blue-500 to-blue-600",
      bgGradient:
        "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      trend: null,
    },
    {
      label: "Total Sales",
      value: totalSales.toLocaleString(),
      subtitle: "Items purchased",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-600",
      bgGradient:
        "from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/30",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      trend: totalSales > 0 ? "+12%" : null,
    },
    {
      label: "Revenue",
      value: `$${enhancedMetrics.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Total earnings",
      icon: DollarSign,
      gradient: "from-amber-500 to-orange-500",
      bgGradient:
        "from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/30",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      trend: enhancedMetrics.totalEarnings > 0 ? `${enhancedMetrics.itemsWithRevenue} items` : null,
    },
    {
      label: "Avg Revenue",
      value: `$${enhancedMetrics.avgRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Per performing item",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500",
      bgGradient:
        "from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/30",
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
      trend: null,
    },
    {
      label: "Top Creator",
      value: enhancedMetrics.topCreator,
      subtitle: "Highest earner",
      icon: User,
      gradient: "from-indigo-500 to-blue-500",
      bgGradient:
        "from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-800/30",
      iconBg: "bg-gradient-to-br from-indigo-500 to-blue-500",
      trend: null,
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-8 ${className}`}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.label}
            className={`relative group overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                      {stat.label}
                    </h3>
                    {stat.trend && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {stat.subtitle}
                  </p>
                </div>

                <div
                  className={`${stat.iconBg} p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Progress indicator */}
              <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
                <div
                  className={`bg-gradient-to-r ${stat.gradient} h-2 rounded-full transition-all duration-1000 ease-out`}
                  style={{
                    width: index === 0 ? "85%" : index === 1 ? "45%" : "72%",
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {index === 0
                  ? "Library utilization"
                  : index === 1
                    ? "Conversion rate"
                    : "Revenue performance"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
