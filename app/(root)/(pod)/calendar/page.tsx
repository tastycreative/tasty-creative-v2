"use client";

import React from "react";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  Image as ImageIcon,
  FileText,
  Users,
} from "lucide-react";

// Mock events data
const mockEvents = [
  {
    id: 1,
    title: "Team Meeting",
    date: "2025-10-15",
    time: "10:00 AM",
    type: "meeting",
    color: "from-blue-500 to-cyan-500",
    attendees: 5,
  },
  {
    id: 2,
    title: "Content Upload - Beach Shoot",
    date: "2025-10-15",
    time: "2:00 PM",
    type: "content",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: 3,
    title: "Live Stream Event",
    date: "2025-10-18",
    time: "7:00 PM",
    type: "livestream",
    color: "from-red-500 to-orange-500",
    attendees: 150,
  },
  {
    id: 4,
    title: "Model Photoshoot",
    date: "2025-10-20",
    time: "11:00 AM",
    type: "photoshoot",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: 5,
    title: "Campaign Review",
    date: "2025-10-22",
    time: "3:00 PM",
    type: "meeting",
    color: "from-blue-500 to-cyan-500",
    attendees: 8,
  },
  {
    id: 6,
    title: "Social Media Posts",
    date: "2025-10-25",
    time: "9:00 AM",
    type: "content",
    color: "from-emerald-500 to-teal-500",
  },
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return mockEvents.filter(event => event.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border-b border-gray-200/50 dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-30"></div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Calendar
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage your schedule and upcoming events
                </p>
              </div>
            </div>

            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Event
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="xl:col-span-2">
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToday}
                    className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white rounded-lg hover:shadow-md transition-all"
                  >
                    Today
                  </button>

                  <button
                    onClick={handlePrevMonth}
                    className="p-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white rounded-lg hover:shadow-md transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleNextMonth}
                    className="p-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white rounded-lg hover:shadow-md transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide py-2"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square bg-gray-50/50 dark:bg-gray-800/30 rounded-lg"
                  ></div>
                ))}

                {/* Calendar Days */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const events = getEventsForDate(day);
                  const today = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`aspect-square p-2 rounded-lg border transition-all cursor-pointer ${
                        today
                          ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/50 dark:border-pink-400/50 ring-2 ring-pink-500/50"
                          : events.length > 0
                          ? "bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-white/10 hover:shadow-md"
                          : "bg-white/50 dark:bg-gray-800/50 border-gray-200/30 dark:border-white/5 hover:bg-white/80 dark:hover:bg-gray-800/80"
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <div
                          className={`text-sm font-semibold mb-1 ${
                            today
                              ? "text-pink-600 dark:text-pink-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {day}
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          {events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r ${event.color} text-white truncate`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              +{events.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - Upcoming Events */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "This Week", value: "8", icon: CalendarIcon, color: "from-pink-500 to-rose-500" },
                { label: "This Month", value: "24", icon: Clock, color: "from-purple-500 to-indigo-500" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="relative bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-5 border border-gray-200/50 dark:border-white/10 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-20"></div>

                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Events */}
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Events</h2>

              <div className="space-y-3">
                {mockEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="group p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200/50 dark:border-white/10 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${event.color} flex items-center justify-center flex-shrink-0`}>
                        {event.type === "meeting" && <Users className="w-5 h-5 text-white" />}
                        {event.type === "content" && <ImageIcon className="w-5 h-5 text-white" />}
                        {event.type === "livestream" && <Video className="w-5 h-5 text-white" />}
                        {event.type === "photoshoot" && <ImageIcon className="w-5 h-5 text-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        {event.attendees && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.attendees} attendees
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Legend */}
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Event Types</h3>
              <div className="space-y-2">
                {[
                  { label: "Meeting", color: "from-blue-500 to-cyan-500" },
                  { label: "Content", color: "from-pink-500 to-rose-500" },
                  { label: "Live Stream", color: "from-red-500 to-orange-500" },
                  { label: "Photoshoot", color: "from-purple-500 to-indigo-500" },
                ].map((type, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${type.color}`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
