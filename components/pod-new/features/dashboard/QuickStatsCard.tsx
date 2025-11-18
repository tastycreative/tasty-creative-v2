"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickStatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  iconBg?: string;
  href?: string;
  alert?: boolean;
  trend?: string | null;
  progressPercent?: number;
}

export default function QuickStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  href,
  alert = false,
  progressPercent = 65
}: QuickStatsCardProps) {
  const getGradientClasses = () => {
    if (gradient.includes('blue')) {
      return {
        bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30',
        iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        progressGradient: 'from-blue-500 to-blue-600',
        label: 'Task completion'
      };
    }
    if (gradient.includes('red')) {
      return {
        bgGradient: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30',
        iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
        progressGradient: 'from-red-500 to-red-600',
        label: 'Attention required'
      };
    }
    if (gradient.includes('purple')) {
      return {
        bgGradient: 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/30',
        iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        progressGradient: 'from-purple-500 to-pink-500',
        label: 'Model activity'
      };
    }
    if (gradient.includes('emerald') || gradient.includes('green')) {
      return {
        bgGradient: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/30',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        progressGradient: 'from-emerald-500 to-green-600',
        label: 'Revenue performance'
      };
    }
    return {
      bgGradient: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/30',
      iconBg: 'bg-gradient-to-br from-gray-500 to-gray-600',
      progressGradient: 'from-gray-500 to-gray-600',
      label: 'Performance'
    };
  };

  const { bgGradient, iconBg, progressGradient, label } = getGradientClasses();

  const content = (
    <div
      className={`relative group overflow-hidden bg-gradient-to-br ${bgGradient} rounded-2xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25 ${href ? "cursor-pointer" : ""}`}
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
                {title}
              </h3>
            </div>
            <p className={`text-3xl font-black mb-1 tracking-tight ${
              alert && typeof value === 'number' && value > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {subtitle}
            </p>
          </div>

          <div
            className={`${iconBg} p-3 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/20 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Progress indicator */}
        <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2 mb-2">
          <div
            className={`bg-gradient-to-r ${progressGradient} h-2 rounded-full transition-all duration-1000 ease-out`}
            style={{
              width: `${progressPercent}%`,
            }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {label}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
