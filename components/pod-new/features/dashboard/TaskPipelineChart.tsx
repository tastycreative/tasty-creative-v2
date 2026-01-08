"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface StatusData {
  status: string;
  count: number;
  label: string;
  color: string;
}

interface TaskPipelineChartProps {
  data: StatusData[];
}

export default function TaskPipelineChart({ data }: TaskPipelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg">
        <div className="text-center py-8 text-gray-500">
          No task data available
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Transform data for Recharts
  const chartData = data.map((item) => ({
    name: item.label,
    value: item.count,
    color: item.color,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(0) : 0,
  }));

  // Calculate max value for Y axis reference lines
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const yAxisMax = Math.ceil(maxValue * 1.2);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1C22] border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">
            {payload[0].payload.name}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <span className="text-violet-400 font-bold">
              {payload[0].value}
            </span>{" "}
            tasks ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot component with glow effect
  const CustomDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <g>
        {/* Glow effect */}
        <circle cx={cx} cy={cy} r={8} fill="#8B5CF6" opacity={0.3} />
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#121216"
          stroke="#8B5CF6"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg relative overflow-hidden group">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">
              Tasks by Status
            </h2>
            <p className="text-[11px] text-gray-500 mt-1">
              Workflow distribution
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white tracking-tight">
              {total}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center justify-end font-medium">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                {/* Gradient for area fill */}
                <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                {/* Glow filter for the line */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite
                    in="SourceGraphic"
                    in2="blur"
                    operator="over"
                  />
                </filter>
              </defs>

              {/* Horizontal reference lines */}
              {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <ReferenceLine
                  key={i}
                  y={yAxisMax * ratio}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="0"
                />
              ))}

              <XAxis
                dataKey="name"
                tick={{ fill: "#6B7280", fontSize: 10 }}
                stroke="transparent"
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis hide domain={[0, yAxisMax]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#8B5CF6", strokeWidth: 1, strokeOpacity: 0.3 }}
              />

              {/* Glow line (behind) */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8B5CF6"
                strokeWidth={4}
                strokeOpacity={0.3}
                fill="none"
                filter="url(#glow)"
              />

              {/* Main area */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fillOpacity={1}
                fill="url(#gradientPurple)"
                dot={<CustomDot />}
                activeDot={{
                  r: 6,
                  fill: "#121216",
                  stroke: "#8B5CF6",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
