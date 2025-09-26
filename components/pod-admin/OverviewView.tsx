"use client";

import React from "react";
import { AdminStats } from "./AdminStats";

interface AdminStatsData {
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

interface OverviewViewProps {
  stats: AdminStatsData;
  teams: Team[];
}

export const OverviewView: React.FC<OverviewViewProps> = ({ stats, teams }) => {
  return (
    <>
      <AdminStats stats={stats} teams={teams} />
    </>
  );
};