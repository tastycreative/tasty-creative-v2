"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import WorkflowDashboard from "./WorkflowDashboard";
import SheetsIntegration from "./SheetsIntegration";
import SheetViewer from "./SheetViewer";
import PodAdminDashboard from "./PodAdminDashboard";
import Board from "./pod/Board";

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
  sheetLinks?: Array<{ name: string; url: string; cellGroup?: string }>;
  rowNumber: number;
  lastUpdated: string;
}

const DEFAULT_SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1sTp3x6SA4yKkYEwPUIDPNzAPiu0RnaV1009NXZ7PkZM/edit?gid=0#gid=0";
const EARNINGS_SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1uF-zuML1HgP5b95pbJycVQZj_0Nl1mgkTshOe3lUCSs/edit?gid=591071681#gid=591071681";

const PodComponent = () => {
  const { data: session } = useSession();
  const [schedulerSpreadsheetUrl, setSchedulerSpreadsheetUrl] = useState<
    string | undefined
  >(undefined);
  const [selectedRow, setSelectedRow] = useState<number>(8);
  const [podData, setPodData] = useState<PodData | null>(null);
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "sheets" | "board" | "admin">(
    "dashboard"
  );
  const [selectedSheet, setSelectedSheet] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "sheet">("dashboard");
  const [driveSheets, setDriveSheets] = useState<Array<{
    id: string;
    name: string;
    url: string;
    lastModified: string;
  }>>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);

  const fetchAvailableTeams = async () => {
    setIsLoadingTeams(true);

    try {
      const response = await fetch("/api/pod/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          startRow: 8,
          endRow: 20,
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
      console.error("Error fetching available teams:", err);
      // Fallback to basic team options if API fails
      setAvailableTeams([
        { row: 8, name: "Team 8", label: "Team 8" },
        { row: 9, name: "Team 9", label: "Team 9" },
        { row: 10, name: "Team 10", label: "Team 10" },
      ]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchCreatorEarnings = async (creatorNames: string[], retryCount = 0) => {
    try {
      const response = await fetch("/api/pod/earnings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetUrl: EARNINGS_SPREADSHEET_URL,
          creatorNames: creatorNames,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check for quota exceeded error
        if (response.status === 429 && errorText.includes('Quota exceeded') && retryCount < 3) {
          console.log(`Quota exceeded, retrying in ${(retryCount + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return fetchCreatorEarnings(creatorNames, retryCount + 1);
        }
        throw new Error(`Failed to fetch earnings: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.earnings) {
        return result.earnings;
      }
      return {};
    } catch (err) {
      console.error("Error fetching creator earnings:", err);
      // If it's a quota error and we haven't exhausted retries, try again
      if (err instanceof Error && err.message.includes('quota') && retryCount < 3) {
        console.log(`Retrying earnings fetch after error, attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return fetchCreatorEarnings(creatorNames, retryCount + 1);
      }
      return {};
    }
  };

  const fetchTasks = useCallback(async (teamId: string) => {
    if (!teamId) {
      setTasks([]);
      return;
    }

    setIsTasksLoading(true);
    try {
      const response = await fetch(`/api/tasks?teamId=${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const result = await response.json();
      if (result.success && result.tasks) {
        // Convert database tasks to WorkflowDashboard format
        const formattedTasks = result.tasks.map((task: any) => {
          // If assignedTo is an email, extract the name part or use session name
          let assigneeName = task.assignedTo || 'Unassigned';
          if (assigneeName.includes('@')) {
            // Check if it's the current user
            if (session?.user?.email === assigneeName) {
              assigneeName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Current User';
            } else {
              // Extract username from email
              assigneeName = assigneeName.split('@')[0];
            }
          }
          
          // Map database status to dashboard format
          const statusMapping: Record<string, 'not-started' | 'in-progress' | 'completed' | 'review'> = {
            'NOT_STARTED': 'not-started',
            'IN_PROGRESS': 'in-progress', 
            'COMPLETED': 'completed',
            'CANCELLED': 'review' // Map cancelled to review status for dashboard display
          };
          
          return {
            id: task.id,
            title: task.title,
            assignee: assigneeName,
            status: statusMapping[task.status] || 'not-started',
            progress: task.status === 'COMPLETED' ? 100 : 
                     task.status === 'IN_PROGRESS' ? 50 : 
                     task.status === 'CANCELLED' ? 0 : 0,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high'
          };
        });
        setTasks(formattedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsTasksLoading(false);
    }
  }, [session]);

  const fetchDriveSheets = useCallback(async () => {
    if (!podData?.creators || podData.creators.length === 0) {
      setDriveSheets([]);
      return;
    }

    setIsDriveLoading(true);
    setDriveError(null);

    try {
      const creatorNames = podData.creators.map(creator => creator.name);
      const folderId = "1jV4H9nDmseNL8AdvokY8uAOM5am4YC_c"; // The folder ID from the Google Drive URL

      const response = await fetch('/api/drive/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: folderId,
          creatorNames: creatorNames,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sheets from Google Drive');
      }

      const data = await response.json();
      
      if (data.success) {
        setDriveSheets(data.sheets || []);
      } else {
        throw new Error(data.error || 'Failed to fetch sheets');
      }
      
    } catch (err) {
      console.error('Error fetching drive sheets:', err);
      setDriveError('Failed to load sheets from Google Drive');
      setDriveSheets([]);
    } finally {
      setIsDriveLoading(false);
    }
  }, [podData?.creators]);

  const handleSheetClick = (sheetName: string, sheetUrl: string) => {
    setSelectedSheet({ name: sheetName, url: sheetUrl });
    setViewMode("sheet");

    // Update URL with googleUrl parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("googleUrl", encodeURIComponent(sheetUrl));
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleBackToDashboard = () => {
    setViewMode("dashboard");
    setSelectedSheet(null);
    // Make sure we're on the dashboard tab when going back
    setActiveTab("dashboard");

    // Remove googleUrl parameter from URL and set tab to dashboard
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("googleUrl");
      url.searchParams.set("tab", "dashboard");
      window.history.pushState({}, "", url.toString());
    }
  };

  const fetchPodData = async (rowNumber = selectedRow, retryCount = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pod/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          rowNumber: rowNumber,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check for quota exceeded error
        if (response.status === 429 && errorText.includes('Quota exceeded') && retryCount < 3) {
          console.log(`Quota exceeded, retrying in ${(retryCount + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return fetchPodData(rowNumber, retryCount + 1);
        }
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
          const creatorNames = basicData.creators.map(
            (creator: Creator) => creator.name
          );
          const earnings = await fetchCreatorEarnings(creatorNames);

          // Update creators with earnings data
          const creatorsWithEarnings = basicData.creators.map(
            (creator: Creator) => ({
              ...creator,
              earnings: earnings[creator.name] || "$0",
            })
          );

          setPodData({
            ...basicData,
            creators: creatorsWithEarnings,
          });
        } else {
          setPodData(basicData);
        }
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching POD data:", err);
      // If it's a quota error and we haven't exhausted retries, try again
      if (err instanceof Error && err.message.includes('quota') && retryCount < 3) {
        console.log(`Retrying pod data fetch after error, attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return fetchPodData(rowNumber, retryCount + 1);
      }
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL parameters for Google Sheets - run after podData is loaded
  useEffect(() => {
    if (typeof window !== "undefined" && podData) {
      const urlParams = new URLSearchParams(window.location.search);
      const googleUrl = urlParams.get("googleUrl");

      if (googleUrl) {
        try {
          const decodedUrl = decodeURIComponent(googleUrl);
          
          // Find the actual sheet name from podData.sheetLinks
          let sheetName = "Shared Sheet"; // fallback name
          if (podData.sheetLinks) {
            const matchingSheet = podData.sheetLinks.find(link => link.url === decodedUrl);
            if (matchingSheet) {
              sheetName = matchingSheet.name;
            }
          }
          
          setSelectedSheet({ name: sheetName, url: decodedUrl });
          setViewMode("sheet");
        } catch (error) {
          console.error("Error decoding Google URL parameter:", error);
        }
      }
    }
  }, [podData]); // Run this effect when podData changes

  // Handle tab parameter from URL on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      // Set active tab from URL parameter
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get("tab");
        
        if (tabParam === "dashboard" || tabParam === "sheets" || tabParam === "board" || tabParam === "admin") {
          setActiveTab(tabParam);
        }
      }
      
      // Always fetch teams data on mount as it's needed for team selection
      await fetchAvailableTeams();
    };
    
    initializeComponent();
  }, []);

  // Fetch dashboard-specific data when dashboard tab becomes active
  useEffect(() => {
    if (activeTab === "dashboard" && !podData) {
      fetchPodData();
    }
  }, [activeTab, podData]);

  // Fetch drive sheets only when sheets tab is active and we have creator data
  useEffect(() => {
    if (activeTab === "dashboard" && podData?.creators && podData.creators.length > 0) {
      fetchDriveSheets();
    }
  }, [activeTab, podData?.creators, fetchDriveSheets]);

  // Fetch tasks when selectedRow changes or when dashboard tab is active
  useEffect(() => {
    if (activeTab === "dashboard" && selectedRow) {
      const teamId = `team-${selectedRow}`;
      fetchTasks(teamId);
    }
  }, [activeTab, selectedRow, fetchTasks]);


  const handleTabChange = (tab: "dashboard" | "sheets" | "board" | "admin") => {
    console.log('Tab change clicked:', tab, 'Current viewMode:', viewMode);
    setActiveTab(tab);
    
    // If we're currently viewing a sheet, exit sheet view mode
    if (viewMode === "sheet") {
      console.log('Exiting sheet view mode');
      setViewMode("dashboard");
      setSelectedSheet(null);
    }
    
    // Lazy load data for the selected tab
    if (tab === "dashboard" && !podData) {
      fetchPodData();
    } else if (tab === "sheets") {
      // For sheets tab, we need pod data first
      if (!podData) {
        fetchPodData(); // This will trigger drive sheets fetch via useEffect
      } else if (podData.creators && podData.creators.length > 0 && driveSheets.length === 0) {
        fetchDriveSheets();
      }
    }
    
    // Update URL with tab parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      // Remove googleUrl parameter when switching tabs manually
      url.searchParams.delete('googleUrl');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleSpreadsheetCreated = (url: string) => {
    // Set the new spreadsheet URL
    setSchedulerSpreadsheetUrl(url);
    
    // Refresh the drive sheets to show the newly created sheet
    if (podData?.creators && podData.creators.length > 0) {
      fetchDriveSheets();
    }
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
              Manage your team, track workflow progress, and sync with Google
              Spreadsheets
            </p>

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
                  ✅ Row {podData.rowNumber} data synced - Last updated:{" "}
                  {new Date(podData.lastUpdated).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-pink-200 dark:border-pink-500/30">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "dashboard"
                  ? "border-pink-500 text-pink-600 dark:text-pink-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleTabChange("sheets")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "sheets"
                  ? "border-pink-500 text-pink-600 dark:text-pink-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Sheets Integration
            </button>
            <button
              onClick={() => handleTabChange("board")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "board"
                  ? "border-pink-500 text-pink-600 dark:text-pink-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Board
            </button>
            {session?.user?.role === "ADMIN" && (
              <button
                onClick={() => handleTabChange("admin")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "admin"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Admin
              </button>
            )}
          </nav>
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Hidden when admin tab is active */}
          {activeTab !== "admin" && activeTab !== "board" && (
            <div className="lg:w-80 w-full">
              {podData ? (
                <div className="w-full space-y-6">
                  {/* Team Selection & Info Combined */}
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg shadow-lg">
                    {/* Team Selection Header */}
                    <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/30 dark:to-indigo-900/30 border-b border-purple-200 dark:border-purple-500/30 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          {podData.teamName}
                        </h3>
                        <button
                          onClick={() => fetchPodData()}
                          disabled={isLoading}
                          className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                          title="Refresh team data"
                        >
                          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Team Selection Dropdown */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Switch Team:
                        </label>
                        <select
                          value={selectedRow || ''}
                          onChange={(e) => {
                            const newRow = parseInt(e.target.value);
                            setSelectedRow(newRow);
                            fetchPodData(newRow);
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
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Team Members ({podData.teamMembers.length})
                      </h4>
                      <div className="space-y-2">
                        {podData.teamMembers.length > 0 ? (
                          podData.teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {member.name}
                              </span>
                              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                {member.role}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No team members assigned
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Assigned Creators */}
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Assigned Creators ({podData.creators.length})
                      </h4>
                      <div className="space-y-2">
                        {podData.creators.length > 0 ? (
                          podData.creators.map((creator) => (
                            <div
                              key={creator.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                            >
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {creator.name}
                                </span>
                             
                              </div>
                              {creator.earnings && (
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                  {creator.earnings}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No creators assigned
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Scheduler Link */}
                    {schedulerSpreadsheetUrl && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                        <a
                          href={schedulerSpreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full p-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm font-medium"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Open Scheduler
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Loading team data...
                      </span>
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
                    <span className="text-gray-500 dark:text-gray-400">
                      No team data available
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className={`${activeTab === "admin" || activeTab === "board" ? "w-full" : "flex-1"} space-y-6`}>
            {viewMode === "sheet" && selectedSheet ? (
              <SheetViewer
                sheetName={selectedSheet.name}
                sheetUrl={selectedSheet.url}
                onBack={handleBackToDashboard}
              />
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <>
                    {/* Workflow Dashboard */}
                    {podData ? (
                      isTasksLoading ? (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                              Loading tasks...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <WorkflowDashboard tasks={tasks} />
                      )
                    ) : (
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                        {isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                              Loading workflow data...
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            Select a team to view workflow
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sheet Links */}
                    {podData &&
                      podData.sheetLinks &&
                      podData.sheetLinks.length > 0 && (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 shadow-lg">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mr-3">
                              <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z"
                                />
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
                                onClick={() =>
                                  handleSheetClick(link.name, link.url)
                                }
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                                      <svg
                                        className="h-5 w-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                      {link.name}
                                    </p>
                                    {link.url && link.url.startsWith("http") ? (
                                      <div className="flex items-center mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                        <svg
                                          className="h-3 w-3 mr-1 flex-shrink-0"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                          />
                                        </svg>
                                        <span className="group-hover:underline">
                                          Open Google Sheet
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <svg
                                          className="h-3 w-3 mr-1 flex-shrink-0"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
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

                    {/* Sheet Integrations */}
                    {podData && podData.creators && podData.creators.length > 0 && (
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-500/30 rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3">
                            <svg
                              className="h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                              />
                            </svg>
                          </div>
                          🔗 Sheet Integrations
                          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                            ({driveSheets.length} found for: {podData.creators.map(c => c.name).join(', ')})
                          </span>
                        </h3>

                        {isDriveLoading ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                              <div
                                key={`loading-${index}`}
                                className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg animate-pulse"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                                  <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : driveError ? (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-5 w-5 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-red-700 dark:text-red-300 text-sm">{driveError}</span>
                            </div>
                          </div>
                        ) : driveSheets.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {driveSheets.map((sheet) => (
                              <div
                                key={sheet.id}
                                className="group relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                                onClick={() => {
                                  if (sheet.url && sheet.url.startsWith("http")) {
                                    window.open(sheet.url, "_blank");
                                  }
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                      <svg
                                        className="h-5 w-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {sheet.name}
                                    </p>
                                    <div className="flex items-center mt-2 text-xs text-blue-600 dark:text-blue-400">
                                      <svg
                                        className="h-3 w-3 mr-1 flex-shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                      <span className="group-hover:underline">
                                        Open Google Sheet
                                      </span>
                                    </div>
                                    {sheet.lastModified && (
                                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <svg
                                          className="h-3 w-3 mr-1 flex-shrink-0"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        <span>
                                          Modified: {new Date(sheet.lastModified).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Hover overlay effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z"
                              />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              No matching sheets found
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              No Google Sheets found for the assigned creators: {podData.creators.map(c => c.name).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "sheets" && (
                  <>
                    {/* Show loading state if pod data is not loaded yet */}
                    {!podData ? (
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                          <span className="text-gray-700 dark:text-gray-300">Loading team data for sheets integration...</span>
                        </div>
                      </div>
                    ) : (
                      /* Google Sheets Integration */
                      <SheetsIntegration
                        onSpreadsheetCreated={handleSpreadsheetCreated}
                        onSheetCreated={() => {
                          // Refresh drive sheets when a new sheet is created
                          if (podData?.creators && podData.creators.length > 0) {
                            fetchDriveSheets();
                          }
                        }}
                      />
                    )}
                  </>
                )}

                {activeTab === "board" && (
                  <Board 
                    teamId={`team-${selectedRow}`}
                    teamName={availableTeams.find(team => team.row === selectedRow)?.name || 'Selected Team'}
                    session={session}
                    availableTeams={availableTeams}
                    onTeamChange={setSelectedRow}
                    selectedRow={selectedRow}
                  />
                )}

                {activeTab === "admin" && session?.user?.role === "ADMIN" && (
                  <>
                    {/* Admin Dashboard - loads its own data when rendered */}
                    <PodAdminDashboard />
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
