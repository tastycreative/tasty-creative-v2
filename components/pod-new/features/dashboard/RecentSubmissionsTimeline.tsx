"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { DollarSign, ArrowRight } from "lucide-react";

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

export default function RecentSubmissionsTimeline({
  data,
}: RecentSubmissionsTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg">
        <div className="text-center py-8 text-gray-500">
          No recent submissions
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121216] rounded-2xl p-5 border border-white/5 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white truncate">
            Recent Submissions
          </h2>
          <p className="text-[11px] text-gray-500 truncate">Latest workflow activity</p>
        </div>
        <Link
          href="/forms"
          className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors whitespace-nowrap shrink-0"
        >
          View All
        </Link>
      </div>

      {/* Timeline */}
      <div className="relative pl-2 space-y-6 overflow-hidden">
        {/* Timeline Line - centered on dots (dots are at pl-2 + left-0, width 2.5 = 10px, center at ~13px) */}
        <div className="absolute left-[12px] top-3 bottom-3 w-[1px] bg-white/10" />

        {data.slice(0, 5).map((submission, index) => {
          const timeAgo = formatDistanceToNow(new Date(submission.createdAt), {
            addSuffix: false,
          });
          const isFirst = index === 0;

          // Generate a fake ID for display
          const displayId = `#${Math.floor(10000000 + Math.random() * 90000000)}`;

          return (
            <div key={submission.id} className="relative flex items-start group">
              {/* Timeline Dot */}
              <div
                className={`absolute left-0 mt-1.5 w-2.5 h-2.5 rounded-full z-10 transition-transform group-hover:scale-110 ${
                  isFirst
                    ? "bg-[#121216] border-2 border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    : "bg-[#121216] border-2 border-gray-600 group-hover:border-violet-500"
                }`}
              />

              {/* Content Card */}
              <div className="ml-6 w-full min-w-0 bg-[#1C1C22] p-3.5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all cursor-pointer overflow-hidden">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* Icon */}
                    <div className="bg-yellow-500/10 p-1.5 rounded-md shrink-0">
                      <DollarSign className="w-3 h-3 text-yellow-500" />
                    </div>

                    {/* Name & Time */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-200 truncate">
                        {submission.modelName}
                      </h4>
                      <p className="text-[10px] text-gray-500">{timeAgo} ago</p>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                      isFirst
                        ? "bg-violet-500/20 text-violet-400 border border-violet-500/20"
                        : "bg-gray-700/50 text-gray-400 border border-white/5"
                    }`}
                  >
                    {submission.type}
                  </span>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {/* Style Tag */}
                  {submission.style && (
                    <span className="flex items-center bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] border border-white/5">
                      {submission.style}
                    </span>
                  )}

                  {/* PPV Tag (hardcoded for demo) */}
                  <span className="flex items-center bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] border border-white/5">
                    PPV
                  </span>

                  {/* Arrow */}
                  <ArrowRight className="w-3 h-3 text-gray-600" />

                  {/* Title */}
                  <span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">
                    {submission.type} PPV - {submission.modelName.split(" ")[0]}
                  </span>

                  {/* ID Badge */}
                  <span className="bg-purple-500/10 text-purple-300 text-[9px] px-2 py-0.5 rounded-full font-mono border border-purple-500/20 truncate max-w-[80px]">
                    {displayId}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
