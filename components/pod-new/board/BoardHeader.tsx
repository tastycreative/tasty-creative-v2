"use client";

import React from "react";
import { Session } from "next-auth";
import { Plus, ChevronDown, Users, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamOption {
  row: number;
  name: string;
  label: string;
}

interface BoardHeaderProps {
  teamName: string;
  availableTeams: TeamOption[];
  selectedRow: number;
  onTeamChange: (teamRow: number) => void;
  onNewTask: () => void;
  session: Session | null;
  isLoading?: boolean;
  totalTasks?: number;
}

export default function BoardHeader({
  teamName,
  availableTeams,
  selectedRow,
  onTeamChange,
  onNewTask,
  session,
  isLoading = false,
  totalTasks = 0
}: BoardHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left side - Team info and selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {teamName || "Select Team"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading ? (
                  <span className="animate-pulse">Loading tasks...</span>
                ) : (
                  <>
                    {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Team Selector */}
          {availableTeams && availableTeams.length > 0 && (
            <Select
              value={String(selectedRow)}
              onValueChange={(value) => onTeamChange(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.row} value={String(team.row)}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <button
              onClick={onNewTask}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}