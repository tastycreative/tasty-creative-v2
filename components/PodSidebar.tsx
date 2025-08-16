'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Calendar, ExternalLink, RefreshCw } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Creator {
  id: string;
  name: string;
  specialty: string;
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
    <div className="w-full space-y-6">
      {/* Team Selection */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/30 dark:to-indigo-900/30 border-b border-purple-200 dark:border-purple-500/30">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-white" />
            </div>
            Team Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
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
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 text-gray-900 dark:text-gray-100"
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
              <Button
                onClick={onRefresh}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Information */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-white" />
            </div>
            {teamName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 mr-2"></div>
              Team Members
            </h4>
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Creators */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-rose-900/30 dark:to-pink-900/30 border-b border-pink-200 dark:border-pink-500/30">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mr-3">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            Assigned Creators
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {assignedCreators.map((creator) => (
              <div key={creator.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors border border-pink-100 dark:border-pink-500/20">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {creator.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{creator.name}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full shadow-md">
                  <p className="text-sm font-bold">{creator.earnings || '$0'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduler Spreadsheet Link */}
      <Card className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Scheduler POD
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Access the main scheduler spreadsheet for this POD team.
            </p>
            {schedulerSpreadsheetUrl ? (
              <Button
                onClick={() => window.open(schedulerSpreadsheetUrl, '_blank')}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Scheduler
              </Button>
            ) : (
              <div className="p-3 bg-pink-50/50 dark:bg-pink-900/20 rounded-lg border-2 border-dashed border-pink-300 dark:border-pink-500/30 text-center">
                <p className="text-sm text-pink-600 dark:text-pink-400">No scheduler link configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PodSidebar;
