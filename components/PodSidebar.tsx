'use client';

import React from 'react';
import { Users, UserPlus, Calendar, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Creator {
  id: string;
  name: string;
  earnings?: string;
}

interface TeamOption {
  row: number;
  name: string;
  label: string;
}

interface PodSidebarProps {
  teamName?: string;
  teamMembers?: TeamMember[];
  assignedCreators?: Creator[];
  schedulerSpreadsheetUrl?: string;
  selectedRow?: number;
  availableTeams?: TeamOption[];
  isLoadingTeams?: boolean;
  isLoading?: boolean;
  onTeamChange?: (rowNumber: number) => void;
  onRefresh?: () => void;
}

const PodSidebar: React.FC<PodSidebarProps> = ({
  teamName,
  teamMembers = [],
  assignedCreators = [],
  schedulerSpreadsheetUrl,
  selectedRow,
  availableTeams = [],
  isLoadingTeams = false,
  isLoading = false,
  onTeamChange,
  onRefresh
}) => {
  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-3">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-50 tracking-tight mb-1">
            POD Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Team management and scheduling
          </p>
        </div>

        {/* Team Selection Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-tight">
                Team Selection
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Team:
              </label>
              <select
                value={selectedRow || ''}
                onChange={(e) => {
                  const newRow = parseInt(e.target.value);
                  if (onTeamChange) onTeamChange(newRow);
                }}
                disabled={isLoading || isLoadingTeams}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
              >
                {availableTeams.length > 0 ? (
                  availableTeams.map((team) => (
                    <option key={team.row} value={team.row}>
                      {team.name}
                    </option>
                  ))
                ) : (
                  <option value={selectedRow || ''}>Loading teams...</option>
                )}
              </select>
              {(isLoading || isLoadingTeams) && (
                <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  {isLoadingTeams ? 'Loading teams...' : 'Loading data...'}
                </div>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Team Information Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl">
                <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-tight">
                {teamName || 'Team Information'}
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Team Members
              </h4>
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-medium text-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-10 w-10 text-gray-400 mb-3 opacity-50" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No team members</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Creators Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-xl">
                <UserPlus className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-tight">
                Assigned Creators
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {assignedCreators.length > 0 ? (
                assignedCreators.map((creator) => (
                  <div key={creator.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-medium text-sm">
                        {creator.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {creator.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Content Creator
                        </p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {creator.earnings || '$0'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-10 w-10 text-gray-400 mb-3 opacity-50" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No assigned creators</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scheduler Link Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-tight">
                POD Hub
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access the main scheduler spreadsheet for this POD team.
              </p>
              {schedulerSpreadsheetUrl ? (
                <button
                  onClick={() => window.open(schedulerSpreadsheetUrl, '_blank')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Scheduler
                </button>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2 opacity-50" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No scheduler link configured</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodSidebar;
