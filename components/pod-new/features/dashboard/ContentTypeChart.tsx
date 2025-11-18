"use client";

import React from "react";
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ContentTypeChartProps {
  otpCount: number;
  ptrCount: number;
}

export default function ContentTypeChart({ otpCount, ptrCount }: ContentTypeChartProps) {
  const total = otpCount + ptrCount;

  const data = [
    {
      name: 'OTP',
      fullName: 'One-Time Posts',
      count: otpCount,
      percentage: total > 0 ? ((otpCount / total) * 100).toFixed(0) : 0,
      color: '#8B5CF6',
      gradient: 'url(#colorOtp)'
    },
    {
      name: 'PTR',
      fullName: 'Pay-To-Release',
      count: ptrCount,
      percentage: total > 0 ? ((ptrCount / total) * 100).toFixed(0) : 0,
      color: '#EC4899',
      gradient: 'url(#colorPtr)'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{payload[0].payload.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{payload[0].payload.fullName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {payload[0].value} submissions ({payload[0].payload.percentage}%)
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
            Content Type Distribution
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">OTP vs PTR submissions</p>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="colorOtp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPtr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EC4899" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#9ca3af"
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={80}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.gradient} stroke={entry.color} strokeWidth={2} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.count} ({item.percentage}%)</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Submissions</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
