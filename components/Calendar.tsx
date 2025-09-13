"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [userTimezone, setUserTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Helper function to format date in user's timezone
  const formatDateInUserTimezone = (dateString: string, isAllDay = false) => {
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString("en-US", {
        timeZone: userTimezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date.toLocaleString("en-US", {
      timeZone: userTimezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get time string in user's timezone
  const getTimeStringInUserTimezone = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <>
      <Card className="lg:col-span-2 w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-100 dark:border-pink-500/30">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-gray-800 dark:text-gray-200">Calendar</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              View public calendar events
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Month selector */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-500/30 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
            >
              <ChevronLeft size={16} />
            </Button>

            <h3 className="text-gray-800 dark:text-gray-200 text-lg font-semibold">
              {selectedDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
                timeZone: userTimezone,
              })}
            </h3>

            <Button
              variant="outline"
              size="sm"
              className="bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-500/30 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-gray-600 dark:text-gray-300 text-sm py-2">
                {day}
              </div>
            ))}

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
                    className="h-16 bg-gray-100 dark:bg-gray-700 rounded-md"
                  ></div>
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
                  const eventDateInUserTZ = new Date(
                    eventDate.toLocaleString("en-US", { timeZone: userTimezone })
                  );
                  
                  return (
                    eventDateInUserTZ.getDate() === i &&
                    eventDateInUserTZ.getMonth() === currentDate.getMonth() &&
                    eventDateInUserTZ.getFullYear() === currentDate.getFullYear()
                  );
                });

                days.push(
                  <div
                    key={i}
                    className={`h-16 p-1 rounded-md text-gray-800 dark:text-gray-200 relative overflow-hidden ${dayEvents.length > 0 ? "bg-pink-100 dark:bg-pink-800/30 border border-pink-300 dark:border-pink-500/30" : "bg-gray-100 dark:bg-gray-700"}`}
                  >
                    <div className="text-right text-sm mb-1">{i}</div>
                    <div className="overflow-y-auto text-xs h-10">
                      {dayEvents.map((event, idx) => (
                        <button
                          key={idx}
                          className="w-full text-left truncate bg-pink-200 dark:bg-pink-700 hover:bg-pink-300 dark:hover:bg-pink-600 text-pink-800 dark:text-pink-200 rounded px-1 py-0.5 mb-0.5 transition-colors"
                          title={event.summary}
                          onClick={() =>
                            event.id
                              ? handleViewEventDetails(event.id)
                              : undefined
                          }
                          disabled={!event.id}
                        >
                          {event.summary}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              return days;
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Events Panel */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-100 dark:border-pink-500/30 rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Events Panel</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Public calendar events
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isCalendarLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 size={24} className="animate-spin text-pink-500" />
            </div>
          ) : calendarEvents.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {calendarEvents
                .sort((a, b) => {
                  const dateAStr = a.start.dateTime || a.start.date;
                  const dateBStr = b.start.dateTime || b.start.date;

                  // Handle undefined dates for sorting
                  if (!dateAStr && !dateBStr) return 0;
                  if (!dateAStr) return 1; // Put items with no date at the end
                  if (!dateBStr) return -1; // Put items with no date at the end

                  const dateA = new Date(dateAStr);
                  const dateB = new Date(dateBStr);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((event, index) => {
                  // Safely handle dates
                  const eventDateStr = event.start.dateTime || event.start.date;
                  if (!eventDateStr) return null; // Skip events with no date

                  const eventDate = new Date(eventDateStr);
                  const isAllDay = !!event.start.date;
                  const isPast = eventDate < new Date();

                  // Get time of day or "All day"
                  const timeStr = isAllDay
                    ? "All day"
                    : getTimeStringInUserTimezone(eventDateStr);

                  return (
                    <button
                      key={index}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        isPast
                          ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-60 hidden"
                          : "border-pink-200 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                      }`}
                      onClick={() =>
                        event.id ? handleViewEventDetails(event.id) : undefined
                      }
                      disabled={!event.id}
                    >
                      <div className="flex items-start">
                        {/* Date box */}
                        <div className="min-w-14 w-14 bg-pink-100 dark:bg-pink-800/40 border border-pink-200 dark:border-pink-500/30 rounded text-center p-1 mr-3">
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {eventDate.toLocaleDateString("en-US", {
                              month: "short",
                              timeZone: userTimezone,
                            })}
                          </div>
                          <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                            {new Date(
                              eventDate.toLocaleString("en-US", { timeZone: userTimezone })
                            ).getDate()}
                          </div>
                        </div>

                        {/* Event details */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">
                            {event.summary}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center mb-1">
                            <Clock size={10} className="mr-1" />
                            {timeStr}
                          </div>

                          {/* Show additional details */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {event.location && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center max-w-full">
                                <MapPin
                                  size={10}
                                  className="mr-1 flex-shrink-0"
                                />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </div>
                            )}

                            {event.attendees && event.attendees.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
                                <Users size={10} className="mr-1" />
                                {event.attendees.length} attendee
                                {event.attendees.length !== 1 ? "s" : ""}
                              </div>
                            )}

                            {event.conferenceData && (
                              <div className="text-xs text-pink-600 dark:text-pink-400 flex items-center">
                                <Video size={10} className="mr-1" />
                                Virtual meeting
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status indicator */}
                        {event.status && (
                          <div
                            className={`ml-2 h-2 w-2 rounded-full flex-shrink-0 ${
                              event.status === "confirmed"
                                ? "bg-green-500"
                                : event.status === "cancelled"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })
                // Filter out null values from map function
                .filter((item) => item !== null)}
            </div>
          ) : (
            <div className="text-center py-8 border border-pink-200 dark:border-pink-500/30 rounded-lg bg-pink-50 dark:bg-pink-900/20">
              <CalendarIcon
                size={32}
                className="mx-auto mb-3 text-gray-500 dark:text-gray-400 opacity-50"
              />
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                No events found for this month
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Try changing the month to see other events
              </p>
            </div>
          )}

          {/* Error display */}
          {calendarError && (
            <Alert
              variant="destructive"
              className="mt-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300"
            >
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{calendarError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-pink-200 dark:border-pink-500/30 text-gray-800 dark:text-gray-200 
      w-[90%] sm:w-[80%] md:w-[70%] lg:w-[60%] max-w-2xl 
      rounded-xl shadow-xl overflow-hidden"
        >
          {isLoadingEventDetail ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={36} className="animate-spin text-pink-500" />
            </div>
          ) : selectedEvent ? (
            <>
              <DialogHeader className="pb-4 border-b border-pink-200 dark:border-pink-500/30">
                <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-start gap-3">
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
                    <span className="inline-flex items-center bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full border border-green-200">
                      <Check size={12} className="mr-1" /> Confirmed
                    </span>
                  ) : selectedEvent.status === "cancelled" ? (
                    <span className="inline-flex items-center bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full border border-red-200">
                      <X size={12} className="mr-1" /> Cancelled
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full border border-yellow-200">
                      <Clock size={12} className="mr-1" /> Tentative
                    </span>
                  )}
                </div>
              </DialogHeader>
              <div className="py-4 space-y-6 max-h-[50vh] md:max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {/* Date and Time */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                    <CalendarIcon size={14} className="mr-2 text-pink-600 dark:text-pink-400" />
                    Date & Time
                  </h3>
                  <div className="bg-pink-50/60 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-500/30">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-800/40 rounded-full flex items-center justify-center mr-4">
                        <CalendarIcon size={20} className="text-pink-600 dark:text-pink-400" />
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
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
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
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                          <FileText
                            size={14}
                            className="mr-2 text-pink-600 dark:text-pink-400"
                          />
                          File Preview
                        </h3>
                        <div className="bg-pink-50/60 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-500/30">
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
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                      <FileText size={14} className="mr-2 text-pink-600 dark:text-pink-400" />
                      Description
                    </h3>
                    <div className="bg-pink-50/60 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-500/30 max-h-60 overflow-y-auto">
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
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                      <MapPin size={14} className="mr-2 text-pink-600 dark:text-pink-400" />
                      Location
                    </h3>
                    <div className="bg-pink-50/60 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-500/30">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-800/40 rounded-full flex items-center justify-center mr-4">
                          <MapPin size={20} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{selectedEvent.location}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conference Data */}
                {selectedEvent.conferenceData && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                      <Video size={14} className="mr-2 text-pink-600 dark:text-pink-400" />
                      Virtual Meeting
                    </h3>
                    <div className="bg-pink-50/60 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-500/30">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-800/40 rounded-full flex items-center justify-center mr-4">
                          <Video size={20} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium">
                            {selectedEvent.conferenceData.conferenceSolution
                              ?.name || "Virtual Meeting"}
                          </p>
                          {renderMeetingLinks(selectedEvent.conferenceData)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendees */}
                {selectedEvent.attendees &&
                  selectedEvent.attendees.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                        <Users size={14} className="mr-2 text-pink-600 dark:text-pink-400" />
                        Attendees ({selectedEvent.attendees.length})
                      </h3>
                      <div className="bg-pink-50/60 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-500/30 max-h-60 overflow-y-auto">
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
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                      <User size={14} className="mr-2 text-pink-600 dark:text-pink-400" />
                      Created by
                    </h3>
                    <div className="bg-pink-50/60 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-500/30">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-800/40 rounded-full flex items-center justify-center mr-4">
                          <User size={20} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">
                          {selectedEvent.creator?.displayName ||
                            selectedEvent.creator?.email ||
                            selectedEvent.organizer?.displayName ||
                            selectedEvent.organizer?.email ||
                            "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-pink-200 dark:border-pink-500/30 flex justify-between items-center">
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
            <div className="py-12 text-center">
              <CalendarIcon
                size={48}
                className="mx-auto text-gray-500 opacity-50 mb-4"
              />
              <p className="text-gray-600 text-lg">
                Event details not available
              </p>
              <DialogClose asChild>
                <Button className="mt-6 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white border-0">
                  Close
                </Button>
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Calendar;
