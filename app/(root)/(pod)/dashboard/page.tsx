"use client";

import React from "react";
import Link from "next/link";
import { usePodOnboarding } from "@/hooks/usePodOnboarding";

export default function PodNewDashboardPage() {
  const { data: apiData, stats, loading, error, refetch } = usePodOnboarding();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
          <span className="text-gray-600 dark:text-slate-400">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load dashboard data</div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{error}</div>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !apiData) return null;

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
        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8m0-2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5 9h-4V7h-2v4H7v2h4v4h2v-4h4v-2z"/>
            </svg>
            <span>View Onboarding</span>
          </Link>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Progress */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">Overall Progress</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTasks}/{stats.totalTasks} completed</div>
          <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            {stats.completionPercentage}% of tasks completed
          </div>
        </div>

        {/* Model Summary */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">Model Summary</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{stats.totalModels}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Total Models</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-400">{stats.onboardingStatus}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">In Onboarding</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700 dark:text-slate-300">{stats.tasksPerModel}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Tasks Per Model</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-400">{stats.totalModels - stats.onboardingStatus}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Pending Start</div>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">Completion Rate</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completionPercentage}% complete</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Across all models</div>
          </div>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performing Models */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center text-white text-xs">
              ★
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Top Performing Models</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">
                Models with highest completion rates
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {stats.topPerformingModels.length > 0 ? stats.topPerformingModels.map((model, index) => (
              <div key={model.model} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {model.model.length > 20 ? model.model.substring(0, 20) + '...' : model.model}
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-slate-400">
                      {model.completed} of {model.total} tasks completed
                    </div>
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
                  model.completed === 0
                    ? 'bg-gray-500/20 text-gray-500 dark:text-gray-400'
                    : model.completed < model.total / 2
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {Math.round((model.completed / model.total) * 100)}%
                </span>
              </div>
            )) : (
              <div className="text-center py-4 text-sm text-gray-600 dark:text-slate-400">
                No models available
              </div>
            )}
          </div>
        </div>

        {/* Task Breakdown */}
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs">
              ✓
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Task Breakdown
              </div>
              <div className="text-xs text-gray-600 dark:text-slate-400">
                Most/least completed onboarding tasks
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {apiData.tasks.slice(0, 4).map((task) => {
              const completedCount = apiData.models.filter(
                model => model[task] === "TRUE"
              ).length;
              const percentage = Math.round((completedCount / stats.totalModels) * 100);

              return (
                <div key={task} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 dark:text-white truncate" title={task}>
                      {task.length > 25 ? task.substring(0, 25) + '...' : task}
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-slate-400">
                      {completedCount} of {stats.totalModels} models
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className={`text-sm font-bold ${
                      percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                      percentage >= 50 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {percentage}%
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      percentage >= 75 ? 'bg-emerald-400' :
                      percentage >= 50 ? 'bg-amber-400' :
                      'bg-red-400'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
