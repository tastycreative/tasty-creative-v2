"use client";

import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";
import { Clock, Calendar, DollarSign, Tag } from "lucide-react";

interface UpcomingEventsPanelProps {
  events: ContentEvent[];
  onEventClick: (event: ContentEvent) => void;
  isLoading?: boolean;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function UpcomingEventsPanel({ events, onEventClick, isLoading = false }: UpcomingEventsPanelProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (date: Date, time?: string) => {
    const dateStr = formatDate(date);

    if (time) {
      // Convert 24h time to 12h format
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const timeStr = `${hour12}:${minutes} ${ampm}`;
      return `${dateStr} • ${timeStr}`;
    }

    return dateStr;
  };

  const getStatusBadge = (status: ContentEvent["status"]) => {
    const badges = {
      IN_QUEUE: { text: "In queue", className: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30" },
      PROCESSING: { text: "Processing", className: "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30" },
    } as Record<string, { text: string; className: string }>;
    return badges[status] || { text: status, className: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg h-full flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Upcoming Events
          </h2>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {events.length} event{events.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Events List */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-3 min-h-0">
        {isLoading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50"
              >
                <div className="flex items-start gap-3">
                  {/* Icon skeleton */}
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"></div>

                  {/* Content skeleton */}
                  <div className="flex-1 space-y-2">
                    {/* Title skeleton */}
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>

                    {/* Date/Time skeleton */}
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>

                    {/* Badges skeleton */}
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Create Event" to add one</p>
          </div>
        ) : (
          events.map((event) => {
            const statusBadge = getStatusBadge(event.status);
            const dayOfMonth = event.date.getDate();

            return (
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
                  {/* Date Number */}
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
                      {dayOfMonth}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Profile Picture or Initials */}
                      {event.creatorProfilePicture ? (
                        <img
                          src={event.creatorProfilePicture}
                          alt={event.creator || 'Creator'}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
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

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(event.date, event.time)}</span>
                    </div>

                    {/* Creator */}
                    {event.creator && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {event.creator}
                      </div>
                    )}

                    {/* Tags & Price */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge.className}`}>
                        {statusBadge.text}
                      </span>

                      {/* Type Badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        event.type === "PPV"
                          ? "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30"
                          : "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"
                      }`}>
                        {event.type}
                      </span>

                      {/* Price */}
                      {event.price && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                          <DollarSign className="h-3 w-3" />
                          {event.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Tag className="h-3 w-3 text-gray-400" />
                        {event.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600/30 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
