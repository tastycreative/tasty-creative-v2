'use client';

import React, { useState, useEffect } from 'react';
import PodSidebar from './PodSidebar';
import WorkflowDashboard from './WorkflowDashboard';
import SheetsIntegration from './SheetsIntegration';

interface TeamMember {
  id: string;
  name: string;
  role: string;
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

interface PodData {
  teamName: string;
  teamMembers: TeamMember[];
  creators: Creator[];
  rowNumber: number;
  lastUpdated: string;
}

const DEFAULT_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1sTp3x6SA4yKkYEwPUIDPNzAPiu0RnaV1009NXZ7PkZM/edit?gid=0#gid=0';
const EARNINGS_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1uF-zuML1HgP5b95pbJycVQZj_0Nl1mgkTshOe3lUCSs/edit?gid=591071681#gid=591071681';

const PodComponent = () => {
  const [schedulerSpreadsheetUrl, setSchedulerSpreadsheetUrl] = useState<string | undefined>(undefined);
  const [selectedRow, setSelectedRow] = useState<number>(8);
  const [podData, setPodData] = useState<PodData | null>(null);
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableTeams = async () => {
    setIsLoadingTeams(true);
    
    try {
      const response = await fetch('/api/pod/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          startRow: 8,
          endRow: 20
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.teams) {
        setAvailableTeams(result.teams);
        // If no teams and no selected row, use the first available team
        if (result.teams.length > 0 && !selectedRow) {
          setSelectedRow(result.teams[0].row);
        }
      }
    } catch (err) {
      console.error('Error fetching available teams:', err);
      // Fallback to basic team options if API fails
      setAvailableTeams([
        { row: 8, name: 'Team 8', label: 'Team 8' },
        { row: 9, name: 'Team 9', label: 'Team 9' },
        { row: 10, name: 'Team 10', label: 'Team 10' },
      ]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchCreatorEarnings = async (creatorNames: string[]) => {
    try {
      const response = await fetch('/api/pod/earnings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetUrl: EARNINGS_SPREADSHEET_URL,
          creatorNames: creatorNames
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch earnings: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.earnings) {
        return result.earnings;
      }
      return {};
    } catch (err) {
      console.error('Error fetching creator earnings:', err);
      return {};
    }
  };

  const fetchPodData = async (rowNumber = selectedRow) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pod/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          rowNumber: rowNumber
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const basicData = result.data;
        
        // Fetch earnings for creators if we have creator names
        if (basicData.creators && basicData.creators.length > 0) {
          const creatorNames = basicData.creators.map((creator: Creator) => creator.name);
          const earnings = await fetchCreatorEarnings(creatorNames);
          
          // Update creators with earnings data
          const creatorsWithEarnings = basicData.creators.map((creator: Creator) => ({
            ...creator,
            earnings: earnings[creator.name] || '$0'
          }));
          
          setPodData({
            ...basicData,
            creators: creatorsWithEarnings
          });
        } else {
          setPodData(basicData);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching POD data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teams and initial data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchAvailableTeams();
      await fetchPodData();
    };
    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate dynamic tasks based on team members
  const generateTasks = () => {
    if (!podData || !podData.teamMembers) return [];
    
    const taskTemplates = [
      { title: 'Design Homepage Banner', status: 'completed' as const, progress: 100, priority: 'high' as const },
      { title: 'Create Video Thumbnail', status: 'in-progress' as const, progress: 65, priority: 'medium' as const },
      { title: 'Write Product Description', status: 'review' as const, progress: 90, priority: 'medium' as const },
      { title: 'Social Media Graphics', status: 'not-started' as const, progress: 0, priority: 'low' as const },
      { title: 'Website Content Update', status: 'in-progress' as const, progress: 45, priority: 'high' as const },
      { title: 'Email Campaign Design', status: 'completed' as const, progress: 100, priority: 'medium' as const },
      { title: 'Mobile App Mockup', status: 'not-started' as const, progress: 0, priority: 'high' as const },
      { title: 'Brand Guidelines', status: 'review' as const, progress: 80, priority: 'low' as const },
      { title: 'Performance Analytics', status: 'in-progress' as const, progress: 30, priority: 'medium' as const },
    ];

    return podData.teamMembers.flatMap((member, memberIndex) => 
      taskTemplates.slice(memberIndex * 3, (memberIndex + 1) * 3).map((template, taskIndex) => ({
        id: `${memberIndex}-${taskIndex}`,
        title: template.title,
        assignee: member.name,
        status: template.status,
        progress: template.progress,
        dueDate: new Date(Date.now() + (taskIndex + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: template.priority
      }))
    );
  };

  const handleSpreadsheetCreated = (url: string) => {
    setSchedulerSpreadsheetUrl(url);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/50 dark:from-gray-900 dark:via-gray-900/80 dark:to-black">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-8 p-6 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border border-pink-200 dark:border-pink-500/30">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent mb-2">
              POD Management Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Manage your team, track workflow progress, and sync with Google Spreadsheets
            </p>
            
            {/* Team Selection */}
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Team:
                </label>
                <select
                  value={selectedRow}
                  onChange={(e) => {
                    const newRow = parseInt(e.target.value);
                    setSelectedRow(newRow);
                    fetchPodData(newRow);
                  }}
                  disabled={isLoading || isLoadingTeams}
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                >
                  {availableTeams.length > 0 ? (
                    availableTeams.map((team) => (
                      <option key={team.row} value={team.row}>
                        {team.name}
                      </option>
                    ))
                  ) : (
                    <option value={selectedRow}>Loading teams...</option>
                  )}
                </select>
              </div>
            </div>
            
            {/* Data Status */}
            <div className="mt-4 flex items-center justify-center space-x-4">
              {isLoading && (
                <div className="flex items-center text-sm text-pink-600 dark:text-pink-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600 mr-2"></div>
                  Loading data from spreadsheet...
                </div>
              )}
              {error && (
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <span className="mr-2">⚠️</span>
                  {error}
                  <button 
                    onClick={() => fetchPodData()}
                    className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!isLoading && !error && podData && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  ✅ Row {podData.rowNumber} data synced - Last updated: {new Date(podData.lastUpdated).toLocaleTimeString()}
                </div>
              )}
              <button 
                onClick={() => fetchPodData()}
                disabled={isLoading}
                className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded text-sm hover:bg-pink-200 dark:hover:bg-pink-900/50 disabled:opacity-50"
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-80 w-full">
            {podData ? (
              <PodSidebar 
                teamName={podData.teamName}
                teamMembers={podData.teamMembers}
                assignedCreators={podData.creators}
                schedulerSpreadsheetUrl={schedulerSpreadsheetUrl}
              />
            ) : (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                    <span className="text-gray-600 dark:text-gray-300">Loading team data...</span>
                  </div>
                ) : error ? (
                  <div className="text-red-600 dark:text-red-400">
                    <p>Failed to load team data</p>
                    <button 
                      onClick={() => fetchPodData()}
                      className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No team data available</span>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Workflow Dashboard */}
            {podData ? (
              <WorkflowDashboard 
                tasks={generateTasks()}
              />
            ) : (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                    <span className="text-gray-600 dark:text-gray-300">Loading workflow data...</span>
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Select a team to view workflow</span>
                )}
              </div>
            )}

            {/* Google Sheets Integration */}
            <SheetsIntegration onSpreadsheetCreated={handleSpreadsheetCreated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodComponent;
