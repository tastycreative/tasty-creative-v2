"use client";

import { useState, useMemo } from "react";
import { Calendar, Filter, Plus, ChevronLeft, ChevronRight, Eye, EyeOff, Search, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContentDatesCalendar from "@/components/pod-new/features/content-dates/ContentDatesCalendar";
import UpcomingEventsPanel from "@/components/pod-new/features/content-dates/UpcomingEventsPanel";
import FilterControls from "@/components/pod-new/features/content-dates/FilterControls";
import CreateEventModal from "@/components/pod-new/features/content-dates/CreateEventModal";
import EventDetailModal from "@/components/pod-new/features/content-dates/EventDetailModal";

export type EventType = "PPV" | "LIVESTREAM";
export type EventStatus = "QUEUING" | "QUEUED";

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
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ContentEvent | null>(null);
  const [showDeleted, setShowDeleted] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filters, setFilters] = useState({
    creator: "all",
    eventType: "all",
    status: "all",
    flyerLink: "all",
    tags: [] as string[],
  });

  // Fetch events with TanStack Query
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['content-events', { ...filters, showDeleted }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters.creator !== "all") queryParams.set("creator", filters.creator);
      if (filters.eventType !== "all") queryParams.set("eventType", filters.eventType);
      if (filters.status !== "all") queryParams.set("status", filters.status);
      if (filters.flyerLink !== "all") queryParams.set("flyerLink", filters.flyerLink);
      if (filters.tags.length > 0) queryParams.set("tags", filters.tags.join(","));
      if (showDeleted) queryParams.set("includeDeleted", "true");

      const response = await fetch(`/api/content-events?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      // Transform API response to match ContentEvent interface
      return data.events.map((event: any) => ({
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
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<ContentEvent>) => {
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
          status: eventData.status || "QUEUING",
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

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-events'] });
      setIsCreateModalOpen(false);
      setSelectedDate(null);
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: Partial<ContentEvent> }) => {
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

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-events'] });
      setSelectedEvent(null);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/content-events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-events'] });
      setSelectedEvent(null);
    },
  });

  // Restore event mutation
  const restoreEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/content-events/${eventId}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to restore event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-events'] });
      setSelectedEvent(null);
    },
  });

  // Permanent delete event mutation
  const permanentDeleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/content-events/${eventId}/permanent-delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to permanently delete event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-events'] });
      setSelectedEvent(null);
    },
    onError: (error: Error) => {
      console.error("Error permanently deleting event:", error);
      alert(error.message);
    },
  });

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
    createEventMutation.mutate(eventData);
  };

  const handleUpdateEvent = async (eventId: string, eventData: Partial<ContentEvent>) => {
    updateEventMutation.mutate({ eventId, eventData });
  };

  const handleDeleteEvent = async (eventId: string) => {
    deleteEventMutation.mutate(eventId);
  };

  const handleRestoreEvent = async (eventId: string) => {
    restoreEventMutation.mutate(eventId);
  };

  const handlePermanentDeleteEvent = async (eventId: string) => {
    permanentDeleteEventMutation.mutate(eventId);
  };

  // Search events with API call (for dropdown only)
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-events', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.trim().length < 2) return [];

      const queryParams = new URLSearchParams();
      queryParams.set("search", searchTerm);
      queryParams.set("includeDeleted", showDeleted.toString());

      const response = await fetch(`/api/content-events?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search events');
      }

      const data = await response.json();
      return data.events.map((event: any) => ({
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
    },
    enabled: searchTerm.trim().length >= 2,
    staleTime: 1000 * 30, // Cache search results for 30 seconds
  });

  // Calendar and upcoming events always use the original filtered events (not search results)
  const filteredEvents = events;

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter((event: ContentEvent) => {
        // Filter by date (must be in the future)
        if (event.date < new Date()) return false;
        // If showDeleted is false, exclude deleted events
        if (!showDeleted && event.deletedAt) return false;
        return true;
      })
      .sort((a: ContentEvent, b: ContentEvent) => a.date.getTime() - b.date.getTime())
      .slice(0, 10);
  }, [filteredEvents, showDeleted]);

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

        {/* Search Bar */}
        <div className="mt-4 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search events by title, description, creator, or tags..."
              className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && searchTerm.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-pink-600"></div>
                    <span>Searching...</span>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">
                    Found {searchResults.length} event{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((event: ContentEvent) => {
                    const colorClasses: Record<string, string> = {
                      pink: "from-pink-500/90 to-pink-600/90",
                      purple: "from-purple-500/90 to-purple-600/90",
                      blue: "from-blue-500/90 to-blue-600/90",
                      green: "from-green-500/90 to-green-600/90",
                      orange: "from-orange-500/90 to-orange-600/90",
                    };
                    const gradientClass = event.deletedAt
                      ? 'from-gray-400/90 to-gray-500/90 opacity-60'
                      : (colorClasses[event.color] || 'from-pink-500/90 to-pink-600/90');

                    return (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsSearchFocused(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${gradientClass} text-white hover:shadow-md transition-all text-left mb-2`}
                      >
                        {event.creatorProfilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.creatorProfilePicture}
                            alt={event.creator || 'Creator'}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white/50"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white text-xs font-bold border-2 border-white/50 flex-shrink-0">
                            {event.creator?.substring(0, 2).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {event.type && `${event.type} - `}{event.creator || 'Unknown'}
                          </div>
                          {event.title && (
                            <div className="text-xs opacity-90 truncate">{event.title}</div>
                          )}
                          <div className="text-xs opacity-80 mt-1">
                            {event.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {event.time && ` • ${event.time}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No events found matching "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <FilterControls
        filters={filters}
        onFiltersChange={setFilters}
        creators={Array.from(new Set(events.map((e: ContentEvent) => e.creator).filter((c: string | undefined): c is string => Boolean(c))))}
        tags={(() => {
          // Count tag frequencies
          const tagCounts = new Map<string, number>();
          events.forEach((e: ContentEvent) => {
            (e.tags || []).forEach((tag: string) => {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
          });
          // Sort by frequency (descending) and return unique tags
          return Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);
        })()}
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
