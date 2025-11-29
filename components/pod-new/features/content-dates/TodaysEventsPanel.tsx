"use client";

import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";
import { Clock } from "lucide-react";
import UpcomingEventsPanel from "./UpcomingEventsPanel";

// Helper to get initials (matches UpcomingEventsPanel)
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

interface TodaysEventsPanelProps {
  events: ContentEvent[];
  onEventClick: (event: ContentEvent) => void;
  isLoading?: boolean;
}

export default function TodaysEventsPanel({ events, onEventClick, isLoading = false }: TodaysEventsPanelProps) {
  // Reuse UpcomingEventsPanel's layout but with a different header text
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg h-full flex flex-col">
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative z-10 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Today's Events
          </h2>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {events.length} event{events.length !== 1 ? 's' : ''} today
        </p>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-3 min-h-0">
        {events.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">No events today</p>
          </div>
        ) : (
          events.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`w-full text-left p-4 rounded-xl border transition-all group ${
                event.deletedAt
                  ? 'bg-gray-100/50 dark:bg-gray-800/50 border-red-300/50 dark:border-red-800/50 opacity-60'
                  : 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  event.deletedAt
                    ? "bg-red-500/10 border border-red-500/20"
                    : event.type === "PPV"
                    ? "bg-pink-500/10 border border-pink-500/20"
                    : "bg-purple-500/10 border border-purple-500/20"
                }`}>
                  <span className={`text-lg font-bold ${
                    event.deletedAt
                      ? "text-red-600 dark:text-red-400"
                      : event.type === "PPV"
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-purple-600 dark:text-purple-400"
                  }`}>
                    {event.date.getDate()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* Profile Picture or Initials (match UpcomingEventsPanel) */}
                    {event.creatorProfilePicture ? (
                      <img
                        src={event.creatorProfilePicture}
                        alt={event.creator || 'Creator'}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) {
                            const initialsDiv = document.createElement('div');
                            initialsDiv.className = 'flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-[10px] font-bold border border-gray-200 dark:border-gray-700 flex-shrink-0';
                            initialsDiv.textContent = getInitials(event.creator || '?');
                            parent.insertBefore(initialsDiv, img);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-[10px] font-bold border border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {getInitials(event.creator || '?')}
                      </div>
                    )}

                    <h3 className={`text-sm font-semibold text-gray-900 dark:text-gray-100 truncate transition-colors ${
                      event.deletedAt
                        ? 'line-through text-gray-500 dark:text-gray-500'
                        : 'group-hover:text-pink-600 dark:group-hover:text-pink-400'
                    }`}>
                      {event.type} - {event.creator || 'Unknown'}
                    </h3>
                    {event.deletedAt && (
                      <span className="text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                        DELETED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{event.time ? ` • ${event.time}` : ''}</span>
                  </div>

                  {/* Creator name (matches UpcomingEventsPanel) */}
                  {event.creator && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {event.creator}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      event.status === 'PROCESSING' ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30' : 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                    }`}>
                      {event.status === 'PROCESSING' ? 'Processing' : 'In queue'}
                    </span>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      event.type === 'PPV' ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30' : 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
                    }`}>
                      {event.type}
                    </span>

                    {event.price && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                        {event.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
