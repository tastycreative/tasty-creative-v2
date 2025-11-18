"use client";

import React from "react";
import Link from "next/link";
import { UserRole } from "@prisma/client";

interface AdminData {
  type: 'admin';
  totalUsers: number;
  recentSignups: number;
  activeStrikes: number;
  unverifiedUsers: number;
}

interface ManagerData {
  type: 'manager';
  myTeamTasksByStatus: { status: string; count: number }[];
  completionRate: number;
}

interface UserData {
  type: 'user';
  myTasksByStatus: { status: string; count: number }[];
  unreadNotifications: number;
}

type RoleSpecificData = AdminData | ManagerData | UserData;

interface RoleAdaptiveSectionProps {
  userRole: UserRole;
  data: RoleSpecificData;
}

export default function RoleAdaptiveSection({ userRole, data }: RoleAdaptiveSectionProps) {
  // Admin View
  if (data.type === 'admin') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 border border-gray-200/50 shadow-sm p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        <div className="relative">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Admin Overview
            </h3>
            <p className="text-sm text-gray-600 mt-1">System administration metrics</p>
          </div>

          {/* Admin Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/pod-admin"
              className="group p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all hover:border-purple-300"
            >
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Total Users
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">
                {data.totalUsers}
              </div>
              <div className="text-xs text-gray-500">
                +{data.recentSignups} this week
              </div>
            </Link>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Unverified
              </div>
              <div className="text-3xl font-black text-orange-600 mb-1">
                {data.unverifiedUsers}
              </div>
              <div className="text-xs text-gray-500">
                Email not verified
              </div>
            </div>

            <div className={`p-4 bg-white rounded-xl border ${
              data.activeStrikes > 0 ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
            }`}>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Active Strikes
              </div>
              <div className={`text-3xl font-black mb-1 ${
                data.activeStrikes > 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {data.activeStrikes}
              </div>
              <div className="text-xs text-gray-500">
                {data.activeStrikes > 0 ? 'Requires attention' : 'No active strikes'}
              </div>
            </div>

            <Link
              href="/pod-admin"
              className="group p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl border border-purple-600 hover:shadow-lg transition-all text-white"
            >
              <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-90">
                Admin Panel
              </div>
              <div className="text-sm font-bold mb-2">
                Manage Users & Teams
              </div>
              <div className="text-xs opacity-75 flex items-center gap-1">
                Open dashboard
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Manager View
  if (data.type === 'manager') {
    const totalTasks = data.myTeamTasksByStatus.reduce((sum, t) => sum + t.count, 0);

    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 border border-gray-200/50 shadow-sm p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        <div className="relative">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              My Team Performance
            </h3>
            <p className="text-sm text-gray-600 mt-1">Your team's task overview</p>
          </div>

          {/* Completion Rate Circle */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(data.completionRate / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {data.completionRate}%
                </div>
                <div className="text-xs font-semibold text-gray-600 uppercase">Complete</div>
              </div>
            </div>
          </div>

          {/* Task Breakdown */}
          <div className="space-y-2">
            {data.myTeamTasksByStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">{item.status}</span>
                <span className="text-lg font-black text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Team Tasks</span>
              <span className="text-2xl font-black text-gray-900">{totalTasks}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular User View
  if (data.type === 'user') {
    const totalMyTasks = data.myTasksByStatus.reduce((sum, t) => sum + t.count, 0);

    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 border border-gray-200/50 shadow-sm p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        <div className="relative">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              My Activity
            </h3>
            <p className="text-sm text-gray-600 mt-1">Your assigned tasks</p>
          </div>

          {/* Notifications Alert */}
          {data.unreadNotifications > 0 && (
            <Link
              href="/notifications"
              className="block mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {data.unreadNotifications} Unread Notification{data.unreadNotifications !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-600">Click to view</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* My Tasks */}
          <div className="space-y-2 mb-4">
            {data.myTasksByStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">{item.status}</span>
                <span className="text-lg font-black text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>

          <Link
            href="/board?filter=MY_TASKS"
            className="block w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-center font-bold hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-center gap-2">
              View My Tasks ({totalMyTasks})
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
