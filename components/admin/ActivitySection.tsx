"use client";

import { ActivityStats as ActivityStatsType } from "@/hooks/useAdminUsers";
import { UserActivityChart } from "./UserActivityChart";
import { UserActivityChartSkeleton } from "./UserActivityChartSkeleton";
import { ActivityStats } from "./ActivityStats";
import { ActiveUsersToday } from "./ActiveUsersToday";
import { ActiveUsersSkeleton } from "./ActiveUsersSkeleton";

interface ActivitySectionProps {
  activity: ActivityStatsType;
  period: string;
  onPeriodChange: (period: string) => void;
  isLoading?: boolean;
  isChartLoading?: boolean;
}

export function ActivitySection({ activity, period, onPeriodChange, isLoading, isChartLoading }: ActivitySectionProps) {
  return (
    <div className="space-y-4">
      {/* Activity Stats */}
      <ActivityStats stats={activity} />

      {/* Chart and Active Users Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Activity Chart - 3/4 width */}
        <div className="lg:col-span-3 h-[400px]">
          {isChartLoading ? (
            <UserActivityChartSkeleton />
          ) : (
            <UserActivityChart
              data={activity.daily}
              period={period}
              onPeriodChange={onPeriodChange}
            />
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
