"use client";

import React from "react";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function ContributorLeaderboard({ data }: ContributorLeaderboardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No contributor data available
        </div>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map((contributor, index) => ({
    name: contributor.name.split(' ')[0], // First name only
    value: contributor.taskCount,
    fullName: contributor.name,
    email: contributor.email,
    image: contributor.image,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{payload[0].payload.fullName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {payload[0].value} {payload[0].value === 1 ? 'task' : 'tasks'} created
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
            Top Contributors
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Most active this week</p>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Contributors List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.slice(0, 6).map((contributor, index) => (
            <div
              key={contributor.userId}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {contributor.image ? (
                  <Image
                    src={contributor.image}
                    alt={contributor.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {contributor.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Rank Badge */}
                {index < 3 && (
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: COLORS[index] }}
                  >
                    {index + 1}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {contributor.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {contributor.taskCount} {contributor.taskCount === 1 ? 'task' : 'tasks'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Based on tasks created in the last 7 days
          </p>
        </div>
      </div>
    </div>
  );
}
