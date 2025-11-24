"use client";

import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";
import { Clock, Calendar, DollarSign, Tag, Video } from "lucide-react";

interface UpcomingEventsPanelProps {
  events: ContentEvent[];
  onEventClick: (event: ContentEvent) => void;
}

export default function UpcomingEventsPanel({ events, onEventClick }: UpcomingEventsPanelProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEventTypeIcon = (type: ContentEvent["type"]) => {
    return type === "LIVESTREAM" ? Video : DollarSign;
  };

  const getStatusBadge = (status: ContentEvent["status"]) => {
    const badges = {
      SCHEDULED: { text: "Scheduled", className: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30" },
      COMPLETED: { text: "Completed", className: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30" },
      CANCELLED: { text: "Cancelled", className: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30" },
    };
    return badges[status];
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
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Create Event" to add one</p>
          </div>
        ) : (
          events.map((event) => {
            const EventIcon = getEventTypeIcon(event.type);
            const statusBadge = getStatusBadge(event.status);

            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="w-full text-left p-4 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    event.type === "PPV"
                      ? "bg-pink-500/10 border border-pink-500/20"
                      : "bg-purple-500/10 border border-purple-500/20"
                  }`}>
                    <EventIcon className={`h-4 w-4 ${
                      event.type === "PPV"
                        ? "text-pink-600 dark:text-pink-400"
                        : "text-purple-600 dark:text-purple-400"
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {event.title}
                    </h3>

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(event.date)}</span>
                      {event.time && (
                        <>
                          <span>•</span>
                          <span>{event.time}</span>
                        </>
                      )}
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
