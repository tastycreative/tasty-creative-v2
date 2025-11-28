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
  source?: string;
  _raw?: any;
}

export default function TodayEventsCard() {
  const router = useRouter();
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userTimezone] = useState<string>(DateTime.local().zoneName);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        setIsLoading(true);
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const googleEvents = (await getPublicCalendarEvents(startOfDay, endOfDay)) || [];

        // Fetch content-dates events for today
        let contentEvents: CalendarEvent[] = [];
        try {
          const resp = await fetch(`/api/content-events?includeDeleted=true`);
          if (resp.ok) {
            const data = await resp.json();
            const items = data.events || data || [];

            contentEvents = (items || [])
              .filter((ev: any) => ev.date)
              .map((ev: any) => {
                const iso = new Date(ev.date).toISOString();
                return {
                  id: `content-${ev.id}`,
                  summary: ev.title || ev.summary || "(No title)",
                  start: { dateTime: iso, date: undefined },
                  end: { dateTime: iso, date: undefined },
                  source: "content",
                  _raw: ev,
                } as CalendarEvent;
              })
              .filter((ev: CalendarEvent) => {
                // ensure it falls within today
                const dt = ev.start.dateTime ? new Date(ev.start.dateTime) : ev.start.date ? new Date(ev.start.date) : null;
                return dt && dt >= startOfDay && dt <= endOfDay;
              });
          }
        } catch (err) {
          console.error('Failed to fetch content events for today', err);
        }

        // Merge and dedupe by id
        const combined = [...googleEvents, ...contentEvents];
        const seen = new Set<string>();
        const deduped = combined.filter((ev) => {
          const key = ev.id || `${ev.summary}-${ev.start?.dateTime || ev.start?.date || ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setTodayEvents(deduped || []);
      } catch (error) {
        console.error("Error fetching today's events:", error);
        setTodayEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayEvents();
  }, []);

  // Helper to get initials (used for content events)
  const getInitials = (name: any) => {
    if (!name && name !== 0) return "?";
    let str = "";
    if (typeof name === 'string') str = name;
    else if (typeof name === 'object' && name !== null) {
      str = name.clientName || name.displayName || name.name || '';
    } else {
      str = String(name || '');
    }

    str = str.trim();
    if (!str) return "?";
    const parts = str.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  // Helper to safely get creator display name (handles object or string)
  const getCreatorName = (raw: any) => {
    if (!raw) return 'Unknown';
    if (typeof raw === 'string') return raw;
    // raw may be the whole event payload - check if it has a creator property
    if (raw.creator) {
      // Creator is an object with clientName
      if (typeof raw.creator === 'object' && raw.creator !== null) {
        return raw.creator.clientName || raw.creator.displayName || raw.creator.name || 'Unknown';
      }
      // Creator is a string
      if (typeof raw.creator === 'string') {
        return raw.creator;
      }
    }
    // Check if raw itself is the creator object
    return raw.clientName || raw.displayName || raw.name || raw.creatorName || 'Unknown';
  };

  // Helper to safely get creator profile picture
  const getCreatorProfilePicture = (raw: any): string | null => {
    if (!raw) return null;
    // Check if raw has a creator property
    if (raw.creator && typeof raw.creator === 'object' && raw.creator !== null) {
      return raw.creator.profilePicture || null;
    }
    // Check if raw itself has the profile picture
    return raw.creatorProfilePicture || raw.profilePicture || null;
  };

  const formatEventTime = (event: CalendarEvent) => {
    // For content events with a separate time field
    if (event.source === "content" && event._raw?.time) {
      const time = event._raw.time;
      // Convert 24h time to 12h format
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }

    // For Google Calendar events
    const dateString = event.start.dateTime || event.start.date;
    if (!dateString) return "";

    if (event.start.date) {
      return "All day";
    }

    const dt = DateTime.fromISO(dateString, { zone: 'utc' }).setZone(userTimezone);
    return dt.toLocaleString(DateTime.TIME_SIMPLE);
  };

  // Helper to render a single event
  const renderEvent = (event: CalendarEvent) => {
    const isContentEvent = event.source === "content";
    const raw = event._raw || {};

    if (isContentEvent) {
      // Content event styling with color badges
      const colorClasses: Record<string, string> = {
        pink: "from-pink-500/90 to-pink-600/90",
        purple: "from-purple-500/90 to-purple-600/90",
        blue: "from-blue-500/90 to-blue-600/90",
        green: "from-green-500/90 to-green-600/90",
        orange: "from-orange-500/90 to-orange-600/90",
      };
      const gradientClass = raw.deletedAt
        ? 'from-gray-400/90 to-gray-500/90 opacity-60'
        : (colorClasses[raw.color] || 'from-pink-500/90 to-pink-600/90');

      return (
        <div
          key={event.id}
          className={`flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r ${gradientClass} text-white transition-all`}
        >
          {/* Profile Picture or Initials */}
          {getCreatorProfilePicture(raw) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getCreatorProfilePicture(raw)!}
              alt={getCreatorName(raw)}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white/50"
            />
          ) : (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-[9px] font-bold border border-white/50 flex-shrink-0">
              {getInitials(getCreatorName(raw))}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">
              {raw.type ? `${raw.type} - ` : ''}{getCreatorName(raw)}
            </p>
            <p className="text-[10px] text-white/80 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatEventTime(event)}
            </p>
          </div>
        </div>
      );
    }

    // Google Calendar event - original styling
    return (
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
    );
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
                {(showAllEvents ? todayEvents : todayEvents.slice(0, 3)).map((event) => renderEvent(event))}
                {todayEvents.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllEvents(!showAllEvents);
                    }}
                    className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 text-center mt-2 py-1 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
                  >
                    {showAllEvents ? (
                      <>Show less</>
                    ) : (
                      <>+{todayEvents.length - 3} more event{todayEvents.length - 3 !== 1 ? 's' : ''}</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
