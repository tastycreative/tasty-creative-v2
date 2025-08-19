"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  User,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicCalendarEvents } from "@/app/services/google-calendar-implementation";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { formatDateTime } from "@/lib/utils";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEventDetail, setIsLoadingEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<{day: number, events: CalendarEvent[], x: number, y: number} | null>(null);

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

      const startDate = new Date(selectedDate);
      startDate.setDate(1); // First day of month
      startDate.setHours(0, 0, 0, 0); // Start of day

      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month
      endDate.setHours(23, 59, 59, 999); // End of day

      try {
        // Always use the public calendar API without checking authentication
        const events = await getPublicCalendarEvents(startDate, endDate);

        // Filter out events that have "Call" in the title
        const filteredEvents = events.filter(
          (event) => !event.summary?.toLowerCase().includes("call")
        );

        // Update state with filtered events
        setCalendarEvents(filteredEvents);
      } catch (error) {
        console.error("Error loading calendar events:", error);
        setCalendarError("Failed to load events from calendar.");
      } finally {
        setIsCalendarLoading(false);
      }
    };

    loadCalendarEventsForMonth();
  }, [selectedDate]);

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

  const today = new Date();
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <>
      <div className="w-full relative">
        {/* Hover Tooltip - Positioned relative to this container */}
        {hoveredDay && (
          <div 
            className="absolute z-[9999] pointer-events-none"
            style={{
              left: `${hoveredDay.x - 100}px`,
              top: `${hoveredDay.y - 120}px`,
            }}
          >
            {/* Debug marker to show exact position */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full opacity-50"></div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-[200px]">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 text-center">
                Events for day {hoveredDay.day}
              </div>
              <div className="space-y-3">
                {hoveredDay.events.map((event, idx) => {
                  const cleanSummary = (event.summary || '').replace(/🎉/g, '').trim();
                  const eventTime = event.start.date ? 'All day' : new Date(event.start.dateTime || '').toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  
                  return (
                    <div key={idx} className="text-xs border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        {cleanSummary.includes('Birthday') || cleanSummary.includes('HBD') ? (
                          <span className="text-sm">🎂</span>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{cleanSummary}</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 ml-6 font-medium">
                        {eventTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Pointing Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
            </div>
          </div>
        )}
        
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            aria-label="Previous month"
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <button
            aria-label="Next month"
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Calendar Grid */}
        {isCalendarLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={24} className="animate-spin text-pink-500" />
          </div>
        ) : (
          <div className="w-full">
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div 
                  key={day} 
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const days = [];
                const date = new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  1
                );
                const lastDay = new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth() + 1,
                  0
                ).getDate();

                // Add empty cells for days before the first day of the month
                for (let i = 0; i < date.getDay(); i++) {
                  days.push(
                    <div
                      key={`empty-${i}`}
                      className="min-h-[80px] xl:min-h-[100px]"
                    />
                  );
                }

                // Add cells for each day of the month
                for (let i = 1; i <= lastDay; i++) {
                  const currentDate = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    i
                  );
                  
                  // Get events for this day
                  const dayEvents = calendarEvents.filter((event) => {
                    const eventDateString =
                      event.start.dateTime || event.start.date;
                    if (!eventDateString) return false;

                    const eventDate = new Date(eventDateString);
                    return (
                      eventDate.getDate() === i &&
                      eventDate.getMonth() === currentDate.getMonth() &&
                      eventDate.getFullYear() === currentDate.getFullYear()
                    );
                  });

                  const isTodayDate = isToday(currentDate);

                  days.push(
                    <div
                      key={i}
                      className={`
                        min-h-[80px] xl:min-h-[100px] p-2 xl:p-3
                        bg-gray-50 dark:bg-gray-900/50 
                        hover:bg-gray-100 dark:hover:bg-gray-800/50 
                        rounded transition-colors relative cursor-pointer
                        ${isTodayDate ? 'ring-1 ring-pink-500 bg-pink-50 dark:bg-pink-900/20' : ''}
                      `}
                      onMouseEnter={(e) => {
                        if (dayEvents.length > 0) {
                          const dayCell = e.currentTarget;
                          const calendarContainer = dayCell.closest('.w-full');
                          
                          if (calendarContainer) {
                            const dayRect = dayCell.getBoundingClientRect();
                            const containerRect = calendarContainer.getBoundingClientRect();
                            
                            // Position relative to calendar container
                            const relativeX = dayRect.left - containerRect.left + dayRect.width / 2;
                            const relativeY = dayRect.top - containerRect.top;
                            
                            console.log(`Day ${i} - Day rect:`, dayRect);
                            console.log(`Day ${i} - Container rect:`, containerRect);
                            console.log(`Day ${i} - Relative position: X=${relativeX}, Y=${relativeY}`);
                            
                            setHoveredDay({
                              day: i,
                              events: dayEvents,
                              x: relativeX,
                              y: relativeY
                            });
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        // Use a small delay to prevent flickering when moving between elements
                        setTimeout(() => setHoveredDay(null), 100);
                      }}
                    >
                      {/* Date Number */}
                      <div className={`
                        text-sm xl:text-base font-medium mb-1
                        ${isTodayDate 
                          ? 'text-pink-600 dark:text-pink-400 font-semibold' 
                          : 'text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        {i}
                      </div>
                      
                      {/* Event Indicators - Show actual event names */}
                      {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((event, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left block pointer-events-auto"
                              title={event.summary}
                              onClick={() =>
                                event.id
                                  ? handleViewEventDetails(event.id)
                                  : undefined
                              }
                              disabled={!event.id}
                              onMouseEnter={(e) => {
                                e.stopPropagation();
                                const dayRect = e.currentTarget.closest('.cursor-pointer')?.getBoundingClientRect();
                                if (dayRect) {
                                  setHoveredDay({
                                    day: i,
                                    events: dayEvents,
                                    x: dayRect.left + dayRect.width / 2 + window.scrollX,
                                    y: dayRect.top + window.scrollY
                                  });
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
                                <span className="text-xs xl:text-sm text-gray-700 dark:text-gray-300 truncate leading-tight">
                                  {(() => {
                                    const cleanSummary = (event.summary || '').replace(/🎉/g, '').trim();
                                    return cleanSummary.includes('Birthday') || cleanSummary.includes('HBD') 
                                      ? `🎂 ${cleanSummary}` 
                                      : cleanSummary;
                                  })()}
                                </span>
                              </div>
                            </button>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 pl-2.5">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // Add empty cells for remaining days
                const totalCells = days.length;
                const remainingCells = 35 - totalCells; // Ensure we have 5 rows
                for (let i = 0; i < remainingCells; i++) {
                  days.push(
                    <div
                      key={`empty-end-${i}`}
                      className="min-h-[80px] xl:min-h-[100px]"
                    />
                  );
                }

                return days;
              })()}
            </div>
          </div>
        )}

        {/* Error State */}
        {calendarError && (
          <Alert className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTitle className="text-red-800 dark:text-red-300">Error</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400">
              {calendarError}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl overflow-hidden">
          {isLoadingEventDetail ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 size={20} className="animate-spin text-pink-500" />
            </div>
          ) : selectedEvent ? (
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {selectedEvent?.summary?.replace(/🎉/g, '').trim() || "Event"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDateTime(selectedEvent.start.dateTime || selectedEvent.start.date)}
                </p>
                {selectedEvent.status && (
                  <div className="flex justify-center mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedEvent.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : selectedEvent.status === 'tentative'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : selectedEvent.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Info Cards */}
              <div className="space-y-3">
                {/* Time Card */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <Clock size={16} className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedEvent.start.date ? 'All day' : 
                        new Date(selectedEvent.start.dateTime || '').toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      }
                    </p>
                    {selectedEvent.end && !selectedEvent.start.date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Until {new Date(selectedEvent.end.dateTime || '').toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location Card */}
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {selectedEvent.location}
                    </p>
                  </div>
                )}

                {/* Creator Card */}
                {(selectedEvent.creator || selectedEvent.organizer || (selectedEvent.attendees && selectedEvent.attendees.find(a => a.organizer))) && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                      <User size={16} className="text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created by</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedEvent.creator?.email || 
                         selectedEvent.organizer?.email || 
                         selectedEvent.attendees?.find(a => a.organizer)?.email ||
                         selectedEvent.organizer?.displayName || 
                         'Unknown'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Attendees Card */}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Users size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedEvent.attendees.length} {selectedEvent.attendees.length === 1 ? 'Attendee' : 'Attendees'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedEvent.attendees.slice(0, 2).map(a => a.email?.split('@')[0]).join(', ')}
                        {selectedEvent.attendees.length > 2 && ` +${selectedEvent.attendees.length - 2} more`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedEvent.conferenceData?.entryPoints?.map((entry, idx) => (
                  <a
                    key={idx}
                    href={entry.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors text-center"
                  >
                    Join Meeting
                  </a>
                ))}
                {selectedEvent.htmlLink && (
                  <a
                    href={selectedEvent.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors text-center"
                  >
                    View in Calendar
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No event details available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Calendar;