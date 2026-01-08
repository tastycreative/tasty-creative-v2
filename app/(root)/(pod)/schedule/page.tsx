"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Grid3x3,
  List,
  Eye,
} from "lucide-react";
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useScheduleData } from "@/hooks/useScheduleData";
import type { ScheduledContent } from "@/types/schedule";

// Configure date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Message type color configuration
const messageTypeColors = {
  "PPV": { gradient: "from-purple-500 to-pink-500", bg: "#ddd6fe", border: "#a78bfa", text: "#581c87" },
  "PPV Follow Up": { gradient: "from-blue-500 to-cyan-500", bg: "#bfdbfe", border: "#60a5fa", text: "#1e3a8a" },
  "Sexting Set Bump": { gradient: "from-rose-500 to-red-500", bg: "#fecdd3", border: "#fb7185", text: "#881337" },
};

const typeColors = {
  "MM": { bg: "bg-indigo-500/90", text: "text-white", border: "border-indigo-600" },
  "Post": { bg: "bg-emerald-500/90", text: "text-white", border: "border-emerald-600" },
};

const statusConfig = {
  scheduled: { label: "Scheduled", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/20" },
  published: { label: "Published", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20" },
};

// Calendar event interface
interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledContent;
}

export default function SchedulePage() {
  const [filters, setFilters] = useState({
    page: undefined as string | undefined,
    message_type: undefined as "PPV" | "PPV Follow Up" | "Sexting Set Bump" | undefined,
    schedule_tab: undefined as string | undefined,
    type: undefined as "MM" | "Post" | undefined,
    search: "",
  });

  const [searchInput, setSearchInput] = useState("");
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch schedule data
  const { data, isLoading, error } = useScheduleData({
    page: filters.page,
    message_type: filters.message_type,
    schedule_tab: filters.schedule_tab,
    type: filters.type,
    search: filters.search,
  });

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Transform scheduled content into calendar events
  const events: CalendarEvent[] = useMemo(() => {
    if (!data?.items) return [];

    return data.items.map((item) => {
      // Parse date and time - handle M/D/YYYY format
      let eventDate = new Date();
      try {
        if (item.scheduledDate) {
          // Parse M/D/YYYY or MM/DD/YYYY format
          const [month, day, year] = item.scheduledDate.split('/').map(Number);
          eventDate = new Date(year, month - 1, day);

          // Add time if available
          if (item.timePST) {
            const timeMatch = item.timePST.match(/(\d+):(\d+):?(\d+)?\s*(AM|PM)/i);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const isPM = timeMatch[4].toUpperCase() === 'PM';

              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;

              eventDate.setHours(hours, minutes, 0, 0);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing date:', item.scheduledDate, e);
      }

      // Event duration (1 hour default)
      const endDate = new Date(eventDate);
      endDate.setHours(endDate.getHours() + 1);

      return {
        id: item.id,
        title: `${item.messageType} - ${item.page}`,
        start: eventDate,
        end: endDate,
        resource: item,
      };
    });
  }, [data?.items]);

  // Calculate stats from data
  const stats = useMemo(() => {
    if (!data) return { scheduled: 0, published: 0, ppv: 0, ppvFollowUp: 0, sextingSetBump: 0, mm: 0, post: 0 };

    return {
      scheduled: data.items.filter(i => i.status === 'scheduled').length,
      published: data.items.filter(i => i.status === 'published').length,
      ppv: data.stats.byMessageType['PPV'] || 0,
      ppvFollowUp: data.stats.byMessageType['PPV Follow Up'] || 0,
      sextingSetBump: data.stats.byMessageType['Sexting Set Bump'] || 0,
      mm: data.stats.byType?.['MM'] || 0,
      post: data.stats.byType?.['Post'] || 0,
    };
  }, [data]);

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const messageType = event.resource.messageType;
    const colors = messageTypeColors[messageType] || messageTypeColors["PPV"];

    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
        borderRadius: '8px',
        border: 'none',
        fontSize: '12px',
        padding: '6px 8px',
        fontWeight: '600',
      }
    };
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const content = event.resource;
    const typeColor = typeColors[content.type] || typeColors["MM"];

    return (
      <div className="text-xs leading-tight">
        <div className="font-bold truncate mb-1">{content.page}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeColor.bg} ${typeColor.text} shadow-sm`}>
            {content.type}
          </span>
          {content.price && (
            <span className="text-[10px] font-extrabold opacity-90">{content.price}</span>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading schedule data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Schedule</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load schedule data'}
          </p>
        </div>
      </div>
    );
  }

  const items = data?.items || [];

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border-b border-gray-200/50 dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-30"></div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Content Schedule
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View scheduled Mass Messages and Posts
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {items.length} events
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-7 gap-4">
            {[
              { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "from-blue-500 to-cyan-500" },
              { label: "Published", value: stats.published, icon: CheckCircle, color: "from-green-500 to-emerald-500" },
              { label: "PPV", value: stats.ppv, icon: Send, color: "from-purple-500 to-pink-500" },
              { label: "Follow Up", value: stats.ppvFollowUp, icon: Send, color: "from-blue-500 to-cyan-500" },
              { label: "Set Bump", value: stats.sextingSetBump, icon: Send, color: "from-rose-500 to-red-500" },
              { label: "Mass Messages", value: stats.mm, icon: Grid3x3, color: "from-indigo-500 to-purple-500" },
              { label: "Posts", value: stats.post, icon: List, color: "from-emerald-500 to-green-500" },
            ].map((stat, index) => (
              <div
                key={index}
                className="relative bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-white/10 overflow-hidden group hover:shadow-lg transition-all"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-10"></div>

                <div className="relative flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="xl:col-span-3 space-y-6">
            {/* Filters */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-white/10 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search captions, creators, content..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* View Toggle */}
              <div className="flex flex-wrap gap-2">
                {[
                  { view: Views.MONTH, label: 'Month' },
                  { view: Views.WEEK, label: 'Week' },
                  { view: Views.DAY, label: 'Day' },
                  { view: Views.AGENDA, label: 'Agenda' },
                ].map(({ view, label }) => (
                  <button
                    key={label}
                    onClick={() => setCalendarView(view)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      calendarView === view
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, message_type: undefined }))}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    !filters.message_type
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10"
                  }`}
                >
                  All Messages
                </button>
                {["PPV", "PPV Follow Up", "Sexting Set Bump"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilters(prev => ({ ...prev, message_type: type as any }))}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      filters.message_type === type
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, type: undefined }))}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    !filters.type
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10"
                  }`}
                >
                  All Types
                </button>
                {["MM", "Post"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilters(prev => ({ ...prev, type: type as any }))}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      filters.type === type
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Creator Filter */}
                {data?.availablePages && data.availablePages.length > 0 && (
                  <select
                    value={filters.page || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, page: e.target.value || undefined }))}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  >
                    <option value="">All Creators</option>
                    {data.availablePages.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}

                {/* Schedule Tab Filter */}
                {data?.availableScheduleTabs && data.availableScheduleTabs.length > 0 && (
                  <select
                    value={filters.schedule_tab || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, schedule_tab: e.target.value || undefined }))}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  >
                    <option value="">All Schedule Variants</option>
                    {data.availableScheduleTabs.map((tab) => (
                      <option key={tab} value={tab}>{tab}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-gray-200/50 dark:border-white/10 min-h-[600px]">
              <style jsx global>{`
                .rbc-calendar {
                  font-family: inherit;
                }
                .rbc-header {
                  padding: 14px 8px;
                  font-weight: 700;
                  color: #4b5563;
                  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
                  border-bottom: 2px solid #d1d5db;
                  text-transform: uppercase;
                  font-size: 12px;
                  letter-spacing: 0.05em;
                }
                .rbc-today {
                  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
                }
                .rbc-event {
                  padding: 6px 8px;
                  border-radius: 8px;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .rbc-toolbar {
                  margin-bottom: 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 12px;
                }
                .rbc-toolbar button {
                  padding: 10px 18px;
                  border-radius: 10px;
                  border: 2px solid #e5e7eb;
                  background: white;
                  color: #374151;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.2s;
                  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }
                .rbc-toolbar button:hover {
                  background: linear-gradient(to bottom, #fdf2f8, #fce7f3);
                  border-color: #ec4899;
                  transform: translateY(-1px);
                  box-shadow: 0 4px 6px rgba(236, 72, 153, 0.15);
                }
                .rbc-toolbar button.rbc-active {
                  background: linear-gradient(135deg, #ec4899, #8b5cf6);
                  color: white;
                  border-color: transparent;
                  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
                }
                .rbc-toolbar-label {
                  font-weight: 800;
                  font-size: 18px;
                  color: #1f2937;
                }
                .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
                  border: 2px solid #e5e7eb;
                  border-radius: 16px;
                  overflow: hidden;
                  background: white;
                }
                .rbc-month-row, .rbc-day-bg {
                  border-color: #e5e7eb;
                }
                .rbc-date-cell {
                  padding: 10px;
                  text-align: right;
                  font-weight: 600;
                  color: #1f2937;
                }
                .rbc-off-range {
                  color: #d1d5db;
                }
                .rbc-off-range-bg {
                  background: #f9fafb;
                }
                .rbc-day-slot .rbc-time-slot {
                  border-color: #f3f4f6;
                }
                .rbc-time-content {
                  border-color: #e5e7eb;
                }
                .rbc-current-time-indicator {
                  background-color: #ec4899;
                  height: 2px;
                }
              `}</style>

              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                view={calendarView}
                onView={setCalendarView}
                date={selectedDate}
                onNavigate={setSelectedDate}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: EventComponent,
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Legend */}
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Legend</h2>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message Types</div>
                {Object.entries(messageTypeColors).map(([type, colors]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg shadow-sm border-2"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border
                      }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{type}</span>
                  </div>
                ))}

                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">Content Types</div>
                {Object.entries(typeColors).map(([type, colors]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg shadow-sm ${colors.bg} border-2 ${colors.border}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Creators */}
            {data?.stats.byPage && Object.keys(data.stats.byPage).length > 0 && (
              <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Creators</h2>

                <div className="space-y-3">
                  {Object.entries(data.stats.byPage)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([name, count]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200/50 dark:border-white/10 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setFilters(prev => ({ ...prev, page: name }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                            <Send className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900 dark:text-white">
                              {name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {count} scheduled
                            </div>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-blue-500/10 rounded-2xl p-6 border border-pink-300/50 dark:border-pink-500/30">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                Read-Only View
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                This calendar displays scheduled content from your Google Sheets. Use filters to focus on specific creators, message types, or content types. Click on different views to see monthly, weekly, daily, or agenda layouts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
