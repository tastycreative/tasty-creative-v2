"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import UpcomingEvents from "./UpcomingEvents";

interface Event {
  id: string;
  title: string;
  date: Date;
  time?: string;
  color: "pink" | "purple" | "blue" | "green" | "orange";
  description?: string;
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Team Meeting",
    date: new Date(2025, 10, 25, 10, 0),
    time: "10:00 AM",
    color: "blue",
    description: "Weekly team sync",
  },
  {
    id: "2",
    title: "Content Review",
    date: new Date(2025, 10, 27, 14, 30),
    time: "2:30 PM",
    color: "purple",
    description: "Review latest content submissions",
  },
];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events] = useState<Event[]>(mockEvents);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const previousMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const colorClasses = {
    pink: "bg-pink-500/20 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-500/50",
    purple: "bg-purple-500/20 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/50",
    blue: "bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/50",
    green: "bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/50",
    orange: "bg-orange-500/20 dark:bg-orange-500/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/50",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-blue-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(120,119,198,0.3), rgba(255,255,255,0))'}} />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                  <CalendarIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">{monthNames[month]} {year}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{events.length} events this month</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={goToToday} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all">Today</button>
                <button onClick={previousMonth} className="p-2 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={nextMonth} className="p-2 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all"><ChevronRight className="h-5 w-5" /></button>
                <button className="p-2 text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg transition-all shadow-lg shadow-pink-500/30"><Plus className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={'empty-' + index} className="min-h-[100px] md:min-h-[120px] border-b border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/20" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const date = new Date(year, month, day);
                  const dayEvents = getEventsForDate(date);
                  const today = isToday(day);
                  const selected = isSelected(day);
                  return (
                    <div key={day} onClick={() => setSelectedDate(date)} className={'min-h-[100px] md:min-h-[120px] border-b border-r border-gray-200/50 dark:border-gray-700/50 p-2 cursor-pointer transition-all hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-purple-50/50 dark:hover:from-pink-900/10 dark:hover:to-purple-900/10 ' + (today ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' : '') + ' ' + (selected ? 'ring-2 ring-pink-500 dark:ring-pink-400 ring-inset' : '')}>
                      <div className="flex items-start justify-between mb-1">
                        <span className={'inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full ' + (today ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : 'text-gray-700 dark:text-gray-300')}>{day}</span>
                        {dayEvents.length > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{dayEvents.length}</span>}
                      </div>
                      <div className="space-y-1 mt-2">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div key={event.id} className={'text-xs px-2 py-1 rounded border truncate ' + colorClasses[event.color]} title={event.title}>{event.time && <span className="font-medium">{event.time}</span>}{event.time && ' - '}{event.title}</div>
                        ))}
                        {dayEvents.length > 2 && <div className="text-xs text-gray-500 dark:text-gray-400 px-2">+{dayEvents.length - 2} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <UpcomingEvents events={events} selectedDate={selectedDate} />
      </div>
    </div>
  );
}
