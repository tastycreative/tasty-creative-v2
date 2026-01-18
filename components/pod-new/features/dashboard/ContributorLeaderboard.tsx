"use client";

import React from "react";
import Image from "next/image";

interface Contributor {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  taskCount: number;
}

interface ContributorLeaderboardProps {
  data: Contributor[];
}

const BAR_COLORS = [
  { bg: "#8B5CF6", glow: "rgba(139,92,246,0.3)" }, // Violet
  { bg: "#F472B6", glow: "rgba(244,114,182,0.3)" }, // Pink
  { bg: "#6B7280", glow: "none" }, // Gray for "Other"
];

export default function ContributorLeaderboard({
  data,
}: ContributorLeaderboardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg">
        <div className="text-center py-8 text-gray-500">
          No contributor data available
        </div>
      </div>
    );
  }

  // Get top 2 contributors and aggregate the rest
  const topContributors = data.slice(0, 2);
  const otherContributors = data.slice(2);
  const otherCount = otherContributors.reduce((sum, c) => sum + c.taskCount, 0);

  // Calculate max value for scaling bars
  const allCounts = [
    ...topContributors.map((c) => c.taskCount),
    otherCount,
  ].filter((c) => c > 0);
  const maxCount = Math.max(...allCounts, 1);

  // Create Y-axis labels
  const yAxisLabels = [maxCount, Math.round(maxCount / 2), 0];

  // Bar data including "Other" if there are more contributors
  const barData = [
    ...topContributors.map((c, i) => ({
      name: c.name.split(" ")[0],
      count: c.taskCount,
      image: c.image,
      color: BAR_COLORS[i],
      isOther: false,
    })),
    ...(otherContributors.length > 0
      ? [
          {
            name: "Other",
            count: otherCount,
            image: null,
            color: BAR_COLORS[2],
            isOther: true,
          },
        ]
      : []),
  ];

  const maxHeight = 128; // Max bar height in pixels

  return (
    <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-base font-semibold text-white">
            Top Contributors
          </h2>
          <p className="text-[11px] text-gray-500">Weekly activity</p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Chart Area with Bars */}
        <div className="flex items-end space-x-4 h-32 px-1 relative overflow-hidden">
          {/* Y-Axis Labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-gray-600 font-medium -ml-1 h-full z-0">
            {yAxisLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>

          {/* Horizontal Grid Lines */}
          <div className="absolute inset-0 w-full h-full flex flex-col justify-between pointer-events-none pl-4 z-0">
            <div className="border-b border-dashed border-white/5 w-full h-0" />
            <div className="border-b border-dashed border-white/5 w-full h-0" />
            <div className="border-b border-white/10 w-full h-0" />
          </div>

          {/* Bars */}
          {barData.map((item, index) => {
            const barHeight =
              maxCount > 0 ? (item.count / maxCount) * maxHeight : 0;

            return (
              <div
                key={index}
                className={`flex-1 flex flex-col items-center justify-end h-full z-10 ${index === 0 ? "pl-4" : ""} group ${item.isOther ? "opacity-40" : ""}`}
              >
                {/* Bar */}
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-full max-w-[40px] rounded-t-sm transition-all duration-300 group-hover:opacity-90"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: item.color.bg,
                      boxShadow:
                        item.color.glow !== "none"
                          ? `0 0 15px ${item.color.glow}`
                          : "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Avatars / Labels Row - Outside the chart overflow area */}
        <div className="flex space-x-4 px-1 mt-2">
          {barData.map((item, index) => (
            <div
              key={index}
              className={`flex-1 flex flex-col items-center ${index === 0 ? "pl-4" : ""} ${item.isOther ? "opacity-40" : ""}`}
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={24}
                  height={24}
                  className="rounded-full border border-pink-500/30 object-cover"
                />
              ) : item.isOther ? (
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[8px] text-gray-400 font-bold border border-gray-700">
                  +
                </div>
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border"
                  style={{
                    backgroundColor:
                      index === 0
                        ? "rgba(59,130,246,0.3)"
                        : "rgba(236,72,153,0.3)",
                    borderColor:
                      index === 0
                        ? "rgba(59,130,246,0.3)"
                        : "rgba(236,72,153,0.3)",
                    color: index === 0 ? "#93C5FD" : "#F9A8D4",
                  }}
                >
                  {item.name.charAt(0).toUpperCase()}
                  {item.name.split(" ")[1]?.charAt(0).toUpperCase() || ""}
                </div>
              )}
              <span
                className={`text-[9px] mt-1 truncate w-12 text-center ${item.isOther ? "text-gray-600" : "text-gray-500"}`}
              >
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
