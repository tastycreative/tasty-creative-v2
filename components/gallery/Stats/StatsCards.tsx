"use client";

import React from "react";
import { Grid3X3, TrendingUp, DollarSign } from "lucide-react";

export interface StatsCardsProps {
  totalContent: number;
  totalSales: number;
  totalRevenue: number;
  className?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalContent,
  totalSales,
  totalRevenue,
  className = "",
}) => {
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
      value: `$${totalRevenue.toLocaleString()}`,
      subtitle: "Total earnings",
      icon: DollarSign,
      gradient: "from-amber-500 to-orange-500",
      bgGradient:
        "from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/30",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      trend: totalRevenue > 0 ? "+8.2%" : null,
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6  pb-8 ${className}`}>
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
