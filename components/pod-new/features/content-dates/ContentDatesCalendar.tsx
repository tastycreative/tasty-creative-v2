"use client";

import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";

interface ContentDatesCalendarProps {
  currentDate: Date;
  events: ContentEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: ContentEvent) => void;
}

export default function ContentDatesCalendar({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: ContentDatesCalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const today = isToday(date);

          return (
            <div
              key={index}
              onClick={() => date && onDateClick(date)}
              className={`min-h-[100px] md:min-h-[120px] p-2 rounded-lg border transition-all cursor-pointer ${
                date
                  ? 'bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 hover:shadow-md'
                  : 'bg-transparent border-transparent cursor-default'
              } ${
                today
                  ? 'ring-2 ring-pink-500 dark:ring-pink-400 ring-inset'
                  : ''
              }`}
            >
              {date && (
                <>
                  {/* Date Number */}
                  <div className={`text-sm font-semibold mb-1 ${
                    today
                      ? 'text-pink-600 dark:text-pink-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {date.getDate()}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const colorClasses = {
                        pink: "bg-pink-500/80 hover:bg-pink-500",
                        purple: "bg-purple-500/80 hover:bg-purple-500",
                        blue: "bg-blue-500/80 hover:bg-blue-500",
                        green: "bg-green-500/80 hover:bg-green-500",
                        orange: "bg-orange-500/80 hover:bg-orange-500",
                      };

                      return (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          className={`w-full text-left text-xs px-2 py-1 rounded text-white font-medium truncate transition-colors ${colorClasses[event.color]}`}
                          title={event.title}
                        >
                          {event.time && <span className="mr-1">{event.time}</span>}
                          {event.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
