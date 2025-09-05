"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Settings,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SheetLinksCard } from "@/components/pod-dashboard/SheetLinksCard";
import { TeamMembersCard } from "@/components/pod-dashboard/TeamMembersCard";
import { AssignedCreatorsCard } from "@/components/pod-dashboard/AssignedCreatorsCard";

interface DashboardWithTeamSidebarProps {
  tasks?: any[];
  creators?: any[];
}

// Simple Progress component
const Progress = ({
  value,
  className = "h-2",
}: {
  value: number;
  className?: string;
}) => (
  <div className={`w-full bg-gray-700 rounded-full ${className}`}>
    <div
      className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-600"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

export function DashboardWithTeamSidebarNew({
  tasks,
  creators,
}: DashboardWithTeamSidebarProps) {
  return (
    <div className="space-y-6">
      {/* POD Workflow Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              POD Workflow Dashboard
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-400">Sheets Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Overall Progress */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">4/8</div>
              <div className="text-sm text-gray-400">completed</div>
              <Progress value={50} />
              <div className="text-xs text-gray-400">
                50% of tasks completed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">4</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">2</div>
                <div className="text-xs text-gray-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">2</div>
                <div className="text-xs text-gray-400">Not Started</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">0</div>
                <div className="text-xs text-gray-400">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">87%</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">+12%</span>
              </div>
              <div className="text-xs text-gray-400">efficiency this week</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Recent Tasks & Schedule Overview */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-pink-500 rounded flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <CardTitle className="text-base text-white">
                Recent Tasks
              </CardTitle>
            </div>
            <p className="text-xs text-gray-400">
              Latest team activity and progress
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Task 1 */}
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-pink-500 text-white text-xs">
                    J
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm text-white">
                    Luna_Dreams - Schedule Complete
                  </div>
                  <div className="text-xs text-gray-400">
                    Jake • 2 hours ago
                  </div>
                </div>
              </div>
              <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                Complete
              </div>
            </div>

            {/* Task 2 */}
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-purple-500 text-white text-xs">
                    S
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm text-white">
                    Sophia_Blaze - Data Analysis
                  </div>
                  <div className="text-xs text-gray-400">
                    Sarah • 1 hour ago
                  </div>
                </div>
              </div>
              <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30">
                In Progress
              </div>
            </div>

            {/* Task 3 */}
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-purple-500 text-white text-xs">
                    V
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm text-white">
                    Maya_Rose - Content Upload
                  </div>
                  <div className="text-xs text-gray-400">
                    Vanessa • 30 minutes ago
                  </div>
                </div>
              </div>
              <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
                Review
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Overview */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <CalendarIcon className="w-3 h-3 text-white" />
              </div>
              <CardTitle className="text-base text-white">
                Schedule Overview
              </CardTitle>
            </div>
            <p className="text-xs text-gray-400">
              Quick preview of content scheduling
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Daily Posts Scheduled */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-sm text-white">
                    Daily Posts Scheduled
                  </div>
                  <div className="text-xs text-gray-400">All Models</div>
                </div>
              </div>
              <div className="text-sm font-medium text-white">18/28</div>
            </div>

            {/* Mass Messages Ready */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-sm text-white">Mass Messages Ready</div>
                  <div className="text-xs text-gray-400">Luna, Sophia</div>
                </div>
              </div>
              <div className="text-sm font-medium text-white">2/4</div>
            </div>

            {/* CHECK Validation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-sm text-white">✅CHECK✅ Validation</div>
                  <div className="text-xs text-gray-400">Maya, Emma</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span className="text-sm text-green-400">Pass</span>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <div>
                  <div className="text-sm text-white">Performance Analysis</div>
                  <div className="text-xs text-gray-400">This Week</div>
                </div>
              </div>
              <div className="text-sm font-medium text-white">89%</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
