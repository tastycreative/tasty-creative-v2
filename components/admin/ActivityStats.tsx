"use client";

import { ActivityStats as ActivityStatsType } from "@/hooks/useAdminUsers";
import { Users, Calendar, TrendingUp } from "lucide-react";

interface ActivityStatsProps {
  stats: ActivityStatsType;
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  const statCards = [
    {
      label: "Active Today",
      value: stats.activeToday,
      icon: Users,
      gradient: "from-emerald-500/10 to-green-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Active This Week",
      value: stats.activeThisWeek,
      icon: Calendar,
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Active This Month",
      value: stats.activeThisMonth,
      icon: TrendingUp,
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      borderColor: "border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-xl border ${stat.borderColor} bg-gradient-to-br ${stat.gradient} p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
          >
            {/* Radial pattern overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.borderColor}`}>
                <Icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-3xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
