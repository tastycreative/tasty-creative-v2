"use client";
import React, { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Users, MoreHorizontal } from "lucide-react";
import { getPublicCalendarEvents } from "@/app/services/google-calendar-implementation";
import { formatDateTime } from "@/lib/utils";

const UpcomingEvents = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      setIsLoading(true);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2); // Next 2 months

      try {
        const events = await getPublicCalendarEvents(startDate, endDate);
        
        // Filter to future events and sort by date
        const futureEvents = events
          .filter(event => {
            const eventDate = new Date(event.start.dateTime || event.start.date || '');
            return eventDate >= new Date();
          })
          .sort((a, b) => {
            const dateA = new Date(a.start.dateTime || a.start.date || '');
            const dateB = new Date(b.start.dateTime || b.start.date || '');
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5); // Show next 5 events

        setUpcomingEvents(futureEvents);
      } catch (error) {
        console.error("Error loading upcoming events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUpcomingEvents();
  }, []);

  const getEventTypeIcon = (summary: string | undefined) => {
    if (!summary) return <Calendar size={14} className="text-gray-400 dark:text-gray-500" />;
    
    const lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes('birthday') || lowerSummary.includes('hbd')) {
      return <span className="text-sm">🎂</span>;
    }
    if (lowerSummary.includes('meeting') || lowerSummary.includes('call')) {
      return <Users size={14} className="text-blue-500 dark:text-blue-400" />;
    }
    return <Calendar size={14} className="text-pink-500 dark:text-pink-400" />;
  };

  const formatEventDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      ...(eventDate.getFullYear() !== now.getFullYear() && { year: 'numeric' })
    });
  };

  const formatEventTime = (dateString: string | undefined, isAllDay: boolean) => {
    if (isAllDay || !dateString) return '';
    
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-full min-h-[400px]">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              <div className="w-[60px] space-y-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-full min-h-[400px] flex flex-col justify-center items-center">
        <Calendar size={24} className="text-gray-400 dark:text-gray-500 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No upcoming events
        </p>
      </div>
    );
  }


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full min-h-[400px]">
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {upcomingEvents.map((event, index) => {
          const eventDate = event.start.dateTime || event.start.date;
          const isAllDay = !!event.start.date;
          const eventTime = formatEventTime(eventDate, isAllDay);
          const cleanSummary = (event.summary || 'Untitled Event').replace(/🎉/g, '').trim();
          const eventDateObj = new Date(eventDate || '');
          
          return (
            <div 
              key={event.id || index} 
              className="flex items-center gap-4 px-6 py-4 first:pt-6 last:pb-6 group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              {/* Date Column */}
              <div className="flex-shrink-0 text-center min-w-[70px]">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {eventDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ')[1]}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {eventDateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
              </div>

              {/* Event Details - Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {cleanSummary}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {eventDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {eventDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <MoreHorizontal size={16} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users size={14} />
                    <span>{event.attendees?.length || 0} Attendees</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={14} />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Published
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingEvents;