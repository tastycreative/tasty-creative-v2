"use client";

import { Bell, ArrowRight } from "lucide-react";

export function TeamNotificationPreview() {
  return (
    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
      <h5 className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Team Notification Preview
      </h5>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
            Content Team
          </span>
          <ArrowRight className="w-3 h-3 text-purple-600" />
          <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
            PGT Team
          </span>
          <span className="text-xs text-purple-600 dark:text-purple-400">
            (Default - Caption writing)
          </span>
        </div>
        <p className="text-xs text-purple-700 dark:text-purple-300">
          ✅ PGT Team will be automatically notified to create captions for this submission
        </p>
      </div>
    </div>
  );
}
