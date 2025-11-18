"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface PriorityData {
  priority: string;
  count: number;
}

interface PriorityDonutChartProps {
  data: PriorityData[];
}

const PRIORITY_CONFIG = {
  URGENT: { color: '#EF4444', gradient: ['#EF4444', '#DC2626'], label: 'Urgent' },
  HIGH: { color: '#F59E0B', gradient: ['#F59E0B', '#D97706'], label: 'High' },
  MEDIUM: { color: '#EAB308', gradient: ['#EAB308', '#CA8A04'], label: 'Medium' },
  LOW: { color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'], label: 'Low' }
};

export default function PriorityDonutChart({ data }: PriorityDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No priority data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Transform data for Recharts
  const chartData = data.map((item, index) => {
    const config = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] || {
      color: '#6B7280',
      gradient: ['#6B7280', '#4B5563'],
      label: item.priority
    };

    return {
      name: config.label,
      value: item.count,
      color: config.color,
      gradientId: `gradient-${index}`,
      gradient: config.gradient,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(0) : 0
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{payload[0].name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {payload[0].value} tasks ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Priority Breakdown
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active tasks by priority level</p>
        </div>

        <div className="flex flex-col items-center">
          {/* Donut Chart */}
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient key={entry.gradientId} id={entry.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.gradient[0]} stopOpacity={1}/>
                    <stop offset="100%" stopColor={entry.gradient[1]} stopOpacity={0.9}/>
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId})`} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="w-full mt-2 grid grid-cols-2 gap-3">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {item.value} tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
