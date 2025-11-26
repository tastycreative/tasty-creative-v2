"use client";

import { useState } from "react";
import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";
import { X } from "lucide-react";

interface ContentDatesCalendarProps {
  currentDate: Date;
  events: ContentEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: ContentEvent) => void;
}

export default function ContentDatesCalendar({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: ContentDatesCalendarProps) {
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const expandedDayEvents = expandedDate ? getEventsForDate(expandedDate) : [];

  return (
    <div className="relative">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const today = isToday(date);

          return (
            <div
              key={index}
              onClick={() => date && onDateClick(date)}
              className={`min-h-[100px] md:min-h-[120px] p-2 rounded-lg border transition-all cursor-pointer ${
                date
                  ? 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 hover:shadow-md'
                  : 'bg-transparent border-transparent cursor-default'
              } ${
                today
                  ? 'ring-2 ring-pink-500 dark:ring-pink-400 ring-inset'
                  : ''
              }`}
            >
              {date && (
                <>
                  {/* Date Number */}
                  <div className={`text-sm font-semibold mb-1 ${
                    today
                      ? 'text-pink-600 dark:text-pink-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {date.getDate()}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const colorClasses = {
                        pink: "bg-pink-500/80 hover:bg-pink-500",
                        purple: "bg-purple-500/80 hover:bg-purple-500",
                        blue: "bg-blue-500/80 hover:bg-blue-500",
                        green: "bg-green-500/80 hover:bg-green-500",
                        orange: "bg-orange-500/80 hover:bg-orange-500",
                      };

                      return (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          className={`w-full text-left text-xs px-2 py-1 rounded text-white font-medium truncate transition-colors ${
                            event.deletedAt
                              ? 'bg-gray-400/80 hover:bg-gray-400 line-through opacity-60'
                              : colorClasses[event.color]
                          }`}
                          title={event.deletedAt ? `${event.title} (Deleted)` : event.title}
                        >
                          {event.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDate(date);
                        }}
                        className="w-full text-left text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        +{dayEvents.length - 2} more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* All Events Modal */}
      {expandedDate && expandedDayEvents.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setExpandedDate(null)}>
          <div className="relative w-full max-w-md max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Events on {expandedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setExpandedDate(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Events List */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
              {expandedDayEvents.map((event) => {
                const colorClasses = {
                  pink: "bg-pink-500/80 hover:bg-pink-500 border-pink-500/30",
                  purple: "bg-purple-500/80 hover:bg-purple-500 border-purple-500/30",
                  blue: "bg-blue-500/80 hover:bg-blue-500 border-blue-500/30",
                  green: "bg-green-500/80 hover:bg-green-500 border-green-500/30",
                  orange: "bg-orange-500/80 hover:bg-orange-500 border-orange-500/30",
                };

                return (
                  <button
                    key={event.id}
                    onClick={() => {
                      onEventClick(event);
                      setExpandedDate(null);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all border shadow-sm hover:shadow-md ${
                      event.deletedAt
                        ? 'bg-gray-400/80 hover:bg-gray-400 border-gray-400/30 text-white opacity-60'
                        : `${colorClasses[event.color]} text-white`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${event.deletedAt ? 'line-through' : ''}`}>
                        {event.title}
                        {event.deletedAt && (
                          <span className="ml-2 text-xs font-normal">(Deleted)</span>
                        )}
                      </span>
                      {event.time && (
                        <span className="text-xs opacity-90">{event.time}</span>
                      )}
                    </div>
                    {event.creator && (
                      <div className="text-xs opacity-90 mt-1">
                        {event.creator}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="relative z-10 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setExpandedDate(null)}
                className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
