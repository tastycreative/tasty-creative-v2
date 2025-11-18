"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Submission {
  id: string;
  modelName: string;
  type: string;
  style: string | null;
  createdAt: Date;
  taskId?: string;
  taskTitle?: string;
  taskStatus?: string;
}

interface RecentSubmissionsTimelineProps {
  data: Submission[];
}

const STYLE_ICONS: Record<string, string> = {
  NORMAL: '📝',
  GAME: '🎮',
  POLL: '📊',
  LIVESTREAM: '🔴',
  BUNDLE: '📦',
  PPV: '💰'
};

const TYPE_COLORS = {
  OTP: 'from-purple-500 to-purple-600',
  PTR: 'from-pink-500 to-pink-600'
};

export default function RecentSubmissionsTimeline({ data }: RecentSubmissionsTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No recent submissions
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Recent Submissions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest content workflows</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-pink-300 to-transparent" />

          <div className="space-y-4">
            {data.map((submission, index) => {
              const icon = submission.style ? STYLE_ICONS[submission.style] || '📄' : '📄';
              const typeColor = TYPE_COLORS[submission.type as keyof typeof TYPE_COLORS] || 'from-gray-500 to-gray-600';
              const timeAgo = formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true });

              return (
                <div key={submission.id} className="relative pl-16 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>

                  {/* Content Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-900 dark:text-white truncate">
                            {submission.modelName}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {timeAgo}
                          </div>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className={`px-2 py-1 rounded-md bg-gradient-to-r ${typeColor} text-white text-xs font-bold flex-shrink-0`}>
                        {submission.type}
                      </div>
                    </div>

                    {/* Style Tag */}
                    {submission.style && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-white mb-2">
                        <span>{STYLE_ICONS[submission.style] || '📄'}</span>
                        <span>{submission.style}</span>
                      </div>
                    )}

                    {/* Task Link */}
                    {submission.taskId && (
                      <Link
                        href={`/board?task=${submission.taskId}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline mt-2"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {submission.taskTitle || 'View Task'}
                        {submission.taskStatus && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                            {submission.taskStatus}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View All Link */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link
            href="/forms"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline"
          >
            View all submissions
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
