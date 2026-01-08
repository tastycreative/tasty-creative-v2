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
  progressPercent = 65,
}: QuickStatsCardProps) {
  const getGradientClasses = () => {
    if (gradient.includes("blue")) {
      return {
        iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
        iconGlow: "shadow-blue-500/30",
        progressGradient: "from-blue-500 to-cyan-500",
        label: "Task completion",
        borderColor: "border-blue-500/20",
        bgGlow: "rgba(59,130,246,0.1)",
      };
    }
    if (gradient.includes("red")) {
      return {
        iconBg: "bg-gradient-to-br from-red-500 to-rose-500",
        iconGlow: "shadow-red-500/30",
        progressGradient: "from-red-500 to-rose-500",
        label: "Attention required",
        borderColor: "border-red-500/20",
        bgGlow: "rgba(239,68,68,0.1)",
      };
    }
    if (gradient.includes("purple")) {
      return {
        iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
        iconGlow: "shadow-violet-500/30",
        progressGradient: "from-violet-500 to-purple-500",
        label: "Model activity",
        borderColor: "border-violet-500/20",
        bgGlow: "rgba(139,92,246,0.1)",
      };
    }
    if (gradient.includes("emerald") || gradient.includes("green")) {
      return {
        iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
        iconGlow: "shadow-emerald-500/30",
        progressGradient: "from-emerald-500 to-green-500",
        label: "Revenue performance",
        borderColor: "border-emerald-500/20",
        bgGlow: "rgba(16,185,129,0.1)",
      };
    }
    return {
      iconBg: "bg-gradient-to-br from-gray-500 to-gray-600",
      iconGlow: "shadow-gray-500/30",
      progressGradient: "from-gray-500 to-gray-600",
      label: "Performance",
      borderColor: "border-gray-500/20",
      bgGlow: "rgba(107,114,128,0.1)",
    };
  };

  const { iconBg, iconGlow, progressGradient, label, borderColor, bgGlow } =
    getGradientClasses();

  const content = (
    <div
      className={`relative group overflow-hidden bg-[#121216] rounded-2xl border border-white/5 ${borderColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-white/10 ${href ? "cursor-pointer" : ""}`}
    >
      {/* Background Glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 -translate-y-8 translate-x-8 pointer-events-none"
        style={{ backgroundColor: bgGlow }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {title}
              </h3>
            </div>
            <p
              className={`text-2xl font-bold mb-1 tracking-tight ${
                alert && typeof value === "number" && value > 0
                  ? "text-red-400"
                  : "text-white"
              }`}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
          </div>

          <div
            className={`${iconBg} p-2.5 rounded-xl shadow-lg ${iconGlow} group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Progress indicator */}
        <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
          <div
            className={`bg-gradient-to-r ${progressGradient} h-1.5 rounded-full transition-all duration-1000 ease-out`}
            style={{
              width: `${progressPercent}%`,
            }}
          ></div>
        </div>
        <p className="text-[10px] text-gray-600">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
