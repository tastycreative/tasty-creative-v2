"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  User,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicCalendarEvents } from "@/app/services/google-calendar-implementation";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import {
  formatForDisplay,
} from "@/lib/dateUtils";
import { DateTime } from 'luxon';

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<DateTime | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEventDetail, setIsLoadingEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>("");

  // Ensure we detect the browser timezone on the client (e.g., Asia/Manila)
  useEffect(() => {
    try {
      const tz = Intl?.DateTimeFormat?.().resolvedOptions().timeZone;
      if (tz) setUserTimezone(tz);
      else setUserTimezone(DateTime.local().zoneName || "UTC");
    } catch (err) {
      setUserTimezone(DateTime.local().zoneName || "UTC");
    }
  }, []);

  // Use a stable timezone value (fallback to Intl if state not set)
  const tz = userTimezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : DateTime.local().zoneName || 'UTC');

  // Helper function to format date in user's timezone using Luxon
  const formatDateInUserTimezone = (dateString: string, isAllDay = false) => {
    if (isAllDay) {
      // For all-day events, parse as date only in user's timezone to avoid shifting
      const dt = DateTime.fromISO(dateString, { zone: tz });
      return dt.toLocaleString({
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    // For timed events, convert from UTC to user's timezone
    return formatForDisplay(dateString, 'datetime', userTimezone);
  };

  // Helper function to get time string in user's timezone using Luxon
  const getTimeStringInUserTimezone = (dateString: string, raw?: any) => {
    // For content events with a separate time field, use that instead
    if (raw?.time) {
      const time = raw.time;
      // Convert 24h time to 12h format
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }

    // For Google Calendar events, use the datetime
  const dt = DateTime.fromISO(dateString).setZone(tz);
    return dt.toLocaleString(DateTime.TIME_SIMPLE);
  };

  // Helper function to parse event date properly for calendar positioning
  const parseEventDate = (dateString: string, isAllDay: boolean) => {
    if (isAllDay) {
      // For all-day events, parse in user's timezone to keep the date stable
      return DateTime.fromISO(dateString, { zone: tz });
    } else {
      // For timed events, parse as UTC then convert to user's timezone
      return DateTime.fromISO(dateString, { zone: 'utc' }).setZone(tz);
    }
  };

  // Helper to get initials (used for content events)
  const getInitials = (name: any) => {
    if (!name && name !== 0) return "?";
    let str = "";
    if (typeof name === 'string') str = name;
    else if (typeof name === 'object' && name !== null) {
      // try common fields
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

  const handleViewEventDetails = async (eventId: string) => {
    try {
      setIsLoadingEventDetail(true);

      // Find the event in the current events array
      const existingEvent = calendarEvents.find(
        (event) => event.id === eventId
      );

      if (existingEvent) {
        setSelectedEvent(existingEvent);
        setIsEventDetailOpen(true);
      } else {
        setCalendarError("Event not found");
      }
    } catch (error) {
      console.error("Error viewing event details:", error);
      setCalendarError("Failed to load event details");
    } finally {
      setIsLoadingEventDetail(false);
    }
  };

  useEffect(() => {
    const loadCalendarEventsForMonth = async () => {

      // Clear events first to avoid stale data being displayed
      setCalendarEvents([]);
      setIsCalendarLoading(true);
      setCalendarError("");

      // Use Luxon for proper month calculation in user's timezone
      const currentMonth = DateTime.fromJSDate(selectedDate).setZone(userTimezone);
      const startDate = currentMonth.startOf('month').toJSDate();
      const endDate = currentMonth.endOf('month').toJSDate();

      try {
        // Always use the public calendar API without checking authentication
        const googleEvents = (await getPublicCalendarEvents(startDate, endDate)) || [];

        // Filter out events that have "Call" in the title (applies to Google events)
        const filteredGoogleEvents = googleEvents.filter(
          (event) => !event.summary?.toLowerCase().includes("call")
        );

        // Fetch content-dates events from our API and transform to calendar-like shape
        let contentEvents: any[] = [];
        try {
          const resp = await fetch(`/api/content-events?includeDeleted=true`);
          if (resp.ok) {
            const data = await resp.json();
            const items = data.events || data || [];

            // Keep only events that fall inside the requested month range
            contentEvents = (items || [])
              .map((ev: any) => {
                if (!ev.date) return null;

                // Normalize date using Luxon in the user's timezone to prevent day shifts
                // If the event has a time field, treat it as a timed event; otherwise treat as all-day
                const hasTime = !!ev.time;
                try {
                  if (hasTime) {
                    // Combine date + time into an ISO string then convert to user's timezone
                    // ev.date may already be an ISO datetime, but be defensive
                    const combined = ev.time && ev.date && !ev.date.includes('T') ? `${ev.date}T${ev.time}` : ev.date;
                    const dt = DateTime.fromISO(combined, { zone: userTimezone });
                    return {
                      id: `content-${ev.id}`,
                      summary: ev.title || ev.summary || "(No title)",
                      description: ev.description,
                      location: ev.flyerLink || ev.location,
                      start: { dateTime: dt.toISO() },
                      end: { dateTime: dt.plus({ minutes: 60 }).toISO() },
                      _raw: ev,
                      source: "content",
                    };
                  } else {
                    // All-day event: parse date in user's timezone and store date-only (YYYY-MM-DD)
                    const dt = DateTime.fromISO(ev.date, { zone: userTimezone });
                    const isoDateOnly = dt.toISODate(); // YYYY-MM-DD
                    return {
                      id: `content-${ev.id}`,
                      summary: ev.title || ev.summary || "(No title)",
                      description: ev.description,
                      location: ev.flyerLink || ev.location,
                      start: { date: isoDateOnly },
                      end: { date: isoDateOnly },
                      _raw: ev,
                      source: "content",
                    };
                  }
                } catch (err) {
                  console.warn('Failed to parse content event date', ev, err);
                  return null;
                }
              })
              .filter(Boolean) as any[];
          } else {
            console.warn("Failed to fetch content events: ", resp.status);
          }
        } catch (err) {
          console.error("Error fetching content events:", err);
        }

        // Merge Google events and content events so they coexist
        const merged = [...filteredGoogleEvents, ...contentEvents];

        // Update state with merged events
        setCalendarEvents(merged);
      } catch (error) {
        console.error("Error loading calendar events:", error);
        setCalendarError("Failed to load events from calendar.");
      } finally {
        setIsCalendarLoading(false);
      }
    };

    loadCalendarEventsForMonth();
  }, [selectedDate, userTimezone]);

  const renderMeetingLinks = (
    conferenceData: EventConferenceData | undefined
  ) => {
    if (!conferenceData || !conferenceData.entryPoints) return null;

    return (
      <div className="mt-3 space-y-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Meeting Links:</h4>
        {conferenceData.entryPoints.map((entry, index) => (
          <a
            key={index}
            href={entry.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            {entry.entryPointType === "video" && (
              <Video size={14} className="mr-1" />
            )}
            {entry.entryPointType === "phone" && (
              <Phone size={14} className="mr-1" />
            )}
            {entry.entryPointType === "more" && (
              <MoreHorizontal size={14} className="mr-1" />
            )}
            {entry.label || entry.entryPointType}
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendar - 3/4 */}
      <div className="lg:col-span-3">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
          {/* Radial pattern overlay */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />

          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                  <CalendarIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {DateTime.fromJSDate(selectedDate).setZone(tz).toLocaleString({ month: "long", year: "numeric" })}
                  </h2>
                  <span className="text-xs ml-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-blue-700 dark:text-blue-300 font-medium">
                    {tz}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {calendarEvents.length} event{calendarEvents.length !== 1 ? 's' : ''} this month
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7">
                {(() => {
                  const days = [];
                  const monthStart = DateTime.fromJSDate(selectedDate).setZone(userTimezone).startOf('month');
                  const monthEnd = monthStart.endOf('month');
                  const startDay = monthStart.weekday % 7;
                  const lastDay = monthEnd.day;
                  const today = DateTime.now().setZone(userTimezone);

                  // Empty cells before month starts
                  for (let i = 0; i < startDay; i++) {
                    days.push(
                      <div key={'empty-' + i} className="min-h-[100px] md:min-h-[120px] border-b border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/20" />
                    );
                  }

                  // Days of the month
                  for (let i = 1; i <= lastDay; i++) {
                    const currentDate = monthStart.set({ day: i });
                    const isToday = currentDate.day === today.day && currentDate.month === today.month && currentDate.year === today.year;
                    const isSelected = selectedDayDate && currentDate.day === selectedDayDate.day && currentDate.month === selectedDayDate.month && currentDate.year === selectedDayDate.year;

                    const dayEvents = calendarEvents.filter((event) => {
                      const eventDateString = event.start.dateTime || event.start.date;
                      if (!eventDateString) return false;
                      const isAllDay = !!event.start.date;
                      const eventDate = parseEventDate(eventDateString, isAllDay);
                      return eventDate.day === i && eventDate.month === currentDate.month && eventDate.year === currentDate.year;
                    });

                    days.push(
                      <div
                        key={i}
                        onClick={(e) => {
                          // Don't select day if clicking on an event button
                          if ((e.target as HTMLElement).closest('button')) return;
                          setSelectedDayDate(currentDate);
                        }}
                        className={'min-h-[100px] md:min-h-[120px] border-b border-r border-gray-200/50 dark:border-gray-700/50 p-2 cursor-pointer transition-all hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-purple-50/50 dark:hover:from-pink-900/10 dark:hover:to-purple-900/10 ' + (isToday ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 ' : '') + (isSelected ? 'ring-2 ring-pink-500 dark:ring-pink-400 ring-inset' : '')}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className={'inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full ' + (isToday ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : 'text-gray-700 dark:text-gray-300')}>
                            {i}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Events - max 2 shown, rest indicated with count */}
                        <div className="space-y-1 mt-2">
                          {dayEvents.slice(0, 2).map((event, idx) => {
                            // If this is a content-dates event, render with content styling
                            if ((event as any).source === "content") {
                              const raw = (event as any)._raw || {};
                              const colorClasses: Record<string, string> = {
                                pink: "bg-pink-500/80 hover:bg-pink-500",
                                purple: "bg-purple-500/80 hover:bg-purple-500",
                                blue: "bg-blue-500/80 hover:bg-blue-500",
                                green: "bg-green-500/80 hover:bg-green-500",
                                orange: "bg-orange-500/80 hover:bg-orange-500",
                              };

                              const badgeClass = raw.deletedAt ? 'bg-gray-400/80 hover:bg-gray-400 opacity-60' : (colorClasses[raw.color] || 'bg-pink-500/80');

                              return (
                                <button
                                  key={idx}
                                  className={`w-full text-left text-xs px-2 py-1 rounded text-white font-medium transition-colors flex items-center gap-1.5 ${badgeClass}`}
                                  title={raw.title || event.summary}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // open content event detail by id (prefixed)
                                    if (event.id) handleViewEventDetails(event.id);
                                  }}
                                >
                                  {/* Profile */}
                                  {getCreatorProfilePicture(raw) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={getCreatorProfilePicture(raw)!} alt={getCreatorName(raw) || 'Creator'} className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-white/50" />
                                  ) : (
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-[8px] font-bold border border-white/50 flex-shrink-0">{getInitials(getCreatorName(raw))}</div>
                                  )}

                                  <span className="truncate">{(raw.type ? `${raw.type} - ` : '') + getCreatorName(raw)}</span>
                                </button>
                              );
                            }

                            // default: Google event styling
                            return (
                              <button
                                key={idx}
                                className="w-full text-left text-xs px-2 py-1 rounded border border-pink-300 dark:border-pink-500/50 bg-pink-500/20 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 truncate hover:bg-pink-500/30 dark:hover:bg-pink-500/40 transition-colors"
                                title={event.summary}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (event.id) handleViewEventDetails(event.id);
                                }}
                                disabled={!event.id}
                              >
                                {event.summary}
                              </button>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <button
                              className="w-full text-left text-xs text-gray-500 dark:text-gray-400 px-2 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDayDate(currentDate);
                              }}
                            >
                              +{dayEvents.length - 2} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Panel - 1/4 */}
      <div className="lg:col-span-1 space-y-4">
        {/* Selected Date Events */}
        {selectedDayDate && (() => {
          const selectedDateEvents = calendarEvents.filter((event) => {
            const eventDateStr = event.start.dateTime || event.start.date;
            if (!eventDateStr) return false;
            const isAllDay = !!event.start.date;
            const eventDate = parseEventDate(eventDateStr, isAllDay);
            return eventDate.day === selectedDayDate.day && eventDate.month === selectedDayDate.month && eventDate.year === selectedDayDate.year;
          });

          if (selectedDateEvents.length === 0) return null;

          return (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
              <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />
              <div className="relative z-10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {selectedDayDate.toLocaleString({ month: 'short', day: 'numeric' })}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedDayDate(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {selectedDateEvents.map((event, index) => {
                    const eventDateStr = event.start.dateTime || event.start.date;
                    if (!eventDateStr) return null;
                    const isAllDay = !!event.start.date;

                    // content event
                    if ((event as any).source === 'content') {
                      const raw = (event as any)._raw || {};
                      const timeStr = isAllDay ? "All day" : getTimeStringInUserTimezone(eventDateStr, raw);
                      const colorClasses: Record<string, string> = {
                        pink: "bg-pink-500/80 hover:bg-pink-500",
                        purple: "bg-purple-500/80 hover:bg-purple-500",
                        blue: "bg-blue-500/80 hover:bg-blue-500",
                        green: "bg-green-500/80 hover:bg-green-500",
                        orange: "bg-orange-500/80 hover:bg-orange-500",
                      };

                      const badgeClass = raw.deletedAt ? 'bg-gray-400/80 hover:bg-gray-400 opacity-60' : (colorClasses[raw.color] || 'bg-pink-500/80');

                      return (
                        <button
                          key={index}
                          className={`w-full group p-3 rounded-xl ${badgeClass} text-white transition-all cursor-pointer text-left`}
                          onClick={() => event.id ? handleViewEventDetails(event.id) : undefined}
                          disabled={!event.id}
                        >
                          <div className="flex items-start gap-3">
                            {getCreatorProfilePicture(raw) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={getCreatorProfilePicture(raw)!} alt={getCreatorName(raw) || 'Creator'} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white/50" />
                            ) : (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white text-xs font-bold border-2 border-white/50 flex-shrink-0">{getInitials(getCreatorName(raw))}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold truncate">{raw.type ? `${raw.type} - ` : ''}{getCreatorName(raw)}</h4>
                              {raw.title && <div className="text-xs opacity-90 mt-0.5 truncate">{raw.title}</div>}
                              <div className="flex items-center gap-1 mt-1 text-xs text-white/90">
                                <Clock className="h-3 w-3" />
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    }

                    // default google event
                    const timeStr = isAllDay ? "All day" : getTimeStringInUserTimezone(eventDateStr);
                    return (
                      <button
                        key={index}
                        className="w-full group p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all cursor-pointer hover:border-pink-300 dark:hover:border-pink-500/50 text-left"
                        onClick={() => event.id ? handleViewEventDetails(event.id) : undefined}
                        disabled={!event.id}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-pink-500" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                              {event.summary}
                            </h4>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{timeStr}</span>
                            </div>
                            {event.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Today's Events */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Today</h3>
            </div>
            <div className="space-y-2">
              {isCalendarLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 size={24} className="animate-spin text-pink-500" />
                </div>
              ) : (() => {
                const today = DateTime.now().setZone(userTimezone);
                const todayEvents = calendarEvents.filter((event) => {
                  const eventDateStr = event.start.dateTime || event.start.date;
                  if (!eventDateStr) return false;
                  const isAllDay = !!event.start.date;
                  const eventDate = parseEventDate(eventDateStr, isAllDay);
                  return eventDate.day === today.day && eventDate.month === today.month && eventDate.year === today.year;
                });

                return todayEvents.length > 0 ? (
                  todayEvents.map((event, index) => {
                    const eventDateStr = event.start.dateTime || event.start.date;
                    if (!eventDateStr) return null;
                    const isAllDay = !!event.start.date;

                    if ((event as any).source === 'content') {
                      const raw = (event as any)._raw || {};
                      const timeStr = isAllDay ? "All day" : getTimeStringInUserTimezone(eventDateStr, raw);
                      const colorClasses: Record<string, string> = {
                        pink: "bg-pink-500/80 hover:bg-pink-500",
                        purple: "bg-purple-500/80 hover:bg-purple-500",
                        blue: "bg-blue-500/80 hover:bg-blue-500",
                        green: "bg-green-500/80 hover:bg-green-500",
                        orange: "bg-orange-500/80 hover:bg-orange-500",
                      };
                      const badgeClass = raw.deletedAt ? 'bg-gray-400/80 hover:bg-gray-400 opacity-60' : (colorClasses[raw.color] || 'bg-pink-500/80');

                      return (
                        <button
                          key={index}
                          className={`w-full group p-3 rounded-xl ${badgeClass} text-white transition-all cursor-pointer text-left`}
                          onClick={() => event.id ? handleViewEventDetails(event.id) : undefined}
                          disabled={!event.id}
                        >
                          <div className="flex items-start gap-3">
                            {getCreatorProfilePicture(raw) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={getCreatorProfilePicture(raw)!} alt={getCreatorName(raw) || 'Creator'} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white/50" />
                            ) : (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white text-xs font-bold border-2 border-white/50 flex-shrink-0">{getInitials(getCreatorName(raw))}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold truncate">{raw.type ? `${raw.type} - ` : ''}{getCreatorName(raw)}</h4>
                              {raw.title && <div className="text-xs opacity-90 mt-0.5 truncate">{raw.title}</div>}
                              <div className="flex items-center gap-1 mt-1 text-xs text-white/90">
                                <Clock className="h-3 w-3" />
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    }

                    const timeStr = isAllDay ? "All day" : getTimeStringInUserTimezone(eventDateStr);
                    return (
                      <button
                        key={index}
                        className="w-full group p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all cursor-pointer hover:border-pink-300 dark:hover:border-pink-500/50 text-left"
                        onClick={() => event.id ? handleViewEventDetails(event.id) : undefined}
                        disabled={!event.id}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-pink-500" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                              {event.summary}
                            </h4>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{timeStr}</span>
                            </div>
                            {event.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No events today</p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Upcoming</h3>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {isCalendarLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 size={24} className="animate-spin text-pink-500" />
                </div>
              ) : (() => {
                const today = DateTime.now().setZone(userTimezone);
                const upcomingEvents = calendarEvents
                  .filter((event) => {
                    const eventDateStr = event.start.dateTime || event.start.date;
                    if (!eventDateStr) return false;
                    const isAllDay = !!event.start.date;
                    const eventDate = parseEventDate(eventDateStr, isAllDay);
                    return eventDate > today;
                  })
                  .sort((a, b) => {
                    const dateAStr = a.start.dateTime || a.start.date;
                    const dateBStr = b.start.dateTime || b.start.date;
                    if (!dateAStr || !dateBStr) return 0;
                    const dateA = DateTime.fromISO(dateAStr);
                    const dateB = DateTime.fromISO(dateBStr);
                    return dateA.toMillis() - dateB.toMillis();
                  })
                  .slice(0, 5);

                return upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, index) => {
                    const eventDateStr = event.start.dateTime || event.start.date;
                    if (!eventDateStr) return null;
                    const isAllDay = !!event.start.date;
                    const eventDate = parseEventDate(eventDateStr, isAllDay);

                    if ((event as any).source === 'content') {
                      const raw = (event as any)._raw || {};
                      const timeStr = isAllDay ? "All day" : getTimeStringInUserTimezone(eventDateStr, raw);
                      const colorClasses: Record<string, string> = {
                        pink: "bg-pink-500/80 hover:bg-pink-500",
                        purple: "bg-purple-500/80 hover:bg-purple-500",
                        blue: "bg-blue-500/80 hover:bg-blue-500",
                        green: "bg-green-500/80 hover:bg-green-500",
                        orange: "bg-orange-500/80 hover:bg-orange-500",
                      };
                      const badgeClass = raw.deletedAt ? 'bg-gray-400/80 hover:bg-gray-400 opacity-60' : (colorClasses[raw.color] || 'bg-pink-500/80');

                      return (
                        <div key={index}>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                            {eventDate.toLocaleString({ month: 'short', day: 'numeric' })}
                          </p>
                          <button
                            className={`w-full group p-3 rounded-xl ${badgeClass} text-white transition-all cursor-pointer text-left`}
                            onClick={() => event.id ? handleViewEventDetails(event.id) : undefined}
                            disabled={!event.id}
                          >
                            <div className="flex items-start gap-3">
                              {getCreatorProfilePicture(raw) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getCreatorProfilePicture(raw)!} alt={getCreatorName(raw) || 'Creator'} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white/50" />
                              ) : (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white text-xs font-bold border-2 border-white/50 flex-shrink-0">{getInitials(getCreatorName(raw))}</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold truncate">{raw.type ? `${raw.type} - ` : ''}{getCreatorName(raw)}</h4>
                                {raw.title && <div className="text-xs opacity-90 mt-0.5 truncate">{raw.title}</div>}
                                <div className="flex items-center gap-1 mt-1 text-xs text-white/90">
                                  <Clock className="h-3 w-3" />
                                  <span>{timeStr}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    }

                    const timeStr = isAllDay ? "All day" : getTimeStringInUserTimezone(eventDateStr);
                    return (
                      <div key={index}>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                          {eventDate.toLocaleString({ month: 'short', day: 'numeric' })}
                        </p>
                        <button
                          className="w-full group p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all cursor-pointer hover:border-pink-300 dark:hover:border-pink-500/50 text-left"
                          onClick={() => event.id ? handleViewEventDetails(event.id) : undefined}
                          disabled={!event.id}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-purple-500" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                {event.summary}
                              </h4>
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>{timeStr}</span>
                              </div>
                              {event.location && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Error display */}
        {calendarError && (
          <Alert
            variant="destructive"
            className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300"
          >
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{calendarError}</AlertDescription>
          </Alert>
        )}
      </div>

      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]
      bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20
      backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 text-gray-800 dark:text-gray-200
      w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-4xl
      h-[90vh] max-h-[90vh]
      rounded-2xl shadow-2xl overflow-hidden flex flex-col
      z-50"
        >
          {/* Radial pattern overlay */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />

          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            {isLoadingEventDetail ? (
              <div className="flex justify-center items-center flex-1">
                <Loader2 size={36} className="animate-spin text-pink-500" />
              </div>
            ) : selectedEvent ? (
              <>
                <DialogHeader className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent flex items-start gap-3">
                    <span className="mr-2">{selectedEvent.summary}</span>
                  {selectedEvent.colorId && (
                    <div
                      className="w-4 h-4 rounded-full mt-2 flex-shrink-0"
                      style={{
                        backgroundColor:
                          selectedEvent.colorId === "1"
                            ? "#7986cb"
                            : selectedEvent.colorId === "2"
                              ? "#33b679"
                              : selectedEvent.colorId === "3"
                                ? "#8e24aa"
                                : selectedEvent.colorId === "4"
                                  ? "#e67c73"
                                  : selectedEvent.colorId === "5"
                                    ? "#f6c026"
                                    : selectedEvent.colorId === "6"
                                      ? "#f5511d"
                                      : selectedEvent.colorId === "7"
                                        ? "#039be5"
                                        : selectedEvent.colorId === "8"
                                          ? "#616161"
                                          : selectedEvent.colorId === "9"
                                            ? "#3f51b5"
                                            : selectedEvent.colorId === "10"
                                              ? "#0b8043"
                                              : selectedEvent.colorId === "11"
                                                ? "#d50000"
                                                : "#4285f4",
                      }}
                    />
                  )}
                </DialogTitle>

                <div className="mt-2">
                  {selectedEvent.status === "confirmed" ? (
                    <span className="inline-flex items-center bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300 text-xs px-3 py-1 rounded-full border border-green-300 dark:border-green-500/50">
                      <Check size={12} className="mr-1" /> Confirmed
                    </span>
                  ) : selectedEvent.status === "cancelled" ? (
                    <span className="inline-flex items-center bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-300 text-xs px-3 py-1 rounded-full border border-red-300 dark:border-red-500/50">
                      <X size={12} className="mr-1" /> Cancelled
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-300 dark:border-yellow-500/50">
                      <Clock size={12} className="mr-1" /> Tentative
                    </span>
                  )}
                </div>
              </DialogHeader>
              <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-2">
                {/* Date and Time */}
                <div className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                      <CalendarIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Date & Time</h3>
                  </div>
                  <div>
                        {selectedEvent.start.date ? (
                          // All-day event
                          <p className="text-gray-800 dark:text-gray-200 text-lg">
                            {formatDateInUserTimezone(selectedEvent.start.date, true)}
                            {selectedEvent.end &&
                              selectedEvent.end.date &&
                              new Date(
                                selectedEvent.start.date
                              ).toDateString() !==
                                new Date(
                                  selectedEvent.end.date
                                ).toDateString() && (
                                <>
                                  {" "}
                                  to{" "}
                                  {formatDateInUserTimezone(selectedEvent.end.date, true)}
                                </>
                              )}
                            <span className="ml-2 text-xs bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-500/50">
                              All day
                            </span>
                          </p>
                        ) : (
                          // Timed event
                          <p className="text-gray-800 dark:text-gray-200 text-lg">
                            {selectedEvent.start.dateTime && formatDateInUserTimezone(selectedEvent.start.dateTime)}
                            {selectedEvent.end &&
                              selectedEvent.end.dateTime && (
                                <>
                                  {" "}
                                  to{" "}
                                  {formatDateInUserTimezone(selectedEvent.end.dateTime)}
                                </>
                              )}
                          </p>
                        )}
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Timezone: {userTimezone}
                        </div>
                  </div>
                </div>

                {/* Google Drive Link */}
                {selectedEvent.description &&
                  (() => {
                    const driveMatch = selectedEvent.description.match(
                      /WebView Link:\s*https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/[^\s]+/i
                    );
                    const fileId = driveMatch && driveMatch[1];

                    if (!fileId) return null;

                    const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
                    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

                    return (
                      <div className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                            <FileText className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">File Preview</h3>
                        </div>
                        <div>
                          <div className="w-full">
                            <div className="relative w-full pb-[56.25%] overflow-hidden rounded-lg bg-white/80 dark:bg-gray-800/80 border border-pink-200 dark:border-pink-500/30 mb-3">
                              <iframe
                                src={embedUrl}
                                className="absolute top-0 left-0 w-full h-full"
                                style={{ border: 0 }}
                                allowFullScreen
                                title="Google Drive File Preview"
                              ></iframe>
                            </div>

                            <a
                              href={driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-full py-2 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-lg transition-colors"
                            >
                              <ExternalLink size={16} className="mr-2" />
                              Open in Google Drive
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* Description */}
                {selectedEvent.description && (
                  <div className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                        <FileText className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Description</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: selectedEvent.description
                              .replace(/Thumbnail:\s*https:\/\/[^\n]+\n?/gi, "")
                              .replace(
                                /WebView Link:\s*https:\/\/[^\n]+\n?/gi,
                                ""
                              )
                              .replace(/Model:\s*[^\n]+\n?/gi, "")
                              .replace(
                                /(https?:\/\/[^\s]+)/g,
                                '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 break-all">$1</a>'
                              )
                              .replace(/\n/g, "<br />"),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Location */}
                {selectedEvent.location && (
                  <div className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                        <MapPin className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Location</h3>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200">{selectedEvent.location}</p>
                  </div>
                )}

                {/* Conference Data */}
                {selectedEvent.conferenceData && (
                  <div className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                        <Video className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Virtual Meeting</h3>
                    </div>
                    <div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">
                        {selectedEvent.conferenceData.conferenceSolution
                          ?.name || "Virtual Meeting"}
                      </p>
                      {renderMeetingLinks(selectedEvent.conferenceData)}
                    </div>
                  </div>
                )}

                {/* Attendees */}
                {selectedEvent.attendees &&
                  selectedEvent.attendees.length > 0 && (
                    <div className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                          <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Attendees ({selectedEvent.attendees.length})</h3>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <ul className="space-y-3">
                          {selectedEvent.attendees.map((attendee, index) => (
                            <li
                              key={index}
                              className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border border-pink-100 dark:border-pink-500/30"
                            >
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3">
                                  <span className="text-xs font-bold text-white">
                                    {attendee.displayName
                                      ? attendee.displayName[0].toUpperCase()
                                      : attendee.email[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                                    {attendee.displayName || attendee.email}
                                  </span>
                                  <div className="flex gap-1 mt-1">
                                    {attendee.organizer && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                                        Organizer
                                      </span>
                                    )}
                                    {attendee.self && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  attendee.responseStatus === "accepted"
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : attendee.responseStatus === "declined"
                                      ? "bg-red-100 text-red-700 border border-red-200"
                                      : attendee.responseStatus === "tentative"
                                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                        : "bg-gray-100 text-gray-700 border border-gray-200"
                                }`}
                              >
                                {attendee.responseStatus === "accepted"
                                  ? "Accepted"
                                  : attendee.responseStatus === "declined"
                                    ? "Declined"
                                    : attendee.responseStatus === "tentative"
                                      ? "Maybe"
                                      : "Pending"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                {/* Creator/Organizer */}
                {(selectedEvent.creator || selectedEvent.organizer) && (
                  <div className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                        <User className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Created by</h3>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedEvent.creator?.displayName ||
                        selectedEvent.creator?.email ||
                        selectedEvent.organizer?.displayName ||
                        selectedEvent.organizer?.email ||
                        "Unknown"}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center flex-shrink-0">
                {selectedEvent.htmlLink && (
                    <a
                      href={selectedEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink size={14} className="mr-2" /> View in Google
                      Calendar
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <CalendarIcon
                  size={48}
                  className="mx-auto text-gray-500 opacity-50 mb-4"
                />
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Event details not available
                </p>
                <DialogClose asChild>
                  <Button className="mt-6 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white border-0">
                    Close
                  </Button>
                </DialogClose>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
