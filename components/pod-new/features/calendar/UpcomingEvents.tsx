"use client";

import { Clock, Calendar, MapPin } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  time?: string;
  color: "pink" | "purple" | "blue" | "green" | "orange";
  description?: string;
}

interface UpcomingEventsProps {
  events: Event[];
  selectedDate: Date | null;
}

export default function UpcomingEvents({ events, selectedDate }: UpcomingEventsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDateEvents = selectedDate
    ? events.filter(event => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  });

  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() > today.getTime();
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const colorDotClasses = {
    pink: "bg-pink-500",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
  };

  const EventCard = ({ event }: { event: Event }) => (
    <div className="group p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all cursor-pointer hover:border-pink-300 dark:hover:border-pink-500/50">
      <div className="flex items-start gap-3">
        <div className={'w-2 h-2 rounded-full mt-2 shrink-0 ' + colorDotClasses[event.color]} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{event.title}</h4>
          {event.time && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{event.time}</span>
            </div>
          )}
          {event.description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Selected Date</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{formatDate(selectedDate)}</p>
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
        <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Today</h3>
          </div>
          <div className="space-y-2">
            {todayEvents.length > 0 ? (
              todayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No events today</p>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
        <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Upcoming</h3>
          </div>
          <div className="space-y-2">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">{formatDate(event.date)}</p>
                  <EventCard event={event} />
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
