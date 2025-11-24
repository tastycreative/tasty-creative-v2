"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ChevronRight, Loader2 } from "lucide-react";
import { getPublicCalendarEvents } from "@/app/services/google-calendar-implementation";
import { DateTime } from "luxon";

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export default function TodayEventsCard() {
  const router = useRouter();
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userTimezone] = useState<string>(DateTime.local().zoneName);

  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        setIsLoading(true);
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const events = await getPublicCalendarEvents(startOfDay, endOfDay);
        setTodayEvents(events || []);
      } catch (error) {
        console.error("Error fetching today's events:", error);
        setTodayEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayEvents();
  }, []);

  const formatEventTime = (event: CalendarEvent) => {
    const dateString = event.start.dateTime || event.start.date;
    if (!dateString) return "";

    if (event.start.date) {
      return "All day";
    }

    const dt = DateTime.fromISO(dateString, { zone: 'utc' }).setZone(userTimezone);
    return dt.toLocaleString(DateTime.TIME_SIMPLE);
  };

  // Get user's timezone abbreviation
  const getTimezoneAbbr = (): string => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const abbr = new Date().toLocaleTimeString('en-US', {
        timeZoneName: 'short'
      }).split(' ').pop();
      return abbr || timezone;
    } catch {
      return timezone;
    }
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = today.getDate();
  const monthName = today.toLocaleDateString('en-US', { month: 'short' });
  const timezoneAbbr = getTimezoneAbbr();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => router.push('/calendar')}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      {/* Decorative Circles */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-white dark:bg-gray-800 rounded-full opacity-50 blur-2xl"></div>
      <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-white dark:bg-gray-800 rounded-full opacity-50 blur-2xl"></div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-start gap-4">
          {/* Date Display */}
          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <div className="text-xs font-semibold uppercase tracking-wide">{dayName}</div>
            <div className="text-2xl font-black leading-none">{dayNumber}</div>
            <div className="text-xs font-medium">{monthName}</div>
          </div>

          {/* Events List */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Today's Events
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-9">
                  {!isLoading && (
                    <>{todayEvents.length} {todayEvents.length === 1 ? 'event' : 'events'} • </>
                  )}
                  Your time: {timezoneAbbr}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 text-pink-500 animate-spin" />
              </div>
            ) : todayEvents.length === 0 ? (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No events today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <Clock className="h-3 w-3 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {event.summary}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {formatEventTime(event)}
                      </p>
                    </div>
                  </div>
                ))}
                {todayEvents.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    +{todayEvents.length - 3} more event{todayEvents.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
