"use client";

import { useState } from "react";
import { Calendar, Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import ContentDatesCalendar from "@/components/pod-new/features/content-dates/ContentDatesCalendar";
import UpcomingEventsPanel from "@/components/pod-new/features/content-dates/UpcomingEventsPanel";
import FilterControls from "@/components/pod-new/features/content-dates/FilterControls";
import CreateEventModal from "@/components/pod-new/features/content-dates/CreateEventModal";
import EventDetailModal from "@/components/pod-new/features/content-dates/EventDetailModal";

export type EventType = "PPV" | "LIVESTREAM";
export type EventStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface ContentEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  type: EventType;
  status: EventStatus;
  creator?: string;
  tags?: string[];
  price?: number;
  color: "pink" | "purple" | "blue" | "green" | "orange";
}

export default function ContentDatesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ContentEvent | null>(null);
  const [filters, setFilters] = useState({
    creator: "all",
    eventType: "all",
    status: "all",
    tags: [] as string[],
  });

  // Mock events data - Replace with API call
  const [events, setEvents] = useState<ContentEvent[]>([
    {
      id: "1",
      title: "Premium PPV Release",
      description: "Exclusive content for premium subscribers",
      date: new Date(2025, 10, 28),
      time: "8:00 PM",
      type: "PPV",
      status: "SCHEDULED",
      creator: "Model A",
      tags: ["premium", "exclusive"],
      price: 29.99,
      color: "pink",
    },
    {
      id: "2",
      title: "Live Gaming Stream",
      description: "Interactive gaming session with fans",
      date: new Date(2025, 10, 30),
      time: "6:00 PM",
      type: "LIVESTREAM",
      status: "SCHEDULED",
      creator: "Model B",
      tags: ["gaming", "interactive"],
      color: "purple",
    },
    {
      id: "3",
      title: "Q&A Livestream",
      description: "Monthly Q&A session",
      date: new Date(2025, 11, 2),
      time: "7:00 PM",
      type: "LIVESTREAM",
      status: "SCHEDULED",
      creator: "Model A",
      tags: ["q&a", "monthly"],
      color: "blue",
    },
  ]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (event: ContentEvent) => {
    setSelectedEvent(event);
  };

  const handleCreateEvent = (eventData: Partial<ContentEvent>) => {
    const newEvent: ContentEvent = {
      id: Date.now().toString(),
      title: eventData.title || "New Event",
      description: eventData.description,
      date: eventData.date || new Date(),
      time: eventData.time,
      type: eventData.type || "PPV",
      status: eventData.status || "SCHEDULED",
      creator: eventData.creator,
      tags: eventData.tags || [],
      price: eventData.price,
      color: eventData.color || "pink",
    };
    setEvents([...events, newEvent]);
    setIsCreateModalOpen(false);
    setSelectedDate(null);
  };

  // Filter events based on active filters
  const filteredEvents = events.filter((event) => {
    if (filters.creator !== "all" && event.creator !== filters.creator) return false;
    if (filters.eventType !== "all" && event.type !== filters.eventType) return false;
    if (filters.status !== "all" && event.status !== filters.status) return false;
    if (filters.tags.length > 0 && !filters.tags.some(tag => event.tags?.includes(tag))) return false;
    return true;
  });

  const upcomingEvents = filteredEvents
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
              Content Dates
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              Plan, track, and execute all PPVs and Livestreams with full visibility
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Event</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <FilterControls
        filters={filters}
        onFiltersChange={setFilters}
        creators={Array.from(new Set(events.map(e => e.creator).filter(Boolean)))}
        tags={Array.from(new Set(events.flatMap(e => e.tags || [])))}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Calendar Section - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30 dark:opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            </div>

            {/* Calendar Header */}
            <div className="relative z-10 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    <Calendar className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="relative z-10 p-6">
              <ContentDatesCalendar
                currentDate={currentDate}
                events={filteredEvents}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </div>
          </div>
        </div>

        {/* Upcoming Events Panel - Takes 1 column */}
        <div className="lg:col-span-1">
          <UpcomingEventsPanel
            events={upcomingEvents}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedDate(null);
        }}
        onSubmit={handleCreateEvent}
        prefilledDate={selectedDate}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
