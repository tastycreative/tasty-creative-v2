"use client";

import React from "react";
import { Search, Plus } from "lucide-react";
import { TeamCard } from "./TeamCard";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  image?: string;
  userId?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  status: "not-started" | "in-progress" | "completed" | "on-hold";
  priority: "low" | "medium" | "high";
  dueDate?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  projectPrefix?: string;
  members: TeamMember[];
  tasks: Task[];
  sheetUrl?: string;
  rowNumber: number;
  creators?: string[];
}

interface TeamsViewProps {
  teams: Team[];
  filteredTeams: Team[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowAddTeamForm: (show: boolean) => void;
  onUpdateTeamName: (teamId: string, newName: string) => void;
  onUpdateTeamPrefix: (teamId: string, newPrefix: string) => void;
  onUpdateTeamCreators: (teamId: string, creators: string[]) => void;
  onShowMembers: (teamId: string) => void;
  onShowTasks: (teamId: string) => void;
  onShowColumnAssignments: (teamId: string) => void;
  getTeamStats: (team: Team) => any;
  getStatusColor: (status: string) => string;
  getStatusBgColor: (status: string) => string;
  availableCreators: string[];
  fetchAvailableCreators: () => void;
  updatingStates: {
    teamName?: string;
    teamPrefix?: string;
    creators?: string;
  };
  successStates: {
    teamName?: string;
    teamPrefix?: string;
    creators?: string;
  };
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  filteredTeams,
  searchQuery,
  setSearchQuery,
  setShowAddTeamForm,
  onUpdateTeamName,
  onUpdateTeamPrefix,
  onUpdateTeamCreators,
  onShowMembers,
  onShowTasks,
  onShowColumnAssignments,
  getTeamStats,
  getStatusColor,
  getStatusBgColor,
  availableCreators,
  fetchAvailableCreators,
  updatingStates,
  successStates,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Team Management
          </h3>
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium self-start sm:self-auto">
            {filteredTeams.length} teams
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full lg:w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowAddTeamForm(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onUpdateTeamName={onUpdateTeamName}
            onUpdateTeamPrefix={onUpdateTeamPrefix}
            onUpdateTeamCreators={onUpdateTeamCreators}
            onShowMembers={onShowMembers}
            onShowTasks={onShowTasks}
            onShowColumnAssignments={onShowColumnAssignments}
            getTeamStats={getTeamStats}
            getStatusColor={getStatusColor}
            getStatusBgColor={getStatusBgColor}
            availableCreators={availableCreators}
            fetchAvailableCreators={fetchAvailableCreators}
            updatingStates={updatingStates}
            successStates={successStates}
          />
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? "No teams found" : "No teams yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery 
                ? `No teams match "${searchQuery}". Try adjusting your search.`
                : "Get started by creating your first team."
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddTeamForm(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Your First Team</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};