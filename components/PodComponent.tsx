'use client';

import React, { useState, useEffect } from 'react';
import PodSidebar from './PodSidebar';
import WorkflowDashboard from './WorkflowDashboard';
import SheetsIntegration from './SheetsIntegration';
import SheetViewer from './SheetViewer';

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
  schedulerSpreadsheetUrl?: string;
  sheetLinks?: Array<{name: string, url: string, cellGroup?: string}>;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sheets'>('dashboard');
  const [selectedSheet, setSelectedSheet] = useState<{name: string, url: string} | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'sheet'>('dashboard');

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

  const handleSheetClick = (sheetName: string, sheetUrl: string) => {
    setSelectedSheet({ name: sheetName, url: sheetUrl });
    setViewMode('sheet');
    
    // Update URL with googleUrl parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('googleUrl', encodeURIComponent(sheetUrl));
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedSheet(null);
    
    // Remove googleUrl parameter from URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('googleUrl');
      window.history.pushState({}, '', url.toString());
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
        
        // Update scheduler spreadsheet URL from API response
        if (basicData.schedulerSpreadsheetUrl) {
          setSchedulerSpreadsheetUrl(basicData.schedulerSpreadsheetUrl);
        }
        
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

  // Handle URL parameters for Google Sheets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const googleUrl = urlParams.get('googleUrl');
      
      if (googleUrl) {
        try {
          const decodedUrl = decodeURIComponent(googleUrl);
          setSelectedSheet({ name: 'Shared Sheet', url: decodedUrl });
          setViewMode('sheet');
        } catch (error) {
          console.error('Error decoding Google URL parameter:', error);
        }
      }
    }
  }, []);

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

        {/* Tab Navigation */}
        <div className="border-b border-pink-200 dark:border-pink-500/30">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('sheets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sheets'
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Sheets Integration
            </button>
          </nav>
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
            {viewMode === 'sheet' && selectedSheet ? (
              <SheetViewer
                sheetName={selectedSheet.name}
                sheetUrl={selectedSheet.url}
                onBack={handleBackToDashboard}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
              <>
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

                {/* Sheet Links */}
                {podData && podData.sheetLinks && podData.sheetLinks.length > 0 && (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mr-3">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z" />
                        </svg>
                      </div>
                      📄 Sheet Links
                      <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({podData.sheetLinks.length} sheets)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {podData.sheetLinks.map((link, index) => (
                        <div
                          key={index}
                          className="group relative p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                          onClick={() => handleSheetClick(link.name, link.url)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                {link.name}
                              </p>
                              {link.url && link.url.startsWith('http') ? (
                                <div className="flex items-center mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                  <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span className="group-hover:underline">Open Google Sheet</span>
                                </div>
                              ) : (
                                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>No link available</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Hover overlay effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'sheets' && (
              <>
                {/* Google Sheets Integration */}
                <SheetsIntegration onSpreadsheetCreated={handleSpreadsheetCreated} />
              </>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodComponent;
