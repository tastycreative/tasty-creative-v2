"use client";

import React from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StyleData {
  style: string;
  count: number;
}

interface ContentStylePillsProps {
  data: StyleData[];
}

const STYLE_CONFIG = {
  NORMAL: { color: '#3B82F6', label: 'Normal' },
  GAME: { color: '#8B5CF6', label: 'Game' },
  POLL: { color: '#EC4899', label: 'Poll' },
  LIVESTREAM: { color: '#EF4444', label: 'Livestream' },
  BUNDLE: { color: '#10B981', label: 'Bundle' },
  PPV: { color: '#F59E0B', label: 'PPV' }
};

export default function ContentStylePills({ data }: ContentStylePillsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No content style data available
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Transform data for chart
  const chartData = data.map(item => {
    const config = STYLE_CONFIG[item.style as keyof typeof STYLE_CONFIG] || {
      color: '#6B7280',
      label: item.style
    };
    const percentage = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;

    return {
      name: config.label,
      value: item.count,
      color: config.color,
      percentage,
      styleType: item.style
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{payload[0].payload.name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {payload[0].value} pieces ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Content Styles
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Breakdown by content type</p>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              stroke="#9ca3af"
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#8884d8"
              barSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} radius={[6, 6, 0, 0]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {chartData.map((item, index) => (
            <Link
              key={index}
              href={`/forms?style=${item.styleType}`}
              className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.value} ({item.percentage}%)
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Content Pieces</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
