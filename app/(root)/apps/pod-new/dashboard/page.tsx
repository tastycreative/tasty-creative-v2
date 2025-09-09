"use client";

import React from "react";

export default function PodNewDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              POD Workflow Dashboard
            </h2>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              Sheets Synced
            </div>
          </div>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Progress */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">Overall Progress</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">4/8 completed</div>
          <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            50% of tasks completed
          </div>
        </div>

        {/* Status Summary */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">Status Summary</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-400">4</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-400">2</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700 dark:text-slate-300">2</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Not Started</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-400">0</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">Team Performance</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">87% efficiency</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">↗ +12% this week</div>
          </div>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Tasks */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center text-white text-xs">
              •
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Recent Tasks</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">
                Latest team activity and progress
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100/60 dark:bg-slate-800/40">
              <div>
                <div className="text-sm text-gray-900 dark:text-white">
                  Luna_Dreams - Schedule Complete
                </div>
                <div className="text-[11px] text-gray-600 dark:text-slate-400">
                  Jake • 2 hours ago
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Complete
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100/60 dark:bg-slate-800/40">
              <div>
                <div className="text-sm text-gray-900 dark:text-white">
                  Sophia_Blaze - Data Analysis
                </div>
                <div className="text-[11px] text-gray-600 dark:text-slate-400">
                  Sarah • 1 hour ago
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                In Progress
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100/60 dark:bg-slate-800/40">
              <div>
                <div className="text-sm text-gray-900 dark:text-white">
                  Maya_Rose - Content Upload
                </div>
                <div className="text-[11px] text-gray-600 dark:text-slate-400">
                  Vanessa • 30 minutes ago
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Review
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Overview */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs">
              ★
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Schedule Overview
              </div>
              <div className="text-xs text-gray-600 dark:text-slate-400">
                Quick preview of content scheduling
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-900 dark:text-white">Daily Posts Scheduled</div>
                <div className="text-[11px] text-gray-600 dark:text-slate-400">All Models</div>
              </div>
              <div className="text-sm text-gray-900 dark:text-white">18/28</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-900 dark:text-white">Mass Messages Ready</div>
                <div className="text-[11px] text-gray-600 dark:text-slate-400">Luna, Sophia</div>
              </div>
              <div className="text-sm text-gray-900 dark:text-white">2/4</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                  CHECK Validation
                </span>
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Pass</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-900 dark:text-white">Performance Analysis</div>
              <div className="text-sm text-gray-900 dark:text-white">89%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
