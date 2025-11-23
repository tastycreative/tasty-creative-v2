"use client";

import { ActivityStats as ActivityStatsType } from "@/hooks/useAdminUsers";
import { UserActivityChart } from "./UserActivityChart";
import { UserActivityChartSkeleton } from "./UserActivityChartSkeleton";
import { ActivityStats } from "./ActivityStats";
import { ActiveUsersToday } from "./ActiveUsersToday";
import { ActiveUsersSkeleton } from "./ActiveUsersSkeleton";
import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";

interface ActivitySectionProps {
  activity: ActivityStatsType;
  onMonthChange?: (startDate: string, endDate: string) => void;
  isLoading?: boolean;
}

export function ActivitySection({ activity, onMonthChange, isLoading }: ActivitySectionProps) {
  const [selectedDate, setSelectedDate] = useState(DateTime.now());

  const handlePreviousMonth = () => {
    const newDate = selectedDate.minus({ months: 1 });
    setSelectedDate(newDate);
    if (onMonthChange) {
      const startOfMonth = newDate.startOf('month').toISODate();
      const endOfMonth = newDate.endOf('month').toISODate();
      onMonthChange(startOfMonth!, endOfMonth!);
    }
  };

  const handleNextMonth = () => {
    const newDate = selectedDate.plus({ months: 1 });
    const today = DateTime.now();

    // Don't allow selecting future months
    if (newDate.month > today.month || newDate.year > today.year) {
      return;
    }

    setSelectedDate(newDate);
    if (onMonthChange) {
      const startOfMonth = newDate.startOf('month').toISODate();
      const endOfMonth = newDate.endOf('month').toISODate();
      onMonthChange(startOfMonth!, endOfMonth!);
    }
  };

  const handleCurrentMonth = () => {
    const today = DateTime.now();
    setSelectedDate(today);
    if (onMonthChange) {
      const startOfMonth = today.startOf('month').toISODate();
      const endOfMonth = today.endOf('month').toISODate();
      onMonthChange(startOfMonth!, endOfMonth!);
    }
  };

  const isCurrentMonth = selectedDate.month === DateTime.now().month &&
                         selectedDate.year === DateTime.now().year;
  const isFutureMonth = selectedDate > DateTime.now();

  return (
    <div className="space-y-4">
      {/* Month Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Activity Period
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedDate.toFormat('MMMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={handleCurrentMonth}
              className="px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              Current Month
            </button>
          )}

          <button
            onClick={handleNextMonth}
            disabled={isFutureMonth || isCurrentMonth}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      <ActivityStats stats={activity} />

      {/* Chart and Active Users Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Activity Chart - 3/4 width */}
        <div className="lg:col-span-3 h-[400px]">
          {isLoading ? (
            <UserActivityChartSkeleton />
          ) : (
            <UserActivityChart data={activity.daily} />
          )}
        </div>

        {/* Active Users Today - 1/4 width */}
        <div className="lg:col-span-1 h-[400px]">
          {isLoading ? (
            <ActiveUsersSkeleton />
          ) : (
            <ActiveUsersToday users={activity.activeTodayUsers} />
          )}
        </div>
      </div>
    </div>
  );
}
