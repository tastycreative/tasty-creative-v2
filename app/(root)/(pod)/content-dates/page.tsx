"use client";

import { useState, useEffect } from "react";
import { Calendar, Filter, Plus, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
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
  creatorProfilePicture?: string;
  tags?: string[];
  price?: number;
  color: "pink" | "purple" | "blue" | "green" | "orange";
  // Optional extended fields for PPV / Livestream
  contentLink?: string;
  editedVideoLink?: string;
  flyerLink?: string;
  liveType?: "PUBLIC" | "SUBSCRIBERS";
  // Additional fields
  notes?: string;
  attachments?: any;
  deletedAt?: Date | null;
}

export default function ContentDatesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ContentEvent | null>(null);
  const [showDeleted, setShowDeleted] = useState(true);
  const [filters, setFilters] = useState({
    creator: "all",
    eventType: "all",
    status: "all",
    tags: [] as string[],
  });
  const [events, setEvents] = useState<ContentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events from database
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.creator !== "all") queryParams.set("creator", filters.creator);
      if (filters.eventType !== "all") queryParams.set("eventType", filters.eventType);
      if (filters.status !== "all") queryParams.set("status", filters.status);
      if (filters.tags.length > 0) queryParams.set("tags", filters.tags.join(","));
      if (showDeleted) queryParams.set("includeDeleted", "true");

      const response = await fetch(`/api/content-events?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match ContentEvent interface
        const transformedEvents = data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: new Date(event.date),
          time: event.time,
          type: event.type,
          status: event.status,
          creator: event.creator?.clientName,
          creatorProfilePicture: event.creator?.profilePicture,
          tags: event.tags,
          price: event.price,
          color: event.color.toLowerCase() as ContentEvent["color"],
          contentLink: event.contentLink,
          editedVideoLink: event.editedVideoLink,
          flyerLink: event.flyerLink,
          liveType: event.liveType,
          notes: event.notes,
          attachments: event.attachments,
          deletedAt: event.deletedAt ? new Date(event.deletedAt) : null,
        }));
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events on mount and when filters or showDeleted change
  useEffect(() => {
    fetchEvents();
  }, [filters, showDeleted]);

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

  const handleCreateEvent = async (eventData: Partial<ContentEvent>) => {
    try {
      const response = await fetch("/api/content-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          type: eventData.type,
          status: eventData.status || "SCHEDULED",
          creator: eventData.creator,
          tags: eventData.tags || [],
          price: eventData.price,
          color: eventData.color?.toUpperCase() || "PINK",
          contentLink: eventData.contentLink,
          editedVideoLink: eventData.editedVideoLink,
          flyerLink: eventData.flyerLink,
          liveType: eventData.liveType,
          notes: eventData.notes,
          attachments: eventData.attachments,
        }),
      });

      if (response.ok) {
        // Refresh events list
        await fetchEvents();
        setIsCreateModalOpen(false);
        setSelectedDate(null);
      } else {
        console.error("Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: Partial<ContentEvent>) => {
    try {
      const response = await fetch(`/api/content-events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: eventData.date,
          time: eventData.time,
          type: eventData.type,
          creator: eventData.creator,
          tags: eventData.tags || [],
          price: eventData.price,
          color: eventData.color?.toUpperCase(),
          contentLink: eventData.contentLink,
          editedVideoLink: eventData.editedVideoLink,
          flyerLink: eventData.flyerLink,
          liveType: eventData.liveType,
          notes: eventData.notes,
          attachments: eventData.attachments,
        }),
      });

      if (response.ok) {
        // Refresh events list
        await fetchEvents();
        // Close the modal by clearing selected event
        setSelectedEvent(null);
      } else {
        console.error("Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/content-events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh events list
        await fetchEvents();
        // Close the modal by clearing selected event
        setSelectedEvent(null);
      } else {
        console.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  };

  const handleRestoreEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/content-events/${eventId}/restore`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh events list
        await fetchEvents();
        // Close the modal by clearing selected event
        setSelectedEvent(null);
      } else {
        console.error("Failed to restore event");
      }
    } catch (error) {
      console.error("Error restoring event:", error);
      throw error;
    }
  };

  const handlePermanentDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/content-events/${eventId}/permanent-delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh events list
        await fetchEvents();
        // Close the modal by clearing selected event
        setSelectedEvent(null);
      } else {
        const errorData = await response.json();
        console.error("Failed to permanently delete event:", errorData.error);
        alert(errorData.error || "Failed to permanently delete event");
      }
    } catch (error) {
      console.error("Error permanently deleting event:", error);
      throw error;
    }
  };

  // Events are already filtered by the API
  const filteredEvents = events;

  const upcomingEvents = events
    .filter(event => {
      // Filter by date (must be in the future)
      if (event.date < new Date()) return false;
      // If showDeleted is false, exclude deleted events
      if (!showDeleted && event.deletedAt) return false;
      return true;
    })
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`inline-flex items-center justify-center p-2 rounded-xl font-semibold transition-all ${
                showDeleted
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={showDeleted ? 'Hide deleted events' : 'Show deleted events'}
            >
              {showDeleted ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
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
      </div>

      {/* Filter Controls */}
      <FilterControls
        filters={filters}
        onFiltersChange={setFilters}
        creators={Array.from(new Set(events.map(e => e.creator).filter((c): c is string => Boolean(c))))}
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
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h2>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-blue-700 dark:text-blue-300 font-medium">
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </span>
                    </div>
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
              {isLoading ? (
                <div className="space-y-4">
                  {/* Calendar Header Skeleton - Days of Week */}
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center py-2">
                        <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse"></div>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid Skeleton */}
                  <div className="grid grid-cols-7 gap-2">
                    {[...Array(35)].map((_, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="min-h-[100px] md:min-h-[120px] p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 space-y-2"
                      >
                        {/* Day number skeleton */}
                        <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                        {/* Event badges skeleton - random number of events per day */}
                        {dayIndex % 3 === 0 && (
                          <div className="space-y-1">
                            <div className="h-6 w-full bg-pink-200 dark:bg-pink-900/30 rounded animate-pulse"></div>
                            {dayIndex % 2 === 0 && (
                              <div className="h-6 w-full bg-purple-200 dark:bg-purple-900/30 rounded animate-pulse"></div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ContentDatesCalendar
                  currentDate={currentDate}
                  events={filteredEvents}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                />
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events Panel - Takes 1 column */}
        <div className="lg:col-span-1">
          <UpcomingEventsPanel
            events={upcomingEvents}
            onEventClick={handleEventClick}
            isLoading={isLoading}
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
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        onRestore={handleRestoreEvent}
        onPermanentDelete={handlePermanentDeleteEvent}
      />
    </div>
  );
}
