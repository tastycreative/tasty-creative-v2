"use client";

import React from "react";
import { DollarSign, Users, Clock, Sparkles } from "lucide-react";
import { formatCurrency, formatNumber } from "./utils";

interface AnalyticsData {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  subscribers: {
    total: number;
    active: number;
    trend: number;
  };
  responseTime: {
    average: string;
    trend: number;
  };
  engagementRate: number;
  performanceScore: number;
}

interface ModelStatsProps {
  analytics: AnalyticsData;
  hasRevenue: boolean;
  hasSubscribers: boolean;
  hasResponse: boolean;
  hasEngagement: boolean;
}

export const ModelStats: React.FC<ModelStatsProps> = ({
  analytics,
  hasRevenue,
  hasSubscribers,
  hasResponse,
  hasEngagement,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Monthly Revenue */}
      {hasRevenue ? (
        <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    Monthly Revenue
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    +{analytics.revenue.trend}%
                  </span>
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                  {formatCurrency(analytics.revenue.thisMonth)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  vs {formatCurrency(analytics.revenue.lastMonth)} last month
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: "85%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Revenue performance
            </p>
          </div>
        </div>
      ) : null}

      {/* Total Subscribers */}
      {hasSubscribers ? (
        <div className="relative group overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    Total Subscribers
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    +{analytics.subscribers.trend}%
                  </span>
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                  {formatNumber(analytics.subscribers.total)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {formatNumber(analytics.subscribers.active)} active
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: "72%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Subscriber growth
            </p>
          </div>
        </div>
      ) : null}

      {/* Response Time */}
      {hasResponse ? (
        <div className="relative group overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    Response Time
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    -{Math.abs(analytics.responseTime.trend)}%
                  </span>
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                  {analytics.responseTime.average}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  12% faster than last month
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: "65%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Response efficiency
            </p>
          </div>
        </div>
      ) : null}

      {/* Engagement Rate */}
      {hasEngagement ? (
        <div className="relative group overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/30 rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    Engagement Rate
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                    +{analytics.engagementRate}%
                  </span>
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                  {analytics.engagementRate}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Above industry average
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: "78%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Engagement performance
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
