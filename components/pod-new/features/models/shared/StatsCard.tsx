"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatsColorConfig, type StatsColorType } from "../utils";

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: React.ComponentType<{ className?: string }>;
  color: StatsColorType;
  progressPercent?: number;
  progressLabel?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  progressPercent,
  progressLabel,
}: StatsCardProps) {
  const config = getStatsColorConfig(color);

  return (
    <div className="relative group p-6 rounded-3xl bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
            config.iconBg
          )}
        >
          <Icon className={cn("w-6 h-6", config.iconColor)} />
        </div>
        {change && (
          <div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
              change.type === "increase"
                ? "bg-emerald-50/50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                : "bg-red-50/50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
            )}
          >
            <TrendingUp
              className={cn("w-3 h-3", change.type === "decrease" && "rotate-180")}
            />
            {change.value}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
          {title}
        </h3>
        <p
          className={cn(
            "text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent drop-shadow-sm",
            config.gradient
          )}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>

      {progressPercent !== undefined && (
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
            <span>{progressLabel}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden backdrop-blur-sm">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", config.gradient)}
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
