"use client";

import React from "react";
import { Users, Database, Activity } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalTeams: number;
  totalCreators: number;
  systemStatus: "healthy" | "warning" | "error";
}

interface Team {
  id: string;
  name: string;
  members: any[];
}

interface AdminStatsProps {
  stats: AdminStats;
  teams: Team[];
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats, teams }) => {
  const totalMembers = teams.reduce((acc, team) => acc + team.members.length, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
              Users
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.totalUsers}
            </p>
          </div>
          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
              Total Teams
            </p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {teams.length}
            </p>
          </div>
          <Database className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Total Members
            </p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {totalMembers}
            </p>
          </div>
          <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
      
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
              System Status
            </p>
            <p className="text-lg font-semibold text-orange-900 dark:text-orange-100 capitalize">
              {stats.systemStatus}
            </p>
          </div>
          <Activity className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
    </div>
  );
};