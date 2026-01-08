"use client";

import React from "react";
import { MoreVertical } from "lucide-react";

interface PriorityData {
  priority: string;
  count: number;
}

interface PriorityDonutChartProps {
  data: PriorityData[];
}

const PRIORITY_CONFIG = {
  URGENT: {
    color: "#EF4444",
    label: "Urgent",
    glowColor: "rgba(239,68,68,0.5)",
  },
  HIGH: {
    color: "#F97316",
    label: "High",
    glowColor: "rgba(249,115,22,0.5)",
  },
  MEDIUM: {
    color: "#EAB308",
    label: "Medium",
    glowColor: "rgba(234,179,8,0.5)",
  },
  LOW: {
    color: "#22C55E",
    label: "Low",
    glowColor: "rgba(34,197,94,0.5)",
  },
};

export default function PriorityDonutChart({ data }: PriorityDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg">
        <div className="text-center py-8 text-gray-500">
          No priority data available
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Filter to only include priorities with count > 0 and sort by priority order
  const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  const chartData = priorityOrder
    .map((priority) => {
      const item = data.find((d) => d.priority === priority);
      const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
      if (!item || item.count === 0 || !config) return null;

      return {
        priority,
        count: item.count,
        color: config.color,
        label: config.label,
        glowColor: config.glowColor,
        percentage: total > 0 ? (item.count / total) * 100 : 0,
      };
    })
    .filter(Boolean) as {
    priority: string;
    count: number;
    color: string;
    label: string;
    glowColor: string;
    percentage: number;
  }[];

  // Calculate the highest percentage (non-low priority) for center display
  const nonLowPriorities = chartData.filter((d) => d.priority !== "LOW");
  const totalNonLow = nonLowPriorities.reduce((sum, d) => sum + d.count, 0);
  const centerPercentage =
    total > 0 ? Math.round((totalNonLow / total) * 100) : 0;

  // SVG calculations for donut chart
  const size = 128;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash offsets for each segment
  let cumulativePercentage = 0;
  const segments = chartData.map((item) => {
    const dashLength = (item.percentage / 100) * circumference;
    const dashOffset = circumference - dashLength;
    const rotation = (cumulativePercentage / 100) * 360 - 90; // Start from top
    cumulativePercentage += item.percentage;

    return {
      ...item,
      dashLength,
      dashOffset,
      rotation,
    };
  });

  return (
    <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Priority</h2>
          <p className="text-[11px] text-gray-500">Task breakdown</p>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Chart and Legend Row */}
      <div className="flex items-center space-x-6">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#27272A"
              strokeWidth={strokeWidth}
            />

            {/* Priority segments */}
            {segments.map((segment, index) => (
              <circle
                key={segment.priority}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${segment.dashLength} ${circumference}`}
                style={{
                  transform: `rotate(${segment.rotation}deg)`,
                  transformOrigin: "center",
                  filter: `drop-shadow(0 0 6px ${segment.glowColor})`,
                }}
              />
            ))}
          </svg>

          {/* Center percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">
              {centerPercentage}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {chartData.map((item) => (
            <div
              key={item.priority}
              className="flex justify-between items-center group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.glowColor}`,
                  }}
                />
                <span className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
